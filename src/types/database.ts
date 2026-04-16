export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string | null
  content: string
  created_at: string
}

export interface Like {
  id: string
  post_id: string
  visitor_id: string
  created_at: string
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  created_at: string
  updated_at: string
}
