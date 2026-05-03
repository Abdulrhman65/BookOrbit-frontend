import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/common/Navbar';
import { booksApi } from '../services/api';
import { BOOK_CATEGORY_LABELS } from '../utils/constants';
import { 
  Upload, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  X, 
  User, 
  Save,
  ArrowRight,
  Loader2,
  Barcode,
  Building
} from 'lucide-react';

const AddBook = () => {
  const navigate = useNavigate();
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    categories: [],
  });

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processCoverFile(file);
    }
  };

  const processCoverFile = (file) => {
    if (file.type.startsWith('image/')) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('يرجى اختيار ملف صورة صحيح للغلاف');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCoverFile(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const current = prev.categories || [];
      if (current.includes(category)) {
        return { ...prev, categories: current.filter((c) => c !== category) };
      } else {
        return { ...prev, categories: [...current, category] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error("العنوان والمؤلف حقول مطلوبة");
      return;
    }
    
    if (!coverFile) {
      toast.error("الرجاء رفع صورة غلاف الكتاب");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('جاري إضافة الكتاب للكتالوج...');

    try {
      const data = new FormData();
      data.append('Title', formData.title.trim());
      data.append('Author', formData.author.trim());
      data.append('ISBN', formData.isbn?.trim() || "");
      data.append('Publisher', formData.publisher?.trim() || "");
      
      // Explicitly check that coverFile is a File object
      if (coverFile instanceof File || coverFile instanceof Blob) {
        data.append('CoverImage', coverFile);
      }
      
      if (formData.categories && formData.categories.length > 0) {
        // Send each category as a separate 'Categories' entry
        formData.categories.forEach(cat => {
          data.append('Categories', cat);
        });
      }

      await booksApi.create(data);
      
      toast.dismiss(loadingToast);
      toast.success('تمت إضافة الكتاب بنجاح، وهو الآن بانتظار موافقة الإدارة.');
      
      navigate('/app', { replace: true });
    } catch (error) {
      toast.dismiss(loadingToast);
      if (error.status === 403) {
        toast.error('عذراً، لا تمتلك الصلاحيات الكافية لإضافة كتاب. يجب أن يكون حسابك موثقاً (Active).');
      } else if (error.status === 409) {        toast.error('هذا الكتاب (أو الرقم الدولي ISBN) موجود بالفعل في الكتالوج.');
      } else if (error.errors) {
        // Detailed validation errors from backend
        const firstError = Array.isArray(error.errors)
          ? error.errors[0]
          : Object.values(error.errors)[0]?.[0] || Object.values(error.errors)[0];
        toast.error(firstError || error.detail || 'يرجى التحقق من البيانات المدخلة');
      } else {
        toast.error(error.message || 'فشل في إضافة الكتاب');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <>
      <Navbar />

      <div dir="rtl" className="min-h-screen bg-library-paper dark:bg-dark-bg pt-[calc(8rem+env(safe-area-inset-top,0px))] pb-12 px-4 sm:px-6 lg:px-8 font-sans text-library-ink dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-library-primary/40 dark:text-gray-500 hover:text-library-accent transition-all mb-6 font-bold text-xs group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-library-primary/10 dark:border-white/10 flex items-center justify-center group-hover:border-library-accent group-hover:bg-library-accent/5 transition-all">
              <ArrowRight size={14} />
            </div>
            <span>العودة للسابقة</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-surface rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden border border-library-primary/5 dark:border-white/5 transition-colors duration-300"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-library-primary to-library-primary/80 dark:from-black dark:to-library-primary/20 px-8 py-10 text-white relative overflow-hidden transition-colors duration-300">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white opacity-5">
                <BookOpen size={200} />
              </div>
              <div className="relative z-10">
                <h1 className="text-3xl font-extrabold mb-3 flex items-center gap-3">
                  <BookOpen size={32} className="text-library-accent" />
                  إضافة كتاب جديد للكتالوج
                </h1>
                <p className="text-library-paper/80 opacity-90 text-lg font-medium mb-2">قم بتعبئة بيانات الكتاب لإدراجه في الكتالوج العام للمكتبة.</p>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-sm font-bold border border-white/20 inline-block">
                  💡 إشعار: بمجرد موافقة الإدارة على إدراج الكتاب، سيتم تسجيل نسختك تلقائياً وعرضها للإعارة. إذا كان الكتاب موجوداً مسبقاً، يمكنك إضافة نسختك مباشرة من صفحة الكتاب.
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                
                {/* 3D Book Preview Area */}
                <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
                  <div className="font-bold text-library-primary dark:text-white text-lg mb-1 flex items-center gap-2 transition-colors duration-300">
                    <ImageIcon size={20} className="text-library-accent" />
                    غلاف الكتاب
                  </div>
                  
                  <div 
                    className={`relative w-full h-[480px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-hidden
                      ${isDragging ? 'border-2 border-library-accent bg-library-accent/5' : ''}
                      ${!coverPreview && !isDragging ? 'border-2 border-dashed border-library-primary/10 dark:border-white/10 bg-library-primary/[0.02] dark:bg-white/[0.02] hover:bg-library-accent/5 dark:hover:bg-library-accent/5 hover:border-library-accent cursor-pointer' : ''}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onDragOver={!isSubmitting ? handleDragOver : undefined}
                    onDragLeave={!isSubmitting ? handleDragLeave : undefined}
                    onDrop={!isSubmitting ? handleDrop : undefined}
                    onClick={() => !isSubmitting && !coverPreview && fileInputRef.current?.click()}
                  >
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleCoverUpload} disabled={isSubmitting} />

                    <AnimatePresence>
                      {coverPreview ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full flex flex-col items-center justify-center relative"
                        >
                          {/* 3D Book — غلاف أوضح: حواف صفحات + عمق + hover */}
                          <div className="group/book3d relative z-10 mt-[-32px] h-[300px] w-[210px] [perspective:2200px]">
                            <motion.div className="relative h-full w-full cursor-default [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:rotateY(38deg)_rotateX(8deg)] group-hover/book3d:[transform:rotateY(22deg)_rotateX(4deg)]">
                              {/* ظهر الغلاف */}
                              <div className="absolute inset-0 overflow-hidden rounded-l-xl rounded-r-sm border-l border-black/25 bg-library-primary [transform:translateZ(-18px)] shadow-2xl" aria-hidden>
                                <img
                                  src={coverPreview}
                                  className="h-full w-full object-cover opacity-45 brightness-[0.55] dark:opacity-35"
                                  alt=""
                                />
                              </div>
                              {/* حافة الصفحات (اليسار في فضاء 3D) */}
                              <div className="absolute inset-y-[5px] left-[2px] flex w-[26px] flex-col justify-evenly overflow-hidden border-y border-gray-300 bg-[#ececec] shadow-inner [transform:translateX(-13px)_rotateY(-90deg)] dark:border-gray-600 dark:bg-[#2a3038]">
                                {Array.from({ length: 28 }).map((_, i) => (
                                  <div key={`sp-${i}`} className="h-px w-full shrink-0 bg-[#d8d8d8] dark:bg-gray-600" />
                                ))}
                              </div>
                              {/* حافة علوية (رأس الكتاب) */}
                              <div className="absolute left-[3px] right-[3px] top-[2px] flex h-[22px] flex-row justify-evenly overflow-hidden border-x border-gray-300 bg-[#f0f0f0] shadow-inner [transform:translateY(-11px)_rotateX(90deg)] dark:border-gray-600 dark:bg-[#353b44]">
                                {Array.from({ length: 36 }).map((_, i) => (
                                  <div key={`tp-${i}`} className="h-full w-px shrink-0 bg-[#dadada] dark:bg-gray-600" />
                                ))}
                              </div>
                              {/* حافة سفلية */}
                              <div className="absolute bottom-[2px] left-[3px] right-[3px] flex h-[22px] flex-row justify-evenly overflow-hidden border-x border-gray-300 bg-[#e4e4e4] [transform:translateY(11px)_rotateX(-90deg)] dark:border-gray-600 dark:bg-[#2f353d]">
                                {Array.from({ length: 36 }).map((_, i) => (
                                  <div key={`bt-${i}`} className="h-full w-px shrink-0 bg-[#cfcfcf] dark:bg-gray-600" />
                                ))}
                              </div>
                              {/* قطع الصفحات (يمين الغلاف) */}
                              <div className="absolute inset-y-[4px] right-0 flex w-[32px] flex-col justify-evenly overflow-hidden rounded-r-sm border-y border-r border-black/15 bg-[#fafafa] shadow-[inset_-6px_0_14px_rgba(0,0,0,0.12)] [transform:translateX(16px)_rotateY(90deg)] dark:border-white/10 dark:bg-[#1e232b] dark:shadow-[inset_-6px_0_18px_rgba(0,0,0,0.5)]">
                                {Array.from({ length: 36 }).map((_, i) => (
                                  <div key={`pg-${i}`} className="h-px w-full shrink-0 bg-[#e2e2e2] dark:bg-gray-700" />
                                ))}
                              </div>
                              {/* الغلاف الأمامي */}
                              <div className="absolute inset-0 overflow-hidden rounded-l-xl rounded-r-sm border-l-2 border-white/25 bg-white [transform:translateZ(18px)] shadow-[-12px_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:shadow-[-14px_18px_36px_rgba(0,0,0,0.55)] dark:ring-white/10">
                                <img src={coverPreview} className="h-full w-full object-cover" alt="غلاف الكتاب" />
                                {/* لمعان ربط خفيف بدون تدرج كامل الشاشة */}
                                <div
                                  className="pointer-events-none absolute inset-y-0 start-0 w-[28%] bg-white/25 mix-blend-overlay dark:bg-white/10"
                                  aria-hidden
                                />
                                <div
                                  className="pointer-events-none absolute inset-0 shadow-[inset_-14px_0_24px_rgba(0,0,0,0.18)] dark:shadow-[inset_-18px_0_32px_rgba(0,0,0,0.45)]"
                                  aria-hidden
                                />
                              </div>
                            </motion.div>
                            <div
                              className="pointer-events-none absolute -bottom-14 left-1/2 h-8 w-[88%] -translate-x-1/2 rounded-[100%] bg-black/35 blur-xl dark:bg-black/60"
                              aria-hidden
                            />
                          </div>

                          {!isSubmitting && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                               <button type="button" onClick={(e) => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); }} className="bg-white dark:bg-dark-surface hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-black shadow-lg">
                                  <X size={18} /> إلغاء الغلاف
                               </button>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
                          <div className="bg-library-primary/5 dark:bg-white/5 p-5 rounded-3xl mb-4 transition-colors duration-300">
                            <Upload size={32} className="text-library-accent" />
                          </div>
                          <p className="text-library-primary/60 dark:text-gray-300 font-bold mb-2 transition-colors duration-300">اضغط للرفع أو اسحب الصورة هنا</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">يدعم PNG, JPG, JPEG</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Form Fields Area */}
                <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-library-primary/60 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300 mr-1">
                        <BookOpen size={16} className="text-library-accent" /> اسم الكتاب
                      </label>
                      <input
                        type="text" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting}
                        placeholder="مثلاً: الفيزياء الجامعية..."
                        className="w-full px-5 py-4 rounded-xl border-2 border-library-primary/5 dark:border-white/[0.05] focus:border-library-accent outline-none transition-all bg-white dark:bg-dark-surface focus:shadow-xl focus:shadow-library-accent/5 text-library-ink dark:text-white placeholder-gray-300 dark:placeholder-gray-600 font-medium text-sm disabled:opacity-50"
                        required
                      />
                    </div>

                    {/* Author */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-library-primary/60 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300 mr-1">
                        <User size={16} className="text-library-accent" /> اسم المؤلف
                      </label>
                      <input
                        type="text" name="author" value={formData.author} onChange={handleChange} disabled={isSubmitting}
                        placeholder="أدخل اسم المؤلف..."
                        className="w-full px-5 py-4 rounded-xl border-2 border-library-primary/5 dark:border-white/[0.05] focus:border-library-accent outline-none transition-all bg-white dark:bg-dark-surface focus:shadow-xl focus:shadow-library-accent/5 text-library-ink dark:text-white placeholder-gray-300 dark:placeholder-gray-600 font-medium text-sm disabled:opacity-50"
                        required
                      />
                    </div>

                    {/* ISBN */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-library-primary/60 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300 mr-1">
                        <Barcode size={16} className="text-library-accent" /> رقم ISBN
                      </label>
                      <input
                        type="text" name="isbn" value={formData.isbn} onChange={handleChange} disabled={isSubmitting}
                        placeholder="978-..."
                        className="w-full px-5 py-4 rounded-xl border-2 border-library-primary/5 dark:border-white/[0.05] focus:border-library-accent outline-none transition-all bg-white dark:bg-dark-surface focus:shadow-xl focus:shadow-library-accent/5 text-library-ink dark:text-white placeholder-gray-300 dark:placeholder-gray-600 font-medium text-sm disabled:opacity-50"
                      />
                    </div>

                    {/* Publisher */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-library-primary/60 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300 mr-1">
                        <Building size={16} className="text-library-accent" /> الناشر
                      </label>
                      <input
                        type="text" name="publisher" value={formData.publisher} onChange={handleChange} disabled={isSubmitting}
                        placeholder="دار النشر..."
                        className="w-full px-5 py-4 rounded-xl border-2 border-library-primary/5 dark:border-white/[0.05] focus:border-library-accent outline-none transition-all bg-white dark:bg-dark-surface focus:shadow-xl focus:shadow-library-accent/5 text-library-ink dark:text-white placeholder-gray-300 dark:placeholder-gray-600 font-medium text-sm disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-3 col-span-1 md:col-span-2">
                      <label className="text-xs font-black text-library-primary/60 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300 mr-1">
                        <BookOpen size={16} className="text-library-accent" /> التصنيفات (اختر واحدة أو أكثر)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {Object.entries(BOOK_CATEGORY_LABELS)
                          .filter(([key]) => key[0] === key[0].toUpperCase()) // Only show CamelCase keys to avoid duplicates
                          .map(([key, label]) => {
                          const isSelected = formData.categories.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleCategoryToggle(key)}
                              disabled={isSubmitting}
                              className={`px-3 py-2.5 rounded-xl text-[11px] font-black transition-all border-2 flex items-center justify-center text-center
                                ${isSelected 
                                  ? 'bg-library-primary text-white border-library-primary shadow-md shadow-library-primary/20 dark:bg-library-accent dark:border-library-accent' 
                                  : 'bg-white dark:bg-white/5 text-library-primary/60 dark:text-gray-400 border-library-primary/5 dark:border-white/5 hover:border-library-accent/30'}
                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Categories Info */}
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                      * ملاحظة: سيتم مراجعة بيانات الكتاب من قبل الإدارة قبل ظهوره بشكل عام في المكتبة. يرجى التأكد من دقة المعلومات وصورة الغلاف.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <motion.button
                      whileHover={isSubmitting ? {} : { scale: 1.01, translateY: -2 }}
                      whileTap={isSubmitting ? {} : { scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-library-primary dark:bg-white text-white dark:text-library-primary font-black py-4 px-12 rounded-2xl shadow-xl shadow-library-primary/20 dark:shadow-none hover:shadow-2xl transition-all flex items-center gap-3 text-sm w-full md:w-auto justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> حفظ وإضافة الكتاب
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>

              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AddBook;
