export default function About() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold mb-6">
          <span className="gradient-text">关于我</span>
        </h1>
        <div className="glass-card p-8 text-left">
          <p className="text-zinc-300 leading-relaxed mb-4">
            你好！我是一名热爱技术的开发者，喜欢探索新技术、分享开发经验。
          </p>
          <p className="text-zinc-300 leading-relaxed mb-4">
            这个博客用于记录我的学习历程和技术分享。
          </p>
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 gradient-text">技术栈</h2>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Node.js'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-400">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}