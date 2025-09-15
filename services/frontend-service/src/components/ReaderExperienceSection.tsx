'use client';

import { useState } from 'react';
import { Smartphone, Wifi, Globe, Users } from 'lucide-react';
import { motion } from "framer-motion"

export default function ReaderExperienceSection() {
    return (
        <section className="py-20 bg-gradient-to-br from-primary-50 via-neutral-50 to-accent-blue/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold text-reading-text dark:text-white mb-6 font-crimson"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        Reading Experience Like No Other
                    </motion.h2>
                    <motion.p
                        className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        Immerse yourself in stories with our mobile-first reading interface, designed for comfort and connection
                    </motion.p>
                </div>

                {/* Mobile Reading Interface Mockup */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    <motion.div
                        className="order-2 lg:order-1"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-3xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                            Mobile-First Reading
                        </h3>
                        <p className="text-lg text-reading-muted dark:text-gray-300 mb-8 leading-relaxed">
                            Experience stories the way they were meant to be read - comfortably, beautifully, and intuitively on any device.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-reading-text dark:text-white">Touch-Optimized Interface</h4>
                                    <p className="text-reading-muted dark:text-gray-400">Smooth scrolling, easy navigation, perfect for mobile reading</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="order-1 lg:order-2 flex justify-center"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        {/* Mobile Mockup */}
                        <div className="relative">
                            <div className="w-80 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative">
                                    {/* Status Bar */}
                                    <div className="h-8 bg-gray-50 dark:bg-gray-700 flex items-center justify-between px-6 text-xs">
                                        <span className="font-medium">9:41</span>
                                        <div className="flex space-x-1">
                                            <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                                            <div className="w-6 h-2 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                                        </div>
                                    </div>

                                    {/* Reading Interface */}
                                    <div className="p-6 h-full">
                                        <div className="text-center mb-6">
                                            <h4 className="text-lg font-bold text-reading-text dark:text-white font-crimson">Chapter 12: The Discovery</h4>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2">
                                                <div className="bg-primary-500 h-1 rounded-full" style={{ width: '65%' }}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 text-sm leading-relaxed text-reading-text dark:text-gray-300">
                                            <p>The ancient library stretched endlessly before Maya, its towering shelves disappearing into shadows above...</p>
                                            <p>Each book seemed to whisper secrets of forgotten worlds, their leather bindings worn smooth by countless hands...</p>
                                            <p className="opacity-60">As she reached for the glowing tome, a voice echoed through the silence...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Offline Capabilities */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="relative">
                            <div className="w-72 h-48 bg-gradient-to-br from-accent-blue/20 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-600/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm text-reading-muted dark:text-gray-400">Offline Mode</span>
                                    </div>
                                    <Wifi className="w-5 h-5 text-gray-400 line-through" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-reading-text dark:text-white">The Midnight Chronicles</div>
                                            <div className="text-xs text-reading-muted dark:text-gray-400">Downloaded • 12 chapters</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-reading-text dark:text-white">Ocean's Whisper</div>
                                            <div className="text-xs text-reading-muted dark:text-gray-400">Downloaded • 8 chapters</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-3xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                            Read Anywhere, Anytime
                        </h3>
                        <p className="text-lg text-reading-muted dark:text-gray-300 mb-8 leading-relaxed">
                            Download your favorite stories and enjoy them offline. No internet? No problem. Your stories are always with you.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-xl flex items-center justify-center">
                                    <Wifi className="w-6 h-6 text-accent-blue" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-reading-text dark:text-white">Smart Offline Sync</h4>
                                    <p className="text-reading-muted dark:text-gray-400">Automatically downloads new chapters when connected</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent-emerald/10 dark:bg-accent-emerald/20 rounded-xl flex items-center justify-center">
                                    <div className="w-6 h-6 bg-accent-emerald rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-reading-text dark:text-white">Data Saving Mode</h4>
                                    <p className="text-reading-muted dark:text-gray-400">Optimized for low-bandwidth connections</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Multi-language and Audio Features */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    <motion.div
                        className="order-2 lg:order-1"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-3xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                            Stories in Every Language
                        </h3>
                        <p className="text-lg text-reading-muted dark:text-gray-300 mb-8 leading-relaxed">
                            Break language barriers with AI-powered translations and immersive audio experiences that bring stories to life.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent-emerald/10 dark:bg-accent-emerald/20 rounded-xl flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-accent-emerald" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-reading-text dark:text-white">50+ Languages</h4>
                                    <p className="text-reading-muted dark:text-gray-400">Instant translation with cultural context preservation</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent-rose/10 dark:bg-accent-rose/20 rounded-xl flex items-center justify-center">
                                    <div className="w-6 h-6 bg-accent-rose rounded-full flex items-center justify-center">
                                        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-reading-text dark:text-white">AI Audiobooks</h4>
                                    <p className="text-reading-muted dark:text-gray-400">Natural voice narration with emotion and character voices</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="order-1 lg:order-2 flex justify-center"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="relative">
                            <div className="w-80 h-64 bg-gradient-to-br from-accent-emerald/20 to-accent-blue/20 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-600/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-semibold text-reading-text dark:text-white">Language & Audio</h4>
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse delay-100"></div>
                                        <div className="w-2 h-2 bg-accent-rose rounded-full animate-pulse delay-200"></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-sm font-medium text-reading-text dark:text-white">🇺🇸 English</span>
                                        <span className="text-xs text-reading-muted dark:text-gray-400">Original</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-sm font-medium text-reading-text dark:text-white">🇪🇸 Español</span>
                                        <span className="text-xs text-accent-emerald font-medium">Available</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-sm font-medium text-reading-text dark:text-white">🇫🇷 Français</span>
                                        <span className="text-xs text-accent-emerald font-medium">Available</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-accent-rose/10 dark:bg-accent-rose/20 rounded-lg border border-accent-rose/30">
                                        <span className="text-sm font-medium text-reading-text dark:text-white">🎧 Audio Version</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1 h-4 bg-accent-rose rounded animate-pulse"></div>
                                            <div className="w-1 h-6 bg-accent-rose rounded animate-pulse delay-100"></div>
                                            <div className="w-1 h-3 bg-accent-rose rounded animate-pulse delay-200"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Community Engagement Highlights */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-3xl font-bold text-reading-text dark:text-white mb-6 font-crimson">
                        Connect with Fellow Readers
                    </h3>
                    <p className="text-lg text-reading-muted dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                        Join a vibrant community of story lovers. Share thoughts, discover new favorites, and connect with authors.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h4 className="text-xl font-semibold text-reading-text dark:text-white mb-3">Discussion Forums</h4>
                            <p className="text-reading-muted dark:text-gray-400">
                                Engage in thoughtful conversations about your favorite stories and characters
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-16 h-16 bg-accent-rose/10 dark:bg-accent-rose/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 bg-accent-rose rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">★</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-semibold text-reading-text dark:text-white mb-3">Rate & Review</h4>
                            <p className="text-reading-muted dark:text-gray-400">
                                Share your thoughts and help other readers discover amazing stories
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-16 h-16 bg-accent-emerald/10 dark:bg-accent-emerald/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 bg-accent-emerald rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">♥</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-semibold text-reading-text dark:text-white mb-3">Follow Authors</h4>
                            <p className="text-reading-muted dark:text-gray-400">
                                Stay updated with your favorite writers and never miss a new chapter
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}