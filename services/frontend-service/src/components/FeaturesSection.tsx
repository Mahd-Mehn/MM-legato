'use client';

import { Heart, Shield, Globe, Smartphone, Users, BookOpen } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} dark:from-gray-800 dark:to-gray-700 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50 dark:border-gray-600/50`}>
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-white/80 dark:bg-gray-700/80 rounded-2xl shadow-md">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
        {title}
      </h3>
      <p className="text-reading-muted dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <Heart className="w-10 h-10 text-accent-rose" />,
      title: "Reader-First Design",
      description: "Warm, comfortable reading experience with eye-friendly colors and typography that feels like silk",
      gradient: "from-rose-50 to-pink-50"
    },
    {
      icon: <Shield className="w-10 h-10 text-primary-600" />,
      title: "Story Protection",
      description: "Your intellectual property is sacred. We protect it with cryptographic proof and legal backing",
      gradient: "from-primary-50 to-amber-50"
    },
    {
      icon: <Globe className="w-10 h-10 text-accent-emerald" />,
      title: "Global Reach",
      description: "Share your stories across languages and cultures with AI-powered translation and audiobooks",
      gradient: "from-emerald-50 to-teal-50"
    },
    {
      icon: <Smartphone className="w-10 h-10 text-accent-blue" />,
      title: "Mobile Comfort",
      description: "Read anywhere, anytime. Optimized for mobile with offline reading and data-saving features",
      gradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: <Users className="w-10 h-10 text-primary-500" />,
      title: "Community Love",
      description: "Connect with readers who cherish your work. Build lasting relationships through your stories",
      gradient: "from-primary-50 to-yellow-50"
    },
    {
      icon: <BookOpen className="w-10 h-10 text-accent-amber" />,
      title: "Fair Rewards",
      description: "Keep 60-85% of your earnings. Multiple revenue streams ensure your creativity is valued",
      gradient: "from-amber-50 to-orange-50"
    }
  ];

  return (
    <section className="px-4 py-20 bg-gradient-to-r from-neutral-50 to-primary-50 dark:from-gray-800 dark:to-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-reading-text dark:text-white mb-4 font-crimson">
            Crafted for Storytellers
          </h2>
          <p className="text-xl text-reading-muted dark:text-gray-300 max-w-2xl mx-auto">
            Every feature designed with love, care, and the reader's comfort in mind
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
}