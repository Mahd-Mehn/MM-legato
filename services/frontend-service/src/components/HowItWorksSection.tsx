'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, 
  Shield, 
  Globe, 
  DollarSign, 
  Users, 
  BookOpen,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
  bgGradient: string;
}

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);

  const steps: Step[] = [
    {
      id: 1,
      title: "Write Your Story",
      description: "Create compelling content with our intuitive writing tools",
      icon: <PenTool className="w-8 h-8" />,
      details: [
        "Use our distraction-free writing interface",
        "Organize chapters and manage your story structure",
        "Auto-save ensures your work is never lost",
        "Collaborate with beta readers and editors"
      ],
      color: "text-accent-blue",
      bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
    },
    {
      id: 2,
      title: "Protect Your IP",
      description: "Secure your intellectual property with blockchain technology",
      icon: <Shield className="w-8 h-8" />,
      details: [
        "Automatic copyright registration upon publication",
        "Blockchain-based proof of authorship",
        "Legal protection with Certificate of Authorship",
        "Timestamped creation records"
      ],
      color: "text-primary-600",
      bgGradient: "from-primary-50 to-amber-50 dark:from-primary-900/20 dark:to-amber-900/20"
    },
    {
      id: 3,
      title: "Reach Global Audience",
      description: "Share your stories across languages and cultures",
      icon: <Globe className="w-8 h-8" />,
      details: [
        "AI-powered translation to 50+ languages",
        "Professional audiobook generation",
        "Mobile-optimized reading experience",
        "Offline reading capabilities"
      ],
      color: "text-accent-emerald",
      bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
    },
    {
      id: 4,
      title: "Build Community",
      description: "Connect with readers and fellow writers",
      icon: <Users className="w-8 h-8" />,
      details: [
        "Engage with your reader community",
        "Receive feedback and reviews",
        "Join writer groups and discussions",
        "Participate in writing challenges"
      ],
      color: "text-accent-rose",
      bgGradient: "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
    },
    {
      id: 5,
      title: "Earn Revenue",
      description: "Monetize your creativity through multiple streams",
      icon: <DollarSign className="w-8 h-8" />,
      details: [
        "Keep 60-85% of your earnings",
        "Multiple revenue streams: subscriptions, tips, licensing",
        "Direct reader support and patronage",
        "Licensing opportunities for adaptations"
      ],
      color: "text-accent-amber",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
    }
  ];

  return (
    <section className="px-4 py-20 bg-white dark:bg-gray-900">
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
              How It Works
            </h2>
            <p className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto">
              From idea to income - your journey as a storyteller on Legato
            </p>
          </motion.div>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block">
          {/* Timeline Line */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800 rounded-full transform -translate-y-1/2" />
            
            {/* Steps */}
            <div className="relative flex justify-between items-center">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setActiveStep(step.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Step Circle */}
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeStep === step.id
                      ? 'bg-primary-500 text-white shadow-lg scale-110'
                      : 'bg-white dark:bg-gray-800 text-reading-muted dark:text-gray-400 border-2 border-primary-200 dark:border-gray-600 group-hover:border-primary-400 dark:group-hover:border-primary-500'
                  }`}>
                    {step.icon}
                    {activeStep === step.id && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <div className="relative z-10">
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Step Number */}
                  <div className={`mt-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    activeStep === step.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                  }`}>
                    {step.id}
                  </div>
                  
                  {/* Step Title */}
                  <h3 className={`mt-2 text-lg font-semibold text-center transition-colors duration-300 ${
                    activeStep === step.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-reading-text dark:text-gray-300'
                  }`}>
                    {step.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Active Step Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {steps.map((step) => (
                step.id === activeStep && (
                  <div key={step.id} className={`bg-gradient-to-br ${step.bgGradient} p-8 rounded-3xl border border-white/50 dark:border-gray-600/50`}>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className={`inline-flex items-center space-x-3 mb-4 ${step.color}`}>
                          {step.icon}
                          <h3 className="text-2xl font-bold font-crimson">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-lg text-reading-muted dark:text-gray-300 mb-6">
                          {step.description}
                        </p>
                        <div className="space-y-3">
                          {step.details.map((detail, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start space-x-3"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                              <span className="text-reading-text dark:text-gray-200">
                                {detail}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <motion.div
                          className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white ${step.color}`}
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <div className="text-4xl">
                            {step.icon}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`bg-gradient-to-br ${step.bgGradient} p-6 rounded-2xl border border-white/50 dark:border-gray-600/50`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-bold">
                      {step.id}
                    </span>
                    <h3 className="text-xl font-bold text-reading-text dark:text-white font-crimson">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-reading-muted dark:text-gray-300 mb-4">
                    {step.description}
                  </p>
                  <div className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-reading-text dark:text-gray-200">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center mt-6">
                  <ArrowRight className="w-6 h-6 text-primary-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}