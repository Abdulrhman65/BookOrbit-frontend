/**
 * MyCopies — /my-copies
 * APIs:
 *   GET  /students/{studentId}/books/copies
 *   POST /students/me/books/{bookId}/copies
 *   POST /students/me/books/copies/{bookCopyId}/list?borrowingDurationInDays=...
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  BookOpen,
  Layers,
  Loader2,
  Plus,
  Hash,
  Sparkles,
  Share2,
  X,
  ChevronDown,
  Check,
  Inbox,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { bookCopiesApi, lendingApi } from "../services/api";
import { showReadableAccessErrorToast } from "../utils/accessMessages";
import { API_BASE_URL, getBookImageUrl, tokenStore, BOOK_COPY_CONDITION_LABELS, BOOK_COPY_STATE_LABELS, getLabel } from "../utils/constants";

const CONDITION_OPTIONS = Object.entries(BOOK_COPY_CONDITION_LABELS)
  .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys to avoid duplicates
  .map(([key, label], index) => ({ value: index, label, key }));

const LENDING_DAYS_PRESETS = [7, 14, 21, 30];
const CONDITION_KEY_TO_VALUE = {
  new: 0,
  likenew: 1,
  verygood: 1,
  acceptable: 2,
  poor: 3,
  worn: 3,
};
const toApiAssetUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      const base = new URL(API_BASE_URL);
      return `${base.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return raw;
  } catch {
    return raw;
  }
};

/** Custom condition picker — native `<select>` cannot style the open menu. */
const ConditionDropdown = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedLabel =
    CONDITION_OPTIONS.find((o) => o.value === value)?.label ?? "اختر الحالة";

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative z-[60]" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        id="condition-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="condition-dropdown-list"
        onClick={() => !disabled && setOpen((v) => !v)}
        className="w-full min-h-[46px] flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg py-3 ps-4 pe-3 text-sm font-black text-library-primary dark:text-white shadow-sm transition-all duration-200 hover:border-library-primary/35 hover:shadow-md dark:hover:border-library-accent/30 focus:outline-none focus:ring-2 focus:ring-library-primary/25 focus:border-library-primary/40 disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="truncate text-start">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-library-primary/45 dark:text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="condition-dropdown-list"
            role="listbox"
            aria-labelledby="condition-dropdown-trigger"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 bg-white/95 dark:bg-dark-surface/98 backdrop-blur-xl py-1 shadow-xl shadow-black/10 dark:shadow-black/40 ring-1 ring-library-primary/5 dark:ring-white/5"
          >
            {CONDITION_OPTIONS.map((o) => {
              const isSelected = value === o.value;
              return (
                <li key={o.value} role="presentation" className="px-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-start text-sm font-black transition-colors ${
                      isSelected
                        ? "bg-library-primary/10 text-library-primary dark:bg-library-accent/15 dark:text-library-accent"
                        : "text-library-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{o.label}</span>
                    {isSelected ? (
                      <Check className="w-4 h-4 shrink-0 text-library-accent" strokeWidth={2.5} />
                    ) : (
                      <span className="w-4 h-4 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

const normalizeCopy = (row = {}) => {
  const id = row.Id ?? row.id;
  const bookId = row.BookId ?? row.bookId ?? row.book?.Id ?? row.book?.id;
  const book = row.book ?? row.Book ?? {};
  const title =
    book.title ||
    book.Title ||
    row.bookTitle ||
    row.BookTitle ||
    row.title ||
    "كتاب";
  const author =
    book.author ||
    book.Author ||
    row.authorName ||
    row.AuthorName ||
    "";
  const conditionRaw = row.condition ?? row.Condition;
  const normalizedCondition =
    typeof conditionRaw === "number"
      ? conditionRaw
      : CONDITION_KEY_TO_VALUE[String(conditionRaw ?? "").toLowerCase()] ?? null;
  const state = row.state ?? row.State;
  const isOnLendingList =
    row.isOnLendingList ??
    row.IsOnLendingList ??
    row.IsListed ??
    row.isListed ??
    row.onLendingList ??
    Boolean(row.lendingListRecordId || row.LendingListRecordId);
  return {
    ...row,
    id,
    bookId,
    title,
    author,
    condition: normalizedCondition,
    state,
    isOnLendingList: Boolean(isOnLendingList),
    bookCoverImageUrl: toApiAssetUrl(
      book.bookCoverImageUrl || 
      book.BookCoverImageUrl || 
      row.bookCoverImageUrl || 
      row.BookCoverImageUrl || 
      (bookId ? getBookImageUrl(bookId) : "")
    ),
  };
};

const CopyCard = ({ copy, imageSrc, onList, onToggleAvailability, onViewDetails, togglingId, detailsLoadingId }) => {
  const condLabel = getLabel(BOOK_COPY_CONDITION_LABELS, copy.condition);
  const listed = Boolean(copy.isOnLendingList);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-library-primary/20 hover:shadow-lg hover:shadow-library-primary/10 dark:border-white/10 dark:bg-dark-surface/90 dark:hover:border-library-accent/25"
    >
      <div className="w-full sm:w-32 h-44 sm:h-auto sm:min-h-[160px] bg-gradient-to-br from-library-primary/10 to-library-accent/10 dark:from-white/5 dark:to-white/[0.02] relative shrink-0 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-library-primary/20 dark:text-white/15 transition-transform duration-300 group-hover:scale-110">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
      </div>
      <div className="flex-grow p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
        <div>
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-base font-black text-library-primary dark:text-white line-clamp-1 group-hover:text-library-accent transition-colors">
              {copy.title}
            </h3>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${
              listed
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            }`}>
              {listed ? "معروضة" : "غير معروضة"}
            </span>
          </div>
          {copy.author ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate">
              {copy.author}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-200/80 bg-gray-50/80 px-2.5 py-2 text-[10px] font-black text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
              الحالة
              <p className="mt-1 text-[11px] text-library-primary dark:text-white">{condLabel}</p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-gray-50/80 px-2.5 py-2 text-[10px] font-black text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
              رقم النسخة
              <p className="mt-1 text-[11px] text-library-primary dark:text-white">#{copy.id ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-between border-t border-gray-100 pt-3 dark:border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
            <Hash size={12} />
            <span>نسخة: {copy.id}</span>
            {copy.bookId ? (
              <>
                <span className="opacity-30">·</span>
                <span>كتاب: {copy.bookId}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {copy.bookId ? (
              <Link
                to={`/catalog/${copy.bookId}`}
                className="text-xs font-black text-library-accent hover:text-library-primary dark:hover:text-white underline-offset-4 hover:underline transition-colors"
              >
                تفاصيل الكتاب
              </Link>
            ) : null}
            {!listed && copy.id ? (
              <button
                type="button"
                onClick={() => onList(copy)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-library-primary text-white text-xs font-black shadow-md shadow-library-primary/15 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-library-primary/25 active:scale-[0.98]"
              >
                <Share2 size={14} className="transition-transform group-hover:-translate-x-0.5" />
                عرض للإعارة
              </button>
            ) : null}
            {copy.id ? (
              <button
                type="button"
                onClick={() => onToggleAvailability(copy)}
                disabled={togglingId === copy.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 disabled:opacity-50"
              >
                {togglingId === copy.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : copy.state === 1 || String(copy.state).toLowerCase() === "available" ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
                {copy.state === 1 || String(copy.state).toLowerCase() === "available" ? "إخفاء النسخة" : "إتاحة النسخة"}
              </button>
            ) : null}
            {copy.id ? (
              <button
                type="button"
                onClick={() => onViewDetails(copy.id)}
                disabled={detailsLoadingId === copy.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-library-primary/20 bg-library-primary/5 text-xs font-black text-library-primary transition-all duration-200 hover:bg-library-primary hover:text-white disabled:opacity-50"
              >
                {detailsLoadingId === copy.id ? <Loader2 size={14} className="animate-spin" /> : <Info size={14} />}
                تفاصيل النسخة
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MyCopies = () => {
  const { user } = useAuth();
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageMap, setImageMap] = useState({});
  const imageFetchStarted = useRef(new Set());
  const blobUrlsRef = useRef(new Set());

  const [newBookId, setNewBookId] = useState("");
  const [newCondition, setNewCondition] = useState(2);
  const [creating, setCreating] = useState(false);

  const [listModalCopy, setListModalCopy] = useState(null);
  const [lendingDays, setLendingDays] = useState(14);
  const [listSubmitting, setListSubmitting] = useState(false);
  const [togglingAvailabilityId, setTogglingAvailabilityId] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [selectedCopyDetails, setSelectedCopyDetails] = useState(null);

  const studentId = user?.studentId || user?.id;
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const fetchCopies = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await bookCopiesApi.getByStudentId(studentId, {
        page: 1,
        pageSize: 50,
        _t: Date.now(),
      });
      const raw = res?.items || res?.data || res || [];
      const list = Array.isArray(raw) ? raw.map(normalizeCopy) : [];
      const listedStatusByCopyId = new Map();

      await Promise.all(
        list.map(async (copy) => {
          if (!copy?.id) return;
          try {
            const lendingRes = await lendingApi.getAll({
              bookCopyId: copy.id,
              page: 1,
              pageSize: 20,
              states: "available",
            });
            const rows = Array.isArray(lendingRes?.items)
              ? lendingRes.items
              : Array.isArray(lendingRes?.data)
                ? lendingRes.data
                : [];
            const hasActiveRecord = rows.some((record) => {
              const recordCopyId = record?.bookCopyId ?? record?.BookCopyId;
              const state = String(record?.state ?? record?.State ?? "").toLowerCase();
              return String(recordCopyId ?? "") === String(copy.id) && state === "available";
            });
            listedStatusByCopyId.set(copy.id, hasActiveRecord);
          } catch {
            listedStatusByCopyId.set(copy.id, Boolean(copy.isOnLendingList));
          }
        })
      );

      setCopies(
        list.map((copy) => ({
          ...copy,
          isOnLendingList: listedStatusByCopyId.has(copy.id)
            ? listedStatusByCopyId.get(copy.id)
            : copy.isOnLendingList,
        }))
      );
    } catch (e) {
      console.error(e);
      showReadableAccessErrorToast(e, user, "تعذر تحميل نسخك. حاول مرة أخرى.");
      setCopies([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]); // user is only used in error toast — not needed as a dependency

  const fetchBookImage = useCallback(async (bookId) => {
    if (!bookId || imageFetchStarted.current.has(bookId)) return;
    imageFetchStarted.current.add(bookId);
    const { accessToken } = tokenStore.get();
    if (!accessToken) return;
    const url = getBookImageUrl(bookId);
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (!blob.size) return;
      const objectUrl = URL.createObjectURL(blob);
      blobUrlsRef.current.add(objectUrl);
      setImageMap((prev) => ({ ...prev, [bookId]: objectUrl }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    imageFetchStarted.current.clear();
    fetchCopies();
  }, [fetchCopies]);

  useEffect(() => {
    const urls = blobUrlsRef;
    return () => {
      const set = urls.current;
      set.forEach((u) => URL.revokeObjectURL(u));
      set.clear();
    };
  }, []);

  useEffect(() => {
    copies.forEach((c) => {
      if (c.bookId && !c.bookCoverImageUrl) fetchBookImage(c.bookId);
    });
  }, [copies, fetchBookImage]);

  const handleAddCopy = async (e) => {
    e.preventDefault();
    const id = parseInt(newBookId, 10);
    if (Number.isNaN(id) || id < 1) {
      toast.error("أدخل رقم كتاب صحيح (معرّف الكتاب في المنصة).");
      return;
    }
    setCreating(true);
    const t = toast.loading("جاري إضافة النسخة…");
    try {
      await bookCopiesApi.create(id, newCondition);
      toast.success("تمت إضافة النسخة بنجاح", { id: t });
      setNewBookId("");
      await fetchCopies();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "فشل إضافة النسخة", { id: t });
    } finally {
      setCreating(false);
    }
  };

  const handleListForLending = async () => {
    if (!listModalCopy?.id) return;
    setListSubmitting(true);
    const t = toast.loading("جاري إضافة النسخة لقائمة الإعارة…");
    try {
      await bookCopiesApi.listForLending(listModalCopy.id, lendingDays);
      setCopies((prev) =>
        prev.map((copy) =>
          copy.id === listModalCopy.id
            ? { ...copy, isOnLendingList: true, isListed: true }
            : copy
        )
      );
      toast.success("تم عرض النسخة للإعارة", { id: t });
      setListModalCopy(null);
      await fetchCopies();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر الإدراج في قائمة الإعارة", { id: t });
    } finally {
      setListSubmitting(false);
    }
  };

  const handleToggleAvailability = async (copy) => {
    if (!copy?.id) return;
    setTogglingAvailabilityId(copy.id);
    const t = toast.loading("جاري تحديث حالة النسخة...");
    try {
      const isAvailable = copy.state === 1 || String(copy.state).toLowerCase() === "available";
      if (isAvailable) {
        await bookCopiesApi.markUnavailable(copy.id);
      } else {
        await bookCopiesApi.markAvailable(copy.id);
      }
      toast.success("تم تحديث حالة النسخة", { id: t });
      await fetchCopies();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر تحديث الحالة", { id: t });
    } finally {
      setTogglingAvailabilityId(null);
    }
  };

  const handleViewCopyDetails = async (copyId) => {
    setDetailLoadingId(copyId);
    try {
      const details = await bookCopiesApi.getById(copyId);
      setSelectedCopyDetails(details || null);
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر تحميل تفاصيل النسخة");
    } finally {
      setDetailLoadingId(null);
    }
  };

  if (isAdmin) {
    return (
      <div
        className="min-h-screen bg-library-paper dark:bg-dark-bg pt-under-fixed-nav lg:pt-under-fixed-nav-lg pb-12"
        dir="rtl"
      >
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-library-primary dark:text-white font-black text-lg mb-2">
            إدارة نسخ الطلاب تتم من لوحة الإدارة.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center mt-4 px-5 py-2.5 rounded-xl bg-library-primary/10 text-library-primary dark:text-library-accent font-black text-sm border border-library-primary/15 hover:bg-library-primary/15 hover:border-library-accent/30 transition-all duration-200"
          >
            الانتقال إلى لوحة الإدارة
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-library-paper dark:bg-dark-bg">
        <Loader2 className="w-8 h-8 animate-spin text-library-accent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-library-paper dark:bg-dark-bg pt-under-fixed-nav lg:pt-under-fixed-nav-lg pb-12"
      dir="rtl"
    >
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl bg-white/75 dark:bg-dark-surface/75 border border-white dark:border-white/5 p-5 sm:p-7 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-library-primary/10 dark:hover:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black bg-library-accent/10 text-library-accent border border-library-accent/20 mb-3 transition-colors duration-200 hover:bg-library-accent/15">
                <Layers size={12} className="shrink-0" />
                مكتبتك
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-library-primary dark:text-white tracking-tight">
                نسخي
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-2 max-w-xl">
                أضف نسخ الكتب التي تملكها، واعرضها للإعارة لزملائك — كل شيء من مكان
                واحد.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/lending/incoming"
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 text-library-primary dark:text-white text-sm font-black shadow-sm border border-library-primary/10 dark:border-white/10 transition-all duration-200 shrink-0 hover:bg-library-accent/10 hover:border-library-accent/30 hover:text-library-accent hover:-translate-y-0.5"
              >
                <Inbox size={18} className="transition-transform duration-300 group-hover:scale-110 group-hover:text-library-accent" />
                الطلبات الواردة
              </Link>
              <Link
                to="/addbook"
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-library-primary text-white text-sm font-black shadow-md shadow-library-primary/20 transition-all duration-200 shrink-0 hover:shadow-lg hover:shadow-library-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                إضافة كتاب للكتالوج
              </Link>
            </div>
          </div>
        </header>

        {/* Add copy */}
        <section className="mb-8">
          <div className="relative z-30 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl rounded-2xl border border-white dark:border-white/5 p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-library-primary/15 dark:hover:border-library-accent/20">
            <h2 className="text-sm font-black text-library-primary dark:text-white mb-4 flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-library-accent/10 text-library-accent">
                <Sparkles size={16} />
              </span>
              إضافة نسخة لكتاب مسجّل
            </h2>
            <form
              onSubmit={handleAddCopy}
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
            >
              <div className="flex-grow min-w-0">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                  معرّف الكتاب
                </label>
                <input
                  type="number"
                  min={1}
                  value={newBookId}
                  onChange={(e) => setNewBookId(e.target.value)}
                  placeholder="مثال: 12"
                  className="w-full bg-white dark:bg-dark-bg border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-library-primary dark:text-white transition-all duration-200 hover:border-library-primary/25 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-library-primary/25"
                />
              </div>
              <div className="w-full sm:w-52 min-w-0">
                <label
                  htmlFor="condition-dropdown-trigger"
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5"
                >
                  حالة النسخة
                </label>
                <ConditionDropdown
                  value={newCondition}
                  onChange={setNewCondition}
                  disabled={creating}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black shadow-md shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {creating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}
                إضافة النسخة
              </button>
            </form>
            <p className="text-[11px] text-gray-400 font-bold mt-3">
              استخدم رقم الكتاب كما يظهر في صفحة الكتاب أو في الكتالوج. إذا كان
              الكتاب غير مضاف بعد،{" "}
              <Link
                to="/addbook"
                className="text-library-accent font-black underline-offset-2 hover:underline transition-colors"
              >
                أضفه أولاً
              </Link>
              .
            </p>
          </div>
        </section>

        {/* List */}
        <section>
          <h2 className="text-sm font-black text-library-primary dark:text-white mb-4 flex items-center gap-3">
            <span
              className="inline-block h-1 w-10 rounded-full bg-gradient-to-l from-library-accent to-library-primary/30 shrink-0"
              aria-hidden
            />
            نسخك ({copies.length})
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-library-accent mb-3" />
              <p className="text-xs font-bold text-gray-400">جاري التحميل…</p>
            </div>
          ) : copies.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] transition-all duration-300 hover:border-library-accent/25 hover:bg-white/70 dark:hover:bg-white/[0.04]">
              <BookOpen
                className="mx-auto text-gray-300 dark:text-white/20 mb-3 transition-transform duration-300 hover:scale-110"
                size={48}
              />
              <p className="text-library-primary dark:text-white font-black mb-1">
                لا توجد نسخ بعد
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-sm mx-auto">
                عندما تضيف نسخة لكتابك المسجّل، ستظهر هنا مع إمكانية عرضها للإعارة.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {copies.map((copy) => (
                <CopyCard
                  key={copy.id}
                  copy={copy}
                  imageSrc={
                    copy.bookCoverImageUrl || imageMap[copy.bookId] || null
                  }
                  onList={(c) => setListModalCopy(c)}
                  onToggleAvailability={handleToggleAvailability}
                  onViewDetails={handleViewCopyDetails}
                  togglingId={togglingAvailabilityId}
                  detailsLoadingId={detailLoadingId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {listModalCopy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => !listSubmitting && setListModalCopy(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-white/10 shadow-2xl shadow-library-primary/5 p-6"
            >
              <button
                type="button"
                onClick={() => setListModalCopy(null)}
                className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
                disabled={listSubmitting}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-black text-library-primary dark:text-white pr-8">
                عرض للإعارة
              </h3>
              <p className="text-sm text-gray-500 font-bold mt-1 mb-4">
                {listModalCopy.title}
              </p>
              <p className="text-xs font-bold text-gray-400 mb-2">
                مدة الإعارة بالأيام
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {LENDING_DAYS_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLendingDays(d)}
                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all duration-200 ${
                      lendingDays === d
                        ? "bg-library-primary text-white border-library-primary shadow-md"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-library-primary/35 hover:bg-library-primary/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {d} يوم
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={7}
                max={30}
                value={lendingDays}
                onChange={(e) =>
                  setLendingDays(Math.max(7, Math.min(30, parseInt(e.target.value, 10) || 7)))
                }
                className="w-full mb-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:border-library-primary/30 focus:outline-none focus:ring-2 focus:ring-library-primary/20"
              />
              <button
                type="button"
                onClick={handleListForLending}
                disabled={listSubmitting}
                className="w-full py-3 rounded-xl bg-library-primary text-white text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-library-primary/20 transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:hover:brightness-100"
              >
                {listSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Share2 size={18} />
                )}
                تأكيد العرض
              </button>
            </motion.div>
          </motion.div>
        )}
        {selectedCopyDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedCopyDetails(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#121214] border border-gray-100 dark:border-white/10 shadow-2xl p-6"
            >
              <h3 className="text-lg font-black text-library-primary dark:text-white mb-3">تفاصيل النسخة</h3>
              <div className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                <p>رقم النسخة: <span className="font-mono">#{selectedCopyDetails.id || selectedCopyDetails.Id}</span></p>
                <p>رقم الكتاب: <span className="font-mono">#{selectedCopyDetails.bookId || selectedCopyDetails.BookId}</span></p>
                <p>الحالة: <span className="font-bold">{getLabel(BOOK_COPY_STATE_LABELS, selectedCopyDetails.state ?? selectedCopyDetails.State)}</span></p>
                <p>الحالة الفيزيائية: <span className="font-bold">{getLabel(BOOK_COPY_CONDITION_LABELS, selectedCopyDetails.condition ?? selectedCopyDetails.Condition)}</span></p>
                <p>معروضة للإعارة: <span className="font-bold">{Boolean(selectedCopyDetails.isListed ?? selectedCopyDetails.isOnLendingList ?? false) ? "نعم" : "لا"}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCopyDetails(null)}
                className="mt-4 w-full py-3 rounded-xl bg-library-primary text-white text-sm font-black"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCopies;
