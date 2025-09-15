'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Play, ArrowRight, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-neutral-50 to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated background shapes */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent-rose/20 dark:bg-accent-rose/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-100/20 to-accent-emerald/20 dark:from-primary-900/20 dark:to-accent-emerald/10 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-primary-200/50 dark:border-gray-600/50 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Star className="w-4 h-4 text-primary-500 fill-current" />
          <span className="text-sm font-medium text-reading-text dark:text-gray-200">
            Where Stories Become Intellectual Property
          </span>
          <Star className="w-4 h-4 text-primary-500 fill-current" />
        </motion.div>

        {/* Main Headline */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mb-6">
            <motion.div
              className="inline-block"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-primary-500 mx-auto mb-6" />
            </motion.div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-reading-text dark:text-white mb-6 font-crimson leading-tight">
            Where Stories Find Their{' '}
            <span className="relative">
              <span className="text-transparent bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text">
                Voice
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1 }}
              />
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-xl sm:text-2xl md:text-3xl text-reading-muted dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          A warm, welcoming space for storytellers to craft, protect, and share their tales with readers around the world. 
          <span className="text-primary-600 dark:text-primary-400 font-semibold"> Your stories deserve to be heard, cherished, and rewarded.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link
            href="/auth/register"
            className="group relative bg-gradient-to-r from-primary-500 to-primary-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-3"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link
            href="/stories"
            className="group border-2 border-primary-400 dark:border-primary-500 text-primary-700 dark:text-primary-400 px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-300 backdrop-blur-sm flex items-center space-x-3"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Discover Stories</span>
          </Link>
        </motion.div>

        {/* Stats/Social Proof */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              10K+
            </div>
            <div className="text-reading-muted dark:text-gray-400 font-medium">
              Stories Protected
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              50+
            </div>
            <div className="text-reading-muted dark:text-gray-400 font-medium">
              Languages Supported
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              85%
            </div>
            <div className="text-reading-muted dark:text-gray-400 font-medium">
              Revenue to Writers
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-primary-400 dark:border-primary-500 rounded-full flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-primary-500 rounded-full mt-2"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}