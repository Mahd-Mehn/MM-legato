'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  Users, 
  Star,
  CheckCircle,
  ArrowUpRight,
  Zap,
  Crown,
  Heart,
  PieChart,
  Target,
  Award
} from 'lucide-react';

export default function PricingMonetizationSection() {
  const [activeTab, setActiveTab] = useState('readers');
  const [calculatorInputs, setCalculatorInputs] = useState({
    followers: 1000,
    avgChapterPrice: 2,
    chaptersPerMonth: 4,
    subscriptionPrice: 10
  });

  return (
    <section className="px-4 py-20 bg-gradient-to-br from-accent-emerald/5 via-white to-primary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
              Transparent Pricing & Fair Monetization
            </h2>
            <p className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto">
              Clear pricing for readers, maximum earnings for writers, and honest fees for everyone
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 max-w-3xl mx-auto">
          {[
            { id: 'readers', label: 'Reader Pricing', icon: Users },
            { id: 'writers', label: 'Writer Earnings', icon: Calculator },
            { id: 'comparison', label: 'vs Competitors', icon: TrendingUp },
            { id: 'fees', label: 'Fee Structure', icon: PieChart }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-reading-muted dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'readers' && (
            <div className="space-y-12">
              {/* Pricing Tiers */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Free Tier */}
                <motion.div
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-2 border-gray-200 dark:border-gray-700 relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-center mb-8">
                    <Heart className="w-12 h-12 text-accent-rose mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-2 font-crimson">
                      Free Reader
                    </h3>
                    <div className="text-4xl font-bold text-reading-text dark:text-white mb-2">
                      $0<span className="text-lg text-reading-muted dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-reading-muted dark:text-gray-400">
                      Perfect for discovering new stories
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      'Access to free chapters',
                      'Basic reading features',
                      'Community participation',
                      'Story bookmarking',
                      'Mobile app access'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0" />
                        <span className="text-reading-text dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full bg-gray-100 dark:bg-gray-700 text-reading-text dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300">
                    Get Started Free
                  </button>
                </motion.div>

                {/* Premium Tier */}
                <motion.div
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-2 border-primary-500 relative transform scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                  
                  <div className="text-center mb-8">
                    <Zap className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-2 font-crimson">
                      Premium Reader
                    </h3>
                    <div className="text-4xl font-bold text-reading-text dark:text-white mb-2">
                      $9.99<span className="text-lg text-reading-muted dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-reading-muted dark:text-gray-400">
                      Unlimited access to premium content
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      'Unlimited premium chapters',
                      'Early access to new releases',
                      'Offline reading',
                      'AI-generated audiobooks',
                      'Ad-free experience',
                      'Advanced reading settings',
                      'Priority customer support'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <span className="text-reading-text dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors duration-300 shadow-lg">
                    Start Premium Trial
                  </button>
                </motion.div>

                {/* VIP Tier */}
                <motion.div
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-2 border-accent-amber dark:border-accent-amber relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <Crown className="w-12 h-12 text-accent-amber mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-2 font-crimson">
                      VIP Reader
                    </h3>
                    <div className="text-4xl font-bold text-reading-text dark:text-white mb-2">
                      $19.99<span className="text-lg text-reading-muted dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-reading-muted dark:text-gray-400">
                      Ultimate reading experience
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      'Everything in Premium',
                      'Direct author interaction',
                      'Exclusive VIP content',
                      'Monthly coin bonus (500 coins)',
                      'Beta feature access',
                      'Personal reading concierge',
                      'VIP community access'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-accent-amber flex-shrink-0" />
                        <span className="text-reading-text dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full bg-accent-amber text-white py-3 rounded-xl font-semibold hover:bg-accent-amber/90 transition-colors duration-300 shadow-lg">
                    Become VIP
                  </button>
                </motion.div>
              </div>

              {/* Coin Packages */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 text-center font-crimson">
                  Coin Packages - Pay Per Chapter
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { coins: 100, price: 4.99, bonus: 0, popular: false },
                    { coins: 250, price: 9.99, bonus: 25, popular: false },
                    { coins: 500, price: 19.99, bonus: 75, popular: true },
                    { coins: 1000, price: 34.99, bonus: 200, popular: false }
                  ].map((pkg, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border-2 text-center relative ${
                        pkg.popular
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Best Value
                          </span>
                        </div>
                      )}
                      <div className="text-2xl font-bold text-reading-text dark:text-white mb-2">
                        {pkg.coins + pkg.bonus}
                      </div>
                      <div className="text-sm text-reading-muted dark:text-gray-400 mb-2">
                        coins
                      </div>
                      <div className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-4">
                        ${pkg.price}
                      </div>
                      {pkg.bonus > 0 && (
                        <div className="text-xs text-accent-emerald font-semibold mb-2">
                          +{pkg.bonus} bonus coins!
                        </div>
                      )}
                      <button className={`w-full py-2 rounded-lg font-medium transition-colors duration-300 ${
                        pkg.popular
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'bg-gray-200 dark:bg-gray-600 text-reading-text dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}>
                        Buy Now
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-center text-reading-muted dark:text-gray-400 mt-6 text-sm">
                  1 coin = 1 premium chapter • No expiration • Refundable within 24 hours
                </p>
              </div>
            </div>
          )}

          {activeTab === 'writers' && (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Earnings Calculator */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson flex items-center">
                  <Calculator className="w-6 h-6 mr-3 text-primary-500" />
                  Earnings Calculator
                </h3>
                
                <div className="space-y-6">
                  {/* Input Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-reading-text dark:text-gray-200 mb-2">
                        Followers
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="50000"
                        step="100"
                        value={calculatorInputs.followers}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, followers: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-reading-muted dark:text-gray-400 mt-1">
                        <span>100</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {calculatorInputs.followers.toLocaleString()}
                        </span>
                        <span>50,000</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-reading-text dark:text-gray-200 mb-2">
                        Average Chapter Price (coins)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={calculatorInputs.avgChapterPrice}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, avgChapterPrice: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-reading-muted dark:text-gray-400 mt-1">
                        <span>1</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {calculatorInputs.avgChapterPrice}
                        </span>
                        <span>10</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-reading-text dark:text-gray-200 mb-2">
                        Chapters per Month
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={calculatorInputs.chaptersPerMonth}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, chaptersPerMonth: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-reading-muted dark:text-gray-400 mt-1">
                        <span>1</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {calculatorInputs.chaptersPerMonth}
                        </span>
                        <span>20</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-reading-text dark:text-gray-200 mb-2">
                        Subscription Price ($)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        step="1"
                        value={calculatorInputs.subscriptionPrice}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, subscriptionPrice: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-reading-muted dark:text-gray-400 mt-1">
                        <span>$5</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          ${calculatorInputs.subscriptionPrice}
                        </span>
                        <span>$25</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Results */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-2xl">
                    <h4 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-4">
                      Your Potential Monthly Earnings
                    </h4>
                    
                    {(() => {
                      const readRate = 0.15; // 15% of followers read each chapter
                      const subscriptionRate = 0.05; // 5% of followers subscribe
                      const coinValue = 0.05; // $0.05 per coin
                      const writerShare = 0.75; // 75% to writer
                      
                      const chapterEarnings = calculatorInputs.followers * readRate * calculatorInputs.avgChapterPrice * coinValue * calculatorInputs.chaptersPerMonth * writerShare;
                      const subscriptionEarnings = calculatorInputs.followers * subscriptionRate * calculatorInputs.subscriptionPrice * writerShare;
                      const totalEarnings = chapterEarnings + subscriptionEarnings;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-primary-600 dark:text-primary-400">Chapter Sales:</span>
                            <span className="font-bold text-primary-700 dark:text-primary-300">
                              ${chapterEarnings.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-primary-600 dark:text-primary-400">Subscriptions:</span>
                            <span className="font-bold text-primary-700 dark:text-primary-300">
                              ${subscriptionEarnings.toFixed(0)}
                            </span>
                          </div>
                          <div className="border-t border-primary-200 dark:border-primary-700 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-primary-700 dark:text-primary-300">Total Monthly:</span>
                              <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                                ${totalEarnings.toFixed(0)}
                              </span>
                            </div>
                            <div className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                              Annual: ${(totalEarnings * 12).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                    Revenue Streams
                  </h3>
                  
                  <div className="space-y-6">
                    {[
                      {
                        icon: <Users className="w-6 h-6" />,
                        title: 'Chapter Sales',
                        description: 'Per-chapter purchases with coins',
                        percentage: '40%',
                        color: 'text-primary-500'
                      },
                      {
                        icon: <Star className="w-6 h-6" />,
                        title: 'Subscriptions',
                        description: 'Monthly recurring revenue',
                        percentage: '35%',
                        color: 'text-accent-emerald'
                      },
                      {
                        icon: <Heart className="w-6 h-6" />,
                        title: 'Tips & Gifts',
                        description: 'Direct reader support',
                        percentage: '15%',
                        color: 'text-accent-rose'
                      },
                      {
                        icon: <Award className="w-6 h-6" />,
                        title: 'Licensing',
                        description: 'IP adaptation rights',
                        percentage: '10%',
                        color: 'text-accent-amber'
                      }
                    ].map((stream, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${stream.color}`}>
                          {stream.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-reading-text dark:text-white">
                            {stream.title}
                          </h4>
                          <p className="text-sm text-reading-muted dark:text-gray-400">
                            {stream.description}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${stream.color}`}>
                          {stream.percentage}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-3xl shadow-xl">
                  <h3 className="text-xl font-bold mb-4 font-crimson">
                    Writer Success Guarantee
                  </h3>
                  <ul className="space-y-2 text-primary-100">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Keep 75-85% of all revenue</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Weekly payouts, no minimum</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Full IP ownership retained</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Global licensing opportunities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-8">
              {/* Comparison Table */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 overflow-hidden">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 text-center font-crimson">
                    How Legato Compares to Competitors
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary-50 dark:bg-primary-900/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-reading-text dark:text-white">
                          Feature
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                          Legato
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-reading-muted dark:text-gray-400">
                          Webnovel
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-reading-muted dark:text-gray-400">
                          Wattpad
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-reading-muted dark:text-gray-400">
                          Radish Fiction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[
                        {
                          feature: 'Writer Revenue Share',
                          legato: '75-85%',
                          webnovel: '50-70%',
                          wattpad: '50%',
                          radish: '60%',
                          highlight: true
                        },
                        {
                          feature: 'IP Protection',
                          legato: 'Blockchain + Legal',
                          webnovel: 'Basic',
                          wattpad: 'None',
                          radish: 'Basic',
                          highlight: true
                        },
                        {
                          feature: 'Global Translation',
                          legato: 'AI + Human',
                          webnovel: 'Limited',
                          wattpad: 'None',
                          radish: 'None',
                          highlight: true
                        },
                        {
                          feature: 'Licensing Marketplace',
                          legato: 'Built-in',
                          webnovel: 'Limited',
                          wattpad: 'External',
                          radish: 'None',
                          highlight: true
                        },
                        {
                          feature: 'Audio Generation',
                          legato: 'AI-powered',
                          webnovel: 'None',
                          wattpad: 'None',
                          radish: 'None',
                          highlight: true
                        },
                        {
                          feature: 'Mobile Experience',
                          legato: 'Mobile-first',
                          webnovel: 'Good',
                          wattpad: 'Good',
                          radish: 'Basic',
                          highlight: false
                        },
                        {
                          feature: 'Community Features',
                          legato: 'Advanced',
                          webnovel: 'Good',
                          wattpad: 'Excellent',
                          radish: 'Basic',
                          highlight: false
                        },
                        {
                          feature: 'Payout Frequency',
                          legato: 'Weekly',
                          webnovel: 'Monthly',
                          wattpad: 'Monthly',
                          radish: 'Monthly',
                          highlight: true
                        }
                      ].map((row, index) => (
                        <tr key={index} className={row.highlight ? 'bg-primary-25 dark:bg-primary-900/10' : ''}>
                          <td className="px-6 py-4 text-sm font-medium text-reading-text dark:text-white">
                            {row.feature}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              row.highlight 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                                : 'text-reading-text dark:text-gray-200'
                            }`}>
                              {row.highlight && <CheckCircle className="w-4 h-4 mr-1" />}
                              {row.legato}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-reading-muted dark:text-gray-400">
                            {row.webnovel}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-reading-muted dark:text-gray-400">
                            {row.wattpad}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-reading-muted dark:text-gray-400">
                            {row.radish}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Advantages */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <DollarSign className="w-8 h-8 text-accent-emerald" />,
                    title: 'Higher Earnings',
                    description: 'Keep 75-85% of revenue vs industry standard 50-70%',
                    highlight: '+25% more earnings'
                  },
                  {
                    icon: <Target className="w-8 h-8 text-primary-500" />,
                    title: 'IP-First Approach',
                    description: 'Built-in protection and licensing from day one',
                    highlight: 'Unique in market'
                  },
                  {
                    icon: <TrendingUp className="w-8 h-8 text-accent-amber" />,
                    title: 'Global Reach',
                    description: 'AI translation and cultural adaptation',
                    highlight: '10x audience potential'
                  }
                ].map((advantage, index) => (
                  <motion.div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                        {advantage.icon}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
                      {advantage.title}
                    </h4>
                    <p className="text-reading-muted dark:text-gray-300 mb-4">
                      {advantage.description}
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-accent-emerald/10 text-accent-emerald rounded-full text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {advantage.highlight}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-12">
              {/* Fee Structure Visualization */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-8 text-center font-crimson">
                  Transparent Fee Structure
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Visual Breakdown */}
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="text-4xl font-bold text-reading-text dark:text-white mb-2">
                        Every $100 Earned
                      </div>
                      <p className="text-reading-muted dark:text-gray-400">
                        Here's exactly where your money goes
                      </p>
                    </div>
                    
                    {[
                      { 
                        label: 'Writer Earnings', 
                        amount: 75, 
                        color: 'bg-primary-500', 
                        description: 'Your take-home pay'
                      },
                      { 
                        label: 'Platform Operations', 
                        amount: 15, 
                        color: 'bg-primary-300', 
                        description: 'Hosting, development, support'
                      },
                      { 
                        label: 'Payment Processing', 
                        amount: 7, 
                        color: 'bg-primary-200', 
                        description: 'Stripe, PayPal, banking fees'
                      },
                      { 
                        label: 'IP Protection', 
                        amount: 3, 
                        color: 'bg-primary-100', 
                        description: 'Blockchain, legal services'
                      }
                    ].map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-reading-text dark:text-gray-200 font-semibold">
                              {item.label}
                            </span>
                            <p className="text-sm text-reading-muted dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-reading-text dark:text-gray-200">
                              ${item.amount}
                            </span>
                            <div className="text-sm text-reading-muted dark:text-gray-400">
                              {item.amount}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <motion.div
                            className={`h-4 rounded-full ${item.color} flex items-center justify-end pr-2`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.amount}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          >
                            <span className="text-white text-xs font-semibold">
                              ${item.amount}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison Chart */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-2xl">
                    <h4 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-6 text-center">
                      Industry Comparison
                    </h4>
                    
                    <div className="space-y-6">
                      {[
                        { platform: 'Legato', writer: 75, platformFee: 25, highlight: true },
                        { platform: 'Webnovel', writer: 60, platformFee: 40, highlight: false },
                        { platform: 'Wattpad', writer: 50, platformFee: 50, highlight: false },
                        { platform: 'Amazon KDP', writer: 35, platformFee: 65, highlight: false }
                      ].map((comp, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`font-semibold ${
                              comp.highlight 
                                ? 'text-primary-700 dark:text-primary-300' 
                                : 'text-reading-muted dark:text-gray-400'
                            }`}>
                              {comp.platform}
                            </span>
                            <span className={`text-sm ${
                              comp.highlight 
                                ? 'text-primary-700 dark:text-primary-300 font-bold' 
                                : 'text-reading-muted dark:text-gray-400'
                            }`}>
                              {comp.writer}% to writer
                            </span>
                          </div>
                          <div className="flex w-full h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <div 
                              className={`${
                                comp.highlight 
                                  ? 'bg-primary-500' 
                                  : 'bg-gray-400 dark:bg-gray-500'
                              } flex items-center justify-center text-white text-xs font-semibold`}
                              style={{ width: `${comp.writer}%` }}
                            >
                              Writer
                            </div>
                            <div 
                              className={`${
                                comp.highlight 
                                  ? 'bg-primary-200' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              } flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs`}
                              style={{ width: `${comp.platformFee}%` }}
                            >
                              Platform
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* What's Included */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                  <h4 className="text-xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                    What's Included in Platform Fee
                  </h4>
                  
                  <ul className="space-y-4">
                    {[
                      'Global CDN and hosting infrastructure',
                      'Mobile apps (iOS & Android)',
                      'AI translation services',
                      'Audiobook generation',
                      'Analytics and reporting',
                      '24/7 customer support',
                      'Marketing and promotion',
                      'Community features',
                      'Regular platform updates'
                    ].map((item, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0" />
                        <span className="text-reading-text dark:text-gray-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* No Hidden Fees */}
                <div className="bg-gradient-to-br from-accent-emerald/10 to-primary-50 dark:from-accent-emerald/5 dark:to-primary-900/20 p-8 rounded-3xl border border-accent-emerald/20">
                  <h4 className="text-xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                    No Hidden Fees Promise
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-accent-emerald">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold">No setup fees</span>
                    </div>
                    <div className="flex items-center space-x-3 text-accent-emerald">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold">No monthly minimums</span>
                    </div>
                    <div className="flex items-center space-x-3 text-accent-emerald">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold">No withdrawal fees</span>
                    </div>
                    <div className="flex items-center space-x-3 text-accent-emerald">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold">No contract lock-ins</span>
                    </div>
                    <div className="flex items-center space-x-3 text-accent-emerald">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold">No exclusivity requirements</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-reading-text dark:text-gray-200 font-medium">
                      💡 <strong>Fair Deal Guarantee:</strong> If you find a platform with better terms, 
                      we'll match them or help you transition at no cost.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-3xl shadow-xl text-center">
                <h3 className="text-2xl font-bold mb-4 font-crimson">
                  Ready to Keep More of What You Earn?
                </h3>
                <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                  Join Legato and start earning 75-85% of your revenue with complete transparency
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors duration-300 shadow-lg">
                    Start Writing
                  </button>
                  <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-300">
                    View Full Terms
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}