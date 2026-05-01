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
  MessageSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
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
  
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  
  // Real Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordingIntervalRef = useRef(null);

  // Initial conversations list
  const [conversations, setConversations] = useState([
    {
      id: "1",
      name: "أحمد محمد",
      image: null,
      lastMessage: "مرحباً بك!",
      time: "10:30 ص",
      unread: 0,
      role: "طالب جامعي",
      messages: [
        { id: 1, text: "السلام عليكم، كيف يمكنني مساعدتك؟", sender: "other", time: "10:00 ص", status: "read" }
      ]
    }
  ]);

  // Sync studentId and metadata
  useEffect(() => {
    if (studentId) {
      const { studentName, studentImage } = location.state || {};
      setConversations(prev => {
        const existing = prev.find(c => c.id === studentId);
        if (existing) {
          if (studentName && (existing.name === "طالب جديد" || !existing.image)) {
            return prev.map(c => c.id === studentId ? { ...c, name: studentName, image: studentImage || c.image } : c);
          }
          return prev;
        }
        return [{
          id: studentId,
          name: studentName || "طالب جديد",
          image: studentImage || null,
          role: "طالب جامعي",
          lastMessage: "بدء المحادثة...",
          time: "الآن",
          unread: 0,
          messages: []
        }, ...prev];
      });
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  }, [studentId, location.state]);

  useEffect(() => {
    if (studentId) {
      const found = conversations.find(c => c.id === studentId);
      if (found) {
        setActiveChat(found);
        
        // If data is missing (e.g. name is placeholder or image is null), fetch it
        if (found.name === "طالب جديد" || !found.image) {
          fetchStudentData(studentId);
        }
      }
    }
  }, [studentId, conversations]);

  const fetchStudentData = async (id) => {
    try {
      const data = await studentsApi.getById(id);
      if (data) {
        const name = data.fullName || data.name || data.Name || "طالب";
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, name } : c
        ));
        
        // Now fetch image
        fetchStudentImage(id);
      }
    } catch (err) {
      console.warn("Failed to fetch student data in chat:", err);
    }
  };

  const fetchStudentImage = async (id) => {
    try {
      const { accessToken } = tokenStore.get();
      const imageUrl = `${API_V1}/images/students/${id}`;
      
      const res = await fetch(imageUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "69420"
        }
      });
      
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let finalImage = null;

        if (contentType.startsWith("image/") || contentType.includes("octet-stream")) {
          const blob = await res.blob();
          finalImage = URL.createObjectURL(blob);
        } else {
          const text = await res.text();
          const cleaned = text.replace(/^"|"$/g, "").trim();
          if (cleaned.startsWith("data:image/")) {
            finalImage = cleaned;
          } else if (cleaned.length > 100) {
            finalImage = `data:image/jpeg;base64,${cleaned}`;
          }
        }

        if (finalImage) {
          setConversations(prev => prev.map(c => 
            c.id === id ? { ...c, image: finalImage } : c
          ));
        }
      }
    } catch (err) {
      console.warn("Could not fetch student image in chat:", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChat?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      file: selectedFile,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    };

    updateMessages(newMessage);
    setMessage("");
    setSelectedFile(null);
    setShowEmojiPicker(false);
  };

  const updateMessages = (newMessage) => {
    if (activeChat) {
      setConversations(prev => prev.map(c => {
        if (c.id === activeChat.id) {
          const lastMsgText = newMessage.type === 'audio' ? "رسالة صوتية" : (newMessage.file ? "مرفق" : newMessage.text);
          return {
            ...c,
            messages: [...(c.messages || []), newMessage],
            lastMessage: lastMsgText
          };
        }
        return c;
      }));
    }
  };

  const handleEmojiClick = (emoji) => setMessage(prev => prev + emoji);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          url: event.target.result,
          size: (file.size / 1024).toFixed(1) + " KB"
        });
      };
      reader.readAsDataURL(file);
      setShowAttachments(false);
    }
  };

  // REAL RECORDING LOGIC
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newMessage = {
          id: Date.now(),
          type: "audio",
          audioUrl: audioUrl,
          duration: formatTime(recordingTime),
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "sent"
        };
        updateMessages(newMessage);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("يرجى السماح بالوصول إلى الميكروفون");
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      if (shouldSend) {
        mediaRecorder.stop();
      } else {
        mediaRecorder.onstop = null; 
        mediaRecorder.stop();
      }
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500 overflow-hidden flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-16 md:pt-20 pb-2 px-2 md:px-8 max-w-7xl mx-auto w-full flex gap-0 md:gap-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">
          <Aurora />
        </div>

        {/* Sidebar */}
        <motion.div 
          animate={{ width: isSidebarOpen ? (window.innerWidth < 768 ? '100%' : '380px') : '0px', opacity: isSidebarOpen ? 1 : 0 }}
          className={`${!isSidebarOpen && window.innerWidth < 768 ? 'hidden' : 'flex'} h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white/80 dark:bg-white/[0.03] backdrop-blur-3xl rounded-none md:rounded-[2rem] border-0 md:border border-white dark:border-white/5 shadow-2xl flex flex-col transition-all duration-500 overflow-hidden shrink-0 z-40 relative`}
        >
          <div className="p-4 md:p-5 border-b border-library-primary/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-library-primary text-white flex items-center justify-center shadow-lg"><MessageSquare size={20} /></div>
                {isSidebarOpen && <h2 className="text-lg font-black">المحادثات</h2>}
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden w-9 h-9 rounded-xl bg-gray-100/50 dark:bg-white/5 flex items-center justify-center text-gray-500"><X size={18} /></button>
            </div>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="ابحث..." className="w-full bg-white/50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/5 rounded-2xl py-3 pr-11 pl-4 text-[12px] font-bold focus:outline-none focus:border-library-accent/30" />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                  navigate(`/chat/${conv.id}`);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-[1.5rem] transition-all group ${activeChat?.id === conv.id ? 'bg-library-primary text-white shadow-xl' : 'hover:bg-library-primary/5 dark:hover:bg-white/5'}`}
              >
                <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center border-2 border-white/10">
                  {conv.image ? <img src={conv.image} className="w-full h-full object-cover" alt="" /> : <User size={24} className={activeChat?.id === conv.id ? 'text-white' : 'text-library-accent'} />}
                </div>
                <div className="flex-grow text-right min-w-0">
                  <div className="flex justify-between items-center mb-1"><h3 className="text-[13px] font-black truncate">{conv.name}</h3><span className="text-[9px] opacity-60">{conv.time}</span></div>
                  <p className={`text-[11px] font-bold truncate ${activeChat?.id === conv.id ? 'text-white/80' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div 
          animate={{ opacity: !isSidebarOpen || window.innerWidth >= 768 ? 1 : 0 }}
          className={`${isSidebarOpen && window.innerWidth < 768 ? 'hidden' : 'flex'} flex-grow h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl rounded-none md:rounded-[2.5rem] border-0 md:border border-white dark:border-white/5 shadow-2xl flex flex-col overflow-hidden relative z-30`}
        >
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-library-primary/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-8 h-8 rounded-lg bg-gray-100/50 dark:bg-white/5 flex items-center justify-center text-gray-500"><ChevronRight size={18} /></button>
                  <div onClick={() => navigate(`/student/${activeChat.id}`)} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden bg-white dark:bg-white/5 border border-library-accent/20 shrink-0">
                      {activeChat.image ? <img src={activeChat.image} className="w-full h-full object-cover" alt="" /> : <User size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[13px] md:text-[14px] font-black truncate">{activeChat.name}</h2>
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[9px] md:text-[10px] text-library-accent font-black">نشط الآن</span></div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showHeaderMenu ? 'bg-library-primary text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-library-primary/10'}`}
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
                              navigate(`/student/${activeChat.id}`);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-right transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                              <User size={14} />
                            </div>
                            <span className="text-[12px] font-black">عرض الملف الشخصي</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowHeaderMenu(false);
                              toast.success("سيتم إضافة خاصية مسح المحادثة قريباً");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-right transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                              <Trash2 size={14} />
                            </div>
                            <span className="text-[12px] font-black">مسح المحادثة</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-grow overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-6">
                {activeChat.messages && activeChat.messages.length > 0 ? (
                  activeChat.messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'me' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[90%] md:max-w-[75%] ${msg.sender === 'me' ? 'bg-library-primary text-white rounded-[1.25rem] rounded-tr-none' : 'bg-white dark:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[1.25rem] rounded-tl-none shadow-md'} p-3 px-4 shadow-lg`}>
                        {msg.type === 'audio' ? (
                          <div className="flex flex-col gap-2 min-w-[180px] md:min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'me' ? 'bg-white/20' : 'bg-library-primary text-white'}`}>
                                <Play size={16} fill="currentColor" />
                              </div>
                              <div className="flex-grow">
                                <audio controls className="w-full h-8 opacity-90 custom-audio-player" src={msg.audioUrl} />
                                <div className="flex justify-between items-center mt-1 px-1">
                                  <span className="text-[9px] font-black">{msg.duration}</span>
                                  <span className="text-[8px] opacity-60">رسالة صوتية</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.file && (
                              <div className="mb-3">
                                {msg.file.type.startsWith('image') ? (
                                  <div className="rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => window.open(msg.file.url, '_blank')}>
                                    <img src={msg.file.url} className="w-full max-h-64 object-cover" alt="" />
                                  </div>
                                ) : (
                                  <div onClick={() => window.open(msg.file.url, '_blank')} className="p-3 rounded-xl bg-black/5 flex items-center gap-3 cursor-pointer">
                                    <FileText size={20} /><div className="min-w-0 flex-grow"><p className="text-[10px] font-black truncate">{msg.file.name}</p><p className="text-[9px] opacity-60">{msg.file.size}</p></div><Download size={14} />
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.text && <p className="text-[14px] leading-relaxed font-bold">{msg.text}</p>}
                          </>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 justify-end opacity-60"><span className="text-[8px] md:text-[9px] font-black">{msg.time}</span>{msg.sender === 'me' && <CheckCheck size={12} />}</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20"><MessageSquare size={40} className="mb-4" /><p className="text-[11px] font-black">ابدأ الدردشة الآن...</p></div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-5 bg-white/60 dark:bg-black/40 backdrop-blur-3xl border-t border-library-primary/5 dark:border-white/5 relative z-50">
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-3 p-2 px-3 bg-library-primary/5 rounded-2xl border border-library-accent/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedFile.type.startsWith('image') ? <img src={selectedFile.url} className="w-10 h-10 rounded-lg object-cover" alt="" /> : <div className="w-10 h-10 rounded-lg bg-library-primary/10 flex items-center justify-center"><FileText size={20} /></div>}
                        <div><p className="text-[10px] font-black truncate max-w-[150px]">{selectedFile.name}</p><p className="text-[8px] text-gray-500">{selectedFile.size}</p></div>
                      </div>
                      <button onClick={() => setSelectedFile(null)} className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><X size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 max-w-5xl mx-auto">
                  <div className="flex-grow bg-white dark:bg-white/[0.05] rounded-[1.5rem] border border-gray-100 dark:border-white/10 flex items-center p-1 relative">
                    {isRecording ? (
                      <div className="flex-grow flex items-center justify-between px-3 py-1.5 bg-red-500/5 rounded-[1.5rem]">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div><span className="text-[12px] font-black text-red-500">{formatTime(recordingTime)}</span></div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => stopRecording(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 flex items-center justify-center"><X size={14} /></button>
                          <button type="button" onClick={() => stopRecording(true)} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Send size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showEmojiPicker ? 'bg-amber-500/10 text-amber-500' : 'text-gray-400'}`}><Smile size={20} /></button>
                        <AnimatePresence>{showEmojiPicker && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full right-0 mb-3 p-2 bg-white dark:bg-[#121214] rounded-2xl shadow-2xl border border-white/10 grid grid-cols-6 gap-1 w-56 z-[100]">
                            {['😊', '😂', '😍', '👍', '🙏', '📚', '📖', '❤️', '🔥', '✨', '🙌', '🎉'].map(emoji => (
                              <button key={emoji} type="button" onClick={() => { handleEmojiClick(emoji); setShowEmojiPicker(false); }} className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-all">{emoji}</button>
                            ))}
                          </motion.div>
                        )}</AnimatePresence>
                        {/* <button type="button" onClick={() => setShowAttachments(!showAttachments)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showAttachments ? 'bg-library-accent/10 text-library-accent' : 'text-gray-400'}`}><Paperclip size={20} /></button> */}
                        <AnimatePresence>{showAttachments && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full right-0 mb-3 p-2 bg-white dark:bg-[#121214] rounded-2xl border border-white/10 flex gap-2 z-[100]">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><ImageIcon size={18} /></button>
                            <button type="button" onClick={() => fileInputRef.current.click()} className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><FileText size={18} /></button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                          </motion.div>
                        )}</AnimatePresence>
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب..." className="flex-grow bg-transparent border-none focus:outline-none px-2 py-1.5 text-[14px] font-bold dark:text-white" />
                        {/* <button type="button" onClick={startRecording} className="w-9 h-9 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"><Mic size={20} /></button> */}
                      </>
                    )}
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={(!message.trim() && !selectedFile) || isRecording} className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${message.trim() || selectedFile ? 'bg-library-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}><Send size={18} /></motion.button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 opacity-30 text-center"><MessageSquare size={60} className="mb-4 text-library-accent" /><p className="text-xs font-black">اختر محادثة لبدء الدردشة</p></div>
          )}
        </motion.div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.05); border-radius: 10px; }
        .custom-audio-player { filter: sepia(20%) saturate(70%) hue-rotate(180deg) brightness(1.1); }
        .dark .custom-audio-player { filter: invert(0.9) hue-rotate(180deg); }
      ` }} />
    </div>
  );
};

export default Chat;
