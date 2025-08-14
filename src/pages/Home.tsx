import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Zap, Shield, Star, Image as ImageIcon, Filter } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ScrollToTop, { SectionNavigation } from '../components/ScrollToTop';
import { FeatureCard, TestimonialCard } from '../components/Card';
import Button, { RippleButton } from '../components/Button';
import ImageComparison from '../components/ImageComparison';
import Lightbox from '../components/Lightbox';
import TestimonialCarousel from '../components/TestimonialCarousel';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';
  
  // Mobile-first responsive hooks
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Scroll animations
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Touch handlers for mobile interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    // Handle swipe gestures if needed
    if (isLeftSwipe || isRightSwipe) {
      // Add swipe functionality here
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: t('home.features.ai.title'),
      description: t('home.features.ai.description')
    },
    {
      icon: Users,
      title: t('home.features.categories.title'),
      description: t('home.features.categories.description')
    },
    {
      icon: Zap,
      title: t('home.features.fast.title'),
      description: t('home.features.fast.description')
    },
    {
      icon: Shield,
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description')
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: t('home.testimonials.customer1.name'),
      role: t('home.testimonials.customer1.role'),
      content: t('home.testimonials.customer1.content'),
      rating: 5,
      company: 'Creative Studio'
    },
    {
      id: 2,
      name: t('home.testimonials.customer2.name'),
      role: t('home.testimonials.customer2.role'),
      content: t('home.testimonials.customer2.content'),
      rating: 5,
      company: 'Tech Solutions'
    },
    {
      id: 3,
      name: t('home.testimonials.customer3.name'),
      role: t('home.testimonials.customer3.role'),
      content: t('home.testimonials.customer3.content'),
      rating: 5,
      company: 'Digital Agency'
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      role: 'Wedding Photographer',
      content: 'Stylica.ai has revolutionized my workflow. The AI enhancement quality is incredible, and my clients are amazed by the results. It saves me hours of editing time.',
      rating: 5,
      company: 'SJ Photography'
    },
    {
      id: 5,
      name: 'Michael Chen',
      role: 'E-commerce Manager',
      content: 'Our product photos look professional and consistent now. The batch processing feature is a game-changer for our online store. Sales have increased by 30%!',
      rating: 5,
      company: 'TechGear Store'
    }
  ];

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Example images data
  const exampleImages = [
    {
      id: 1,
      category: 'portrait',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20photo%20of%20a%20person%20low%20quality%20blurry%20dark&image_size=square',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20high%20quality%20sharp%20bright%20enhanced&image_size=square',
      title: t('home.examples.portraitEnhancement.title'),
      description: t('home.examples.portraitEnhancement.description')
    },
    {
      id: 2,
      category: 'landscape',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=landscape%20photo%20dull%20colors%20low%20contrast%20foggy&image_size=landscape_16_9',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vibrant%20landscape%20photo%20high%20contrast%20clear%20sky%20enhanced%20colors&image_size=landscape_16_9',
      title: t('home.examples.landscapeRestoration.title'),
      description: t('home.examples.landscapeRestoration.description')
    },
    {
      id: 3,
      category: 'product',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=product%20photo%20poor%20lighting%20shadows%20low%20quality&image_size=square',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20product%20photo%20perfect%20lighting%20no%20shadows%20high%20quality&image_size=square',
      title: t('home.examples.productPhotography.title'),
      description: t('home.examples.productPhotography.description')
    },
    {
      id: 4,
      category: 'vintage',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=old%20vintage%20photo%20faded%20scratched%20damaged&image_size=portrait_4_3',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=restored%20vintage%20photo%20clear%20colors%20no%20damage%20enhanced&image_size=portrait_4_3',
      title: t('home.examples.vintageRestoration.title'),
      description: t('home.examples.vintageRestoration.description')
    },
    {
      id: 5,
      category: 'portrait',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=selfie%20photo%20poor%20lighting%20grainy%20low%20resolution&image_size=square',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=enhanced%20selfie%20perfect%20lighting%20smooth%20skin%20high%20resolution&image_size=square',
      title: t('home.examples.selfieEnhancement.title'),
      description: t('home.examples.selfieEnhancement.description')
    },
    {
      id: 6,
      category: 'landscape',
      beforeImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=night%20photo%20very%20dark%20noisy%20underexposed&image_size=landscape_16_9',
      afterImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=enhanced%20night%20photo%20clear%20details%20reduced%20noise%20perfect%20exposure&image_size=landscape_16_9',
      title: t('home.examples.nightPhotography.title'),
      description: t('home.examples.nightPhotography.description')
    }
  ];

  const categories = [
    { id: 'all', label: t('home.categories.all') },
    { id: 'portrait', label: t('home.categories.portraits') },
    { id: 'landscape', label: t('home.categories.landscapes') },
    { id: 'product', label: t('home.categories.products') },
    { id: 'vintage', label: t('home.categories.vintage') }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? exampleImages 
    : exampleImages.filter(img => img.category === selectedCategory);

  const lightboxImages = filteredImages.map(img => ({
    src: img.afterImage,
    alt: img.title,
    title: img.title,
    description: img.description
  }));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const previousImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  // Section navigation data
  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'examples', label: 'Examples' },
    { id: 'features', label: 'Features' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'cta', label: 'Get Started' }
  ];

  return (
    <div className="bg-white">
      {/* Scroll to Top Button */}
      <ScrollToTop showProgress={true} />
      
      {/* Section Navigation - Removed to fix double header issue */}
      {/* <div className="fixed top-20 right-4 z-40 hidden lg:block">
        <SectionNavigation sections={sections} className="bg-white/80 backdrop-blur-sm shadow-lg" />
      </div> */}
      
      {/* Hero Section */}
      <motion.section 
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 animate-gradient bg-300%"
        style={{ y: heroY, opacity: heroOpacity }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary-400/20 to-accent-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-accent-400/10 to-primary-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
        </div>
        
        {/* Glassmorphism Container */}
        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            {/* Floating Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-primary-700 text-sm font-medium mb-8 animate-fade-in" role="banner" aria-label="AI-Powered Image Enhancement feature">
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('home.badges.aiPowered')}
            </div>
            
            {/* Main Title with Gradient Animation */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 animate-slide-up" role="heading" aria-level={1}>
              <span className="text-gray-900">{t('home.hero.title')}</span>
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent animate-gradient bg-300%">
                {t('home.hero.titleHighlight')}
              </span>
            </h1>
            
            {/* Subtitle with Glassmorphism */}
            <div className="relative">
              <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}} role="text" aria-describedby="hero-description">
                <span id="hero-description">{t('home.hero.subtitle')}</span>
              </p>
            </div>
            
            {/* CTA Buttons with Enhanced Design */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full max-w-md sm:max-w-none mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              role="group"
              aria-label="Ana eylem butonları"
            >
              {user ? (
                <Link to={`/${currentLang}/dashboard`} className="w-full sm:w-auto">
                  <RippleButton
                    variant="primary"
                    size={isMobile ? "lg" : "xl"}
                    fullWidth={isMobile}
                    rightIcon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
                    className="min-h-[56px] touch-manipulation"
                    role="button"
                    aria-label="Dashboard'a Git - Ana kontrol paneline erişim"
                  >
                    {t('common.goToDashboard')}
                  </RippleButton>
                </Link>
              ) : (
                <>
                  <Link to={`/${currentLang}/login`} className="w-full sm:w-auto">
                    <RippleButton
                      variant="primary"
                      size={isMobile ? "lg" : "xl"}
                      fullWidth={isMobile}
                      rightIcon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
                      className="min-h-[56px] touch-manipulation"
                      role="button"
                      aria-label="Giriş Yap - Hesabınıza giriş yapın"
                    >
                      {t('navigation.login')}
                    </RippleButton>
                  </Link>
                  <Link to={`/${currentLang}/register`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size={isMobile ? "lg" : "xl"}
                      fullWidth={isMobile}
                      rightIcon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
                      className="min-h-[56px] touch-manipulation bg-white/20 backdrop-blur-sm border-white/30 text-gray-800 hover:bg-white/30"
                      role="button"
                      aria-label="Kayıt Ol - Yeni hesap oluşturun"
                    >
                      {t('navigation.register')}
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
            
            {/* Floating Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">10K+</div>
                <div className="text-gray-600">{t('home.stats.imagesEnhanced')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary-600 mb-2">99.9%</div>
                <div className="text-gray-600">{t('home.stats.satisfactionRate')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-600 mb-2">&lt;30s</div>
                <div className="text-gray-600">{t('home.stats.processingTime')}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-b from-white to-gray-50" role="region" aria-labelledby="features-title">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <header className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6" aria-hidden="true">
              <Zap className="w-4 h-4 mr-2" />
              {t('home.badges.powerfulFeatures')}
            </div>
            <h2 id="features-title" className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6" role="heading" aria-level={2}>
              {t('home.features.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed" role="text">
              {t('home.features.subtitle')}
            </p>
          </header>
          <motion.div 
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
            role="list"
            aria-label="Özellikler listesi"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  role="listitem"
                  aria-labelledby={`feature-title-${index}`}
                  tabIndex={0}
                >
                  <FeatureCard
                    icon={<Icon className="w-8 h-8" aria-hidden="true" />}
                    title={feature.title}
                    description={feature.description}
                    className="h-full touch-manipulation"
                    
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Examples Section */}
       <section id="examples" className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-br from-white via-gray-50/50 to-primary-50/20">
         <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent-100 text-accent-700 text-sm font-medium mb-6">
              <ImageIcon className="w-4 h-4 mr-2" />
              {t('home.badges.beforeAfter')}
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
              {t('home.examples.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('home.examples.subtitle')}
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Image Grid */}
          <motion.div 
             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
          >
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <ImageComparison
                    beforeImage={image.beforeImage}
                    afterImage={image.afterImage}
                    beforeLabel={t('common.before')}
                    afterLabel={t('common.after')}
                    className="rounded-t-2xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {image.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {image.description}
                    </p>
                    <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                      <span>{t('home.buttons.viewDetails')}</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* View More Button */}
          <div className="text-center mt-12 sm:mt-16">
            <Link
              to={user ? `/${currentLang}/dashboard` : `/${currentLang}/register`}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>{user ? t('home.buttons.tryItNow') : t('home.buttons.getStartedFree')}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-br from-gray-50 to-primary-50/30">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-100 text-secondary-700 text-sm font-medium mb-6">
              <Users className="w-4 h-4 mr-2" />
              {t('home.badges.customerStories')}
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('home.testimonials.subtitle')}
            </p>
          </div>
          {/* Enhanced Testimonial Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <TestimonialCarousel
              testimonials={testimonials}
              autoPlay={true}
              autoPlayInterval={6000}
              className="touch-manipulation"
            />
          </motion.div>
          
          {/* Additional Testimonials Grid for Desktop */}
          <div className="hidden lg:block mt-12 sm:mt-16">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, staggerChildren: 0.15 }}
            >
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                >
                  <TestimonialCard
                    quote={testimonial.content}
                    author={testimonial.name}
                    role={testimonial.role}
                    rating={testimonial.rating}
                    className="h-full touch-manipulation"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-16 sm:py-20 lg:py-24 xl:py-32 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 animate-gradient bg-300% overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('home.badges.readyToTransform')}
          </div>
          
          {/* Title */}
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 animate-slide-up">
            {t('home.cta.title')}
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
            {t('home.cta.subtitle')}
          </p>
          
          {/* CTA Button */}
          <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Link
              to={user ? `/${currentLang}/dashboard` : `/${currentLang}/register`}
              className="group relative inline-flex items-center px-12 py-6 bg-white text-primary-600 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 min-w-[250px] justify-center"
            >
              <span className="relative z-10">{user ? t('common.goToDashboard') : t('common.startNow')}</span>
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gray-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 animate-fade-in" style={{animationDelay: '0.6s'}}>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">✨ {t('home.trustIndicators.aiPowered')}</div>
              <div className="text-white/80">{t('home.trustIndicators.aiPoweredDesc')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">🚀 {t('home.trustIndicators.fastProcessing')}</div>
              <div className="text-white/80">{t('home.trustIndicators.fastProcessingDesc')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">🔒 {t('home.trustIndicators.securePrivate')}</div>
              <div className="text-white/80">{t('home.trustIndicators.securePrivateDesc')}</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onPrevious={previousImage}
        onNext={nextImage}
      />
    </div>
  );
};

export default Home;