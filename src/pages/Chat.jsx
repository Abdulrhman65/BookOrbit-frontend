import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  ChevronLeft,
  User,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Trash2,
  BellOff,
  Mic,
  ArrowRight,
  Info,
  ChevronRight,
  X,
  Play,
  Pause,
  Download,
  MessageSquare,
  Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { studentsApi, imagesApi } from "../services/api";
import { API_V1, tokenStore } from "../utils/constants";
import Navbar from "../components/common/Navbar";
import Aurora from "../components/effects/Aurora";
import toast from "react-hot-toast";

const Chat = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    groups,
    messages,
    loadingGroups,
    loadingMessages,
    unreadCounts,
    fetchMessages,
    sendMessage,
    markAsRead,
    setActiveChatGroupId,
    activeChatGroupId,
    studentImages,
    fetchStudentImage,
  } = useChat();

  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const [newChatStudent, setNewChatStudent] = useState(null);

  // Sync studentId from URL with activeChatGroupId
  useEffect(() => {
    if (studentId) {
      const group = groups.find((g) => g.otherStudentId === studentId);
      if (group) {
        setActiveChatGroupId(group.chatGroupId);
        setNewChatStudent(null);
      } else {
        // Check if we have metadata from location.state
        const { studentName, studentImage } = location.state || {};
        if (studentName) {
          setNewChatStudent({
            otherStudentId: studentId,
            otherStudentName: studentName,
            otherStudentImage: studentImage,
          });
        } else {
          // Fetch student info
          studentsApi.getById(studentId).then((data) => {
            if (data) {
              setNewChatStudent({
                otherStudentId: studentId,
                otherStudentName: data.fullName || data.name || "طالب",
                otherStudentImage: null,
              });
              fetchStudentImage(studentId);
            }
          });
        }
        setActiveChatGroupId(null);
      }
    }
  }, [studentId, groups, setActiveChatGroupId, location.state]);

  // Fetch messages when group changes
  useEffect(() => {
    if (activeChatGroupId) {
      fetchMessages(activeChatGroupId);
      markAsRead(activeChatGroupId);
    }
  }, [activeChatGroupId, fetchMessages, markAsRead]);

  const activeGroup = activeChatGroupId
    ? groups.find((g) => g.chatGroupId === activeChatGroupId)
    : newChatStudent;
  const currentMessages = activeChatGroupId
    ? messages[activeChatGroupId] || []
    : [];

  const allGroups = [...groups];
  if (
    newChatStudent &&
    !groups.some((g) => g.otherStudentId === newChatStudent.otherStudentId)
  ) {
    allGroups.unshift({
      ...newChatStudent,
      chatGroupId: "new",
      createdAt: new Date().toISOString(),
      isNew: true,
    });
  }

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    try {
      const targetId = activeGroup?.otherStudentId || studentId;
      if (!targetId) return;

      await sendMessage(targetId, message);
      setMessage("");
      setSelectedFile(null);
      setShowEmojiPicker(false);
    } catch (err) {
      // Error handled in context
    }
  };

  const handleEmojiClick = (emoji) => setMessage((prev) => prev + emoji);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          url: event.target.result,
          size: (file.size / 1024).toFixed(1) + " KB",
        });
      };
      reader.readAsDataURL(file);
      setShowAttachments(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500 overflow-hidden flex flex-col"
      dir="rtl"
    >
      <Navbar />

      <main className="flex-grow pt-16 md:pt-20 pb-2 px-2 md:px-8 max-w-7xl mx-auto w-full flex gap-0 md:gap-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">
          <Aurora />
        </div>

        {/* Sidebar */}
        <motion.div
          animate={{
            width: isSidebarOpen
              ? window.innerWidth < 768
                ? "100%"
                : "380px"
              : "0px",
            opacity: isSidebarOpen ? 1 : 0,
          }}
          className={`${
            !isSidebarOpen && window.innerWidth < 768 ? "hidden" : "flex"
          } h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white/80 dark:bg-white/[0.03] backdrop-blur-3xl rounded-none md:rounded-[2rem] border-0 md:border border-white dark:border-white/5 shadow-2xl flex flex-col transition-all duration-500 overflow-hidden shrink-0 z-40 relative`}
        >
          <div className="p-4 md:p-5 border-b border-library-primary/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-library-primary text-white flex items-center justify-center shadow-lg">
                  <MessageSquare size={20} />
                </div>
                {isSidebarOpen && (
                  <h2 className="text-lg font-black">المحادثات</h2>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden w-9 h-9 rounded-xl bg-gray-100/50 dark:bg-white/5 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="ابحث..."
                className="w-full bg-white/50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/5 rounded-2xl py-3 pr-11 pl-4 text-[12px] font-bold focus:outline-none focus:border-library-accent/30"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
            {loadingGroups ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin text-library-accent" />
              </div>
            ) : (
              allGroups.map((conv) => (
                <button
                  key={
                    conv.chatGroupId === "new"
                      ? `new-${conv.otherStudentId}`
                      : conv.chatGroupId
                  }
                  onClick={() => {
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                    navigate(`/chat/${conv.otherStudentId}`);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-[1.5rem] transition-all group ${
                    activeChatGroupId === conv.chatGroupId ||
                    (conv.chatGroupId === "new" && !activeChatGroupId)
                      ? "bg-library-primary text-white shadow-xl"
                      : "hover:bg-library-primary/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center border-2 border-white/10 relative">
                    {studentImages[conv.otherStudentId] ? (
                      <img
                        src={studentImages[conv.otherStudentId]}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User
                        size={24}
                        className={
                          activeChatGroupId === conv.chatGroupId ||
                          (conv.chatGroupId === "new" && !activeChatGroupId)
                            ? "text-white"
                            : "text-library-accent"
                        }
                      />
                    )}
                    {unreadCounts[conv.chatGroupId] > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#121214]">
                        {unreadCounts[conv.chatGroupId]}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow text-right min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-[13px] font-black truncate">
                        {conv.otherStudentName}
                      </h3>
                      <span className="text-[9px] opacity-60">
                        {new Date(conv.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-bold truncate ${
                        activeChatGroupId === conv.chatGroupId ||
                        (conv.chatGroupId === "new" && !activeChatGroupId)
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                    >
                      {conv.isNew
                        ? "ابدأ المحادثة الآن..."
                        : "اضغط لمتابعة الدردشة"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          animate={{
            opacity: !isSidebarOpen || window.innerWidth >= 768 ? 1 : 0,
          }}
          className={`${
            isSidebarOpen && window.innerWidth < 768 ? "hidden" : "flex"
          } flex-grow h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl rounded-none md:rounded-[2.5rem] border-0 md:border border-white dark:border-white/5 shadow-2xl flex flex-col overflow-hidden relative z-30`}
        >
          {activeGroup ? (
            <>
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-library-primary/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden w-8 h-8 rounded-lg bg-gray-100/50 dark:bg-white/5 flex items-center justify-center text-gray-500"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div
                    onClick={() =>
                      navigate(`/student/${activeGroup.otherStudentId}`)
                    }
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden bg-white dark:bg-white/5 border border-library-accent/20 shrink-0">
                      {studentImages[activeGroup.otherStudentId] ? (
                        <img
                          src={studentImages[activeGroup.otherStudentId]}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[13px] md:text-[14px] font-black truncate">
                        {activeGroup.otherStudentName}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      showHeaderMenu
                        ? "bg-library-primary text-white shadow-lg"
                        : "bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-library-primary/10"
                    }`}
                  >
                    <MoreVertical size={18} />
                  </button>

                  <AnimatePresence>
                    {showHeaderMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[200]"
                      >
                        <div className="p-1.5 flex flex-col">
                          <button
                            onClick={() => {
                              setShowHeaderMenu(false);
                              navigate(
                                `/student/${activeGroup.otherStudentId}`,
                              );
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-right transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                              <User size={14} />
                            </div>
                            <span className="text-[12px] font-black">
                              عرض الملف الشخصي
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setShowHeaderMenu(false);
                              toast.success(
                                "سيتم إضافة خاصية مسح المحادثة قريباً",
                              );
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-right transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                              <Trash2 size={14} />
                            </div>
                            <span className="text-[12px] font-black">
                              مسح المحادثة
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-6"
              >
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Loader className="animate-spin text-library-accent mb-4" />
                    <p className="text-[11px] font-black">
                      جاري تحميل الرسائل...
                    </p>
                  </div>
                ) : currentMessages.length > 0 ? (
                  currentMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          isMe ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] md:max-w-[75%] ${
                            isMe
                              ? "bg-library-primary text-white rounded-[1.25rem] rounded-tr-none"
                              : "bg-white dark:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[1.25rem] rounded-tl-none shadow-md"
                          } p-3 px-4 shadow-lg`}
                        >
                          <p className="text-[14px] leading-relaxed font-bold">
                            {msg.content}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 justify-end opacity-60">
                            <span className="text-[8px] md:text-[9px] font-black">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe &&
                              (msg.isRead ? (
                                <CheckCheck
                                  size={12}
                                  className="text-emerald-400"
                                />
                              ) : (
                                <Check size={12} />
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <MessageSquare size={40} className="mb-4" />
                    <p className="text-[11px] font-black">
                      لا توجد رسائل بعد. ابدأ الدردشة الآن...
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-5 bg-white/60 dark:bg-black/40 backdrop-blur-3xl border-t border-library-primary/5 dark:border-white/5 relative z-50">
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-3 p-2 px-3 bg-library-primary/5 rounded-2xl border border-library-accent/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {selectedFile.type.startsWith("image") ? (
                          <img
                            src={selectedFile.url}
                            className="w-10 h-10 rounded-lg object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-library-primary/10 flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-black truncate max-w-[150px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-[8px] text-gray-500">
                            {selectedFile.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 md:gap-3 max-w-5xl mx-auto"
                >
                  <div className="flex-grow bg-white dark:bg-white/[0.05] rounded-[1.5rem] border border-gray-100 dark:border-white/10 flex items-center p-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        showEmojiPicker
                          ? "bg-amber-500/10 text-amber-500"
                          : "text-gray-400"
                      }`}
                    >
                      <Smile size={20} />
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute bottom-full right-0 mb-3 p-2 bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-white/10 grid grid-cols-6 gap-1 w-56 z-[100]"
                        >
                          {[
                            "😊",
                            "😂",
                            "😍",
                            "👍",
                            "🙏",
                            "📚",
                            "📖",
                            "❤️",
                            "🔥",
                            "✨",
                            "🙌",
                            "🎉",
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                handleEmojiClick(emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-all"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب..."
                      className="flex-grow bg-transparent border-none focus:outline-none px-2 py-1.5 text-[14px] font-bold dark:text-white"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!message.trim() && !selectedFile}
                    className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      message.trim() || selectedFile
                        ? "bg-library-primary text-white shadow-lg"
                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                    }`}
                  >
                    <Send size={18} />
                  </motion.button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 opacity-30 text-center">
              <MessageSquare size={60} className="mb-4 text-library-accent" />
              <p className="text-xs font-black">اختر محادثة لبدء الدردشة</p>
            </div>
          )}
        </motion.div>
      </main>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.05); border-radius: 10px; }
        .custom-audio-player { filter: sepia(20%) saturate(70%) hue-rotate(180deg) brightness(1.1); }
        .dark .custom-audio-player { filter: invert(0.9) hue-rotate(180deg); }
      `,
        }}
      />
    </div>
  );
};

export default Chat;
