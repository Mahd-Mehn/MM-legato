import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Coins, Shield, Headphones, MessageCircle, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Legato</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="#community" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Community
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Where Stories Come to Life
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Discover, read, and create amazing stories in our social reading platform. 
            Connect with writers, customize your reading experience, and build your literary community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Reading Free
              </Button>
            </Link>
            <Link href="/writer">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Become a Writer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Everything You Need for Reading & Writing
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Immersive Reading
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Customize fonts, themes, and layouts for the perfect reading experience
              </p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Social Community
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Connect with readers and writers through comments and discussions
              </p>
            </div>
            <div className="text-center p-6">
              <Coins className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Fair Monetization
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Support writers with our coin-based payment system
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Advanced Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <Headphones className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                AI Audiobooks
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Listen to any chapter with AI-generated narration
              </p>
            </div>
            <div className="text-center p-6">
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Secret Vault
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Keep your private reading collection secure
              </p>
            </div>
            <div className="text-center p-6">
              <MessageCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Rich Comments
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Engage with threaded discussions and author interactions
              </p>
            </div>
            <div className="text-center p-6">
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Writer Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Track your audience and earnings with detailed insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
            Simple, Fair Pricing
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">
            Start reading for free, pay only for premium content you love
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Free Reader</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-6">$0</p>
              <ul className="text-left space-y-2 text-slate-600 dark:text-slate-300">
                <li>• Access to free books</li>
                <li>• Basic reading features</li>
                <li>• Community participation</li>
              </ul>
            </div>
            <div className="border-2 border-blue-600 rounded-lg p-8 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Premium Reader</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Pay per book</p>
              <ul className="text-left space-y-2 text-slate-600 dark:text-slate-300">
                <li>• All free features</li>
                <li>• Premium book access</li>
                <li>• AI audiobook generation</li>
                <li>• Secret vault</li>
              </ul>
            </div>
            <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Writer</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Free to start</p>
              <ul className="text-left space-y-2 text-slate-600 dark:text-slate-300">
                <li>• All reader features</li>
                <li>• Publish unlimited books</li>
                <li>• Monetization tools</li>
                <li>• Analytics dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
            Join Our Growing Community
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            Connect with thousands of readers and writers who share your passion for great stories
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600 dark:text-slate-300">Active Readers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">1K+</div>
              <div className="text-slate-600 dark:text-slate-300">Published Writers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-slate-600 dark:text-slate-300">Books Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Start Your Literary Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of readers and writers today
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span className="text-xl font-bold">Legato</span>
              </div>
              <p className="text-slate-400">
                The social reading and writing platform where stories come to life.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/explore" className="hover:text-white">Explore Books</Link></li>
                <li><Link href="/writer" className="hover:text-white">Become a Writer</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/community" className="hover:text-white">Discussions</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Legato. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}