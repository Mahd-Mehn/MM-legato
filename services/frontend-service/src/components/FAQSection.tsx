'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, HelpCircle, Users, DollarSign, Shield, Globe } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'writers' | 'readers' | 'payments' | 'ip-protection' | 'technical';
}

const faqs: FAQ[] = [
  // General Questions
  {
    id: 'general-1',
    category: 'general',
    question: 'What is Legato and how does it work?',
    answer: 'Legato is a mobile-first platform for serialized storytelling that empowers writers to publish, protect, and monetize their work while reaching global audiences. Writers can create stories with automatic IP protection, while readers discover and enjoy content across multiple languages with features like offline reading and audio narration.',
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'Is Legato free to use?',
    answer: 'Yes! Legato is free to join for both writers and readers. Writers can publish stories for free with basic IP protection, while readers can access free content and purchase premium stories or subscriptions for additional features.',
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'What makes Legato different from other storytelling platforms?',
    answer: 'Legato focuses on IP protection, fair revenue sharing (60-85% to writers), AI-powered global translation, and a licensing marketplace. Unlike other platforms, we prioritize writers\' ownership rights and provide tools for licensing stories to studios and publishers.',
  },

  // Writer Questions
  {
    id: 'writers-1',
    category: 'writers',
    question: 'How do I protect my intellectual property on Legato?',
    answer: 'Every story published on Legato receives automatic IP protection through digital fingerprinting and blockchain verification. You receive a Certificate of Authorship that proves ownership and creation date, which can be used for legal protection.',
  },
  {
    id: 'writers-2',
    category: 'writers',
    question: 'How much can I earn from my stories?',
    answer: 'Writers keep 60-85% of revenue depending on the monetization method. This includes earnings from premium chapters, subscriptions, tips, and licensing deals. Our transparent fee structure ensures you know exactly what you\'ll earn.',
  },
  {
    id: 'writers-3',
    category: 'writers',
    question: 'Can I publish stories in languages other than English?',
    answer: 'Absolutely! Legato supports 12+ languages natively, and our AI translation technology can make your story accessible to readers worldwide while preserving cultural context and meaning.',
  },
  {
    id: 'writers-4',
    category: 'writers',
    question: 'How does the licensing marketplace work?',
    answer: 'Our licensing marketplace connects writers with studios, publishers, and producers looking for ready-to-adapt IP. You maintain ownership while licensing specific rights (film, TV, book publishing, etc.) for additional revenue streams.',
  },

  // Reader Questions
  {
    id: 'readers-1',
    category: 'readers',
    question: 'How do I find stories I\'ll enjoy?',
    answer: 'Legato offers personalized recommendations based on your reading history, advanced filtering by genre and language, trending content, and curated collections. Our discovery engine learns your preferences to suggest perfect matches.',
  },
  {
    id: 'readers-2',
    category: 'readers',
    question: 'Can I read stories offline?',
    answer: 'Yes! Our Progressive Web App allows you to download stories for offline reading. Perfect for commutes, travel, or areas with poor internet connectivity.',
  },
  {
    id: 'readers-3',
    category: 'readers',
    question: 'Are there audio versions of stories?',
    answer: 'Many stories feature AI-generated audio narration that syncs with the text. Writers can enable this feature to make their content accessible to visually impaired readers and those who prefer audio content.',
  },
  {
    id: 'readers-4',
    category: 'readers',
    question: 'How do I support my favorite writers?',
    answer: 'You can support writers by purchasing their premium content, subscribing to their stories, leaving tips, sharing their work, and engaging with comments and ratings. Every interaction helps writers grow their audience.',
  },

  // Payment Questions
  {
    id: 'payments-1',
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit cards, PayPal, digital wallets (Apple Pay, Google Pay), and cryptocurrency. Regional payment methods are available in supported countries.',
  },
  {
    id: 'payments-2',
    category: 'payments',
    question: 'How does the coin system work?',
    answer: 'Coins are Legato\'s virtual currency used to purchase premium content. You can buy coin packages with bonus coins for bulk purchases. Coins never expire and can be used across all premium content.',
  },
  {
    id: 'payments-3',
    category: 'payments',
    question: 'When and how do writers get paid?',
    answer: 'Writers receive monthly payouts for earnings above $10. Payments are processed via bank transfer, PayPal, or other supported methods. You can track earnings in real-time through your dashboard.',
  },

  // IP Protection Questions
  {
    id: 'ip-1',
    category: 'ip-protection',
    question: 'Is my content legally protected on Legato?',
    answer: 'Yes! Our IP protection system creates legally recognized proof of authorship and creation date. Combined with your retained copyright ownership, this provides strong legal protection for your intellectual property.',
  },
  {
    id: 'ip-2',
    category: 'ip-protection',
    question: 'What if someone steals my story?',
    answer: 'Our forensic tools can detect unauthorized use of your content across the internet. We provide legal support and documentation to help you protect your rights, including DMCA takedown assistance.',
  },

  // Technical Questions
  {
    id: 'technical-1',
    category: 'technical',
    question: 'What devices and browsers are supported?',
    answer: 'Legato works on all modern browsers and devices. Our Progressive Web App provides a native-like experience on mobile devices and can be installed on your home screen.',
  },
  {
    id: 'technical-2',
    category: 'technical',
    question: 'Is my data secure and private?',
    answer: 'Absolutely. We use enterprise-grade encryption, secure data centers, and follow strict privacy policies. Your personal information and content are protected with industry-standard security measures.',
  },
];

const categories = [
  { id: 'all', name: 'All Questions', icon: HelpCircle },
  { id: 'general', name: 'General', icon: HelpCircle },
  { id: 'writers', name: 'For Writers', icon: Users },
  { id: 'readers', name: 'For Readers', icon: Users },
  { id: 'payments', name: 'Payments', icon: DollarSign },
  { id: 'ip-protection', name: 'IP Protection', icon: Shield },
  { id: 'technical', name: 'Technical', icon: Globe },
];

export default function FAQSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <section className="px-4 py-20 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-20 w-24 h-24 bg-primary-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-20 w-32 h-32 bg-secondary-500 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 font-crimson">
            Got Questions? We Have Answers
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about Legato, from getting started to advanced features.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors duration-300 text-lg"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                No questions found
              </h3>
              <p className="text-neutral-500">
                Try adjusting your search or category filter.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white border-2 border-neutral-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors duration-300"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors duration-300"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 pr-4">
                    {faq.question}
                  </h3>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 border-t border-neutral-100">
                        <p className="text-neutral-700 leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl p-8">
            <HelpCircle className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h4 className="text-2xl font-bold text-neutral-900 mb-4">
              Still Have Questions?
            </h4>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you get the most out of Legato.
            </p>
            <button className="bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors duration-300">
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}