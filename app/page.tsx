'use client';

import { motion, useInView } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, Users, Clock, Settings, ShieldCheck, Zap, Menu, X, Check, Star, Award, MessageSquare, FileText, Code, Users as TeamIcon, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/logo';

// Navigation links
const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Contact', href: '#contact' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FeatureCard = ({ icon, title, description, index }) => (
  <motion.div
    variants={fadeIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-100 group"
  >
    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
      {React.cloneElement(icon, { className: `${icon.props.className} text-orange-600` })}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: '1M+', label: 'Users' },
  { value: '50+', label: 'Integrations' },
];

const Section = ({ id, title, subtitle, children, className = '', ...props }) => (
  <section id={id} className={`py-20 ${className}`} {...props}>
    <div className="container mx-auto px-4">
      {(title || subtitle) && (
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {subtitle && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              {subtitle}
            </div>
          )}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
          )}
        </motion.div>
      )}
      {children}
    </div>
  </section>
);

const pricingPlans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: [
      'Up to 10 users',
      'Basic analytics',
      'Email support',
      'API access',
      'Basic integrations'
    ],
    buttonText: 'Get Started',
    popular: false
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing businesses with more needs',
    features: [
      'Up to 50 users',
      'Advanced analytics',
      'Priority support',
      'API access',
      'All integrations',
      'Custom reports',
      'Dedicated account manager'
    ],
    buttonText: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited users',
      'Advanced analytics',
      '24/7 support',
      'API access',
      'All integrations',
      'Custom reports',
      'Dedicated account manager',
      'Custom development',
      'SLA 99.9%'
    ],
    buttonText: 'Contact Sales',
    popular: false
  }
];

const testimonials = [
  {
    quote: "This platform has transformed how we manage our projects. The interface is intuitive and the support is exceptional.",
    author: "Sarah Johnson",
    role: "CEO, TechCorp",
    avatar: "/avatars/avatar1.jpg"
  },
  {
    quote: "We've seen a 40% increase in team productivity since implementing this solution. Highly recommended!",
    author: "Michael Chen",
    role: "Operations Manager, InnoTech",
    avatar: "/avatars/avatar2.jpg"
  },
  {
    quote: "The customer service is outstanding. They've been incredibly helpful throughout our onboarding process.",
    author: "Emily Rodriguez",
    role: "Director of Operations, GrowthLabs",
    avatar: "/avatars/avatar3.jpg"
  }
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'testimonials', 'pricing', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: 'Smart Budget Planning',
      description: 'Efficiently manage and track your project budgets with real-time updates and AI-powered insights.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Employee Management',
      description: 'Streamline your workforce with comprehensive employee profiles and performance tracking.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and compliance management.'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Custom Solutions',
      description: 'Tailor the system to your specific business needs with flexible configurations.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50  transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="h-10 w-auto">
                  <Logo asLink={false} />
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-orange-400 hover:text-orange-600 transition-colors font-medium"
                >
                  {link.name}
                </a>
              ))}
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                onClick={() => window.location.href = '/sign-in'}
              >
                Sign In
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-orange-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="text-white hover:text-orange-600 transition-colors font-medium py-2"
                  >
                    {link.name}
                  </a>
                ))}
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full py-2 rounded-lg font-medium transition-colors"
                  onClick={() => window.location.href = '/sign-in'}
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-orange-300" />
              Trusted by 10,000+ businesses
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Transform Your Business with <span className="text-orange-400">Digital Specification</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Streamline your operations, boost productivity, and drive growth with our all-in-one business management solution.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-6 text-base transition-colors"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-transparent border-white/20 hover:bg-white/10 text-white font-semibold px-8 py-6 text-base"
              >
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <Section id="stats" className="py-16 bg-white">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              variants={fadeIn}
              className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="text-[40px] font-bold text-orange-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Features Section */}
      <Section 
        id="features" 
        title="Powerful Features" 
        subtitle="Everything You Need to Succeed"
        className="bg-gray-50"
      >
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </motion.div>
      </Section>

      {/* How It Works Section */}
      <Section 
        id="how-it-works" 
        title="How It Works" 
        subtitle="Simple Steps to Get Started"
        className="bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8 text-orange-600 mx-auto mb-4" />,
                title: "1. Sign Up",
                description: "Create your account in minutes. No credit card required to start your free trial."
              },
              {
                icon: <Settings className="w-8 h-8 text-orange-600 mx-auto mb-4" />,
                title: "2. Set Up",
                description: "Customize the platform to match your business needs with our easy setup wizard."
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-orange-600 mx-auto mb-4" />,
                title: "3. Grow",
                description: "Start managing your projects more efficiently and watch your business grow."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                {step.icon}
                <h3 className="text-xl font-semibold text-center mb-2">{step.title}</h3>
                <p className="text-gray-600 text-center">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section 
        id="testimonials" 
        title="What Our Clients Say" 
        subtitle="Trusted by Industry Leaders"
        className="bg-gray-50"
      >
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {testimonial.author.charAt(0)}
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">{testimonial.author}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              <div className="flex mt-4 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Pricing Section */}
      <Section 
        id="pricing" 
        title="Simple, Transparent Pricing" 
        subtitle="Choose Your Plan"
        className="bg-white"
      >
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`rounded-xl shadow-md overflow-hidden ${plan.popular ? 'border-2 border-orange-500 transform md:-translate-y-2' : 'border border-gray-200'}`}
            >
              {plan.popular && (
                <div className="bg-orange-500 text-white text-sm font-medium text-center py-1">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                  {!plan.period && <span className="text-gray-500">/month</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-3 font-medium ${plan.popular ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Contact Section */}
      <Section 
        id="contact" 
        title="Get In Touch" 
        subtitle="We'd Love to Hear From You"
        className="bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
              <p className="text-gray-600 mb-8">Have questions or want to learn more? Reach out to our team and we'll get back to you as soon as possible.</p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <a href="mailto:info@digitalspec.com" className="text-gray-700 hover:text-orange-600">info@digitalspec.com</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <a href="tel:+1234567890" className="text-gray-700 hover:text-orange-600">+1 (234) 567-890</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p className="text-gray-700">123 Business Ave, Suite 100<br />San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-xl shadow-md"
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Send Us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="first-name"
                      name="first-name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="last-name"
                      name="last-name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="How can we help?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Digital Specification</h3>
              <p className="mb-4">Empowering businesses with smart digital solutions for the modern world.</p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github', 'facebook'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label={social}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                      <span className="text-sm font-medium">{social[0].toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Integrations', 'Updates'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      onClick={(e) => scrollToSection(e, `#${item.toLowerCase()}`)}
                      className="hover:text-orange-500 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Documentation', 'Guides', 'API Reference', 'Community'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-orange-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      onClick={(e) => scrollToSection(e, `#${item.toLowerCase()}`)}
                      className="hover:text-orange-500 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Digital Specification. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
