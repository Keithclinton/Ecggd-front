import Link from 'next/link'
import Header from '../components/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-4xl font-extrabold text-brand-primary mb-4">Welcome to CCGD LMS</h1>
          <p className="text-lg text-gray-700 mb-6">Your gateway to career guidance, development, and learning. Use the links below to get started.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
            <Link href="/login" className="px-6 py-3 rounded bg-brand-primary text-white font-semibold text-lg shadow hover:bg-brand-primary/90 transition">Login</Link>
            <Link href="/register" className="px-6 py-3 rounded border-2 border-brand-primary text-brand-primary font-semibold text-lg shadow hover:bg-brand-primary hover:text-white transition">Register</Link>
            <Link href="/courses" className="px-6 py-3 rounded border-2 border-brand-primary text-brand-primary font-semibold text-lg shadow hover:bg-brand-primary hover:text-white transition">Courses</Link>
          </div>
        </div>
      </main>
      <footer className="bg-gray-100 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">© {new Date().getFullYear()} College of Career Guidance and Development</div>
      </footer>
    </div>
  )
}
