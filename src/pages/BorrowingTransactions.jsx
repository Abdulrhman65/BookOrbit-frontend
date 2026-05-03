import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  RefreshCcw,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  User,
  XCircle,
  AlertCircle,
  ArrowDown,
  Hash,
  Repeat,
  BookOpen,
  X,
  Star,
  MessageSquare,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Aurora from "../components/effects/Aurora";
import { useAuth } from "../context/AuthContext";
import { borrowingTransactionsApi, booksApi, bookCopiesApi, reviewsApi } from "../services/api";
import {
  BORROWING_TRANSACTION_STATE_LABELS,
  getLabel,
  getBookImageUrl,
  toApiAssetUrl,
} from "../utils/constants";

const PAGE_SIZE = 10;

const transactionNumToKey = {
  0: "Borrowed",
  1: "Returned",
  2: "Overdue",
  3: "Lost",
};



/** Builds all display fields shared by cards and the detail modal */
const summarizeTransactionRow = (tx) => {
  if (!tx) return {};
  const b = tx?.book ?? tx?.Book ?? tx?.bookDto ?? tx?.BookDto;
  const id = tx?.id ?? tx?.Id;
  let rawSt = tx?.status ?? tx?.state;
  if (typeof rawSt === "string" && !isNaN(Number(rawSt)) && rawSt.trim() !== "") {
    rawSt = Number(rawSt);
  }
  const statusKey =
    typeof rawSt === "number"
      ? transactionNumToKey[rawSt] || "Borrowed"
      : rawSt || "Borrowed";
  
  const title =
    b?.title ||
    b?.Title ||
    tx?.bookTitle ||
    tx?.BookTitle ||
    tx?.title ||
    tx?.Title ||
    "\u0643\u062a\u0627\u0628 \u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641";

  // Priority: 1. Full book object cover, 2. Transaction level cover
  // Use the real ID from the enriched book object (which is a UUID)
  const bookId = b?.id ?? b?.Id ?? tx?.bookId ?? tx?.BookId;

  // Priority: 1. Full book object cover, 2. Transaction level cover, 3. getBookImageUrl fallback
  const rawCoverUrl =
    b?.bookCoverImageUrl ??
    b?.BookCoverImageUrl ??
    tx?.bookCoverImageUrl ??
    tx?.BookCoverImageUrl ??
    tx?.coverImageUrl ??
    tx?.CoverImageUrl ??
    "";

  const displayCoverUrl = rawCoverUrl
    ? toApiAssetUrl(String(rawCoverUrl))
    : bookId
    ? getBookImageUrl(bookId)
    : "";

  const borrowerName =
    tx?.borrowerStudentName ||
    tx?.borrowingStudentName ||
    tx?.BorrowingStudentName ||
    tx?.borrowerFullName ||
    tx?.borrowerName ||
    tx?.studentName ||
    tx?.StudentName ||
    tx?.student?.fullName ||
    tx?.student?.name ||
    tx?.borrower?.fullName ||
    tx?.borrower?.name ||
    "\u0645\u0633\u062a\u0639\u064a\u0631";
    
  const lenderName =
    tx?.lenderName || tx?.LenderName || tx?.lenderStudentName || tx?.lenderStudentFullName || tx?.ownerFullName || tx?.ownerName || tx?.OwnerName || tx?.LendingStudentName || tx?.LenderStudentName || tx?.lendingStudentName || tx?.lenderFullName || tx?.owner?.fullName || tx?.lender?.fullName || "\u0627\u0644\u0645\u0627\u0644\u0643";

  const author =
    b?.author ||
    b?.Author ||
    tx?.bookAuthor ||
    tx?.BookAuthor ||
    tx?.author ||
    tx?.Author ||
    "";

  const isbn =
    b?.isbn ?? b?.ISBN ?? tx?.isbn ?? tx?.ISBN ?? tx?.Isbn ?? "";

  const expDate =
    tx?.expectedReturnDate ||
    tx?.ExpectedReturnDate ||
    tx?.expirationDateUtc ||
    tx?.expirationDate;
    
  const borrowerId =
    tx?.borrowerStudentId ||
    tx?.borrowingStudentId ||
    tx?.BorrowingStudentId ||
    tx?.borrowerId ||
    tx?.BorrowerId ||
    tx?.studentId ||
    tx?.StudentId ||
    tx?.student?.id ||
    tx?.student?.Id ||
    tx?.borrower?.id ||
    tx?.borrower?.Id ||
    "";
    
  const lenderId =
    tx?.lenderStudentId ||
    tx?.lendingStudentId ||
    tx?.LendingStudentId ||
    tx?.lenderId ||
    tx?.LenderId ||
    tx?.ownerId ||
    tx?.OwnerId ||
    tx?.lenderStudentId ||
    tx?.LenderStudentId ||
    tx?.owner?.id ||
    tx?.owner?.Id ||
    tx?.lender?.id ||
    tx?.lender?.Id ||
    "";

  const actDate =
    tx?.actualReturnDate ||
    tx?.ActualReturnDate ||
    tx?.returnDateUtc ||
    tx?.returnDate;

  return {
    id,
    statusKey,
    title,
    bookId, // UUID for /catalog/:id
    borrowerName,
    lenderName,
    borrowerId,
    lenderId,
    author,
    isbn,
    expDate,
    actDate,
    rawCoverUrl: String(rawCoverUrl),
    displayCoverUrl,
  };
};

// Removed local TRANSACTIONS_AR in favor of central constants

const statusTone = {
  Borrowed:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  Returned:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  Overdue:
    "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  Lost: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

const formatDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

/** Cover from API URLs only — no external stock images */
const CoverFromApi = ({ url, alt, wrapClassName, imgClassName }) => {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [url]);
  if (!url || broken) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/[0.04] ${wrapClassName || ""}`}
      >
        <BookOpen className="h-[38%] w-[38%] text-gray-400/65 dark:text-white/35" aria-hidden />
        <span className="sr-only">لا توجد صورة غلاف</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt || ""}
      className={`absolute inset-0 h-full w-full object-cover ${imgClassName || ""}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
};

const PaginationBar = ({ page, totalPages, onChange, disabled }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-8">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-library-primary transition-all hover:border-library-accent/40 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-dark-surface dark:text-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-white/5 shadow-sm">
        <span className="text-xs font-black text-library-primary/40 dark:text-gray-500">
          صفحة
        </span>
        <span className="text-sm font-black text-library-primary dark:text-white">
          {page}
        </span>
        <span className="text-xs font-black text-library-primary/40 dark:text-gray-500">
          من
        </span>
        <span className="text-sm font-black text-library-primary dark:text-white">
          {totalPages}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-library-primary transition-all hover:border-library-accent/40 hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-dark-surface dark:text-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
};

const TransactionCard = ({
  tx,
  isProcessing,
  onReturn,
  onLost,
  isAdminView,
  isIncoming,
  onShowDetail,
  onRate,
}) => {
  const navigate = useNavigate();
  const s = summarizeTransactionRow(tx);
  const {
    id,
    statusKey,
    title,
    bookId,
    borrowerName,
    lenderName,
    borrowerId,
    lenderId,
    expDate,
    actDate,
    displayCoverUrl,
  } = s;
  const statusAr = getLabel(BORROWING_TRANSACTION_STATE_LABELS, statusKey);
  const processing = isProcessing === id;

  const openDetail =
    typeof onShowDetail === "function" ? () => onShowDetail(tx) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      role={openDetail ? "button" : undefined}
      tabIndex={openDetail ? 0 : undefined}
      className={`group relative overflow-hidden rounded-3xl border border-library-primary/10 bg-white/70 p-4 sm:p-5 transition-all duration-300 hover:border-library-accent/30 hover:shadow-xl hover:shadow-library-primary/5 hover:-translate-y-1 dark:border-white/10 dark:bg-dark-surface/70 ${openDetail ? "cursor-pointer outline-none ring-offset-2 ring-offset-library-paper dark:ring-offset-[#08080a] focus-visible:ring-2 focus-visible:ring-library-accent/50" : ""}`}
      onClick={
        openDetail
          ? (e) => {
              if (e.target.closest("[data-tx-return-lost]")) return;
              openDetail();
            }
          : undefined
      }
      onKeyDown={
        openDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetail();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Book Cover Thumbnail */}
        <div className="shrink-0">
          <div 
            onClick={(e) => {
              if (bookId) {
                e.stopPropagation();
                navigate(`/catalog/${bookId}`);
              }
            }}
            className={`relative h-28 w-20 sm:h-32 sm:w-24 overflow-hidden rounded-xl shadow-md border border-gray-100 dark:border-white/10 ${bookId ? "cursor-alias hover:ring-2 hover:ring-library-accent transition-all" : ""}`}
          >
            <CoverFromApi
              url={displayCoverUrl}
              alt={title}
              imgClassName="transition-transform duration-500 group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 
              onClick={(e) => {
                if (bookId) {
                  e.stopPropagation();
                  navigate(`/catalog/${bookId}`);
                }
              }}
              className={`min-w-0 flex-1 text-base font-black text-library-primary dark:text-white truncate sm:max-w-md ${bookId ? "hover:text-library-accent transition-colors cursor-pointer" : ""}`}
            >
              {title}
            </h3>
            <span
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone[statusKey] || statusTone.Borrowed}`}
            >
              {statusAr}
            </span>
            <span className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-mono font-bold text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500 flex items-center gap-1 shadow-sm">
              <Hash size={10} /> {id}
            </span>
            {openDetail ? (
              <button
                type="button"
                className="shrink-0 rounded-lg border border-library-accent/30 bg-library-accent/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-library-accent hover:bg-library-accent/10"
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail();
                }}
              >
                تفاصيل
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <User
                    size={14}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    المالك
                  </p>
                  <Link 
                    to={`/student/${lenderId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-black text-library-primary dark:text-white truncate hover:text-library-accent transition-colors"
                  >
                    {lenderName}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <User
                    size={14}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    المستعير
                  </p>
                  <Link 
                    to={`/student/${borrowerId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-black text-library-primary dark:text-white truncate hover:text-library-accent transition-colors"
                  >
                    {borrowerName}
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-library-primary/5 flex items-center justify-center shrink-0">
                  <Clock
                    size={14}
                    className="text-library-primary/40 dark:text-gray-400"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    موعد الإرجاع
                  </p>
                  <p className="text-xs font-black text-library-primary dark:text-white">
                    {formatDate(expDate)}
                  </p>
                </div>
              </div>
              {actDate && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CalendarDays
                      size={14}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                      تم الإرجاع في
                    </p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatDate(actDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الإجراءات - تظهر للمستعير فقط (أو للأدمن) */}
          {(isAdminView || !isIncoming) && 
            (String(statusKey).toLowerCase() === "borrowed" || String(statusKey).toLowerCase() === "overdue") && (
              <div
                data-tx-return-lost
                className="flex flex-wrap items-center gap-3 pt-4 border-t border-library-primary/5 dark:border-white/5"
              >
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onReturn(id)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/10 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowDown size={14} />
                  )}
                  إرجاع الكتاب
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onLost(id)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-6 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300"
                >
                  {processing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  الإبلاغ كفقدان
                </button>
              </div>
            )}

          {/* تقييم المستعير - يظهر للمالك فقط عند الإرجاع */}
          {isIncoming && (String(statusKey).toLowerCase() === "returned" || String(statusKey).toLowerCase() === "overdue") && (
            <div className="pt-4 border-t border-library-primary/5 dark:border-white/5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(tx);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-600 hover:bg-amber-500/20 transition-all"
              >
                <Star size={14} />
                تقييم المستعير
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <span className="text-[11px] font-black text-gray-400 shrink-0">{label}</span>
    <span className="text-sm font-bold text-library-primary dark:text-white sm:text-start sm:min-w-0 break-words">
      {value}
    </span>
  </div>
);

const ReviewModal = ({ tx, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("يرجى اختيار تقييم قبل الإرسال");
      return;
    }
    setLoading(true);
    
    try {
      const s = summarizeTransactionRow(tx);
      const reviewerId = user?.studentId || user?.id || user?.Id;
      
      // Determine who is being reviewed (the other party)
      const reviewedId = String(reviewerId).toLowerCase() === String(s.borrowerId).toLowerCase() 
        ? s.lenderId 
        : s.borrowerId;

      const body = {
        reviewerStudentId: String(reviewerId),
        reviewedStudentId: String(reviewedId),
        borrowingTransactionId: String(s.id),
        description: comment.trim() || "جيد",
        rating: String(rating)
      };

      await reviewsApi.create(String(s.id), body);
      toast.success("شكراً لتقييمك!");
      onClose();
    } catch (err) {
      toast.error(err?.message || "فشل إرسال التقييم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-[#121214] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden"
          dir="rtl"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
          
          <button onClick={onClose} className="absolute top-6 left-6 text-gray-400 hover:text-library-primary transition-colors">
            <X size={20} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-amber-500" fill="currentColor" />
            </div>
            <h3 className="text-xl font-black text-library-primary dark:text-white">تقييم التجربة</h3>
            <p className="text-sm font-bold text-gray-500 mt-1">كيف كانت تجربتك في استعارة هذا الكتاب؟</p>
          </div>

          <div className="flex justify-center gap-2 mb-8" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  size={36}
                  className={`${(hover || rating) >= star ? 'text-amber-500' : 'text-gray-200 dark:text-white/10'}`}
                  fill={(hover || rating) >= star ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="أضف تعليقاً حول تجربتك (اختياري)..."
            className="w-full rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-4 text-sm font-bold outline-none focus:border-amber-500/50 transition-all min-h-[100px] mb-6 resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "إرسال التقييم"}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-500 py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
            >
              تخطي
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TransactionDetailModal = ({ tx, loading, onClose }) => {
  useEffect(() => {
    if (!tx) return;
    const esc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [tx, onClose]);

  if (!tx) return null;
  const s = summarizeTransactionRow(tx);
  const statusAr = getLabel(
    BORROWING_TRANSACTION_STATE_LABELS,
    s.statusKey,
  );

  return (
    <AnimatePresence>
      {tx ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center sm:p-8"
          role="presentation"
          dir="rtl"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="إغلاق"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex w-full max-w-lg flex-col rounded-3xl border border-library-primary/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121214] max-h-[min(92vh,720px)] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-detail-heading"
          >
            <div className="flex items-center justify-between gap-3 border-b border-library-primary/10 px-5 py-4 dark:border-white/10">
              <div className="min-w-0">
                <h2
                  id="tx-detail-heading"
                  className="text-lg font-black text-library-primary dark:text-white truncate"
                >
                  تفاصيل المعاملة
                </h2>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                  انقر خارج النافذة أو اضغط Esc للإغلاق
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-transparent p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-library-primary dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="إغلاق"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-5 py-6">
              {loading ? (
                <div className="absolute inset-x-5 top-6 flex justify-center rounded-2xl border border-library-primary/5 bg-library-primary/[0.03] py-8 dark:bg-white/[0.02]">
                  <Loader2 className="h-8 w-8 animate-spin text-library-accent" />
                </div>
              ) : null}

              <div className={`flex gap-6 flex-col ${loading ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="mx-auto shrink-0 w-40 overflow-hidden rounded-2xl border border-gray-100 shadow-lg dark:border-white/10 sm:w-44 relative aspect-[2/3]">
                  <CoverFromApi
                    url={s.displayCoverUrl}
                    alt={s.title}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                </div>

                <div className="space-y-4 flex-1 min-w-0">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                      عنوان الكتاب
                    </p>
                    <p className="text-base font-black text-library-primary dark:text-white leading-snug">
                      {s.title}
                    </p>
                  </div>
                  {(s.author || s.isbn) && (
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {s.author ? (
                        <p>
                          <span className="text-gray-500 font-bold">
                            المؤلف:{" "}
                          </span>
                          <span className="font-black text-library-primary dark:text-white">
                            {s.author}
                          </span>
                        </p>
                      ) : null}
                      {s.isbn ? (
                        <p dir="ltr" className="text-end">
                          <span className="text-gray-500 font-bold">ISBN: </span>
                          <span className="font-mono font-bold text-library-primary dark:text-white">
                            {String(s.isbn)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${statusTone[s.statusKey] || statusTone.Borrowed}`}
                    >
                      {statusAr}
                    </span>
                    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-mono text-gray-500 dark:border-white/10 dark:bg-white/5">
                      #{String(s.id)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-library-primary/[0.06] bg-gray-50/80 p-4 space-y-3 dark:bg-white/[0.03]">
                    <DetailRow label="المالك" value={s.lenderName} />
                    <DetailRow label="المستعير" value={s.borrowerName} />
                    <DetailRow label="موعد الإرجاع المتوقع" value={formatDate(s.expDate)} />
                    <DetailRow
                      label="موعد الإرجاع الفعلي"
                      value={s.actDate ? formatDate(s.actDate) : "—"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const BorrowingTransactions = () => {
  const { user } = useAuth();
  const { type: urlType } = useParams();
  const navigate = useNavigate();

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const currentTab = urlType === "in" ? "in" : "out";
  const isIncoming = currentTab === "in";

  // Shared list states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState([]);

  // Student search state
  const [searchId, setSearchId] = useState("");
  const [studentTx, setStudentTx] = useState(null);

  // Shared states
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [detailTx, setDetailTx] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewTx, setReviewTx] = useState(null);

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetId, setOtpTargetId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);

  const statusChips = useMemo(
    () => [
      { id: "all", label: "الكل" },
      ...Object.entries(BORROWING_TRANSACTION_STATE_LABELS).map(
        ([id, label]) => ({
          id,
          label: label.split("(")[0].trim(), // Clean up the label
        }),
      ),
    ],
    [],
  );

  const openTransactionDetail = useCallback(async (rawTx) => {
    setDetailTx(rawTx);
    setDetailLoading(true);
    const txId = rawTx?.id ?? rawTx?.Id;
    try {
      // Step 1: fetch full transaction
      let fullTx = rawTx;
      if (txId) {
        try {
          const res = await borrowingTransactionsApi.getById(String(txId));
          if (res) fullTx = { ...rawTx, ...res };
        } catch { }
      }

      const copyId = fullTx?.bookCopyId ?? fullTx?.BookCopyId;
      if (copyId) {
        try {
          const copyData = await bookCopiesApi.getById(copyId);
          const bookId = copyData?.bookId ?? copyData?.BookId ?? copyData?.book?.id ?? copyData?.book?.Id;
          if (bookId) {
            try {
              const bookData = await booksApi.getById(bookId);
              if (bookData) {
                const ownerName = copyData.ownerName || copyData.OwnerName || copyData.ownerFullName || copyData.studentName || copyData.StudentName || copyData.student?.fullName || copyData.student?.name;

                fullTx = {
                  ...fullTx,
                  book: bookData,
                  lenderName: fullTx.lenderName || ownerName,
                  bookTitle: bookData.title || fullTx.bookTitle,
                  bookCoverImageUrl: bookData.bookCoverImageUrl || "",
                  bookAuthor: bookData.author || fullTx.bookAuthor,
                };
              }
            } catch {
              /* non-fatal */
            }
          }
        } catch { /* non-fatal */ }
      }

      setDetailTx(fullTx);
    } catch (e) {
      toast.error(e?.message || "تعذر تحميل تفاصيل المعاملة بالكامل");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeTransactionDetail = useCallback(() => {
    setDetailTx(null);
    setDetailLoading(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      const params = {
        page,
        pageSize: PAGE_SIZE,
        sortColumn: "createdAt",
        sortDirection: "desc",
      };

      if (statusFilter !== "all") {
        // Map key string to numeric enum if needed
        const num = Object.keys(transactionNumToKey).find(
          (k) => transactionNumToKey[k] === statusFilter,
        );
        if (num != null) params.states = [Number(num)];
        else params.states = [statusFilter];
      }

      if (isAdmin) {
        res = await borrowingTransactionsApi.getAll(params);
      } else if (isIncoming) {
        res = await borrowingTransactionsApi.getMeIn(params);
      } else {
        res = await borrowingTransactionsApi.getMeOut(params);
      }

      const raw = res.items ?? res.data ?? [];

      // Enrich each transaction with book cover data via bookCopyId
      // The transaction API does NOT return bookCoverImageUrl or bookId,
      // so we fetch the book copy then the book to get the cover URL.
      const enriched = await Promise.all(
        raw.map(async (tx) => {
          const copyId = tx.bookCopyId ?? tx.BookCopyId;
          if (!copyId) return tx;
          try {
            const copyData = await bookCopiesApi.getById(copyId);
            if (!copyData) return tx;
            const bookId = copyData.bookId ?? copyData.BookId ?? copyData.book?.id ?? copyData.book?.Id;
            if (!bookId) return tx;
            const bookData = await booksApi.getById(bookId);
            if (!bookData) return tx;

            // Try to get owner/lender name from copyData
            const ownerName = copyData.ownerName || copyData.OwnerName || copyData.studentName || copyData.StudentName || copyData.student?.fullName || copyData.student?.name;

            return {
              ...tx,
              book: bookData,
              lenderName: tx.lenderName || ownerName,
              bookTitle: bookData.title || tx.bookTitle,
              bookCoverImageUrl: bookData.bookCoverImageUrl || "",
              bookAuthor: bookData.author || "",
            };
          } catch {
            return tx; // non-fatal: show card without image
          }
        })
      );

      setItems(enriched);
      const total = res.totalCount ?? res.TotalCount ?? raw.length;
      const tp =
        res.totalPages ??
        res.TotalPages ??
        Math.max(1, Math.ceil(total / PAGE_SIZE));
      setTotalPages(tp);
    } catch (err) {
      toast.error(err?.message || "فشل تحميل معاملات الاستعارة");
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, isAdmin, isIncoming, statusFilter]);

  useEffect(() => {
    fetchTransactions();
    setSearchId("");
  }, [fetchTransactions, currentTab, statusFilter]);

  const handleStudentSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) {
      toast.error("يرجى إدخال رقم المعاملة للبحث");
      return;
    }

    setLoading(true);
    setStudentTx(null);
    try {
      const res = await borrowingTransactionsApi.getById(searchId.trim());
      if (res) {
        setStudentTx(res);
      } else {
        toast.error(
          "لم يتم العثور على معاملة بهذا الرقم، أو لا تملك صلاحية الوصول لها.",
        );
      }
    } catch (err) {
      setStudentTx(null);
      toast.error(err?.message || "لم يتم العثور على المعاملة");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, actionFn, successMsg, isReturnAction = false) => {
    if (isReturnAction) {
      // For return, we need OTP first (sent to lender)
      setProcessingId(id);
      setIsOtpSending(true);
      try {
        await borrowingTransactionsApi.sendReturnOtp(id);
        setOtpTargetId(id);
        setShowOtpModal(true);
        toast.success("تم إرسال رمز التأكيد لصاحب الكتاب");
      } catch (err) {
        toast.error(err?.message || "فشل إرسال رمز التأكيد");
      } finally {
        setIsOtpSending(false);
        setProcessingId(null);
      }
      return;
    }

    setProcessingId(id);
    const t = toast.loading("جاري التنفيذ...");
    try {
      await actionFn(id);
      toast.success(successMsg, { id: t });
      await fetchTransactions();
      if (studentTx) await handleStudentSearch();
      
      // Show the review modal whenever a book is returned (only for lender)
      if (isReturnAction && isIncoming) {
        const fullTx = items.find(item => (item.id ?? item.Id) === id) || studentTx;
        setReviewTx(fullTx);
      }
    } catch (err) {
      toast.error(err?.message || "حدث خطأ أثناء التنفيذ", { id: t });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 4) {
      toast.error("يرجى إدخال رمز صحيح");
      return;
    }

    setIsOtpVerifying(true);
    const t = toast.loading("جاري التحقق من الرمز وإكمال العملية...");
    try {
      await borrowingTransactionsApi.return(otpTargetId, otpValue);
      
      // ✅ If we reached here, the API call was successful
      toast.success("تم تنفيذ العملية بنجاح!", { id: t });
      setShowOtpModal(false);
      setOtpValue("");
      
      // Attempt to refresh list without letting it crash the success experience
      try {
        await fetchTransactions();
        if (studentTx) await handleStudentSearch();
      } catch (refreshErr) {
        console.warn("Refresh failed after success:", refreshErr);
      }
    } catch (err) {
      toast.error(err?.message || "رمز التأكيد غير صحيح أو حدث خطأ في الخادم", { id: t });
    } finally {
      setIsOtpVerifying(false);
    }
  };

  if (!user) {
    return (
      <div
        className="min-h-screen bg-library-paper dark:bg-[#08080a]"
        dir="rtl"
      >
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-9 w-9 animate-spin text-library-accent" />
        </div>
      </div>
    );
  }

  const searchLenderId =
    studentTx?.lenderStudentId ?? studentTx?.LenderStudentId;
  const viewerId = user?.id ?? user?.studentId;
  const searchResultViewerIsLender =
    Boolean(
      studentTx &&
        searchLenderId &&
        viewerId &&
        String(searchLenderId).toLowerCase() ===
          String(viewerId).toLowerCase(),
    );

  // Calculate quick stats from current page items
  const activeCount = items.filter((tx) => {
    const st = String(tx.status ?? tx.state ?? "").toLowerCase();
    return st === "0" || st === "borrowed" || st === "2" || st === "overdue";
  }).length;

  const returnedCount = items.filter((tx) => {
    const st = String(tx.status ?? tx.state ?? "").toLowerCase();
    return st === "1" || st === "returned";
  }).length;

  return (
    <div
      className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500"
      dir="rtl"
    >
      <Navbar />
      <TransactionDetailModal
        tx={detailTx}
        loading={detailLoading}
        onClose={closeTransactionDetail}
      />

      {reviewTx && (
        <ReviewModal 
          tx={reviewTx} 
          onClose={() => setReviewTx(null)} 
        />
      )}

      <main className="relative z-10 pb-12 pt-under-fixed-nav lg:pt-under-fixed-nav-lg">
        <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none overflow-hidden">
          <Aurora />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <header className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-library-accent/10 flex items-center justify-center">
                    <Repeat size={24} className="text-library-accent" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-library-primary dark:text-white">
                      {isAdmin
                        ? "إدارة جميع المعاملات"
                        : "لوحة معاملات الاستعارة"}
                    </h1>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Borrowing & Lending Records
                    </p>
                  </div>
                </div>
                <p className="max-w-xl text-sm font-medium text-library-primary/60 dark:text-gray-400 leading-relaxed">
                  {isAdmin
                    ? "مراقبة وإدارة جميع عمليات تبادل الكتب بين الطلاب وضمان سير العملية بسلاسة."
                    : "تابع حالة الكتب التي استعرتها أو أعرتها لزملائك، وقم بتأكيد الإرجاع بضغطة واحدة."}
                </p>
              </motion.div>

              {!isAdmin && (
                <div className="flex p-1.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-library-primary/10 dark:border-white/10 backdrop-blur-xl">
                  <button
                    onClick={() => navigate("/lending/transactions/out")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentTab === "out" ? "bg-library-primary text-white shadow-lg" : "text-library-primary/60 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5"}`}
                  >
                    المعاملات الصادرة (استعاراتي)
                  </button>
                  <button
                    onClick={() => navigate("/lending/transactions/in")}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentTab === "in" ? "bg-library-primary text-white shadow-lg" : "text-library-primary/60 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5"}`}
                  >
                    المعاملات الواردة (كتبي)
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#121214]/70 border border-library-primary/5 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  إجمالي المعاملات
                </p>
                <p className="text-2xl font-black text-library-primary dark:text-white">
                  {items.length}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 shadow-sm">
                <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest mb-1">
                  نشطة حالياً
                </p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {activeCount}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 shadow-sm">
                <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-1">
                  تم إرجاعها
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {returnedCount}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-orange-500/5 border border-orange-500/10 shadow-sm">
                <p className="text-[10px] font-black text-orange-600/60 dark:text-orange-400/60 uppercase tracking-widest mb-1">
                  متأخرة
                </p>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {
                    items.filter(
                      (x) =>
                        (x.status ?? x.state) === "Overdue" ||
                        (x.status ?? x.state) === 2,
                    ).length
                  }
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* List View Section */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                <h2 className="text-sm font-black text-library-primary dark:text-white flex items-center gap-2">
                  <ListChecks size={18} className="text-library-accent" />
                  قائمة المعاملات {isIncoming ? "(كتبي)" : "(استعاراتي)"}
                </h2>
                
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {statusChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setStatusFilter(chip.id)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap border ${
                        statusFilter === chip.id
                          ? "bg-library-primary text-white border-library-primary shadow-md"
                          : "bg-white dark:bg-white/5 text-gray-500 border-gray-100 dark:border-white/5 hover:border-library-accent/30"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                  <button
                    onClick={fetchTransactions}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 ml-2"
                  >
                    <RefreshCcw
                      size={14}
                      className={loading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-3xl bg-white/50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-library-accent" />
                  <p className="text-sm font-bold text-gray-400 animate-pulse">
                    جاري استرجاع السجلات…
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-library-primary/10 py-24 text-center dark:border-white/5 bg-white/30 dark:bg-white/[0.02]">
                  <div className="mx-auto w-20 h-20 bg-library-primary/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ListChecks className="h-10 w-10 text-library-primary/20 dark:text-gray-600" />
                  </div>
                  <p className="text-lg font-black text-library-primary/40 dark:text-gray-500">
                    لا توجد معاملات في هذه القائمة حالياً
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((tx) => (
                    <TransactionCard
                      key={tx.id || tx.Id}
                      tx={tx}
                      isProcessing={processingId}
                      isAdminView={isAdmin}
                      isIncoming={isIncoming}
                      onShowDetail={openTransactionDetail}
                      onReturn={(id) =>
                        handleAction(
                          id,
                          null, // OTP flow handles the actual call
                          "تم تسجيل إرجاع الكتاب بنجاح",
                          true
                        )
                      }
                      onLost={(id) =>
                        handleAction(
                          id,
                          borrowingTransactionsApi.markLost,
                          "تم الإبلاغ عن فقدان الكتاب"
                        )
                      }
                      onRate={(txData) => setReviewTx(txData)}
                    />
                  ))}
                </ul>
              )}
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                disabled={loading}
              />
            </div>

            {/* Side Tools Section */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Search Utility */}
              <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#121214]/70 border border-library-primary/10 dark:border-white/10 shadow-sm backdrop-blur-md sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Search
                      size={16}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h3 className="text-sm font-black text-library-primary dark:text-white">
                    بحث سريع بالرقم
                  </h3>
                </div>

                <form onSubmit={handleStudentSearch} className="space-y-4">
                  <div className="relative">
                    <Hash
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="أدخل رقم المعاملة..."
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3.5 pl-4 pr-11 text-xs font-bold text-library-primary shadow-inner outline-none transition-all focus:border-library-accent focus:bg-white dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:border-library-accent"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-2xl bg-library-primary py-3.5 text-xs font-black text-white shadow-lg shadow-library-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "ابدأ البحث"
                    )}
                  </button>
                </form>

                <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                  <div className="flex gap-2 mb-2">
                    <AlertCircle
                      size={14}
                      className="text-amber-600 shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                      تنبيه هام
                    </p>
                  </div>
                  <p className="text-[11px] font-bold text-amber-800/70 dark:text-amber-200/60 leading-relaxed">
                    رقم المعاملة هو الكود الفريد الذي يصلك بعد استلام الكتاب.
                    استخدمه هنا للبحث السريع أو الإبلاغ عن الحالة.
                  </p>
                </div>

                <AnimatePresence>
                  {studentTx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-8 pt-8 border-t border-library-primary/5 dark:border-white/5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-library-primary dark:text-white">
                          نتيجة البحث الحالية:
                        </h4>
                        <button
                          onClick={() => setStudentTx(null)}
                          className="text-[10px] font-bold text-rose-500"
                        >
                          مسح
                        </button>
                      </div>
                      <TransactionCard
                        tx={studentTx}
                        isProcessing={processingId}
                        isAdminView={isAdmin}
                        isIncoming={searchResultViewerIsLender}
                        onShowDetail={openTransactionDetail}
                        onReturn={(id) =>
                          handleAction(
                            id,
                            null, // OTP flow handles the actual call
                            "تم تسجيل إرجاع الكتاب بنجاح",
                            true
                          )
                        }
                        onLost={(id) =>
                          handleAction(
                            id,
                            borrowingTransactionsApi.markLost,
                            "تم الإبلاغ عن فقدان الكتاب"
                          )
                        }
                        onRate={(txData) => setReviewTx(txData)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl dark:bg-[#121214] border border-white/10"
              dir="rtl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-library-primary" />
              
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute top-6 left-6 text-gray-400 hover:text-library-primary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 relative">
                  <ShieldCheck size={40} className="text-emerald-600" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-emerald-500/5 rounded-3xl"
                  />
                </div>
                <h3 className="text-2xl font-black text-library-primary dark:text-white">تأكيد الإرجاع</h3>
                <p className="mt-2 text-sm font-bold text-gray-500 leading-relaxed">
                  تم إرسال رمز التأكيد إلى صاحب الكتاب. يرجى الحصول على الرمز منه لتأكيد عملية الإرجاع.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <KeyRound size={18} className="text-gray-400" />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    maxLength={10}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="أدخل رمز الـ OTP هنا..."
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 pl-4 pr-12 text-center text-xl font-black tracking-[0.5em] outline-none transition-all focus:border-emerald-500 focus:bg-white dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isOtpVerifying || !otpValue}
                    className="flex-1 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {isOtpVerifying ? (
                      <Loader2 className="mx-auto animate-spin" size={20} />
                    ) : (
                      "تحقق وإكمال الإرجاع"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 rounded-2xl bg-gray-100 py-4 text-sm font-black text-gray-500 transition-all hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400"
                  >
                    إلغاء
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                نظام حماية التبادل الآمن
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BorrowingTransactions;
