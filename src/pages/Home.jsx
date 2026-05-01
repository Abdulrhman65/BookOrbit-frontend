import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  BookMarked,
  ArrowUpLeft,
  Library,
  Lock,
  Send,
  Mail,
  MapPin,
  Shield,
  Repeat,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ContactForm from "../components/common/ContactForm";

// ─── Spring Reveal Component ────────────────────────────────────────────────
const SpringReveal = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px -8% 0px" });

  return (
    <div
      ref={ref}
      className={`spring-reveal ${isInView ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

// ─── Feature Card ───────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => (
  <SpringReveal delay={delay}>
    <div className="group p-6 rounded-xl bg-white dark:bg-dark-surface border border-library-primary/[0.06] dark:border-white/[0.06] card-lift">
      <div className="w-12 h-12 rounded-xl bg-library-accent/10 flex items-center justify-center mb-5 group-hover:bg-library-accent/20 transition-colors">
        <Icon size={22} className="text-library-accent" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-black text-library-primary dark:text-library-paper mb-3">
        {title}
      </h3>
      <p className="text-sm text-library-primary/50 dark:text-gray-400 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  </SpringReveal>
);

// Removed Stats and Marquee components

// ─── 3D Book Graphic ────────────────────────────────────────────────────────
const BookGraphic = () => (
  <div className="perspective-container">
    <div className="book-wrapper animate-ultimate-float">
      <div className="book-3d">
        <div className="book-spine"></div>
        <div className="book-block-page">
          <div className="flex flex-col h-full relative z-10">
            <div className="border-b border-library-primary/10 pb-2 md:pb-4 mb-2 md:mb-4">
              <h5 className="text-[8px] md:text-[10px] font-black text-library-primary mb-1 italic">
                الأرشيف الجامعي
              </h5>
              <div className="h-0.5 w-6 md:w-8 bg-library-accent rounded-full accent-line"></div>
            </div>
            <p className="text-[7px] md:text-[9px] font-medium leading-relaxed md:leading-loose text-library-primary opacity-60">
              المعرفة هي الأمانة التي تزداد بالمشاركة. نحن نؤمن بأن كل طالب
              يمتلك مفتاحاً لنجاح زميل آخر. نظامنا صُمم ليكون جسراً آمناً يربط بين طلاب الجامعة ..
            </p>
            <div className="mt-auto pt-2 flex justify-between items-center text-library-accent/70 text-[7px] md:text-[8px] font-bold uppercase tracking-tighter">
              <span>Book Orbit</span>
              <span>Mansoura University</span>
            </div>
          </div>
        </div>

        <div className="book-cover-pivot">
          <div className="cover-front flex flex-col justify-between p-5 md:p-8">
            <div className="text-library-accent text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase mb-2 opacity-70">
              Book Orbit
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-8 md:w-10 h-0.5 bg-library-accent mb-4 md:mb-6 rounded-full accent-line"></div>
              <h2 className="text-xl md:text-3xl font-black text-library-paper leading-[1.1] tracking-tighter mb-2 md:mb-4">
                ميثاق <br />
                <span className="text-library-accent">الأمانة</span>
              </h2>
              <p className="text-library-paper/40 font-bold text-[7px] md:text-[9px] tracking-widest uppercase">
                حافظ على الكتب
              </p>
            </div>
            <div className="flex justify-between items-end opacity-40">
              <BookMarked size={20} className="text-white md:w-6 md:h-6" />
              <div className="text-[7px] md:text-[9px] font-bold text-white tracking-widest">
                Qurtuba Team
              </div>
            </div>
          </div>

          <div className="cover-back-page">
            <div className="w-full h-full border border-library-primary/5 p-4 md:p-6 flex flex-col justify-center text-center">
              <Library
                size={20}
                className="text-library-accent/40 mx-auto mb-2 md:mb-4"
              />
              <h5 className="text-[8px] md:text-[10px] font-bold text-library-primary mb-1 md:mb-2 italic">
                ميثاق شرف المنصة
              </h5>
              <p className="text-[7px] md:text-[9px] leading-relaxed text-library-primary/50 font-medium">
                "هذا الكتاب عهدة أمانة. حافظ عليه ليعود يوماً ما لرفوف الأرشيف, تطبق عقوبات على من يتلف الكتاب أو يتأخر عن موعد إرجاعه"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Contact Section ────────────────────────────────────────────────────────
const ContactSection = () => (
  <section className="py-16 md:py-20 relative overflow-hidden">
    {/* Subtle radial glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-library-accent/[0.02] rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
        {/* Left - Info */}
        <SpringReveal className="pt-4">
          <p className="text-library-accent text-[10px] font-bold uppercase tracking-[0.4em] mb-5">
            تواصل معنا
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-library-primary dark:text-white mb-5 leading-tight">
            تواصل معنا.
          </h2>
          <p className="text-base md:text-lg text-library-primary/60 dark:text-white/40 mb-12 max-w-md font-medium leading-relaxed">
            هل لديك استفسار أو اقتراح لتطوير الأرشيف؟ فريقنا دائماً هنا للاستماع
            لرفاقنا.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: Mail,
                label: "البريد الإلكتروني",
                value: "book.orbit.web@gmail.com",
              },
              {
                icon: MapPin,
                label: "الموقع",
                value: "كلية الحاسبات والمعلومات - جامعة المنصورة",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-5 p-4 rounded-xl bg-white dark:bg-white/[0.03] backdrop-blur-md shadow-sm dark:shadow-none border border-library-primary/[0.06] dark:border-white/[0.06] hover:border-library-accent/30 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-library-primary/[0.03] dark:bg-library-accent/10 border border-library-primary/5 dark:border-library-accent/15 flex items-center justify-center text-library-accent flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-library-primary/40 dark:text-white/20 uppercase tracking-widest mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-library-primary dark:text-white font-bold text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </SpringReveal>

        {/* Right - Form */}
        <SpringReveal delay={0.15}>
          <ContactForm />
        </SpringReveal>
      </div>
    </div>
  </section>
);

// ─── Main Home Component ────────────────────────────────────────────────────
const Home = () => {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, 60]);

  const storyRef = useRef(null);
  const { scrollYProgress: storyProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const yStory = useTransform(storyProgress, [0, 1], [0, 450]);

  const books = [
    {
      title: "الفيزياء الجامعية",
      author: "سيرواي",
      cat: "علوم",
      image:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "الاقتصاد الجزئي",
      author: "مانكيو",
      cat: "إدارة",
      image:
        "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "هياكل البيانات",
      author: "سيدجويك",
      cat: "حاسبات",
      image:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "علم الأدوية",
      author: "ليبينكوت",
      cat: "طب",
      image:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    },
  ];



  return (
    <div className="bg-texture min-h-screen relative selection:bg-library-accent/30 overflow-x-hidden">
      <Navbar />

      <main className="relative z-10 pt-20">
        {/* ════════════════════ HERO SECTION ════════════════════ */}
        <section className="relative min-h-[75vh] flex items-center pt-16 pb-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <motion.div
              style={{ y: yHero }}
              className="flex flex-col items-center lg:items-start z-10 text-center lg:text-right"
            >
              <SpringReveal className="mb-6 md:mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-library-accent/8 text-library-accent font-bold text-[10px] uppercase tracking-[0.2em] border border-library-accent/15 rounded-full">
                  <Sparkles size={11} />
                  شبكة الجامعات الأولى
                </div>
              </SpringReveal>

              <SpringReveal delay={0.08} className="mb-5 md:mb-7">
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-library-primary dark:text-library-paper tracking-tight leading-[1.1]">
                  المعرفة لا تُمتلك،
                </h1>
                <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-5 mt-2">
                  <div className="h-1 w-10 md:w-14 bg-library-accent rounded-full accent-line"></div>
                  <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-library-accent italic tracking-tight leading-[1.1] text-shimmer">
                    بل تُمرر.
                  </h1>
                </div>
              </SpringReveal>

              <SpringReveal
                delay={0.16}
                className="text-base md:text-lg text-library-primary/60 dark:text-gray-400 max-w-md mb-8 md:mb-10 border-r-4 border-library-accent/40 pr-5 leading-relaxed font-medium"
              >
                أرشيف رقمي يربط طلاب الجامعات في مصر. استعر الكتب التي تحتاجها
                مجاناً، وأودع مراجعك القديمة في مجتمعك الأكاديمي بأمان تام.
              </SpringReveal>

              <SpringReveal delay={0.24}>
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 text-library-paper bg-library-primary dark:bg-library-paper dark:text-library-primary px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-library-primary/10 dark:shadow-black/20 hover:shadow-2xl hover:shadow-library-accent/15 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  ابدأ الآن
                  <ArrowUpLeft
                    size={18}
                    className="transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform"
                  />
                </Link>
              </SpringReveal>
            </motion.div>

            {/* Book */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="relative z-10 flex justify-center py-8 md:py-0"
            >
              <div className="scale-75 sm:scale-90 md:scale-100">
                <BookGraphic />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════ HOW IT WORKS (BENTO GRID) ════════════════════ */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-library-accent/[0.02] rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <SpringReveal className="text-center mb-14 md:mb-20">
              <p className="text-library-accent text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                BookOrbit
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-library-primary dark:text-white mb-4 tracking-tight">
                بُنيت للطلاب، بأيدي الطلاب.
              </h2>
              <p className="text-library-primary/50 dark:text-white/50 text-base md:text-lg max-w-lg mx-auto font-medium">
                بنيت المنصة لتضمن وصول الكتاب لمن يحتاجه، مع الحفاظ الكامل على الأمان الأكاديمي.
              </p>
            </SpringReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[auto]">
              {/* Card 1: Network & Search (Span 2 cols on Desktop) */}
              <SpringReveal delay={0} className="md:col-span-2">
                <div className="h-full group p-8 md:p-10 rounded-3xl bg-white dark:bg-white/[0.03] border border-library-primary/[0.06] dark:border-white/[0.06] hover:border-library-accent/30 transition-all duration-500 card-lift overflow-hidden relative flex flex-col justify-end min-h-[320px] shadow-sm dark:shadow-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-library-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-library-accent/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-library-primary/[0.03] dark:bg-white/[0.05] flex items-center justify-center mb-6 border border-library-primary/5 dark:border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                      <GraduationCap size={28} className="text-library-accent" strokeWidth={1.5} />
                    </div>
                    <div className="inline-block px-3 py-1 bg-library-accent/10 text-library-accent font-bold mb-4 text-[10px] tracking-widest border border-library-accent/20 rounded-full">
                      01. البحث والإيداع
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-library-primary dark:text-white mb-3">شبكة جامعية متكاملة</h3>
                    <p className="text-library-primary/60 dark:text-white/50 text-sm md:text-base leading-relaxed max-w-md font-medium">
                      تصفح آلاف المراجع المتاحة في جامعتك، أو قم بإيداع مراجعك القديمة في الأرشيف الرقمي لتفيد بها مجتمعك الأكاديمي بسلاسة وسرعة.
                    </p>
                  </div>
                </div>
              </SpringReveal>

              {/* Card 2: Security & Meetup (Span 1 col) */}
              <SpringReveal delay={0.1} className="md:col-span-1">
                <div className="h-full group p-8 md:p-10 rounded-3xl bg-white dark:bg-white/[0.03] border border-library-primary/[0.06] dark:border-white/[0.06] hover:border-library-accent/30 transition-all duration-500 card-lift relative flex flex-col justify-end min-h-[320px] overflow-hidden shadow-sm dark:shadow-none">
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-library-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-library-primary/[0.03] dark:bg-white/[0.05] flex items-center justify-center mb-6 border border-library-primary/5 dark:border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                      <Shield size={28} className="text-library-accent" strokeWidth={1.5} />
                    </div>
                    <div className="inline-block px-3 py-1 bg-library-accent/10 text-library-accent font-bold mb-4 text-[10px] tracking-widest border border-library-accent/20 rounded-full">
                      02. التواصل الآمن
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-library-primary dark:text-white mb-3">لقاء داخل الحرم</h3>
                    <p className="text-library-primary/60 dark:text-white/50 text-sm leading-relaxed font-medium">
                      بعد طلب الكتاب، تواصل عبر المنصة لتحديد موعد للمقابلة داخل الحرم الجامعي، لضمان بيئة موثوقة.
                    </p>
                  </div>
                </div>
              </SpringReveal>

              {/* Card 3: Smart OTP (Span 3 cols) */}
              <SpringReveal delay={0.2} className="md:col-span-3">
                <div className="group p-8 md:p-12 rounded-3xl bg-gradient-to-br from-library-accent/5 to-white dark:from-library-accent/10 dark:to-library-primary/40 border border-library-accent/20 hover:border-library-accent/40 transition-all duration-500 card-lift relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-sm dark:shadow-none">
                  <div className="absolute inset-0 bg-black/[0.01] dark:bg-white/[0.01] mix-blend-overlay pointer-events-none"></div>
                  <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-library-accent/10 dark:bg-library-accent/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none group-hover:bg-library-accent/20 dark:group-hover:bg-library-accent/30 transition-colors duration-700"></div>
                  
                  <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-full bg-library-accent/10 flex items-center justify-center border border-library-accent/20 relative z-10 group-hover:scale-105 transition-transform duration-500">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-library-accent flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.3)] dark:shadow-[0_0_40px_rgba(var(--color-accent-rgb),0.4)] group-hover:shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.5)] dark:group-hover:shadow-[0_0_60px_rgba(var(--color-accent-rgb),0.6)] transition-shadow duration-500">
                      <Repeat size={36} className="text-white dark:text-library-primary" strokeWidth={2} />
                    </div>
                  </div>
                  
                  <div className="relative z-10 text-center md:text-right flex-1">
                    <div className="inline-block px-3 py-1 bg-library-accent/10 dark:bg-library-accent/20 text-library-accent font-bold mb-4 text-[10px] tracking-widest border border-library-accent/20 dark:border-library-accent/30 rounded-full">
                      03. التوثيق الذكي
                    </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-library-primary dark:text-white mb-4">
                      التسليم عبر رمز الـ OTP
                    </h3>
                    <p className="text-library-primary/70 dark:text-white/60 text-sm md:text-base leading-relaxed max-w-3xl font-medium">
                      رمز الـ OTP لا يتم تبادله إلا عند اللقاء الفعلي. عند الاستلام، يتم تقديم رمز توثيق ذكي لمرة واحدة لضمان أن الكتاب قد وصل لصاحبه الجديد وتوثيق سجلات الأمانة الأكاديمية بنجاح. خطوة واحدة بسيطة تضمن حقوق الجميع.
                    </p>
                  </div>
                </div>
              </SpringReveal>
            </div>
          </div>
        </section>

        {/* ════════════════════ DIGITAL SHELF ════════════════════ */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {/* Header */}
            <SpringReveal className="flex flex-col md:flex-row justify-between items-center md:items-end mb-14 md:mb-20 pb-10 border-b border-library-primary/[0.06] dark:border-white/[0.06] gap-6 text-center md:text-right">
              <div>
                <p className="text-library-accent text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                  المجموعة الرقمية
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-library-primary dark:text-library-paper mb-3 tracking-tight">
                  الأرشيف الرقمي.
                </h2>
                <p className="text-library-primary/50 dark:text-gray-400 text-base md:text-lg font-medium max-w-md">
                  تصفح آلاف المراجع المتاحة. كل كتاب هنا هو فرصة لنجاح زميل آخر.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-white/[0.04] text-library-primary dark:text-white font-bold rounded-xl border border-library-primary/[0.06] dark:border-white/[0.06] hover:border-library-accent/30 hover:bg-library-primary/[0.02] dark:hover:bg-white/[0.08] transition-all text-sm shadow-sm dark:shadow-none"
              >
                تصفح الأرشيف <Lock size={14} />
              </Link>
            </SpringReveal>

            {/* Book Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {books.map((book, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group cursor-pointer"
                >
                  <Link
                    to="/login"
                    className="w-full aspect-[3/4] bg-white dark:bg-white/[0.02] backdrop-blur-md border border-library-primary/[0.06] dark:border-white/[0.06] shadow-sm dark:shadow-none hover:border-library-accent/30 rounded-2xl relative overflow-hidden flex flex-col justify-between p-7 md:p-8 card-lift"
                  >
                    {/* Hover Glow Background */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-library-accent/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 group-hover:bg-library-accent/15 transition-all duration-700"></div>

                    <div className="text-library-primary/30 dark:text-library-paper/20 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
                      {book.cat}
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg md:text-xl font-black text-library-primary dark:text-library-paper mb-1 leading-tight group-hover:text-library-accent transition-colors duration-300">
                        {book.title}
                      </h3>
                      <p className="text-library-accent font-bold text-xs tracking-wider">
                        {book.author}
                      </p>
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-[2px]">
                      <span className="bg-library-accent text-library-primary px-6 py-3 rounded-full text-xs font-black shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        سجّل الدخول للتصفح
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════ CONTACT ════════════════════ */}
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
