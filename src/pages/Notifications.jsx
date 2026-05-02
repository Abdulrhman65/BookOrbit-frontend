import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  MessageSquare, 
  BookOpen, 
  Repeat, 
  ShieldCheck, 
  Trash2, 
  AlertCircle,
  Coins,
  ArrowLeft,
  Settings
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Aurora from "../components/effects/Aurora";
import { notificationsApi } from "../services/api";

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll();
      setNotifications(res.items);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      // Optimistically update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      await notificationsApi.markAllAsRead();
      
      // Notify other components (like Navbar) to refresh
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const getNotificationUI = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "good":
        return { icon: <CheckCheck className="text-emerald-500" size={18} />, color: "emerald" };
      case "bad":
        return { icon: <AlertCircle className="text-rose-500" size={18} />, color: "rose" };
      case "normal":
        return { icon: <Bell className="text-blue-500" size={18} />, color: "blue" };
      case "borrowing":
      case "request":
        return { icon: <Repeat className="text-emerald-500" size={18} />, color: "emerald", action: "عرض الطلب" };
      case "system":
        return { icon: <ShieldCheck className="text-blue-500" size={18} />, color: "blue" };
      case "points":
        return { icon: <Coins className="text-amber-500" size={18} />, color: "amber" };
      case "reminder":
        return { icon: <Clock className="text-rose-500" size={18} />, color: "rose" };
      case "book":
        return { icon: <BookOpen className="text-indigo-500" size={18} />, color: "indigo" };
      default:
        return { icon: <Bell className="text-blue-500" size={18} />, color: "blue" };
    }
  };

  const notificationTranslations = {
    // الأنماط المعقدة (Complex Patterns - should be first)
    "Your request for the book": "طلبك لكتاب",
    "for the book": "للكتاب",
    "for your copy of the book": "لنسختك من كتاب",
    "A student has requested your copy of the book": "طلب أحد الطلاب استعارة نسختك من كتاب",
    "You have been rated": "لقد حصلت على تقييم",
    "stars": "نجوم",
    "star": "نجمة",
    "You have earned": "لقد ربحت",
    "points": "نقاط",
    "point": "نقطة",
    "Your": "طلبك الـ",

    // العناوين (Titles)
    "Borrowing Request": "طلب استعارة",
    "Request Accepted": "تم قبول الطلب",
    "Request Rejected": "تم رفض الطلب",
    "Request Cancelled": "تم إلغاء الطلب",
    "Book Delivered": "تم تسليم الكتاب",
    "Book Returned": "تم إرجاع الكتاب",
    "New Review": "تقييم جديد",
    "Points Received": "نقاط مكتسبة",
    "System Update": "تحديث النظام",
    "Reminder": "تذكير",

    // الجمل الشائعة (Messages)
    "has been accepted": "تم قبوله",
    "has been rejected": "تم رفضه",
    "wants to borrow": "يريد استعارة",
    "has returned the book": "قام بإرجاع الكتاب",
    "has delivered the book": "قام بتسليم الكتاب",
    "Successfully": "بنجاح",
    "Your request for": "طلبك لـ",
    "New borrowing request from": "طلب استعارة جديد من",
    "You received": "لقد استلمت",
  };

  const translateText = (text) => {
    if (!text) return text;
    let translated = text;
    Object.entries(notificationTranslations).forEach(([en, ar]) => {
      const regex = new RegExp(en, "gi");
      translated = translated.replace(regex, ar);
    });
    return translated;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return "الآن";
      if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
      if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
      if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
      
      return date.toLocaleDateString("ar-EG");
    } catch {
      return dateStr;
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => {
        const type = String(n.type || "").toLowerCase();
        if (activeTab === "unread") return !n.isRead;
        return type === activeTab;
      });

  const tabs = [
    { id: "all", label: "الكل" },
    { id: "unread", label: "غير المقروءة" },
    { id: "good", label: "جيد" },
    { id: "normal", label: "عادي" },
    { id: "bad", label: "سيء" }
  ];

  const getColorClasses = (color) => {
    const maps = {
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    };
    return maps[color] || maps.blue;
  };

  return (
    <div className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500" dir="rtl">
      <Navbar />

      <main className="relative z-10 pt-24 pb-12">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <Aurora />
        </div>

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-black flex items-center gap-3">
                <Bell className="text-library-accent" size={28} />
                الإشعارات
                {notifications.some(n => !n.isRead) && (
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-black text-white">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </h1>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">تابع آخر التحديثات والطلبات الخاصة بك</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-library-primary/10 dark:border-white/10 text-xs font-black hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
              >
                <CheckCheck size={16} />
                قراءة الكل
              </button>
              <button className="p-2 rounded-xl bg-white dark:bg-white/5 border border-library-primary/10 dark:border-white/10 text-gray-500 hover:text-library-accent transition-all">
                <Settings size={18} />
              </button>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-2xl text-[13px] font-black transition-all shrink-0 border ${
                  activeTab === tab.id
                    ? "bg-library-primary text-white border-library-primary dark:bg-white dark:text-library-primary dark:border-white"
                    : "bg-white dark:bg-white/5 text-gray-500 border-library-primary/10 dark:border-white/10 hover:border-library-accent/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Notifications List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-library-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm font-bold text-gray-500">جاري تحميل الإشعارات...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => {
                  const ui = getNotificationUI(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                      className={`group relative p-5 rounded-3xl border transition-all cursor-pointer overflow-hidden ${
                        notification.isRead 
                          ? {
                              emerald: "bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-500/5 dark:border-emerald-500/10",
                              blue: "bg-blue-50/30 border-blue-100/50 dark:bg-blue-500/5 dark:border-blue-500/10",
                              rose: "bg-rose-50/30 border-rose-100/50 dark:bg-rose-500/5 dark:border-rose-500/10",
                              amber: "bg-amber-50/30 border-amber-100/50 dark:bg-amber-500/5 dark:border-amber-500/10",
                              indigo: "bg-indigo-50/30 border-indigo-100/50 dark:bg-indigo-500/5 dark:border-indigo-500/10",
                            }[ui.color] || "bg-white/60 dark:bg-white/[0.03] border-library-primary/5"
                          : {
                              emerald: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5",
                              blue: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-lg shadow-blue-500/5",
                              rose: "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 shadow-lg shadow-rose-500/5",
                              amber: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 shadow-lg shadow-amber-500/5",
                              indigo: "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/5",
                            }[ui.color] || "bg-white dark:bg-white/[0.07] border-library-accent/20 shadow-sm"
                      }`}
                    >
                      {/* Decorative gradient background */}
                      {!notification.isRead && (
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-20 pointer-events-none -mr-16 -mt-16 bg-current ${
                          ui.color === 'emerald' ? 'text-emerald-500' :
                          ui.color === 'blue' ? 'text-blue-500' :
                          ui.color === 'rose' ? 'text-rose-500' :
                          ui.color === 'amber' ? 'text-amber-500' : 'text-indigo-500'
                        }`}></div>
                      )}

                      {!notification.isRead && (
                        <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${
                          ui.color === 'emerald' ? 'bg-emerald-500' :
                          ui.color === 'blue' ? 'bg-blue-500' :
                          ui.color === 'rose' ? 'bg-rose-500' :
                          ui.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}></div>
                      )}

                      <div className="flex gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border shadow-sm ${getColorClasses(ui.color)}`}>
                          {ui.icon}
                        </div>

                        <div className="flex-grow min-w-0 pr-2">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-sm font-black truncate pr-4 ${
                              notification.isRead ? "text-library-primary/70 dark:text-gray-300" : "text-library-primary dark:text-white"
                            }`}>
                              {translateText(notification.title)}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[13px] font-medium leading-relaxed mb-4 ${
                            notification.isRead ? "text-gray-500 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                          }`}>
                            {translateText(notification.message)}
                          </p>

                          <div className="flex items-center gap-3">
                            {ui.action && (
                              <button className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all shadow-sm ${
                                ui.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                ui.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                                'bg-library-accent hover:bg-library-accent/90 text-white'
                              }`}>
                                {ui.action}
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all md:opacity-0 group-hover:opacity-100"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center"
                >
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200 dark:border-white/10">
                    <Bell className="text-gray-300 dark:text-white/20" size={32} />
                  </div>
                  <h3 className="text-lg font-black text-library-primary dark:text-white">لا توجد إشعارات</h3>
                  <p className="text-sm font-bold text-gray-500 mt-2">عندما تتلقى إشعارات جديدة، ستظهر هنا.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
