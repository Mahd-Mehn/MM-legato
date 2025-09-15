'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Languages, MapPin, ArrowRight, Zap, TrendingUp } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speakers: string;
}

interface Region {
  name: string;
  countries: number;
  languages: number;
  users: string;
  growth: string;
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speakers: '1.5B' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speakers: '500M' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speakers: '280M' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', speakers: '400M' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', speakers: '200M' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', speakers: '260M' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speakers: '600M' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', speakers: '1.1B' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speakers: '125M' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', speakers: '77M' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speakers: '100M' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', speakers: '65M' },
];

const regions: Region[] = [
  { name: 'Africa', countries: 54, languages: 12, users: '2.1M', growth: '+45%' },
  { name: 'Middle East', countries: 18, languages: 8, users: '1.8M', growth: '+38%' },
  { name: 'Asia Pacific', countries: 25, languages: 15, users: '4.2M', growth: '+52%' },
  { name: 'Europe', countries: 44, languages: 10, users: '3.1M', growth: '+28%' },
  { name: 'Americas', countries: 35, languages: 6, users: '2.8M', growth: '+35%' },
];

const translationExample = {
  original: {
    language: 'English',
    flag: '🇺🇸',
    text: 'The moonlight danced across the water, casting silver shadows that whispered secrets of the night.',
  },
  translated: {
    language: 'Arabic',
    flag: '🇸🇦',
    text: 'رقص ضوء القمر عبر الماء، ملقياً ظلالاً فضية تهمس بأسرار الليل.',
  },
};

export default function GlobalReachSection() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <section className="px-4 py-20 bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-600 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Global Reach
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-dark-50 mb-6 font-display">
            Stories That Cross All Borders
          </h2>
          <p className="text-xl text-neutral-600 dark:text-dark-300 max-w-3xl mx-auto leading-relaxed font-medium">
            Break language barriers and reach readers worldwide. Our AI-powered translation 
            technology preserves the soul of your story while making it accessible to billions.
          </p>
        </motion.div>

        {/* Supported Languages Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-dark-50 mb-8 text-center font-display">
            Supported Languages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {supportedLanguages.map((language, index) => (
              <motion.div
                key={language.code}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedLanguage(language)}
                className={`bg-white dark:bg-dark-800 rounded-xl p-4 border cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                  selectedLanguage?.code === language.code
                    ? 'border-primary-500 shadow-lg ring-2 ring-primary-200 dark:ring-primary-400/30'
                    : 'border-neutral-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{language.flag}</div>
                  <div className="font-semibold text-neutral-900 dark:text-dark-100 text-sm mb-1">
                    {language.name}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-dark-400 mb-2">
                    {language.nativeName}
                  </div>
                  <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    {language.speakers} speakers
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Translation Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-dark-50 mb-8 text-center font-display">
            AI-Powered Translation in Action
          </h3>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden border border-neutral-200 dark:border-dark-600 relative">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Original Text */}
                <div className="p-8 md:border-r border-neutral-200 dark:border-dark-600">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">{translationExample.original.flag}</div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-dark-100 font-display">
                        {translationExample.original.language}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-dark-400 font-medium">Original</div>
                    </div>
                  </div>
                  <p className="text-neutral-800 dark:text-dark-200 leading-relaxed font-reading text-lg">
                    "{translationExample.original.text}"
                  </p>
                </div>

                {/* Translated Text */}
                <div className="p-8 bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-primary-900/20 dark:to-primary-800/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">{translationExample.translated.flag}</div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-dark-100 font-display">
                        {translationExample.translated.language}
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-dark-400 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        AI Translation
                      </div>
                    </div>
                  </div>
                  <p className="text-neutral-800 dark:text-dark-200 leading-relaxed font-reading text-lg" dir="rtl">
                    "{translationExample.translated.text}"
                  </p>
                </div>
              </div>

              {/* Translation Arrow */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                <motion.div 
                  className="bg-primary-500 text-white p-3 rounded-full shadow-lg border-4 border-white"
                  whileHover={{ scale: 1.1 }}
                  animate={{ 
                    boxShadow: ['0 4px 20px rgba(230, 162, 60, 0.3)', '0 8px 30px rgba(230, 162, 60, 0.5)', '0 4px 20px rgba(230, 162, 60, 0.3)']
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-neutral-600 dark:text-dark-400 font-medium">
                Preserving meaning, emotion, and cultural context across languages
              </p>
            </div>
          </div>
        </motion.div>

        {/* Regional Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-dark-50 mb-8 text-center font-display">
            Global Community Growth
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {regions.map((region, index) => (
              <motion.div
                key={region.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHoveredRegion(region.name)}
                onHoverEnd={() => setHoveredRegion(null)}
                className={`bg-white dark:bg-dark-800 rounded-xl p-6 border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                  hoveredRegion === region.name
                    ? 'border-primary-500 shadow-xl ring-2 ring-primary-200 dark:ring-primary-400/30'
                    : 'border-neutral-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-400 hover:shadow-lg'
                }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-dark-100 mb-3 font-display">{region.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-dark-400">Countries:</span>
                      <span className="font-medium text-neutral-900 dark:text-dark-200">{region.countries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-dark-400">Languages:</span>
                      <span className="font-medium text-neutral-900 dark:text-dark-200">{region.languages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-dark-400">Active Users:</span>
                      <span className="font-medium text-primary-600 dark:text-primary-400">{region.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-dark-400">Growth:</span>
                      <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {region.growth}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-2xl">
            <Languages className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h4 className="text-2xl font-bold mb-4 font-display">
              Ready to Reach the World?
            </h4>
            <p className="text-lg opacity-95 mb-6 max-w-2xl mx-auto font-medium">
              Join thousands of writers who are already sharing their stories across cultures and languages.
            </p>
            <motion.button 
              className="bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-neutral-50 transition-all duration-300 shadow-lg hover:shadow-xl font-display"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Writing Globally
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}