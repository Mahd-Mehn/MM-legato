'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Shield, 
  Globe, 
  TrendingUp, 
  Users, 
  Award,
  PieChart,
  Star,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';

export default function WriterBenefitsSection() {
  const [activeTab, setActiveTab] = useState('revenue');

  const revenueBreakdown = [
    { label: 'Writer Earnings', percentage: 75, color: 'bg-primary-500', amount: '$750' },
    { label: 'Platform Fee', percentage: 15, color: 'bg-primary-300', amount: '$150' },
    { label: 'Processing', percentage: 10, color: 'bg-primary-200', amount: '$100' }
  ];

  const revenueStreams = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Subscriptions',
      description: 'Monthly reader subscriptions',
      earning: '$2,500/mo',
      growth: '+15%'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Tips & Support',
      description: 'Direct reader appreciation',
      earning: '$800/mo',
      growth: '+25%'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Licensing',
      description: 'Adaptation rights',
      earning: '$5,000',
      growth: 'One-time'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Audiobooks',
      description: 'AI-generated audio content',
      earning: '$1,200/mo',
      growth: '+30%'
    }
  ];

  const ipProtectionFeatures = [
    {
      icon: <Shield className="w-8 h-8 text-primary-500" />,
      title: 'Blockchain Verification',
      description: 'Immutable proof of authorship with timestamped creation records'
    },
    {
      icon: <Award className="w-8 h-8 text-accent-amber" />,
      title: 'Certificate of Authorship',
      description: 'Legal documentation of your intellectual property rights'
    },
    {
      icon: <Globe className="w-8 h-8 text-accent-emerald" />,
      title: 'Global Protection',
      description: 'International copyright protection across 180+ countries'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Fantasy Author',
      avatar: '👩‍💻',
      story: 'My serialized fantasy novel now earns $3,200/month. The IP protection gave me confidence to share my work.',
      earnings: '$3,200/mo'
    },
    {
      name: 'Marcus Johnson',
      role: 'Sci-Fi Writer',
      avatar: '👨‍🚀',
      story: 'Legato helped me license my story to a streaming service. The blockchain proof was crucial for negotiations.',
      earnings: '$15,000 deal'
    },
    {
      name: 'Aisha Patel',
      role: 'Romance Novelist',
      avatar: '👩‍🎨',
      story: 'The global translation feature tripled my readership. Now earning from 12 different languages!',
      earnings: '$4,800/mo'
    }
  ];

  return (
    <section className="px-4 py-20 bg-gradient-to-br from-primary-50 via-white to-accent-rose/10 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
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
              Why Writers Choose Legato
            </h2>
            <p className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto">
              Fair compensation, robust protection, and global reach for your creative work
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 max-w-2xl mx-auto">
          {[
            { id: 'revenue', label: 'Revenue Sharing', icon: DollarSign },
            { id: 'protection', label: 'IP Protection', icon: Shield },
            { id: 'success', label: 'Success Stories', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-reading-muted dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
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
          {activeTab === 'revenue' && (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Revenue Breakdown Chart */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                  Revenue Breakdown
                </h3>
                <div className="space-y-4 mb-8">
                  {revenueBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-reading-text dark:text-gray-200 font-medium">
                          {item.label}
                        </span>
                        <span className="text-reading-text dark:text-gray-200 font-bold">
                          {item.percentage}% ({item.amount})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
                  <p className="text-primary-700 dark:text-primary-300 font-semibold text-center">
                    Writers keep 60-85% of all revenue - industry leading rates!
                  </p>
                </div>
              </div>

              {/* Revenue Streams */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                  Multiple Revenue Streams
                </h3>
                {revenueStreams.map((stream, index) => (
                  <motion.div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-primary-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                          {stream.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-reading-text dark:text-white">
                            {stream.title}
                          </h4>
                          <p className="text-reading-muted dark:text-gray-400 text-sm">
                            {stream.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {stream.earning}
                        </div>
                        <div className="text-sm text-accent-emerald font-medium flex items-center">
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                          {stream.growth}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'protection' && (
            <div className="grid md:grid-cols-3 gap-8">
              {ipProtectionFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
                    {feature.title}
                  </h3>
                  <p className="text-reading-muted dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'success' && (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <h4 className="text-lg font-semibold text-reading-text dark:text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-reading-muted dark:text-gray-400 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-reading-text dark:text-gray-200 mb-6 leading-relaxed">
                    "{testimonial.story}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent-amber fill-current" />
                      ))}
                    </div>
                    <div className="text-primary-600 dark:text-primary-400 font-bold">
                      {testimonial.earnings}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-bold mb-4 font-crimson">
              Ready to Start Earning from Your Stories?
            </h3>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Join thousands of writers who are building sustainable careers on Legato
            </p>
            <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors duration-300 shadow-lg">
              Start Writing Today
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}