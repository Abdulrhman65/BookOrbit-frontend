import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Mail, MessageSquare, ArrowUp } from "lucide-react";

const OrbitIcon = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <circle cx="20" cy="20" r="8" fill="url(#footerOrbitGrad)" />
    <ellipse cx="20" cy="20" rx="18" ry="7" stroke="url(#footerOrbitRing)" strokeWidth="1.5" fill="none" className="orbit-ring-svg" />
    <ellipse cx="20" cy="20" rx="14" ry="12" stroke="url(#footerOrbitRing2)" strokeWidth="0.8" fill="none" transform="rotate(60 20 20)" className="orbit-ring-svg-2" />
    <circle cx="36" cy="18" r="2" fill="var(--color-accent)" className="orbit-dot" />
    <defs>
      <radialGradient id="footerOrbitGrad" cx="50%" cy="40%">
        <stop offset="0%" stopColor="var(--color-accent)" />
        <stop offset="100%" stopColor="var(--color-primary)" />
      </radialGradient>
      <linearGradient id="footerOrbitRing" x1="0" y1="0" x2="40" y2="0">
        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.6" />
        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="footerOrbitRing2" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#080e18] pt-20 pb-8 overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-library-accent/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <OrbitIcon />
              <span className="text-lg font-black tracking-tight text-white">
                Book <span className="text-library-accent">Orbit</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              أول منصة مصرية متخصصة في تبادل المراجع والكتب بين طلاب الجامعة في
              بيئة أكاديمية آمنة وموثقة.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
              روابط سريعة
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-gray-500 text-sm font-medium hover:text-library-accent transition-colors">
                الرئيسية
              </Link>
              <Link to="/login" className="text-gray-500 text-sm font-medium hover:text-library-accent transition-colors">
                تسجيل الدخول
              </Link>
              <Link to="/register" className="text-gray-500 text-sm font-medium hover:text-library-accent transition-colors">
                إنشاء حساب
              </Link>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-4">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
              تابعنا
            </p>
            <div className="flex gap-3">
              {[
                { icon: <MessageSquare size={16} />, label: "Discord" },
                { icon: <Globe size={16} />, label: "Website" },
                { icon: <Mail size={16} />, label: "Email" },
              ].map((social) => (
                <button
                  key={social.label}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-600 hover:text-library-accent hover:border-library-accent/20 hover:bg-library-accent/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-700 text-xs font-medium">
            © {currentYear} BookOrbit جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-700 text-[11px] font-medium hover:text-library-accent transition-colors">
              سياسة الخصوصية
            </Link>
            <Link to="/" className="text-gray-700 text-[11px] font-medium hover:text-library-accent transition-colors">
              شروط الخدمة
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 w-12 h-12 rounded-2xl bg-library-primary dark:bg-white text-white dark:text-library-primary flex items-center justify-center shadow-2xl shadow-library-primary/20 dark:shadow-white/20 z-[90] hover:scale-105 active:scale-95 transition-all border border-white/10"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;
