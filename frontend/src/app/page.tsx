import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BookOpen, Users, Coins, Shield, Headphones, MessageCircle, BarChart3, Sparkles, ArrowRight } from 'lucide-react'
import Hero from '@/components/hero-futuristic'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-black">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-black/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Legato</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/explore" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
              Browse Books
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#community" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
              Community
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
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
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
            Everything You Need for Reading & Writing
          </h2>
          <p className="text-xl text-center text-slate-600 dark:text-slate-300 mb-16 max-w-2xl mx-auto">
            Discover a platform built for book lovers, with features that enhance every aspect of your reading and writing journey.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Customizable Reading
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Personalize fonts, themes, brightness, and layouts. Save bookmarks and track your reading progress across all devices.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Vibrant Community
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Engage in threaded discussions, leave comments on chapters, and connect directly with authors and fellow readers.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <Coins className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Fair Writer Support
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Support your favorite writers with our transparent coin system. Writers keep the majority of earnings from their work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
            Innovative Features That Set Us Apart
          </h2>
          <p className="text-xl text-center text-slate-600 dark:text-slate-300 mb-16 max-w-3xl mx-auto">
            Experience the future of digital reading with AI-powered features, enhanced privacy, and comprehensive tools for writers.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Headphones className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                AI Audiobooks
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Transform any chapter into high-quality audio narration using advanced AI voice synthesis powered by ElevenLabs.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Secret Vault
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Keep your private reading collection secure with password-protected access and enhanced privacy controls.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <MessageCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Rich Discussions
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Participate in threaded chapter discussions, reply to comments, and engage directly with authors and readers.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Writer Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Comprehensive dashboard showing reader engagement, earnings, chapter performance, and audience insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
            Start reading for free, support writers with our fair coin system, and publish your own stories at no cost.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border rounded-xl p-8 bg-slate-50 dark:bg-slate-700 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Free Reader</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">$0</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Forever free</p>
              <ul className="text-left space-y-3 text-slate-600 dark:text-slate-300 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Access to all free books</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Customizable reading interface</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Community discussions</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Reading progress tracking</li>
              </ul>
              <Button variant="outline" className="w-full">Get Started Free</Button>
            </div>
            <div className="border-2 border-blue-600 rounded-xl p-8 bg-blue-50 dark:bg-blue-900/20 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Premium Reader</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pay per book</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Using coins</p>
              <ul className="text-left space-y-3 text-slate-600 dark:text-slate-300 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> All free features</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Access to premium books</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> AI audiobook generation</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Secret vault access</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Priority support</li>
              </ul>
              <Button className="w-full">Start Reading Premium</Button>
            </div>
            <div className="border rounded-xl p-8 bg-slate-50 dark:bg-slate-700 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Writer</h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Free</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Keep 70% of earnings</p>
              <ul className="text-left space-y-3 text-slate-600 dark:text-slate-300 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> All reader features</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Publish unlimited books</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Monetization tools</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Analytics dashboard</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Character management</li>
              </ul>
              <Button variant="outline" className="w-full">Become a Writer</Button>
            </div>
          </div>
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl max-w-3xl mx-auto border dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">How Our Coin System Works</h4>
            <p className="text-slate-600 dark:text-slate-300">
              Purchase coins to support writers and access premium content. Writers earn coins when readers purchase their books or chapters. 
              It's a fair, transparent system that directly supports the creative community.
            </p>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Join Our Thriving Literary Community
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
            Connect with passionate readers and talented writers in a supportive environment where stories flourish and creativity thrives.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <div className="p-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">5K+</div>
              <div className="text-lg text-slate-600 dark:text-slate-300 font-medium">Active Readers</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Discovering new stories daily</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-lg text-slate-600 dark:text-slate-300 font-medium">Published Writers</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sharing their creative works</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-purple-600 mb-2">2K+</div>
              <div className="text-lg text-slate-600 dark:text-slate-300 font-medium">Books & Stories</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Across all genres</div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">For Readers</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Engage in meaningful discussions about your favorite chapters and characters</span>
                </li>
                <li className="flex items-start">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Discover new authors and genres through community recommendations</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Connect directly with authors and fellow book enthusiasts</span>
                </li>
              </ul>
            </div>
            
            <div className="text-left">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">For Writers</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Build your audience with detailed analytics and reader insights</span>
                </li>
                <li className="flex items-start">
                  <Coins className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Monetize your work fairly with transparent revenue sharing</span>
                </li>
                <li className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Receive direct feedback and build relationships with your readers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900 dark:bg-black">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Dive Into Your Next Great Story?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of passionate readers and writers. Start reading for free, or share your own stories with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-blue-50">
                Start Reading Free
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                Browse Books
              </Button>
            </Link>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            No credit card required • Join 5,000+ readers and writers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 dark:bg-black text-white py-12 px-4 border-t border-slate-800 dark:border-slate-900">
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
                <li><Link href="/explore" className="hover:text-white">Browse Books</Link></li>
                <li><Link href="/register" className="hover:text-white">Become a Writer</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#features" className="hover:text-white">AI Audiobooks</Link></li>
                <li><Link href="/vault" className="hover:text-white">Secret Vault</Link></li>
                <li><Link href="#community" className="hover:text-white">Community</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
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