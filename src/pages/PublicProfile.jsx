import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  Coins, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Star,
  Send
} from "lucide-react";
import { studentsApi, lendingApi, bookCopiesApi } from "../services/api";
import { API_V1, tokenStore } from "../utils/constants";
import Navbar from "../components/common/Navbar";
import Aurora from "../components/effects/Aurora";
import toast from "react-hot-toast";

const PublicProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentBooks, setStudentBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch student basic info via /students/profiles/{studentId}
        const studentData = await studentsApi.getById(studentId);
        setStudent(studentData);

        // 2. Fetch student's book copies via /students/{studentId}/books/copies
        setLoadingBooks(true);
        const [copiesRes, lendingRes] = await Promise.all([
          bookCopiesApi.getByStudentId(studentId, { Page: 1, PageSize: 15 }),
          lendingApi.getAll({ OwnerId: studentId, States: "available", PageSize: 50 })
        ]);

        const copies = Array.isArray(copiesRes?.items) ? copiesRes.items : [];
        const lendingRecords = Array.isArray(lendingRes?.items) ? lendingRes.items : [];

        // 3. Build a map: bookCopyId → lending record (for cost, days, etc.)
        const lendingByCopyId = {};
        lendingRecords.forEach((lr) => {
          const copyId = lr.bookCopyId ?? lr.BookCopyId;
          if (copyId) lendingByCopyId[String(copyId)] = lr;
        });

        // 4. Only show copies that have an active lending record, enriched with lending data
        const listedCopies = copies
          .map((copy) => {
            const lr = lendingByCopyId[String(copy.id)];
            if (!lr) return null; // skip copies not on lending list
            return {
              ...copy,
              cost: lr.cost ?? lr.Cost ?? 0,
              borrowingDurationInDays: lr.borrowingDurationInDays ?? lr.BorrowingDurationInDays ?? 0,
              bookTitle: copy.title || lr.bookTitle || "كتاب",
              authorName: copy.authorName || lr.authorName || "مؤلف مجهول",
              bookCoverImageUrl: copy.bookCoverImageUrl || lr.bookCoverImageUrl || "",
              lendingRecordId: lr.id ?? lr.Id,
            };
          })
          .filter(Boolean);

        setStudentBooks(listedCopies);
        
        // 5. Fetch authenticated student image via /images/students/{studentId}
        fetchStudentImage(studentId);

      } catch (err) {
        console.error("Public profile fetch error:", err);
        setError("تعذر تحميل بيانات الطالب. قد يكون الرابط غير صحيح أو الحساب غير موجود.");
      } finally {
        setLoading(false);
        setLoadingBooks(false);
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
          if (contentType.startsWith("image/") || contentType.includes("octet-stream")) {
            const blob = await res.blob();
            setProfileImage(URL.createObjectURL(blob));
          } else {
            // Backend may return base64 string
            const text = await res.text();
            const cleaned = text.replace(/^"|"$/g, "").trim();
            if (cleaned.startsWith("data:image/")) {
              setProfileImage(cleaned);
            } else if (cleaned.length > 100) {
              setProfileImage(`data:image/jpeg;base64,${cleaned}`);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch student image:", err);
      }
    };

    if (studentId) {
      fetchStudentData();
    }

    return () => {
      // Cleanup blob URL on unmount
      if (profileImage && profileImage.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-library-paper dark:bg-dark-bg flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-library-accent" size={48} />
          <p className="text-sm font-black text-gray-500 animate-pulse">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-library-paper dark:bg-dark-bg pt-24 px-4 text-center flex flex-col items-center justify-center">
        <Navbar />
        <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-red-100 dark:border-red-500/10 max-w-md">
          <AlertCircle size={60} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-library-primary dark:text-white mb-2">عذراً، حدث خطأ</h2>
          <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/app')}
            className="px-6 py-3 bg-library-primary text-white rounded-xl font-black text-sm hover:bg-library-accent transition-all shadow-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const displayName = student.fullName || student.name || student.Name || "طالب مجهول";
  const studentInitials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <div className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500" dir="rtl">
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <Aurora />
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-library-primary dark:hover:text-white mb-8 font-black text-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowRight size={16} />
            </div>
            العودة للخلف
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] p-8 border border-white dark:border-white/5 shadow-2xl text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-library-primary via-library-accent to-indigo-500" />
                
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 border-4 border-white dark:border-dark-bg shadow-xl flex items-center justify-center">
                    {profileImage || student.personalPhotoUrl ? (
                      <img src={profileImage || student.personalPhotoUrl} className="w-full h-full object-cover" alt={displayName} />
                    ) : (
                      <span className="text-4xl font-black text-library-primary/20 dark:text-white/20">{studentInitials}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center border-4 border-white dark:border-dark-bg shadow-lg">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-library-primary dark:text-white mb-1 leading-tight">{displayName}</h2>
                <p className="text-[11px] font-black text-library-accent uppercase tracking-[0.2em] mb-6">طالب جامعي</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">النقاط</p>
                    <p className="text-lg font-black text-amber-500 flex items-center justify-center gap-1.5">
                      <Coins size={16} />
                      {student.points || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">الكتب المعارة</p>
                    <p className="text-lg font-black text-library-primary dark:text-white flex items-center justify-center gap-1.5">
                      <BookOpen size={16} />
                      {student.lendingsCount || 0}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/chat/${studentId}`, { state: { studentName: displayName, studentImage: profileImage || student.personalPhotoUrl } })}
                  className="w-full py-4 bg-library-primary dark:bg-white text-white dark:text-library-primary rounded-2xl font-black text-sm shadow-xl shadow-library-primary/20 dark:shadow-white/5 hover:bg-library-accent dark:hover:bg-library-accent dark:hover:text-white transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-library-primary/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Send size={16} />
                  </div>
                  مراسلة الآن
                </motion.button>
              </motion.div>
            </div>

            {/* Right Side - Available Books */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-library-primary dark:text-white flex items-center gap-3">
                  <BookOpen className="text-library-accent" size={24} />
                  الكتب المتاحة للإعارة
                </h3>
                {studentBooks.length > 0 && (
                  <span className="bg-library-accent/10 text-library-accent px-3 py-1 rounded-full text-[10px] font-black border border-library-accent/20">
                    {studentBooks.length} كتاب متاح
                  </span>
                )}
              </div>

              {loadingBooks ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 rounded-[2rem] bg-white/40 dark:bg-white/5 animate-pulse border border-white/10" />
                  ))}
                </div>
              ) : studentBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentBooks.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white/60 dark:bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-5 border border-white dark:border-white/5 hover:border-library-accent/30 hover:shadow-xl transition-all"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-28 rounded-2xl overflow-hidden bg-gray-100 dark:bg-black/20 shrink-0 shadow-sm border border-white/10">
                          {record.bookCoverImageUrl ? (
                            <img src={record.bookCoverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><BookOpen size={24} /></div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0 py-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-[14px] font-black text-library-primary dark:text-white truncate mb-1">{record.bookTitle || record.title || "كتاب"}</h4>
                            <p className="text-[11px] font-bold text-gray-500 mb-3">{record.authorName || "مؤلف مجهول"}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[9px] font-black px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/10 flex items-center gap-1">
                                <Coins size={10} /> {record.cost} نقطة
                              </span>
                              <span className="text-[9px] font-black px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/10 flex items-center gap-1">
                                <Clock size={10} /> {record.borrowingDurationInDays} يوم
                              </span>
                            </div>
                          </div>

                          <Link 
                            to={`/catalog/${record.bookId}`}
                            className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-library-primary dark:bg-white text-white dark:text-library-primary text-[10px] font-black hover:bg-library-accent dark:hover:bg-library-accent dark:hover:text-white transition-all shadow-sm"
                          >
                            عرض التفاصيل
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 bg-white/20 dark:bg-white/[0.01]">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/5">
                    <BookOpen className="text-gray-300 dark:text-white/20" size={28} />
                  </div>
                  <h4 className="text-base font-black text-library-primary dark:text-white">لا توجد كتب معروضة حالياً</h4>
                  <p className="text-xs font-bold text-gray-500 mt-1">هذا الطالب ليس لديه أي كتب معروضة للإعارة في الوقت الحالي.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;
