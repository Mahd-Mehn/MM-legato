'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Award, 
  Globe, 
  CheckCircle, 
  Lock, 
  FileText, 
  Zap, 
  TrendingUp,
  Eye,
  Download,
  Star,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react';

// Legal Protection Guarantees Component
function LegalProtectionContent() {
  const protectionGuarantees = [
    {
      icon: <Shield className="w-12 h-12 text-primary-500" />,
      title: "100% Ownership Guarantee",
      description: "You retain full ownership of your intellectual property. We never claim rights to your work.",
      trustIndicators: ["Legally Binding", "Transparent Terms", "Writer-First Policy"]
    },
    {
      icon: <Globe className="w-12 h-12 text-accent-emerald" />,
      title: "Global Legal Coverage",
      description: "Protection under international copyright treaties in 180+ countries worldwide.",
      trustIndicators: ["Berne Convention", "WIPO Treaties", "International Recognition"]
    },
    {
      icon: <Award className="w-12 h-12 text-accent-amber" />,
      title: "Legal Defense Fund",
      description: "Access to our $2M legal defense fund for copyright infringement cases.",
      trustIndicators: ["Expert Legal Team", "Proven Track Record", "No Win, No Fee"]
    },
    {
      icon: <Lock className="w-12 h-12 text-accent-blue" />,
      title: "Privacy Protection",
      description: "Your personal information and unpublished works are encrypted and secure.",
      trustIndicators: ["End-to-End Encryption", "GDPR Compliant", "Zero Data Selling"]
    }
  ];

  const legalPartners = [
    { name: "International Publishers Association", logo: "🏛️" },
    { name: "World Intellectual Property Organization", logo: "🌍" },
    { name: "Authors Guild", logo: "✍️" },
    { name: "Creative Commons", logo: "🎨" }
  ];

  const successMetrics = [
    { metric: "99.7%", label: "Copyright Claims Won", icon: TrendingUp },
    { metric: "24hrs", label: "Average Response Time", icon: Zap },
    { metric: "$2M", label: "Legal Defense Fund", icon: Shield },
    { metric: "180+", label: "Countries Protected", icon: Globe }
  ];

  return (
    <div className="space-y-12">
      {/* Protection Guarantees */}
      <div className="grid md:grid-cols-2 gap-8">
        {protectionGuarantees.map((guarantee, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                  {guarantee.icon}
                </div>
              </div>
              <h4 className="text-xl font-bold text-reading-text dark:text-white mb-3 font-crimson">
                {guarantee.title}
              </h4>
              <p className="text-reading-muted dark:text-gray-300 leading-relaxed">
                {guarantee.description}
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-2">
              {guarantee.trustIndicators.map((indicator, indicatorIndex) => (
                <div
                  key={indicatorIndex}
                  className="flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-accent-emerald" />
                  <span className="text-reading-text dark:text-gray-200">
                    {indicator}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Success Metrics */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-3xl">
        <h3 className="text-2xl font-bold text-center mb-8 font-crimson">
          Proven Track Record
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          {successMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Icon className="w-8 h-8 text-primary-100 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-2">
                  {metric.metric}
                </div>
                <div className="text-primary-100 text-sm">
                  {metric.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legal Partners */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-center text-reading-text dark:text-white mb-8 font-crimson">
          Trusted Legal Partners
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          {legalPartners.map((partner, index) => (
            <motion.div
              key={index}
              className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl mb-3">{partner.logo}</div>
              <div className="text-sm text-reading-text dark:text-gray-200 font-medium">
                {partner.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legal Guarantee Seal */}
      <div className="text-center">
        <motion.div
          className="inline-block bg-white dark:bg-gray-800 p-8 rounded-full shadow-2xl border-4 border-primary-200 dark:border-primary-700"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h4 className="text-xl font-bold text-reading-text dark:text-white mb-2 font-crimson">
            Legato Legal Guarantee
          </h4>
          <p className="text-reading-muted dark:text-gray-300 text-sm max-w-xs">
            Your stories are protected by industry-leading legal safeguards
          </p>
        </motion.div>
      </div>

      {/* Contact Legal Team CTA */}
      <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-3xl text-center">
        <h4 className="text-xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
          Questions About Legal Protection?
        </h4>
        <p className="text-reading-muted dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Our legal experts are available to answer your questions about IP protection, 
          copyright law, and licensing agreements.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors duration-300">
            Contact Legal Team
          </button>
          <button className="border-2 border-primary-500 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-300">
            View Legal FAQ
          </button>
        </div>
      </div>
    </div>
  );
}

// Licensing Marketplace Preview Component
function LicensingMarketplaceContent() {
  const sampleListings = [
    {
      title: "The Last Dragon's Song",
      author: "Sarah Chen",
      genre: "Epic Fantasy",
      readers: "2.3M",
      rating: 4.9,
      price: "$25,000",
      type: "Film Rights",
      status: "Available",
      description: "A sweeping fantasy epic about the last dragon rider in a world where magic is fading.",
      tags: ["Dragons", "Magic", "Adventure", "Coming of Age"],
      engagement: {
        views: "156K",
        saves: "23K",
        inquiries: "47"
      }
    },
    {
      title: "Neon Shadows",
      author: "Marcus Johnson",
      genre: "Cyberpunk Thriller",
      readers: "1.8M",
      rating: 4.7,
      price: "$18,000",
      type: "TV Series",
      status: "Under Review",
      description: "A noir detective story set in a dystopian future where memories can be stolen.",
      tags: ["Cyberpunk", "Detective", "Sci-Fi", "Noir"],
      engagement: {
        views: "89K",
        saves: "15K",
        inquiries: "32"
      }
    },
    {
      title: "Hearts in Mumbai",
      author: "Aisha Patel",
      genre: "Contemporary Romance",
      readers: "3.1M",
      rating: 4.8,
      price: "$12,000",
      type: "Book Series",
      status: "Hot Deal",
      description: "A heartwarming romance series following love stories across modern Mumbai.",
      tags: ["Romance", "Cultural", "Modern", "Series"],
      engagement: {
        views: "203K",
        saves: "41K",
        inquiries: "78"
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Marketplace Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
          IP Licensing Marketplace
        </h3>
        <p className="text-reading-muted dark:text-gray-300 max-w-2xl mx-auto">
          Connect your stories with studios, publishers, and producers looking for their next big hit
        </p>
      </div>

      {/* Marketplace Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Active Listings", value: "2,847", icon: FileText, color: "text-primary-500" },
          { label: "Total Deals", value: "$2.3M", icon: DollarSign, color: "text-accent-emerald" },
          { label: "Success Rate", value: "73%", icon: TrendingUp, color: "text-accent-amber" },
          { label: "Publishers", value: "156", icon: Users, color: "text-accent-blue" }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-primary-100 dark:border-gray-700 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-2xl font-bold text-reading-text dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-reading-muted dark:text-gray-400 text-sm">
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sample Listings */}
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-reading-text dark:text-white mb-4">
          Featured Licensing Opportunities
        </h4>
        
        {sampleListings.map((listing, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Story Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="text-xl font-bold text-reading-text dark:text-white mb-1">
                      {listing.title}
                    </h5>
                    <p className="text-reading-muted dark:text-gray-400 text-sm">
                      by {listing.author} • {listing.genre}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    listing.status === 'Available' ? 'bg-accent-emerald/20 text-accent-emerald' :
                    listing.status === 'Hot Deal' ? 'bg-accent-amber/20 text-accent-amber' :
                    'bg-accent-blue/20 text-accent-blue'
                  }`}>
                    {listing.status}
                  </div>
                </div>

                <p className="text-reading-text dark:text-gray-200 mb-4 text-sm">
                  {listing.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center space-x-6 text-sm text-reading-muted dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{listing.readers} readers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-accent-amber fill-current" />
                    <span>{listing.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{listing.engagement.views} views</span>
                  </div>
                </div>
              </div>

              {/* Licensing Details */}
              <div className="lg:w-64 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {listing.price}
                  </div>
                  <div className="text-primary-600 dark:text-primary-400 text-sm">
                    {listing.type}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-reading-muted dark:text-gray-400 mb-4">
                  <div className="flex justify-between">
                    <span>Inquiries:</span>
                    <span className="text-reading-text dark:text-white font-medium">
                      {listing.engagement.inquiries}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saved:</span>
                    <span className="text-reading-text dark:text-white font-medium">
                      {listing.engagement.saves}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-primary-500 text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors duration-300 text-sm">
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Marketplace CTA */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-3xl text-center">
        <h4 className="text-2xl font-bold mb-4 font-crimson">
          Ready to License Your Stories?
        </h4>
        <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
          Join thousands of writers earning from licensing deals. Our marketplace connects you 
          directly with studios, publishers, and producers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors duration-300">
            List Your Story
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-300">
            Browse Opportunities
          </button>
        </div>
      </div>
    </div>
  );
}

// Certificate of Authorship Preview Component
function CertificatePreviewContent() {
  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      {/* Certificate Preview */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border-2 border-primary-200 dark:border-primary-700 relative overflow-hidden">
        {/* Certificate Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-amber/10 rounded-t-3xl"></div>
          <div className="relative z-10 py-6">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-primary-700 dark:text-primary-300 font-crimson">
              Certificate of Authorship
            </h3>
            <p className="text-primary-600 dark:text-primary-400 text-sm mt-2">
              Blockchain-Verified Intellectual Property
            </p>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-reading-text dark:text-gray-200 text-lg leading-relaxed">
              This certifies that
            </p>
            <h4 className="text-2xl font-bold text-primary-700 dark:text-primary-300 my-2 font-crimson">
              Sarah Chen
            </h4>
            <p className="text-reading-text dark:text-gray-200 text-lg leading-relaxed">
              is the original author of
            </p>
            <h5 className="text-xl font-semibold text-reading-text dark:text-white my-2 italic">
              "The Last Dragon's Song"
            </h5>
          </div>

          {/* Verification Details */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-reading-muted dark:text-gray-400 text-sm">Creation Date:</span>
              <span className="text-reading-text dark:text-white font-medium">March 15, 2024</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-reading-muted dark:text-gray-400 text-sm">Blockchain Hash:</span>
              <span className="text-primary-600 dark:text-primary-400 font-mono text-xs">0x7a8b9c...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-reading-muted dark:text-gray-400 text-sm">Block Number:</span>
              <span className="text-reading-text dark:text-white font-medium">#18,945,672</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-reading-muted dark:text-gray-400 text-sm">Network:</span>
              <span className="text-accent-emerald font-medium">Ethereum Mainnet</span>
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-center justify-center space-x-2 p-3 bg-accent-emerald/10 rounded-xl">
            <CheckCircle className="w-5 h-5 text-accent-emerald" />
            <span className="text-accent-emerald font-semibold">Verified & Protected</span>
          </div>

          {/* Download Button */}
          <button className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors duration-300 flex items-center justify-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download Certificate</span>
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-8 h-8 border-2 border-primary-200 dark:border-primary-700 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-accent-amber/30 rounded-full"></div>
      </div>

      {/* Certificate Benefits */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
          Legal-Grade Documentation
        </h3>
        
        {[
          {
            icon: <FileText className="w-8 h-8 text-primary-500" />,
            title: 'Court-Admissible Evidence',
            description: 'Accepted by legal systems worldwide as proof of original authorship and creation date'
          },
          {
            icon: <Shield className="w-8 h-8 text-accent-emerald" />,
            title: 'Copyright Registration',
            description: 'Automatically qualifies for copyright protection in 180+ countries under international treaties'
          },
          {
            icon: <Globe className="w-8 h-8 text-accent-blue" />,
            title: 'Publisher Verification',
            description: 'Studios and publishers can instantly verify authenticity when considering licensing deals'
          },
          {
            icon: <Award className="w-8 h-8 text-accent-amber" />,
            title: 'Professional Credibility',
            description: 'Demonstrates serious commitment to your craft and intellectual property protection'
          }
        ].map((benefit, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-primary-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                {benefit.icon}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-reading-text dark:text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-reading-muted dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-2xl">
          <h4 className="text-lg font-bold mb-2">Instant Certificate Generation</h4>
          <p className="text-primary-100 text-sm">
            Every story published on Legato automatically receives a Certificate of Authorship. 
            No extra steps, no additional fees.
          </p>
        </div>
      </div>
    </div>
  );
}

// Blockchain Verification Content Component
function BlockchainVerificationContent() {
  const blockchainSteps = [
    {
      step: 1,
      title: 'Story Creation',
      description: 'You write and publish your story',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-primary-500'
    },
    {
      step: 2,
      title: 'Cryptographic Hash',
      description: 'Content generates unique digital fingerprint',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-accent-amber'
    },
    {
      step: 3,
      title: 'Blockchain Record',
      description: 'Immutable timestamp stored on blockchain',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-accent-emerald'
    },
    {
      step: 4,
      title: 'Legal Proof',
      description: 'Verifiable proof of authorship forever',
      icon: <Award className="w-6 h-6" />,
      color: 'bg-accent-blue'
    }
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Visual Diagram */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-8 font-crimson text-center">
          How Blockchain Protection Works
        </h3>
        
        <div className="space-y-6">
          {blockchainSteps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                {step.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-primary-600 dark:text-primary-400">
                    {step.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-reading-text dark:text-white">
                    {step.title}
                  </h4>
                </div>
                <p className="text-reading-muted dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
              {index < blockchainSteps.length - 1 && (
                <div className="absolute left-6 mt-12 w-0.5 h-6 bg-primary-200 dark:bg-primary-700"></div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <div className="flex items-center space-x-2 text-primary-700 dark:text-primary-300">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Tamper-proof & Legally Binding</span>
          </div>
        </div>
      </div>

      {/* Benefits & Features */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
          Unbreakable Protection
        </h3>
        
        {[
          {
            icon: <Shield className="w-8 h-8 text-primary-500" />,
            title: 'Immutable Records',
            description: 'Once recorded, your authorship proof cannot be altered or deleted by anyone'
          },
          {
            icon: <Globe className="w-8 h-8 text-accent-emerald" />,
            title: 'Global Recognition',
            description: 'Blockchain proof accepted by courts and IP offices worldwide'
          },
          {
            icon: <Zap className="w-8 h-8 text-accent-amber" />,
            title: 'Instant Verification',
            description: 'Anyone can verify your authorship in seconds using our blockchain explorer'
          },
          {
            icon: <Lock className="w-8 h-8 text-accent-blue" />,
            title: 'Military-Grade Security',
            description: 'Protected by the same cryptography that secures billions in cryptocurrency'
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-primary-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-reading-text dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-reading-muted dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function IPProtectionShowcase() {
  const [activeTab, setActiveTab] = useState('blockchain');

  return (
    <section className="px-4 py-20 bg-gradient-to-br from-primary-50 via-white to-accent-blue/10 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
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
              Your Stories, Protected & Profitable
            </h2>
            <p className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto">
              Advanced IP protection meets lucrative licensing opportunities. 
              Your creativity deserves both security and success.
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 max-w-3xl mx-auto">
          {[
            { id: 'blockchain', label: 'Blockchain Verification', icon: Shield },
            { id: 'certificate', label: 'Certificate Preview', icon: Award },
            { id: 'marketplace', label: 'Licensing Marketplace', icon: Globe },
            { id: 'guarantees', label: 'Legal Protection', icon: Lock }
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
          {activeTab === 'blockchain' && <BlockchainVerificationContent />}
          {activeTab === 'certificate' && <CertificatePreviewContent />}
          {activeTab === 'marketplace' && <LicensingMarketplaceContent />}
          {activeTab === 'guarantees' && <LegalProtectionContent />}
        </motion.div>
      </div>
    </section>
  );
}