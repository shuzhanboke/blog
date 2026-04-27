import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { buildDailyAiDigest, FeedRunResult } from '@/lib/ai-daily'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY
const cronSecret = process.env.CRON_SECRET

type DigestMode = 'publish' | 'draft'
type TriggerType = 'cron' | 'manual'

interface DigestRequestOptions {
  targetDate: Date
  mode: DigestMode
  triggerType: TriggerType
  triggeredBy?: string
}

function isMissingRelationError(message: string) {
  const text = message.toLowerCase()
  return text.includes('could not find the table') || text.includes('does not exist') || text.includes('relation')
}

function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production' && !cronSecret) {
    return true
  }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.replace(/^Bearer\s+/i, '')
  const querySecret = request.nextUrl.searchParams.get('secret')

  return !!cronSecret && (bearer === cronSecret || querySecret === cronSecret)
}

function getTargetDate(value?: string | null) {
  if (!value) {
    return new Date()
  }

  const date = new Date(`${value}T12:00:00+08:00`)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function getMode(value?: string | null): DigestMode {
  return value === 'draft' ? 'draft' : 'publish'
}

async function createRun(
  supabase: SupabaseClient,
  options: DigestRequestOptions
) {
  const payload = {
    run_date: options.targetDate.toISOString().slice(0, 10),
    status: 'running',
    mode: options.mode,
    trigger_type: options.triggerType,
    triggered_by: options.triggeredBy || null,
    item_count: 0,
    post_slug: null,
    error_message: null,
    source_results: [],
    started_at: new Date().toISOString(),
    finished_at: null,
  }

  const { data, error } = await supabase.from('ai_digest_runs').insert(payload).select().single()
  if (error) {
    if (isMissingRelationError(error.message)) {
      console.warn('ai_digest_runs table missing, continuing without run log')
      return null
    }

    throw new Error(`Unable to create digest run log: ${error.message}`)
  }

  return data
}

async function finishRun(
  supabase: SupabaseClient,
  runId: string,
  result: {
    status: 'success' | 'error'
    itemCount: number
    postSlug?: string | null
    errorMessage?: string | null
    sourceRuns: FeedRunResult[]
  }
) {
  if (!runId) {
    return
  }

  const { error } = await supabase
    .from('ai_digest_runs')
    .update({
      status: result.status,
      item_count: result.itemCount,
      post_slug: result.postSlug || null,
      error_message: result.errorMessage || null,
      source_results: result.sourceRuns,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId)

  if (error) {
    console.error('Failed to update digest run:', error)
  }
}

async function publishDigestWithClient(
  supabase: SupabaseClient,
  options: DigestRequestOptions
) {
  const run = await createRun(supabase, options)

  try {
    const { digest, items, sourceRuns } = await buildDailyAiDigest(options.targetDate, options.mode === 'publish')
    const contentFooter =
      options.triggerType === 'cron'
        ? '_本专题由定时任务自动整理生成，可在后台二次编辑。_'
        : '_本专题由管理员手动触发生成，可在后台继续润色。_'

    const payload = {
      ...digest,
      content: `${digest.content}\n\n---\n\n${contentFooter}`,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('posts').upsert([payload], { onConflict: 'slug' }).select().single()

    if (error) {
      throw new Error(error.message)
    }

    await finishRun(supabase, run?.id, {
      status: 'success',
      itemCount: items.length,
      postSlug: digest.slug,
      sourceRuns,
    })

    return {
      slug: digest.slug,
      title: digest.title,
      post: data || null,
      mode: options.mode,
      sourceRuns,
      itemCount: items.length,
      runId: run?.id || null,
      logWarning: run ? null : 'ai_digest_runs 表不存在，本次已跳过日志记录。',
    }
  } catch (error) {
    const sourceRuns = [
      {
        source: 'digest-builder',
        sourceType: 'official_rss' as const,
        status: 'error' as const,
        itemCount: 0,
        error: String(error),
      },
    ]

    await finishRun(supabase, run?.id, {
      status: 'error',
      itemCount: 0,
      errorMessage: String(error),
      sourceRuns,
    })

    throw error
  }
}

async function publishWithServiceRole(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase service credentials.')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  return publishDigestWithClient(supabase, {
    targetDate: getTargetDate(request.nextUrl.searchParams.get('date')),
    mode: getMode(request.nextUrl.searchParams.get('mode')),
    triggerType: 'cron',
    triggeredBy: 'vercel-cron',
  })
}

async function publishWithUserToken(accessToken: string, body?: { date?: string; mode?: string }) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public credentials.')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken)

  if (authError || !user) {
    throw new Error('Invalid admin session for manual digest publishing.')
  }

  const result = await publishDigestWithClient(supabase, {
    targetDate: getTargetDate(body?.date),
    mode: getMode(body?.mode),
    triggerType: 'manual',
    triggeredBy: user.email || user.id,
  })

  return {
    ...result,
    triggeredBy: user.email || user.id,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await publishWithServiceRole(request)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    const body = await request.json().catch(() => ({}))

    if (accessToken) {
      const result = await publishWithUserToken(accessToken, body)
      return NextResponse.json({ success: true, ...result })
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await publishWithServiceRole(request)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
