export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">关于我</h1>

      <div className="bg-white rounded-xl shadow p-8">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">你好！</h2>
          <p className="text-gray-700 leading-relaxed">
            我是一名热爱技术的开发者，喜欢分享知识和经验。这个博客是我记录学习心得、
            技术探索和生活感悟的地方。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">技术栈</h2>
          <ul className="space-y-2 text-gray-700">
            <li>Frontend: React, Next.js, Vue</li>
            <li>Backend: Node.js, Python</li>
            <li>Database: PostgreSQL, MongoDB, Supabase</li>
            <li>DevOps: Docker, GitHub Actions, Vercel</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">联系我</h2>
          <p className="text-gray-700">
            如果你有任何问题或建议，欢迎通过以下方式联系我：
          </p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>Email: your.email@example.com</li>
            <li>GitHub: github.com/yourusername</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
