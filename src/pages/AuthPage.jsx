import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Shield, CheckCircle, UserPlus, Lock, X, BookMarked, Library } from "lucide-react";
import toast from "react-hot-toast";
import { identityApi } from "../services/api";

import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";

const AuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [covenantCallback, setCovenantCallback] = useState(null);

  // Cross-tab communication for email verification
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "email_verified_signal") {
        setIsWaitingConfirmation(false);
        setIsLogin(true);
        // Clean up the signal
        localStorage.removeItem("email_verified_signal");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const switchMode = () => {
    const next = !isLogin;
    setIsLogin(next);
    setIsWaitingConfirmation(false);
    window.history.replaceState(null, "", next ? "/login" : "/register");
  };

  const handleForgotPassword = (email) => {
    setForgotPasswordEmail(email);
    setShowForgotPassword(true);
  };

  const handleRegisterSuccess = (email) => {
    setConfirmedEmail(email);
    setIsWaitingConfirmation(true);
  };

  const ConfirmationScreen = () => {
    const [resendCooldown, setResendCooldown] = useState(() => {
      const saved = sessionStorage.getItem("resendCooldownTime");
      if (saved) {
        const remaining = Math.floor((parseInt(saved, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
      return 0;
    });

    useEffect(() => {
      let timer;
      if (resendCooldown > 0) {
        timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              sessionStorage.removeItem("resendCooldownTime");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleResend = async () => {
      if (resendCooldown > 0) return;
      try {
        const cooldownTime = 60;
        setResendCooldown(cooldownTime);
        sessionStorage.setItem("resendCooldownTime", (Date.now() + cooldownTime * 1000).toString());
        
        await identityApi.sendEmailConfirmation(confirmedEmail);
        toast.success("✅ تم إرسال رابط تفعيل جديد لبريدك الجامعي");
      } catch (err) {
        setResendCooldown(0);
        sessionStorage.removeItem("resendCooldownTime");
        toast.error("❌ فشل إرسال الرابط، حاول مرة أخرى");
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="text-center py-6 bg-gray-50/50 dark:bg-black/20 rounded-3xl p-8 backdrop-blur-md border border-gray-100 dark:border-white/10 shadow-sm"
      >
        <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h3 className="text-2xl font-black text-library-primary dark:text-white mb-3">
          تحقق من بريدك الجامعي
        </h3>
        <p className="text-gray-500 dark:text-white/60 text-sm leading-relaxed mb-8">
          لقد أرسلنا رسالة تأكيد إلى:<br />
          <span className="font-bold text-emerald-600 dark:text-emerald-400 break-all select-all">
            {confirmedEmail}
          </span>
          <br />
          <span className="text-[10px] mt-4 block text-gray-400 dark:text-white/40 italic">
            إذا لم تجد الرسالة في صندوق الوارد، يرجى مراجعة مجلد الرسائل غير المرغوب فيها (Spam).
          </span>
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              resendCooldown > 0 
              ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 cursor-not-allowed" 
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            }`}
          >
            {resendCooldown > 0 ? (
              `أعد الإرسال خلال ${resendCooldown} ثانية`
            ) : (
              "إرسال الرابط مرة أخرى"
            )}
          </button>
          
          <button
            onClick={() => {
              setIsWaitingConfirmation(false);
              setIsLogin(true);
            }}
            className="text-gray-400 dark:text-white/40 hover:text-library-primary dark:hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 mt-2"
          >
            <ArrowRight size={14} /> العودة لتسجيل الدخول
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-library-paper dark:bg-dark-bg"
      style={{ direction: "ltr" }}
    >
      <ForgotPasswordModal
        showForgotPassword={showForgotPassword}
        setShowForgotPassword={setShowForgotPassword}
        initialEmail={forgotPasswordEmail}
      />

      <div className="flex min-h-screen">
        {/* LEFT half → Register form (Desktop Only) */}
        <div
          className="hidden lg:flex w-1/2 bg-library-paper dark:bg-dark-bg p-12 flex-col justify-center relative overflow-hidden"
          style={{ direction: "rtl" }}
        >
          {/* Abstract background shapes */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-library-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-library-primary-light/5 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-md mx-auto w-full">

            <AnimatePresence mode="wait">
              {isWaitingConfirmation ? (
                <ConfirmationScreen key="confirmation-desktop" />
              ) : (
                <motion.div
                  key="register-form-desktop"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <RegisterForm 
                    switchMode={switchMode} 
                    onSuccess={handleRegisterSuccess} 
                    onDark={false} 
                    onShowCovenant={(cb) => setCovenantCallback(() => cb)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT half → Login form (Desktop) & Switcher (Mobile) */}
        <div
          className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-12 lg:px-12 py-12 lg:py-0"
          style={{ direction: "rtl" }}
        >
          <div className="max-w-md w-full">
            <Link
              to="/"
              className="text-library-primary/40 dark:text-gray-500 hover:text-library-primary dark:hover:text-gray-300 flex items-center gap-2 mb-4 w-fit text-[10px] font-black transition-all lg:hidden"
            >
              <div className="w-6 h-6 rounded-lg bg-library-primary/5 dark:bg-white/5 border border-library-primary/10 dark:border-white/10 flex items-center justify-center">
                 <ArrowRight size={12} className="rotate-180" />
              </div>
              <span>العودة للرئيسية</span>
            </Link>

            {/* Mobile Tabs */}
            <div className="lg:hidden relative flex bg-library-primary/[0.04] dark:bg-white/[0.04] rounded-xl p-1 mb-6">
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-library-primary shadow-lg"
                animate={{
                  left: isLogin ? "calc(50% - 4px)" : "4px",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => {
                  setIsLogin(true);
                  window.history.replaceState(null, "", "/login");
                }}
                className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${
                  isLogin
                    ? "text-library-primary dark:text-white"
                    : "text-library-primary/70 dark:text-library-paper/70"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  window.history.replaceState(null, "", "/register");
                }}
                className={`relative z-10 flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${
                  !isLogin
                    ? "text-library-primary dark:text-white"
                    : "text-library-primary/70 dark:text-library-paper/70"
                }`}
              >
                حساب جديد
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isWaitingConfirmation ? (
                <motion.div
                  key="confirmation-desktop-right"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                   <ConfirmationScreen />
                </motion.div>
              ) : isLogin ? (
                <motion.div
                  key="login-desktop"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <LoginForm 
                    onForgotPassword={handleForgotPassword} 
                    onUnconfirmed={handleRegisterSuccess}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="register-mobile-placeholder"
                  className="lg:hidden"
                >
                  <RegisterForm 
                    switchMode={null} 
                    onSuccess={handleRegisterSuccess} 
                    onDark={false} 
                    onShowCovenant={(cb) => setCovenantCallback(() => cb)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop Sliding Overlay */}
      <motion.div
        className="hidden lg:flex absolute top-0 bottom-0 w-1/2 bg-library-primary dark:bg-dark-surface z-20 items-center justify-center p-12 overflow-hidden shadow-2xl dark:shadow-black/50 dark:border-x dark:border-white/5"
        initial={false}
        animate={{ left: isLogin ? "0%" : "50%" }}
        transition={{ type: "spring", stiffness: 180, damping: 26, mass: 0.9 }}
      >
        <div className="absolute inset-0 bg-texture opacity-30" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-library-accent/[0.05] rounded-full blur-[100px]" />
        
        {/* Fixed Home Link in Overlay */}
        <Link
          to="/"
          className="absolute top-12 right-12 text-white/50 hover:text-white flex items-center gap-2 text-xs font-black transition-all group z-30"
          style={{ direction: "rtl" }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
             <ArrowRight size={14} />
          </div>
          <span>العودة للرئيسية</span>
        </Link>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="panel-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="relative z-10 max-w-sm text-center"
              style={{ direction: "rtl" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-library-accent/10 border border-library-accent/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-library-accent/5">
                <BookOpen
                  size={32}
                  className="text-library-accent"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-4xl font-black text-library-paper mb-6 leading-[1.2] tracking-tight">
                "المكتبة هي المستشفى
                <br />
                الوحيد للروح."
              </h2>
              <div className="w-12 h-1 bg-library-accent/30 mx-auto mb-6 rounded-full" />
              <p className="text-library-paper/40 font-bold text-sm leading-relaxed max-w-xs mx-auto mb-12">
                شارك في بناء أكبر مكتبة جامعية تعاونية في مصر. آلاف الكتب
                والمراجع في انتظارك.
              </p>
              <button
                onClick={switchMode}
                className="inline-flex items-center gap-3 px-8 py-3.5 border-2 border-library-paper/10 text-library-paper rounded-full text-sm font-black hover:bg-library-paper/5 transition-all shadow-lg active:scale-95"
              >
                <UserPlus size={18} />
                <span>أنشئ حساب جديد</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="panel-register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="relative z-10 max-w-sm text-center"
              style={{ direction: "rtl" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-library-accent/10 border border-library-accent/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-library-accent/5">
                <Shield
                  size={32}
                  className="text-library-accent"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-4xl font-black text-library-paper mb-6 leading-[1.2] tracking-tight">
                بناء مجتمع
                <br />
                جامعي موثوق.
              </h2>
              <div className="w-12 h-1 bg-library-accent/30 mx-auto mb-6 rounded-full" />
              <p className="text-library-paper/40 font-bold text-sm leading-relaxed max-w-xs mx-auto mb-12">
                تتم مراجعة البطاقات الجامعية لكل طالب مسجل لضمان بيئة أكاديمية
                خالية من الغرباء.
              </p>
              <button
                onClick={switchMode}
                className="inline-flex items-center gap-3 px-8 py-3.5 border-2 border-library-paper/10 text-library-paper rounded-full text-sm font-black hover:bg-library-paper/5 transition-all shadow-lg active:scale-95"
              >
                <Lock size={18} />
                <span>لدي حساب بالفعل</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Covenant of Integrity Modal */}
      <AnimatePresence>
        {covenantCallback && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCovenantCallback(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-4xl bg-library-paper dark:bg-dark-bg rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setCovenantCallback(null)}
                className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all border border-white/5 z-50"
              >
                <X size={20} />
              </button>

              

              <div className="flex justify-center items-center py-8 scale-95 md:scale-110 min-h-[420px]">
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
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    if (covenantCallback) covenantCallback();
                    setCovenantCallback(null);
                  }}
                  className="w-full py-4 bg-library-primary dark:bg-white text-white dark:text-library-primary rounded-2xl font-black text-sm hover:shadow-xl transition-all"
                >
                  فهمت وأتعهد بالالتزام
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
