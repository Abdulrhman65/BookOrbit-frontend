import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Shield,
  BookOpen,
  Home,
  Inbox,
  Send,
  RefreshCcw,
  Repeat,
  Coins,
  Clock,
  MessageSquare
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import { OrbitIcon } from "./OrbitIcon";
import { notificationsApi } from "../../services/api";
import { translateNotificationText } from "../../utils/translations";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);

  const fetchBrief = async () => {
    try {
      const res = await notificationsApi.getAll({ PageSize: 5 });
      setNotifications(res.items);
    } catch (err) {
      console.error("Error fetching brief notifications:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role?.toLowerCase() !== "admin") {
      fetchBrief();
    }
    // Only re-fetch when the actual logged-in identity changes (not on every user object recreation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.studentId]);

  useEffect(() => {
    window.addEventListener("notifications:updated", fetchBrief);
    return () => window.removeEventListener("notifications:updated", fetchBrief);
  }, []);

  // Try to find the best display name
  const displayName =
    user?.fullName ||
    user?.Name ||
    user?.name ||
    user?.userName ||
    user?.email?.split("@")[0] ||
    "المستخدم";
  // Keep role label stable after removing specialization field.
  const displayRole =
    user?.role?.toLowerCase() === "admin" ? "إدارة النظام" : "طالب جامعي";
  const homePath = isLoggedIn
    ? user?.role?.toLowerCase() === "admin"
      ? "/admin"
      : "/app"
    : "/";

  const isDashboard =
    location.pathname.startsWith("/app") ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/addbook");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 w-full z-50 transition-all duration-700 ease-in-out pt-[env(safe-area-inset-top,0px)] ${
          scrolled
            ? "glass-card shadow-xl border-b border-library-primary/10 dark:border-white/10"
            : isDashboard
              ? "bg-white/40 dark:bg-dark-bg/40 backdrop-blur-md border-b border-library-primary/5 dark:border-white/5"
              : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 h-16 lg:h-[68px]">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2.5 group relative z-50"
              >
                <motion.div
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <OrbitIcon />
                </motion.div>
                <span className="font-extrabold text-xl tracking-tight text-library-primary dark:text-library-paper transition-colors">
                  Book<span className="text-library-accent">Orbit</span>
                </span>
              </Link>


            </div>

            <div className="flex items-center gap-2.5 lg:gap-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-2.5 lg:gap-4">
                  {location.pathname !== "/" && (
                    <Link
                      to={homePath}
                      className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-library-primary/10 dark:border-white/10 text-[11px] font-black text-library-primary dark:text-white hover:border-library-accent/35 hover:text-library-accent transition-all"
                      title="الصفحة الرئيسية"
                    >
                      <Home size={14} />
                      الرئيسية
                    </Link>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center bg-white/60 dark:bg-white/5 text-library-primary/70 dark:text-library-paper/60 hover:text-library-accent transition-all border border-library-primary/10 dark:border-white/10"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isDarkMode ? "sun" : "moon"}
                        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>

                  {user?.role?.toLowerCase() !== "admin" && (
                    <div className="flex items-center gap-2.5 lg:gap-4">
                      <Link
                        to="/notifications"
                        className="lg:hidden relative w-9 h-9 rounded-lg items-center justify-center bg-white/60 dark:bg-white/5 text-library-primary/70 dark:text-gray-400 hover:text-library-accent transition-all border border-library-primary/10 dark:border-white/10 flex"
                        title="الإشعارات"
                      >
                        <Bell size={17} />
                        {notifications.some((n) => !n.isRead) && (
                          <span className="absolute top-2.5 end-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-bg" />
                        )}
                      </Link>
                      {/* Messages Icon */}
                      <Link
                        to="/chat"
                        className="relative w-9 h-9 rounded-lg items-center justify-center bg-white/60 dark:bg-white/5 text-library-primary/70 dark:text-gray-400 hover:text-library-accent transition-all border border-library-primary/10 dark:border-white/10 flex"
                        title="الرسائل"
                      >
                        <MessageSquare size={17} />
                        {/* Only show if there are unread messages - assuming logic exists or hardcoded for now */}
                        {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-library-accent rounded-full border-2 border-white dark:border-dark-bg animate-bounce"></span> */}
                      </Link>

                      <div 
                        className="relative hidden lg:block"
                        onMouseEnter={() => setNotificationsOpen(true)}
                        onMouseLeave={() => setNotificationsOpen(false)}
                      >
                        <Link
                          to="/notifications"
                          className="relative w-9 h-9 rounded-lg items-center justify-center bg-white/60 dark:bg-white/5 text-library-primary/70 dark:text-gray-400 hover:text-library-accent transition-all border border-library-primary/10 dark:border-white/10 flex"
                          title="الإشعارات"
                        >
                          <Bell size={17} />
                          {notifications.some(n => !n.isRead) && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-bg animate-pulse"></span>
                          )}
                        </Link>

                        <AnimatePresence>
                          {notificationsOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-library-primary/10 dark:border-white/10 z-[100] overflow-hidden backdrop-blur-xl"
                            >
                              <div className="p-4 border-b border-library-primary/5 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-xs font-black text-library-primary dark:text-white">إشعارات حديثة</h3>
                                <Link to="/notifications" className="text-[10px] font-black text-library-accent hover:underline">عرض الكل</Link>
                              </div>
                              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                  notifications.map((n) => {
                                    const ui = {
                                      borrowing: { icon: <Repeat size={14} className="text-emerald-500" />, color: "emerald" },
                                      request: { icon: <Repeat size={14} className="text-emerald-500" />, color: "emerald" },
                                      system: { icon: <Shield size={14} className="text-blue-500" />, color: "blue" },
                                      points: { icon: <Coins size={14} className="text-amber-500" />, color: "amber" },
                                      reminder: { icon: <Clock size={14} className="text-rose-500" />, color: "rose" },
                                      book: { icon: <BookOpen size={14} className="text-indigo-500" />, color: "indigo" },
                                    }[String(n.type || "").toLowerCase()] || { icon: <Bell size={14} className="text-blue-500" />, color: "blue" };

                                    const formatBriefTime = (dateStr) => {
                                      if (!dateStr) return "";
                                      const date = new Date(dateStr);
                                      const now = new Date();
                                      const diffInMin = Math.floor((now - date) / 60000);
                                      if (diffInMin < 60) return `${diffInMin}د`;
                                      const diffInHours = Math.floor(diffInMin / 60);
                                      if (diffInHours < 24) return `${diffInHours}س`;
                                      return `${Math.floor(diffInHours / 24)}ي`;
                                    };

                                    return (
                                      <Link 
                                        key={n.id} 
                                        to="/notifications" 
                                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-library-primary/[0.02] dark:border-white/[0.02] last:border-0 ${!n.isRead ? "bg-library-accent/[0.02] dark:bg-library-accent/[0.05]" : ""}`}
                                      >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.isRead ? "bg-library-accent/10" : "bg-gray-100 dark:bg-white/5"}`}>
                                          {ui.icon}
                                        </div>
                                        <div className="min-w-0 flex-grow">
                                          <p className={`text-[11px] truncate ${!n.isRead ? "font-black text-library-primary dark:text-white" : "font-bold text-gray-500"}`}>
                                            {translateNotificationText(n.title)}
                                          </p>
                                          {n.message && (
                                            <p className="text-[10px] text-gray-400 truncate opacity-70">
                                              {translateNotificationText(n.message)}
                                            </p>
                                          )}
                                          <p className="text-[9px] text-gray-400 font-bold mt-1">{formatBriefTime(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-library-accent"></div>}
                                      </Link>
                                    );
                                  })
                                ) : (
                                  <div className="p-8 text-center text-[10px] font-bold text-gray-400">لا توجد إشعارات</div>
                                )}
                              </div>
                              <Link 
                                to="/notifications" 
                                className="block p-3 text-center text-[10px] font-black text-gray-400 hover:text-library-accent hover:bg-gray-50 dark:hover:bg-white/5 transition-all bg-gray-50/50 dark:bg-white/[0.02]"
                              >
                                مشاهدة كافة الإشعارات
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-2.5 group cursor-pointer pl-2 pr-2 py-1.5 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-library-primary/10 dark:border-white/10 hover:border-library-accent/30 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all shadow-sm"
                  >
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black text-library-primary dark:text-white leading-none group-hover:text-library-accent transition-colors truncate max-w-[124px]">
                        {displayName}
                      </p>
                      <p className="text-[9px] text-library-primary/60 dark:text-gray-400 mt-1 font-black tracking-wide uppercase flex items-center gap-1.5">
                        {displayRole}
                        {isLoggedIn &&
                          user?.role?.toLowerCase() !== "admin" && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                  : user.status === "approved"
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                              }`}
                              title={
                                user.status === "active"
                                  ? "موثق"
                                  : user.status === "approved"
                                    ? "بانتظار التوثيق"
                                    : "بانتظار تأكيد الإيميل"
                              }
                            />
                          )}
                      </p>
                    </div>

                    <motion.div
                      whileHover={{
                        scale: 1.05,
                        borderColor: "var(--color-accent)",
                      }}
                      className="flex w-9 h-9 rounded-lg bg-gradient-to-br from-library-primary/10 to-library-accent/10 dark:from-white/15 dark:to-white/10 p-[2px] border border-library-accent/20 transition-all overflow-hidden shadow-sm"
                    >
                      <div className="w-full h-full rounded-xl bg-white dark:bg-dark-bg flex items-center justify-center text-library-accent overflow-hidden">
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt="profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="lg:size-[22px]" />
                        )}
                      </div>
                    </motion.div>
                  </Link>

                  {user?.role?.toLowerCase() === "admin" &&
                    !location.pathname.startsWith("/admin") && (
                      <Link
                        to="/admin"
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-library-accent/10 text-library-accent border border-library-accent/25 text-[10px] font-black hover:bg-library-accent/20 transition-all"
                      >
                        لوحة الإدارة
                      </Link>
                    )}

                  <motion.button
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                    }}
                    onClick={logout}
                    className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/5 text-red-500 transition-all border border-red-500/15"
                    title="تسجيل الخروج"
                  >
                    <LogOut size={16} />
                  </motion.button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-6">
                  {location.pathname !== "/" && (
                    <Link
                      to={homePath}
                      className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-library-primary/10 dark:border-white/10 text-[11px] font-black text-library-primary dark:text-white hover:border-library-accent/35 hover:text-library-accent transition-all"
                      title="الصفحة الرئيسية"
                    >
                      <Home size={14} />
                      الرئيسية
                    </Link>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center bg-white/60 dark:bg-white/5 text-library-primary/70 dark:text-library-paper/60 hover:text-library-accent transition-all border border-library-primary/10 dark:border-white/10"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isDarkMode ? "sun" : "moon"}
                        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>

                  <Link
                    to="/login"
                    className="text-sm font-black text-library-primary/60 dark:text-library-paper/60 hover:text-library-accent transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="bg-library-primary dark:bg-white text-white dark:text-library-primary px-8 py-3 rounded-2xl text-sm font-black transition-all hover:shadow-2xl hover:shadow-library-accent/30 hover:-translate-y-1 active:scale-95"
                  >
                    ابدأ رحلتك
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-library-primary/5 dark:bg-white/5 text-library-primary dark:text-library-paper relative z-[60]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileMenuOpen ? "close" : "menu"}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                  >
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-[100] w-[min(100%,22rem)] max-w-[360px] bg-white dark:bg-dark-bg shadow-2xl flex flex-col pt-[max(4rem,env(safe-area-inset-top,0px)+3rem)] px-5 pb-[env(safe-area-inset-bottom,0px)] lg:hidden overflow-hidden border-r border-library-primary/5 dark:border-white/5"
            >
              {/* Close Button Inside Drawer */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                }}
                className="absolute top-[max(1.5rem,env(safe-area-inset-top,0px)+0.5rem)] right-5 w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all z-[110] border border-gray-100 dark:border-white/5"
              >
                <X size={20} />
              </button>

              <div className="absolute top-0 end-0 w-64 h-64 bg-library-accent/10 blur-[100px] rounded-full me-[-8rem] -mt-32 pointer-events-none" />

              <div className="flex flex-col gap-6 relative z-10 overflow-y-auto pb-10 flex-grow">
                <div className="flex items-center gap-3 mb-2 mt-2">
                  <OrbitIcon className="w-8 h-8" />
                  <span className="font-black text-2xl tracking-tighter text-library-primary dark:text-white">
                    Book<span className="text-library-accent">Orbit</span>
                  </span>
                </div>

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center gap-4 p-5 rounded-[2rem] bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.05] dark:to-transparent border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-library-accent/20 active:scale-95 transition-all"
                    >
                      <div className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-white/10 flex items-center justify-center text-library-accent shadow-sm overflow-hidden border border-gray-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={28} />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-black text-library-primary dark:text-white leading-none mb-2">
                          {displayName}
                        </p>
                        <p className="text-[10px] text-library-accent font-black tracking-[0.2em] uppercase">
                          {displayRole}
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-4">
                        القائمة الرئيسية
                      </p>
                      <Link
                        to={homePath}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-library-accent/20 to-library-accent/5 text-library-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Home size={20} />
                          </div>
                          الرئيسية
                        </div>
                      </Link>

                      {user?.role?.toLowerCase() === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                              <Shield size={20} />
                            </div>
                            لوحة الإدارة
                          </div>
                        </Link>
                      )}

                      <Link
                        to="/chat"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-library-accent/20 to-library-accent/5 text-library-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <MessageSquare size={20} />
                          </div>
                          الرسائل
                        </div>
                      </Link>

                      <Link
                        to="/notifications"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Bell size={20} />
                          </div>
                          الإشعارات
                        </div>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <User size={20} />
                          </div>
                          حسابي الشخصي
                        </div>
                      </Link>

                      <Link
                        to="/my-copies"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 available hover:border-library-accent/20 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                          </div>
                          كتبي
                        </div>
                      </Link>
                      <Link
                        to="/lending/incoming"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Inbox size={20} />
                          </div>
                          الطلبات الواردة
                        </div>
                      </Link>
                      <Link
                        to="/lending/outgoing"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Send size={20} />
                          </div>
                          طلباتي الصادرة
                        </div>
                      </Link>
                      <Link
                        to="/lending/transactions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group text-[14px] font-black text-library-primary dark:text-gray-200 flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <RefreshCcw size={20} />
                          </div>
                          معاملاتي
                        </div>
                      </Link>
                    </div>

                    <div className="mt-auto pt-6 space-y-3">
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-library-primary dark:text-white active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-dark-bg flex items-center justify-center text-library-accent shadow-sm border border-gray-100 dark:border-white/5">
                            {isDarkMode ? (
                              <Sun size={18} />
                            ) : (
                              <Moon size={18} />
                            )}
                          </div>
                          <span className="text-xs font-black">
                            {isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
                          </span>
                        </div>
                        <div
                          dir="ltr"
                          className={`w-11 h-6 rounded-full p-1 transition-colors relative ${isDarkMode ? "bg-library-accent" : "bg-gray-300 dark:bg-gray-700"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDarkMode ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 text-xs font-black active:scale-95 transition-all border border-red-100 dark:border-red-500/20"
                      >
                        <LogOut size={18} /> تسجيل الخروج
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4 mt-8">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-center text-[13px] font-black text-library-primary dark:text-white border border-gray-100 dark:border-white/5 active:scale-95 transition-all"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full p-4 rounded-2xl bg-library-primary dark:bg-white text-center text-[13px] font-black text-white dark:text-library-primary shadow-lg shadow-library-primary/20 dark:shadow-white/20 active:scale-95 transition-all"
                    >
                      إنشاء حساب جديد
                    </Link>

                    <button
                      onClick={toggleDarkMode}
                      className="mt-6 w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-library-primary dark:text-white active:scale-95 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-dark-bg flex items-center justify-center text-library-accent shadow-sm border border-gray-100 dark:border-white/5">
                          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </div>
                        <span className="text-xs font-black">
                          {isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
                        </span>
                      </div>
                      <div
                        dir="ltr"
                        className={`w-11 h-6 rounded-full p-1 transition-colors relative ${isDarkMode ? "bg-library-accent" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDarkMode ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
