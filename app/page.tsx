"use client";

import { motion, useInView } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart2,
  Users,
  Clock,
  Settings,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Check,
  Star,
  Award,
  MessageSquare,
  FileText,
  Code,
  Users as TeamIcon,
  Mail,
  MapPin,
  Phone,
  Calculator,
  Building2,
  ClipboardCheck,
  DollarSign,
  Calendar,
  Target,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";

// Navigation links
const navLinks = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "Contact", href: "#contact" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const FeatureCard = ({ icon, title, description, index }) => (
  <motion.div
    variants={fadeIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 hover:border-orange-200 group hover:scale-105 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-orange-500/30 relative z-10">
      {React.cloneElement(icon, {
        className: `${icon.props.className} text-white`,
      })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">
      {title}
    </h3>
    <p className="text-slate-600 leading-relaxed relative z-10">
      {description}
    </p>
  </motion.div>
);

const stats = [
  { value: "500+", label: "Construction Companies" },
  { value: "15K+", label: "Employees Managed" },
  { value: "99.8%", label: "Payroll Accuracy" },
  { value: "40%", label: "Time Savings" },
];

const Section = ({
  id,
  title,
  subtitle,
  children,
  className = "",
  ...props
}) => (
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
    name: "Starter",
    price: "Free",
    period: "/30 days",
    description: "Perfect for small construction teams getting started",
    features: [
      "Up to 10 employees",
      "Basic attendance tracking",
      "Simple payroll calculation",
      "Project management basics",
      "Email support",
    ],
    buttonText: "Start Free Trial",
    popular: false,
    isFree: true,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing construction companies",
    features: [
      "Up to 100 employees",
      "Advanced attendance & GPS tracking",
      "Automated payroll with deductions",
      "Multi-project management",
      "Budget planning & cost control",
      "BOQ management",
      "Priority support",
      "Custom reports",
    ],
    buttonText: "Start Free Trial",
    popular: true,
    isFree: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large construction organizations",
    features: [
      "Unlimited employees",
      "Multi-company management",
      "Advanced analytics & reporting",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "On-site training",
      "Custom development",
      "SLA guarantee",
    ],
    buttonText: "Contact Sales",
    popular: false,
    isFree: false,
  },
];

const testimonials = [
  {
    quote:
      "DSE has revolutionized our construction project management. Payroll processing that used to take days now takes minutes, and our cost tracking is incredibly accurate.",
    author: "James Mitchell",
    role: "Project Manager, BuildCorp Construction",
    avatar: "/avatars/avatar1.jpg",
  },
  {
    quote:
      "The attendance tracking and automated payroll features have saved us countless hours. Our employees love the transparency and accuracy of their payslips.",
    author: "Maria Santos",
    role: "HR Director, Premier Engineering",
    avatar: "/avatars/avatar2.jpg",
  },
  {
    quote:
      "Budget planning and cost control features are game-changers. We can track project profitability in real-time and make informed decisions quickly.",
    author: "David Thompson",
    role: "Operations Director, Skyline Builders",
    avatar: "/avatars/avatar3.jpg",
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.1 });
  const { toast } = useToast();

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

    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "home",
        "features",
        "how-it-works",
        "testimonials",
        "pricing",
        "contact",
      ];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId.replace("#", ""));
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Smart Attendance Tracking",
      description:
        "GPS-enabled attendance with real-time monitoring, late arrival detection, and comprehensive reporting for construction sites.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Automated Payroll Processing",
      description:
        "Calculate salaries automatically based on attendance, apply deductions, and generate professional payslips with one click.",
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "Project & Cost Management",
      description:
        "Manage multiple construction projects, track budgets vs actual costs, and monitor project profitability in real-time.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Employee & Trade Management",
      description:
        "Organize employees by trades, manage contracts, track performance, and handle multi-project assignments efficiently.",
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "BOQ & Budget Planning",
      description:
        "Create detailed Bills of Quantities, plan project budgets, and track completion progress with accurate cost analysis.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Advanced Analytics & Reports",
      description:
        "Generate comprehensive reports on payroll, attendance, project costs, and business performance with exportable data.",
    },
    {
      icon: <ClipboardCheck className="w-6 h-6" />,
      title: "Compliance & Documentation",
      description:
        "Maintain compliance with labor laws, generate audit trails, and keep detailed records for regulatory requirements.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Multi-Currency Support",
      description:
        "Handle international projects with multi-currency support, exchange rate management, and localized financial reporting.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/60 py-3"
            : "bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 py-3.5"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`p-2.5 rounded-xl transition-all duration-500 ${
                  scrolled
                    ? "bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-md"
                    : "bg-white/95 shadow-lg"
                }`}
              >
                <Logo className="h-8 w-auto" />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`transition-all duration-300 font-medium relative group ${
                    scrolled
                      ? "text-slate-700 hover:text-orange-600"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 group-hover:w-full ${
                      scrolled
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  ></span>
                </a>
              ))}
              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
                onClick={() => (window.location.href = "/sign-in")}
              >
                Sign In
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className={`focus:outline-none transition-colors ${
                  scrolled
                    ? "text-gray-700 hover:text-orange-600"
                    : "text-white hover:text-orange-400"
                }`}
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
                    className={`transition-colors font-medium py-2 ${
                      scrolled
                        ? "text-gray-700 hover:text-orange-600"
                        : "text-white hover:text-orange-400"
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full py-2 rounded-lg font-medium transition-colors"
                  onClick={() => (window.location.href = "/sign-in")}
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
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Modern Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_60%,rgba(59,130,246,0.1),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.008]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M0 0h60v60H0V0zm60 60h60v60H60V60z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-base font-semibold mb-8 shadow-lg shadow-black/10"
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Trusted by 500+ construction companies
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent">
                Revolutionize Construction
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent">
                Management with
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-2xl">
                DSE Platform
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Complete construction project management solution with{" "}
              <span className="text-white font-medium">
                smart attendance tracking
              </span>
              ,{" "}
              <span className="text-white font-medium">automated payroll</span>,
              and{" "}
              <span className="text-white font-medium">
                real-time cost control
              </span>{" "}
              for modern construction companies.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-10 py-7 text-lg rounded-xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 group"
                onClick={() => (window.location.href = "/sign-up")}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white font-semibold px-10 py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => scrollToSection(null, "#features")}
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
              className="text-center p-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/50 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 hover:scale-105 group"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Features Section */}
      <Section
        id="features"
        title="Powerful Features"
        subtitle="Everything You Need to Succeed"
        className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        </div>
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
                icon: (
                  <FileText className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                ),
                title: "1. Sign Up",
                description:
                  "Create your account in minutes. No credit card required to start your free trial.",
              },
              {
                icon: (
                  <Settings className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                ),
                title: "2. Set Up",
                description:
                  "Customize the platform to match your business needs with our easy setup wizard.",
              },
              {
                icon: (
                  <BarChart2 className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                ),
                title: "3. Grow",
                description:
                  "Start managing your projects more efficiently and watch your business grow.",
              },
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
                <h3 className="text-xl font-semibold text-center mb-2">
                  {step.title}
                </h3>
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
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.author}
                  </h4>
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
        className="relative bg-gradient-to-br from-slate-50 via-white to-orange-50 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-br from-orange-100/40 to-pink-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "bg-white/90 border-2 border-orange-500 shadow-2xl transform md:-translate-y-2"
                  : "bg-white/70 border border-gray-200/50 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="bg-orange-500 text-white text-sm font-medium text-center py-1">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                  {!plan.period && (
                    <span className="text-gray-500">/month</span>
                  )}
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
                  className={`w-full py-3 font-medium ${
                    plan.popular
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-gray-800 hover:bg-gray-900"
                  }`}
                  onClick={() => {
                    if (plan.buttonText === "Contact Sales") {
                      scrollToSection(null, "#contact");
                    } else {
                      window.location.href = "/sign-up";
                    }
                  }}
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
        className="relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Contact Information
              </h3>
              <p className="text-gray-600 mb-8">
                Have questions or want to learn more? Reach out to our team and
                we'll get back to you as soon as possible.
              </p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <a
                      href="mailto:info@digitalspec.com"
                      className="text-gray-700 hover:text-orange-600"
                    >
                      info@digitalspec.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <a
                      href="tel:+1234567890"
                      className="text-gray-700 hover:text-orange-600"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-500">
                      Address
                    </h4>
                    <p className="text-gray-700">
                      123 Business Ave, Suite 100
                      <br />
                      San Francisco, CA 94107
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20"
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Send Us a Message
              </h3>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast({
                    title: "Message Sent!",
                    description:
                      "Thank you for your interest. We'll get back to you within 24 hours.",
                  });
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      name="first-name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
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
      <footer className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-gray-300 py-12 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">
                Digital Specification
              </h3>
              <p className="mb-4">
                Empowering businesses with smart digital solutions for the
                modern world.
              </p>
              <div className="flex space-x-4">
                {["twitter", "linkedin", "github", "facebook"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label={social}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                      <span className="text-sm font-medium">
                        {social[0].toUpperCase()}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Integrations", "Updates"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase()}`}
                        onClick={(e) =>
                          scrollToSection(e, `#${item.toLowerCase()}`)
                        }
                        className="hover:text-orange-500 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                {["Documentation", "Guides", "API Reference", "Community"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="hover:text-orange-500 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      onClick={(e) =>
                        scrollToSection(e, `#${item.toLowerCase()}`)
                      }
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
            <p>
              &copy; {new Date().getFullYear()} Digital Specification. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
