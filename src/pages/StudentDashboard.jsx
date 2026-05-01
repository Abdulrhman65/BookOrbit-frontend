import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, BookOpen, Layers, Repeat, ArrowUpRight, Sparkles, Clock, ArrowDown, ArrowUp, Coins } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Aurora from '../components/effects/Aurora';
import { useAuth } from '../context/AuthContext';

const PremiumOrbit = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute w-24 h-24 rounded-full bg-library-accent/20 blur-2xl"
    />
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-library-accent/10 via-transparent to-indigo-500/10 blur-xl" />

    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0"
    >
      <svg viewBox="0 0 280 280" className="w-full h-full">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9ce0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ab7ff" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="ringA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8be9ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7b61ff" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="ringB" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#7b61ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        <ellipse cx="140" cy="140" rx="108" ry="45" fill="none" stroke="url(#ringA)" strokeWidth="2.2" />
        <ellipse cx="140" cy="140" rx="85" ry="96" fill="none" stroke="url(#ringB)" strokeWidth="1.7" transform="rotate(27 140 140)" />
        <ellipse cx="140" cy="140" rx="62" ry="118" fill="none" stroke="url(#ringA)" strokeWidth="1.2" transform="rotate(-30 140 140)" strokeDasharray="5 5" />

        <circle cx="140" cy="140" r="30" fill="url(#coreGlow)" />
        <circle cx="140" cy="140" r="13" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="140" cy="140" r="7" fill="#7dd3fc" fillOpacity="0.9" />
        <circle cx="248" cy="140" r="6.5" fill="#67e8f9" />
        <circle cx="83" cy="50" r="5" fill="#a78bfa" />
        <circle cx="126" cy="250" r="4.5" fill="#4ade80" />
        <circle cx="45" cy="175" r="3.2" fill="#fde68a" />
        <circle cx="215" cy="66" r="3.2" fill="#bfdbfe" />
      </svg>
    </motion.div>
  </div>
);

const DashboardCard = ({ icon: Icon, title, desc, to, delay = 0, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="h-full"
  >
    <Link to={to} className="block h-full group">
      <div className="p-5 md:p-6 rounded-2xl bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border border-library-primary/[0.08] dark:border-white/[0.08] hover:border-library-accent/35 dark:hover:border-library-accent/35 transition-all duration-300 card-lift h-full flex flex-col relative overflow-hidden hover:shadow-xl hover:shadow-library-primary/5">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-library-accent/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex justify-between items-center mb-5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-library-accent/10 flex items-center justify-center group-hover:bg-library-accent/20 transition-colors">
            <Icon size={22} className="text-library-accent" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            {badge ? <span className="text-[10px] px-2 py-1 rounded-full bg-library-accent/10 text-library-accent font-black">{badge}</span> : null}
            <ArrowUpRight size={18} className="text-library-primary/20 dark:text-white/20 group-hover:text-library-accent transition-colors" />
          </div>
        </div>
        <h3 className="text-lg font-black text-library-primary dark:text-library-paper mb-2 relative z-10">
          {title}
        </h3>
        <p className="text-sm text-library-primary/50 dark:text-gray-400 leading-relaxed font-medium relative z-10 mt-auto">
          {desc}
        </p>
      </div>
    </Link>
  </motion.div>
);

// eslint-disable-next-line no-unused-vars
const MiniMetric = ({ label, value, tone = "indigo" }) => (
  <div className={`rounded-xl border px-3 py-2.5 bg-${tone}-500/5 border-${tone}-500/15`}>
    <p className={`text-[10px] font-black mb-1 text-${tone}-600`}>{label}</p>
    <p className="text-sm font-black text-library-primary dark:text-white">{value}</p>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  // Handle name intelligently - matching Navbar and Dashboard logic
  const rawName = user?.fullName || user?.Name || user?.name || user?.userName || user?.email?.split('@')[0] || "يا بطل";
  const firstName = rawName.split(' ')[0];

  return (
    <div className="min-h-screen bg-library-paper dark:bg-dark-bg text-library-primary dark:text-library-paper transition-colors duration-300 overflow-hidden" dir="rtl">
      <Navbar />

      <main className="relative z-10">
        
        {/* ─── HERO SECTION ─── */}
        <section className="relative w-full pt-24 pb-10 lg:pt-28 lg:pb-14 overflow-hidden border-b border-library-primary/[0.05] dark:border-white/[0.05]">
          <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
            <Aurora />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="rounded-3xl bg-white/70 dark:bg-dark-surface/70 border border-library-primary/10 dark:border-white/10 p-5 md:p-8 flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12 shadow-sm">
              
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-right">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-library-primary dark:text-white leading-[1.2] mb-4">
                    أهلاً <span className="text-library-accent">{firstName}</span>،
                    <br />
                    منصتك جاهزة لرحلتك الأكاديمية.
                  </h1>
                  
                  <p className="text-sm md:text-base text-library-primary/60 dark:text-gray-400 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    تصميم جديد أسرع وأوضح لإدارة حسابك، متابعة الإعارات، والوصول لكل أدواتك من مكان واحد.
                  </p>

                  <div className="mt-4 flex items-center justify-center lg:justify-start gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-library-accent/10 border border-library-accent/20">
                      <Coins size={14} className="text-library-accent" />
                      <span className="text-xs font-black text-library-primary dark:text-white">رصيدك: {user?.points || 0} نقطة</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                    <Link to="/profile" className="px-4 py-2.5 rounded-xl bg-library-primary text-white text-xs font-black shadow-md hover:opacity-90 transition-all">
                      فتح الملف الشخصي
                    </Link>
                    <Link to="/dashboard" className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/10 border border-library-primary/10 text-library-primary dark:text-white text-xs font-black hover:border-library-accent/30 transition-all">
                      تصفح الأرشيف
                    </Link>
                  </div>
                </motion.div>
              </div>

              {/* Premium Orbit */}
              <div className="flex-1 flex justify-center lg:justify-end">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <PremiumOrbit />
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── NAVIGATION GRID ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative">
          <div className="mb-6 bg-white/80 dark:bg-white/[0.03] rounded-2xl border border-library-primary/10 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-library-primary dark:text-white">لوحة التحكم السريعة</h2>
              <p className="text-xs text-library-primary/60 dark:text-gray-400 font-bold mt-1">اختر المسار الذي تريده وابدأ في خطوة واحدة.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="الأرشيف الرقمي" desc="تصفح جميع المراجع والكتب المتاحة للاستعارة من زملائك في مختلف الكليات." icon={BookOpen} to="/dashboard" delay={0.1} />
            <DashboardCard title="الملف الشخصي" desc="قم بإدارة بياناتك الشخصية، تعديل صورتك، وتحديث معلومات التواصل." icon={User} to="/profile" delay={0.2} />
            <DashboardCard title="نسخي الخاصة" desc="أضف كتبك الخاصة للمنصة، تحكم بحالتها، واجعلها متاحة لإفادة غيرك." icon={Layers} to="/my-copies" delay={0.3} />
            <DashboardCard title="الطلبات الواردة" desc="وافق أو ارفض طلبات الاستعارة المقدمة لك من زملائك على كتبك الخاصة." icon={Repeat} to="/lending/incoming" delay={0.4} badge="جديد" />
            <DashboardCard title="طلباتي الصادرة" desc="تابع حالة الكتب التي طلبت استعارتها من الآخرين وتاريخ استحقاقها." icon={Repeat} to="/lending/outgoing" delay={0.5} />
            <DashboardCard title="المعاملات الواردة" desc="تابع حالة الكتب التي أعرتها للآخرين وتأكد من استلامها عند الإرجاع." icon={ArrowDown} to="/lending/transactions/in" delay={0.6} />
            <DashboardCard title="المعاملات الصادرة" desc="تابع حالة الكتب التي استعرتها من زملائك، أكد إرجاعها أو بلّغ عن فقدانها." icon={ArrowUp} to="/lending/transactions/out" delay={0.7} />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-library-primary/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-5">
              <h3 className="text-sm font-black text-library-primary dark:text-white mb-4">خطوات مقترحة اليوم</h3>
              <div className="space-y-2.5">
                <Link to="/profile" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">مراجعة بيانات الحساب</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
                <Link to="/lending/incoming" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">مراجعة الطلبات الواردة (جديد)</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
                <Link to="/lending/outgoing" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">متابعة طلباتي الصادرة</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
                <Link to="/lending/transactions/in" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">متابعة المعاملات الواردة (كتبي)</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
                <Link to="/lending/transactions/out" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">متابعة المعاملات الصادرة (استعاراتي)</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
                <Link to="/lending" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-library-accent/5 transition-all border border-transparent hover:border-library-accent/20">
                  <span className="text-xs font-black text-library-primary dark:text-white">متابعة الإعارات النشطة</span>
                  <ArrowUpRight size={14} className="text-library-accent" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-library-primary/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-5">
              <h3 className="text-sm font-black text-library-primary dark:text-white mb-4">نظرة سريعة</h3>
              <div className="space-y-3">
                <div className="rounded-xl p-3 bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-[10px] font-black text-emerald-600 mb-1">اكتمال الحساب</p>
                  <div className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20 overflow-hidden">
                    <div className="h-full w-[88%] bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="rounded-xl p-3 bg-indigo-500/5 border border-indigo-500/15">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-indigo-600">رصيد النقاط</p>
                    <Coins size={14} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-black text-library-primary dark:text-white">{user?.points || 0} نقطة</p>
                </div>
                <div className="rounded-xl p-3 bg-indigo-500/5 border border-indigo-500/15">
                  <p className="text-[10px] font-black text-indigo-600 mb-1">حالة الأمان</p>
                  <p className="text-xs font-black text-library-primary dark:text-white">ممتاز - لا توجد ملاحظات حرجة</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default StudentDashboard;
