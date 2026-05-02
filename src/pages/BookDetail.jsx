import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, User, Building, Hash, CopyPlus, ArrowRight, Loader2, AlertCircle, CalendarDays, Coins, Repeat, Check } from "lucide-react";
import { booksApi, bookCopiesApi, lendingApi, borrowingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import toast from "react-hot-toast";

const BOOK_COPY_CONDITIONS = {
  0: "جديد",
  1: "جيد جداً",
  2: "مقبول",
  3: "قديم/مهترئ"
};
const CONDITION_KEY_TO_LABEL = {
  new: "جديد",
  likenew: "جيد جداً",
  verygood: "جيد جداً",
  acceptable: "مقبول",
  poor: "قديم/مهترئ",
  worn: "قديم/مهترئ",
};

const BookCopyCard = ({ record, isProcessing, onBorrow, currentStudentId }) => {
  const copy = record?.bookCopy || record?.BookCopy || record;
  const copyState = String(record?.state ?? record?.State ?? "").toLowerCase();
  
  const ownerId = record.studentId || record.ownerId || record.OwnerId || copy?.studentId;
  const isMyCopy = String(ownerId) === String(currentStudentId);

  const conditionLabel =
    BOOK_COPY_CONDITIONS[copy?.condition] ||
    BOOK_COPY_CONDITIONS[copy?.Condition] ||
    CONDITION_KEY_TO_LABEL[String(copy?.condition ?? copy?.Condition ?? "").toLowerCase()] ||
    "غير محدد";
  
  return (
    <div className={`relative bg-white/60 dark:bg-white/[0.02] border rounded-2xl p-5 hover:border-library-accent/30 transition-all flex flex-col justify-between shadow-sm ${
      isMyCopy ? "border-library-accent/50 ring-2 ring-library-accent/5 bg-library-accent/[0.02]" : "border-gray-100 dark:border-white/10"
    }`}>
      {isMyCopy && (
        <div className="absolute -top-3 right-4 px-3 py-1 bg-library-accent text-white text-[10px] font-black rounded-full shadow-lg z-20">
          نسختك
        </div>
      )}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-library-primary/5 dark:bg-white/5 flex items-center justify-center">
            <User size={18} className="text-library-accent" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">صاحب النسخة</p>
            <Link 
              to={`/student/${ownerId}`}
              className="text-sm font-black text-library-primary dark:text-white hover:text-library-accent transition-colors"
            >
              {isMyCopy ? "أنت (صاحب النسخة)" : (record.studentName || record.ownerName || copy?.studentName || "زميل")}
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1"><BookOpen size={10}/> حالة النسخة</p>
            <p className="text-xs font-black text-library-primary dark:text-gray-200">{conditionLabel}</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={10}/> مدة الاستعارة</p>
            <p className="text-xs font-black text-library-primary dark:text-gray-200">{record?.borrowingDurationInDays ? `${record.borrowingDurationInDays} يوم` : "غير معروضة"}</p>
          </div>
          <div className="col-span-2 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-500/10 flex justify-between items-center">
            <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1"><Coins size={12}/> التكلفة المطلوبة</p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{record?.cost ?? "—"} {record?.cost != null ? "نقاط" : ""}</p>
          </div>

        </div>
      </div>
      
      <button 
        onClick={() => onBorrow(record)}
        disabled={isProcessing || isMyCopy}
        className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
          isMyCopy 
            ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed" 
            : "bg-library-primary text-white hover:bg-library-accent"
        }`}
      >
        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : isMyCopy ? <Check size={16} /> : <Repeat size={16} />}
        {isMyCopy ? "هذه نسختك" : "طلب استعارة هذه النسخة"}
      </button>
    </div>
  );
};

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentStudentId = user?.studentId || user?.id;
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [lendingRecords, setLendingRecords] = useState([]);
  const [loadingLending, setLoadingLending] = useState(true);
  const [processingRecordId, setProcessingRecordId] = useState(null);

  const [isAddCopyModalOpen, setIsAddCopyModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [isAddingCopy, setIsAddingCopy] = useState(false);
  const [bookCopiesCount, setBookCopiesCount] = useState(0);
  const [availableCopiesCount, setAvailableCopiesCount] = useState(0);
  const DEFAULT_LENDING_DAYS = 14;

  const fetchBookAndLending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Fetch book metadata
      const bookData = await booksApi.getById(bookId);
      setBook(bookData);
      setBookCopiesCount(bookData.copiesCount || bookData.CopiesCount || 0);

      // 2. Fetch available lending records for this book using the optimized API
      // Query: /api/v1/lendinglist?States=available&BookId={id}
      const lendingRes = await lendingApi.getAll({
        States: "available",
        BookId: bookId,
        Page: 1,
        PageSize: 50,
      });

      const records = Array.isArray(lendingRes?.items) ? lendingRes.items : [];
      setLendingRecords(records);
      setAvailableCopiesCount(lendingRes?.totalCount ?? records.length);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("تعذر تحميل تفاصيل الكتاب.");
      toast.error(err?.message || "فشل تحميل بيانات الكتاب");
    } finally {
      setLoading(false);
      setLoadingLending(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBookAndLending();
  }, [fetchBookAndLending]);

  const handleAddCopySubmit = async () => {
    if (selectedCondition === "") {
      toast.error("يرجى اختيار حالة النسخة");
      return;
    }
    
    setIsAddingCopy(true);
    const toastId = toast.loading("جاري إضافة نسختك...");
    try {
      await bookCopiesApi.create(bookId, Number(selectedCondition));
      toast.success("تم تسجيل نسختك بنجاح. يمكنك إتاحتها للإعارة من صفحة نسخي.", { id: toastId });

      setIsAddCopyModalOpen(false);
      fetchBookAndLending();
    } catch (err) {
      toast.error("فشل إضافة النسخة. تأكد من أنك لم تضف نسخة مسبقاً، أو حاول لاحقاً.", { id: toastId });
    } finally {
      setIsAddingCopy(false);
    }
  };

  const handleBorrowRequest = async (record) => {
    const recordId = record?.id ?? record?.Id;

    if (!recordId) {
      toast.error("لم يتم العثور على سجل إعارة نشط لهذه النسخة.");
      return;
    }

    setProcessingRecordId(recordId);
    const toastId = toast.loading("جاري إرسال طلب الاستعارة...");
    try {
      await borrowingApi.create(recordId);
      toast.success("تم إرسال طلب الاستعارة بنجاح!", { id: toastId });
      navigate('/lending/outgoing');
    } catch (err) {
      toast.error(err?.message || "فشل إرسال الطلب. تأكد من امتلاكك لنقاط كافية، وأنك لم تطلب هذه النسخة مسبقاً.", { id: toastId });
    } finally {
      setProcessingRecordId(null);
    }
  };

  const renderAddCopyModal = () => {
    if (!isAddCopyModalOpen) return null;
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAddingCopy && setIsAddCopyModalOpen(false)} />
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-white/10 p-6"
          dir="rtl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-library-primary/10 flex items-center justify-center text-library-primary dark:text-white">
              <CopyPlus size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-library-primary dark:text-white">إضافة نسخة لهذا الكتاب</h3>
              <p className="text-[10px] text-gray-500 font-bold">حدد حالة النسخة التي تود مشاركتها.</p>
            </div>
          </div>
          
          <div className="mb-6 space-y-2">
            <label className="text-xs font-black text-library-primary dark:text-white">حالة الكتاب</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BOOK_COPY_CONDITIONS).map(([val, label]) => {
                const isActive = selectedCondition === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedCondition(val)}
                    className={`px-3 py-3 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center text-center ${
                      isActive 
                        ? "bg-library-accent/10 border-library-accent text-library-accent ring-2 ring-library-accent/20 ring-offset-1 dark:ring-offset-dark-surface scale-[1.02]" 
                        : "bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-100 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => setIsAddCopyModalOpen(false)}
              disabled={isAddingCopy}
              className="px-4 py-2 rounded-lg text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
            >
              إلغاء
            </button>
            <button 
              onClick={handleAddCopySubmit}
              disabled={isAddingCopy}
              className="px-4 py-2 rounded-lg text-xs font-black bg-library-primary text-white hover:bg-library-primary/90 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAddingCopy ? <Loader2 size={14} className="animate-spin" /> : "تأكيد الإضافة"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-library-paper dark:bg-dark-bg pt-24 pb-12 flex items-center justify-center">
        <Navbar />
        <Loader2 className="animate-spin text-library-accent" size={40} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-library-paper dark:bg-dark-bg pt-24 pb-12 flex flex-col items-center justify-center px-4 text-center">
        <Navbar />
        <AlertCircle size={60} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-black text-library-primary dark:text-white mb-2">{error || "كتاب غير موجود"}</h2>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-6 py-2 bg-library-primary text-white rounded-lg font-bold hover:bg-library-primary/90 transition-all"
        >
          العودة للكتالوج
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-library-paper dark:bg-dark-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300" dir="rtl">
      <Navbar />
      
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-library-primary dark:hover:text-white mb-8 font-bold text-sm transition-colors"
        >
          <ArrowRight size={16} /> العودة للخلف
        </button>

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl flex flex-col md:flex-row mb-8">
          
          {/* Cover Side */}
          <div className="w-full md:w-1/3 bg-gray-50 dark:bg-black/20 p-8 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-library-accent/5 to-transparent"></div>
            <div className="relative w-48 h-72 shadow-2xl rounded-r-xl rounded-l-sm overflow-hidden border-l border-white/20">
               {book.bookCoverImageUrl ? (
                 <img src={book.bookCoverImageUrl} alt={book.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-library-primary flex items-center justify-center text-center p-4">
                   <span className="text-white font-bold">{book.title}</span>
                 </div>
               )}
            </div>
          </div>

          {/* Details Side */}
          <div className="w-full md:w-2/3 p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-black text-library-primary dark:text-white leading-tight">
                  {book.title}
                </h1>
                <span className="shrink-0 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                  {availableCopiesCount} متاحة الآن من أصل {bookCopiesCount} نسخة في النظام
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User size={16} className="text-library-accent" />
                  <span className="font-bold">{book.author || book.authorName}</span>
                </div>
                {book.category && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <BookOpen size={16} className="text-library-accent" />
                    <span className="font-bold">{book.category}</span>
                  </div>
                )}
                {book.publisher && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building size={16} className="text-library-accent" />
                    <span className="font-bold">{book.publisher}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Hash size={16} className="text-library-accent" />
                    <span className="font-bold uppercase tracking-wider">{book.isbn}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 dark:border-white/10">
              <h3 className="font-black text-library-primary dark:text-white mb-3">هل تمتلك نسخة من هذا الكتاب؟</h3>
              <p className="text-xs text-gray-500 font-bold mb-4 leading-relaxed max-w-lg">
                بدلاً من إضافة الكتاب كعنصر جديد في الكتالوج، يمكنك إرفاق نسختك مباشرةً هنا ليتسنى لزملائك استعارتها منك.
              </p>
              
              <button 
                onClick={() => setIsAddCopyModalOpen(true)}
                className="bg-white dark:bg-[#1a1a1f] text-library-primary dark:text-white border border-gray-200 dark:border-white/10 hover:border-library-accent/40 hover:bg-gray-50 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <CopyPlus size={18} className="text-library-accent" />
                أضف نسختك من هذا الكتاب
              </button>
            </div>
          </div>
        </div>

        {/* ─── LENDING MARKETPLACE SECTION ─── */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-xl p-8 lg:p-12 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 flex items-center justify-center text-indigo-500">
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-black text-library-primary dark:text-white">كل نسخ الكتاب في النظام</h2>
          </div>
          <p className="text-xs font-bold text-gray-500 mb-8 max-w-xl">
            هذه القائمة تعرض كل النسخ المسجلة لهذا الكتاب. يمكنك طلب النسخ المعروضة والمتاحة فقط.
          </p>

          {loadingLending ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-library-accent mb-3" size={30} />
              <p className="text-xs font-black text-gray-400">جاري تحميل جميع النسخ...</p>
            </div>
          ) : lendingRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-12 text-center">
              <Repeat className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-base font-black text-library-primary dark:text-white mb-1">لا توجد نسخ مسجلة لهذا الكتاب حالياً</p>
              <p className="text-xs font-bold text-gray-500">أضف أول نسخة ليظهر الكتاب ضمن النسخ المتاحة في النظام.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lendingRecords.map((record) => {
                const recordId = record?.id ?? record?.Id;
                return (
                <BookCopyCard 
                  key={recordId} 
                  record={record}
                  currentStudentId={currentStudentId}
                  isProcessing={processingRecordId === recordId}
                  onBorrow={handleBorrowRequest} 
                />
              )})}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {renderAddCopyModal()}
      </AnimatePresence>
    </div>
  );
};

export default BookDetail;
