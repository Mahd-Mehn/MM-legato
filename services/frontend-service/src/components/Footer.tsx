'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Send,
  Heart,
  Globe,
  Shield,
  Users,
  BookOpen,
  DollarSign,
  HelpCircle
} from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Platform',
    icon: BookOpen,
    links: [
      { label: 'Discover Stories', href: '/stories' },
      { label: 'Start Writing', href: '/write' },
      { label: 'Writer Dashboard', href: '/dashboard' },
      { label: 'Reading List', href: '/library' },
      { label: 'Trending', href: '/trending' },
    ],
  },
  {
    title: 'Features',
    icon: Globe,
    links: [
      { label: 'IP Protection', href: '/ip-protection' },
      { label: 'Global Translation', href: '/translation' },
      { label: 'Audio Stories', href: '/audio' },
      { label: 'Offline Reading', href: '/offline' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    title: 'Monetization',
    icon: DollarSign,
    links: [
      { label: 'Pricing Plans', href: '/pricing' },
      { label: 'Writer Earnings', href: '/earnings' },
      { label: 'Licensing Marketplace', href: '/licensing' },
      { label: 'Payment Methods', href: '/payments' },
      { label: 'Revenue Sharing', href: '/revenue' },
    ],
  },
  {
    title: 'Support',
    icon: HelpCircle,
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Community Guidelines', href: '/guidelines' },
      { label: 'Report Content', href: '/report' },
      { label: 'Status Page', href: '/status' },
    ],
  },
  {
    title: 'Company',
    icon: Users,
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
      { label: 'Blog', href: '/blog' },
      { label: 'Investors', href: '/investors' },
    ],
  },
  {
    title: 'Legal',
    icon: Shield,
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Copyright Policy', href: '/legal/copyright' },
      { label: 'Community Guidelines', href: '/legal/community-guidelines' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  },
];

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/legato', color: 'hover:text-blue-600' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/legato', color: 'hover:text-blue-400' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/legato', color: 'hover:text-pink-600' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/legato', color: 'hover:text-blue-700' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/legato', color: 'hover:text-red-600' },
];

const contactInfo = [
  { icon: Mail, label: 'hello@legato.com', href: 'mailto:hello@legato.com' },
  { icon: Phone, label: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: MapPin, label: 'San Francisco, CA', href: '#' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // Handle newsletter subscription
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-neutral-900 dark:bg-dark-900 text-white dark:text-dark-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-secondary-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Newsletter Section */}
        <div className="border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                Stay Connected with Legato
              </h3>
              <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
                Get the latest updates on new features, writer spotlights, and platform news. 
                Join our community of storytellers.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-primary-500 focus:outline-none transition-colors duration-300 text-white placeholder-neutral-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubscribed}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 justify-center ${
                    isSubscribed
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Heart className="w-4 h-4" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 lg:gap-6">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="xl:col-span-2 lg:col-span-3 md:col-span-2"
            >
              <Link href="/" className="inline-block mb-6">
                <div className="text-2xl font-bold font-display text-primary-400">
                  Legato
                </div>
                <div className="text-sm text-neutral-400 mt-1">
                  Where Stories Become IP
                </div>
              </Link>
              
              <p className="text-neutral-300 mb-6 leading-relaxed max-w-md">
                Empowering storytellers worldwide with IP protection, global reach, 
                and fair monetization. Join the future of digital storytelling.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {contactInfo.map((contact, index) => {
                  const Icon = contact.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Link
                        href={contact.href}
                        className="flex items-center gap-3 text-neutral-300 hover:text-primary-400 transition-colors duration-300"
                      >
                        <Icon className="w-4 h-4" />
                        {contact.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.div
                      key={social.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Link
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 transition-all duration-300 hover:bg-neutral-700 ${social.color}`}
                        aria-label={social.name}
                      >
                        <Icon className="w-5 h-5" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Footer Links */}
            {footerSections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                  className="xl:col-span-1"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Icon className="w-5 h-5 text-primary-400" />
                    <h4 className="font-semibold text-white">{section.title}</h4>
                  </div>
                  <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <motion.li
                        key={link.label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: linkIndex * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="text-neutral-400 hover:text-primary-400 transition-colors duration-300 text-sm"
                        >
                          {link.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row justify-between items-center gap-4"
            >
              <div className="text-neutral-400 text-sm text-center md:text-left">
                © 2024 Legato. All rights reserved. Made with{' '}
                <Heart className="w-4 h-4 inline text-red-500" /> for storytellers worldwide.
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <Link href="/sitemap" className="text-neutral-400 hover:text-primary-400 transition-colors duration-300">
                  Sitemap
                </Link>
                <Link href="/security" className="text-neutral-400 hover:text-primary-400 transition-colors duration-300">
                  Security
                </Link>
                <Link href="/api" className="text-neutral-400 hover:text-primary-400 transition-colors duration-300">
                  API
                </Link>
                <div className="text-neutral-500">
                  v2.1.0
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}