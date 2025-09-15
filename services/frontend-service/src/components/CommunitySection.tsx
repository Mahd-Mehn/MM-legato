'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Globe, 
  Heart, 
  MessageCircle, 
  Star,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink
} from 'lucide-react';

export default function CommunitySection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Animated counter hook
  const useCounter = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (!hasAnimated) return;
      
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [end, duration, hasAnimated]);

    return { count, setHasAnimated };
  };

  // Community statistics
  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      label: 'Active Writers',
      value: 25000,
      suffix: '+',
      color: 'text-primary-500'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      label: 'Stories Published',
      value: 150000,
      suffix: '+',
      color: 'text-accent-emerald'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      label: 'Countries Reached',
      value: 180,
      suffix: '',
      color: 'text-accent-amber'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      label: 'Monthly Readers',
      value: 2500000,
      suffix: '+',
      color: 'text-accent-rose'
    }
  ];

  // User testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Elena Rodriguez',
      role: 'Romance Author',
      location: 'Barcelona, Spain',
      avatar: '/api/placeholder/80/80',
      story: 'Legato transformed my writing hobby into a full-time career. The community support is incredible, and I\'ve made lifelong friends from around the world.',
      rating: 5,
      earnings: '$4,200/month',
      followers: '12.5K',
      image: '/api/placeholder/400/300'
    },
    {
      id: 2,
      name: 'Kwame Asante',
      role: 'Fantasy Writer',
      location: 'Accra, Ghana',
      avatar: '/api/placeholder/80/80',
      story: 'The IP protection gave me confidence to share my African folklore adaptations. Now my stories are being translated into 15 languages!',
      rating: 5,
      earnings: '$3,800/month',
      followers: '8.9K',
      image: '/api/placeholder/400/300'
    },
    {
      id: 3,
      name: 'Yuki Tanaka',
      role: 'Sci-Fi Author',
      location: 'Tokyo, Japan',
      avatar: '/api/placeholder/80/80',
      story: 'The global reach is amazing. My cyberpunk series has readers from every continent, and the community feedback helps me improve every chapter.',
      rating: 5,
      earnings: '$5,100/month',
      followers: '15.2K',
      image: '/api/placeholder/400/300'
    },
    {
      id: 4,
      name: 'Amara Hassan',
      role: 'Literary Fiction',
      location: 'Cairo, Egypt',
      avatar: '/api/placeholder/80/80',
      story: 'Legato\'s community celebrates diverse voices. My stories about modern Cairo life have found readers who truly understand and appreciate the culture.',
      rating: 5,
      earnings: '$2,900/month',
      followers: '6.7K',
      image: '/api/placeholder/400/300'
    }
  ];

  // Featured stories
  const featuredStories = [
    {
      title: 'The Last Lighthouse Keeper',
      author: 'Marina Santos',
      genre: 'Literary Fiction',
      cover: '/api/placeholder/200/300',
      rating: 4.9,
      readers: '45K',
      chapters: 24,
      description: 'A haunting tale of solitude and connection in a world that\'s forgotten the art of waiting.'
    },
    {
      title: 'Neon Dreams',
      author: 'Alex Chen',
      genre: 'Cyberpunk',
      cover: '/api/placeholder/200/300',
      rating: 4.8,
      readers: '62K',
      chapters: 18,
      description: 'In 2087 Neo-Tokyo, a hacker discovers that reality itself might be the ultimate code to crack.'
    },
    {
      title: 'The Spice Route Chronicles',
      author: 'Priya Sharma',
      genre: 'Historical Fantasy',
      cover: '/api/placeholder/200/300',
      rating: 4.9,
      readers: '38K',
      chapters: 32,
      description: 'Magic flows through ancient trade routes as a young merchant discovers her family\'s mystical heritage.'
    },
    {
      title: 'Midnight in Marrakech',
      author: 'Omar Benali',
      genre: 'Mystery',
      cover: '/api/placeholder/200/300',
      rating: 4.7,
      readers: '29K',
      chapters: 16,
      description: 'A detective\'s search for truth leads through the labyrinthine souks of Morocco\'s imperial city.'
    }
  ];

  // Social media feeds (mock data)
  const socialPosts = [
    {
      platform: 'twitter',
      icon: <Twitter className="w-5 h-5" />,
      author: '@LegatoStories',
      content: 'Just hit 25,000 active writers on the platform! 🎉 The creativity flowing through our community is absolutely incredible. #WritingCommunity #Legato',
      time: '2h ago',
      likes: 342,
      shares: 89
    },
    {
      platform: 'instagram',
      icon: <Instagram className="w-5 h-5" />,
      author: '@legato_official',
      content: 'Writer spotlight: Elena\'s romance series just crossed 1M reads! Her journey from hobby writer to bestselling author is truly inspiring. 💫',
      time: '4h ago',
      likes: 1205,
      shares: 156
    },
    {
      platform: 'facebook',
      icon: <Facebook className="w-5 h-5" />,
      author: 'Legato Stories',
      content: 'New feature alert! 📚 Our AI-powered audiobook generation is now available in 12 new languages. Your stories can now reach even more readers worldwide!',
      time: '6h ago',
      likes: 892,
      shares: 234
    }
  ];

  // Counter components
  const StatCounter = ({ stat, index }: { stat: any; index: number }) => {
    const { count, setHasAnimated } = useCounter(stat.value);
    
    return (
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        onViewportEnter={() => setHasAnimated(true)}
      >
        <div className={`${stat.color} mb-4 flex justify-center`}>
          {stat.icon}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-reading-text dark:text-white mb-2">
          {count.toLocaleString()}{stat.suffix}
        </div>
        <div className="text-reading-muted dark:text-gray-400 font-medium">
          {stat.label}
        </div>
      </motion.div>
    );
  };

  return (
    <section className="px-4 py-20 bg-gradient-to-br from-accent-rose/5 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              Join Our Global Community
            </h2>
            <p className="text-xl text-reading-muted dark:text-gray-300 max-w-3xl mx-auto">
              Connect with writers and readers from around the world. Share stories, get feedback, and build lasting relationships.
            </p>
          </motion.div>
        </div>

        {/* Community Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <StatCounter key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* User Testimonials Grid */}
        <div className="mb-20">
          <motion.h3
            className="text-3xl font-bold text-reading-text dark:text-white mb-12 text-center font-crimson"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Stories from Our Community
          </motion.h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-primary-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Profile Image */}
                <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{testimonial.name}</h4>
                        <p className="text-primary-100 text-sm">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                      {testimonial.role}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent-amber fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-reading-text dark:text-gray-200 text-sm leading-relaxed mb-4">
                    "{testimonial.story}"
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-primary-600 dark:text-primary-400 font-semibold">
                      {testimonial.earnings}
                    </div>
                    <div className="text-reading-muted dark:text-gray-400">
                      {testimonial.followers} followers
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Stories Carousel */}
        <div className="mb-20">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-reading-text dark:text-white font-crimson">
              Trending Stories
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))}
                className="p-2 rounded-full bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-gray-600 transition-colors"
                disabled={currentStoryIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentStoryIndex(Math.min(featuredStories.length - 1, currentStoryIndex + 1))}
                className="p-2 rounded-full bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-gray-600 transition-colors"
                disabled={currentStoryIndex >= featuredStories.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="overflow-hidden">
            <motion.div
              className="flex space-x-6"
              animate={{ x: -currentStoryIndex * 320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {featuredStories.map((story, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex">
                    <div className="w-24 h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      📚
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                          {story.genre}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-accent-amber fill-current" />
                          <span className="text-xs text-reading-muted dark:text-gray-400">{story.rating}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-reading-text dark:text-white text-sm mb-1 line-clamp-2">
                        {story.title}
                      </h4>
                      <p className="text-xs text-reading-muted dark:text-gray-400 mb-2">
                        by {story.author}
                      </p>
                      <p className="text-xs text-reading-text dark:text-gray-200 line-clamp-2 mb-3">
                        {story.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-reading-muted dark:text-gray-400">
                        <span>{story.readers} readers</span>
                        <span>{story.chapters} chapters</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Social Media Integration */}
        <div className="mb-16">
          <motion.h3
            className="text-3xl font-bold text-reading-text dark:text-white mb-8 text-center font-crimson"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Follow Our Journey
          </motion.h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {socialPosts.map((post, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-primary-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-full ${
                    post.platform === 'twitter' ? 'bg-blue-100 text-blue-600' :
                    post.platform === 'instagram' ? 'bg-pink-100 text-pink-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {post.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-reading-text dark:text-white text-sm">
                      {post.author}
                    </h4>
                    <p className="text-xs text-reading-muted dark:text-gray-400">
                      {post.time}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-reading-muted dark:text-gray-400 ml-auto" />
                </div>
                
                <p className="text-reading-text dark:text-gray-200 text-sm leading-relaxed mb-4">
                  {post.content}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-reading-muted dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.shares}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Community CTA */}
        <motion.div
          className="text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white p-12 rounded-3xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold mb-4 font-crimson">
            Ready to Join Our Community?
          </h3>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto text-lg">
            Connect with writers and readers from around the world. Share your stories, get feedback, and build your audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors duration-300 shadow-lg">
              Start Writing
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-300">
              Explore Stories
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}