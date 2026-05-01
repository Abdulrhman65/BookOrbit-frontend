import React, { useState } from "react";
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

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "borrowing",
      title: "طلب استعارة جديد",
      message: "طلب 'أحمد علي' استعارة نسخة من كتاب 'فن اللامبالاة' الخاص بك.",
      time: "منذ 5 دقائق",
      isRead: false,
      icon: <Repeat className="text-emerald-500" size={18} />,
      color: "emerald",
      action: "عرض الطلب"
    },
    {
      id: 2,
      type: "system",
      title: "تم توثيق حسابك",
      message: "تهانينا! لقد تمت مراجعة حسابك وتوثيقه بنجاح. يمكنك الآن عرض كتبك للإعارة.",
      time: "منذ ساعتين",
      isRead: true,
      icon: <ShieldCheck className="text-blue-500" size={18} />,
      color: "blue"
    },
    {
      id: 3,
      type: "points",
      title: "زيادة في النقاط",
      message: "حصلت على 50 نقطة مكافأة لإتمامك أول عملية إعارة بنجاح.",
      time: "منذ 5 ساعات",
      isRead: false,
      icon: <Coins className="text-amber-500" size={18} />,
      color: "amber"
    },
    {
      id: 4,
      type: "reminder",
      title: "تذكير بموعد الإرجاع",
      message: "يجب إرجاع كتاب 'قواعد العشق الأربعون' غداً لتجنب خصم النقاط.",
      time: "منذ يوم واحد",
      isRead: true,
      icon: <Clock className="text-rose-500" size={18} />,
      color: "rose",
      action: "تواصل مع المالك"
    },
    {
      id: 5,
      type: "system",
      title: "كتاب جديد متاح",
      message: "أضاف 'عمر خالد' نسخة جديدة من 'رواية 1984' التي كنت تبحث عنها.",
      time: "منذ يومين",
      isRead: true,
      icon: <BookOpen className="text-indigo-500" size={18} />,
      color: "indigo"
    }
  ]);

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeTab || (activeTab === "unread" && !n.isRead));

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const tabs = [
    { id: "all", label: "الكل" },
    { id: "unread", label: "غير المقروءة" },
    { id: "borrowing", label: "الطلبات" },
    { id: "system", label: "النظام" }
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
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`group relative p-5 rounded-3xl border transition-all ${
                      notification.isRead 
                        ? "bg-white/60 dark:bg-white/[0.03] border-library-primary/5 dark:border-white/5" 
                        : "bg-white dark:bg-white/[0.07] border-library-accent/20 shadow-sm"
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-library-accent"></div>
                    )}

                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border ${getColorClasses(notification.color)}`}>
                        {notification.icon}
                      </div>

                      <div className="flex-grow min-w-0 pr-2">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-black text-library-primary dark:text-white truncate pr-4">
                            {notification.title}
                          </h3>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3">
                          {notification.action && (
                            <button className="px-4 py-2 rounded-xl bg-library-accent text-white text-[11px] font-black hover:shadow-lg hover:shadow-library-accent/20 transition-all">
                              {notification.action}
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all md:opacity-0 group-hover:opacity-100"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
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
