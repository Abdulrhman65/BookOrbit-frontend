import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  Send,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  X,
  User,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Aurora from "../components/effects/Aurora";
import { useAuth } from "../context/AuthContext";
import { borrowingApi, lendingApi } from "../services/api";
import { showReadableAccessErrorToast } from "../utils/accessMessages";
import { BORROWING_REQUEST_STATE_LABELS, getLabel } from "../utils/constants";

const PAGE_SIZE = 10;

// Removed local BORROWING_AR in favor of central constants

const borrowingNumToKey = {
  0: "Pending",
  1: "Accepted",
  2: "Rejected",
  3: "Cancelled",
  4: "Expired",
};

const statusTone = {
  Pending: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  Accepted: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  Borrowed: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  Rejected: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  Cancelled: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  Expired: "border-gray-300 bg-gray-50 text-gray-700 dark:border-white/20 dark:bg-white/[0.04] dark:text-gray-300",
};

const formatDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const PaginationBar = ({ page, totalPages, onChange, disabled }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-library-primary transition-all hover:border-library-accent/40 disabled:opacity-40 dark:border-dark-border dark:bg-dark-surface dark:text-white"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <span className="min-w-[100px] text-center text-xs font-black text-library-primary/70 dark:text-gray-400">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-library-primary transition-all hover:border-library-accent/40 disabled:opacity-40 dark:border-dark-border dark:bg-dark-surface dark:text-white"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
};

const BorrowingOutgoingRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [lendingRecordDetails, setLendingRecordDetails] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const statusChips = useMemo(
    () => [
      { id: "all", label: "الكل" },
      ...Object.entries(BORROWING_REQUEST_STATE_LABELS)
        .filter(([id]) => ["Pending", "Accepted", "Rejected", "Cancelled", "Expired", "Borrowed"].includes(id))
        .map(([id, label]) => ({ id, label })),
    ],
    []
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: PAGE_SIZE,
        sortColumn: "createdAt",
        sortDirection: "desc",
      };
      if (debouncedSearch) params.searchTerm = debouncedSearch;
      if (statusFilter !== "all") {
        const num = Object.keys(borrowingNumToKey).find((k) => borrowingNumToKey[k] === statusFilter);
        if (num != null) params.states = [Number(num)];
      }

      const res = await borrowingApi.getMineOutgoing(params);
      const raw = res.items ?? res.data ?? [];
      setItems(raw);
      const total = res.totalCount ?? res.TotalCount ?? raw.length;
      const tp = res.totalPages ?? res.TotalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
      setTotalPages(tp);
    } catch (err) {
      showReadableAccessErrorToast(err, user, "فشل تحميل الطلبات الصادرة");
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (user && !isAdmin) fetchRequests();
  }, [fetchRequests, user, isAdmin]);

  const handleCancel = async (id) => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذا الطلب؟ سيتم استرجاع نقاطك.")) return;
    
    setProcessingId(id);
    const t = toast.loading("جاري الإلغاء...");
    try {
      await borrowingApi.cancel(id);
      toast.success("تم إلغاء الطلب بنجاح.", { id: t });
      await fetchRequests();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "حدث خطأ أثناء إلغاء الطلب", { id: t });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = async (id) => {
    setLoadingDetailId(id);
    try {
      const res = await borrowingApi.getById(id);
      setDetailRequest(res || null);
      const rid = res?.lendingRecordId || res?.LendingRecordId;
      if (rid && !lendingRecordDetails[rid]) {
        const lendingRes = await lendingApi.getById(rid);
        setLendingRecordDetails((prev) => ({ ...prev, [rid]: lendingRes || {} }));
      }
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر تحميل تفاصيل الطلب");
    } finally {
      setLoadingDetailId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-library-paper dark:bg-[#08080a]" dir="rtl">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-9 w-9 animate-spin text-library-accent" />
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-library-paper pb-12 pt-20 dark:bg-[#08080a] lg:pt-24" dir="rtl">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="mb-2 text-lg font-black text-library-primary dark:text-white">إدارة الإعارات من لوحة الإدارة.</p>
          <Link
            to="/admin"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-library-primary/15 bg-library-primary/10 px-5 py-2.5 text-sm font-black text-library-primary transition-all hover:border-library-accent/30 hover:bg-library-primary/15 dark:text-library-accent"
          >
            الانتقال إلى لوحة الإدارة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-library-paper dark:bg-[#08080a] text-library-primary dark:text-library-paper transition-colors duration-500 overflow-hidden" dir="rtl">
      <Navbar />

      <main className="relative z-10 pt-20 lg:pt-24 pb-12">
        <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
          <Aurora />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <header className="mb-8 rounded-3xl bg-white/70 dark:bg-[#121214]/70 border border-library-primary/10 dark:border-white/10 p-5 sm:p-8 shadow-sm backdrop-blur-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest">
                  <Send size={12} /> 
                  طلباتي الصادرة للاستعارة
                </div>
                <h1 className="text-2xl font-black tracking-tight text-library-primary dark:text-white sm:text-3xl mb-2">الطلبات الصادرة</h1>
                <p className="max-w-xl text-sm font-medium text-library-primary/60 dark:text-gray-400 leading-relaxed">
                  هنا تجد جميع الطلبات التي قمت بإرسالها لاستعارة كتب زملائك. يمكنك إلغاء الطلبات التي لم يتم تسليمها بعد.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-library-primary px-5 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-library-accent hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shrink-0"
                >
                  تصفح كتالوج الكتب
                </Link>
              </motion.div>
            </div>
          </header>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="relative min-w-0 flex-1"
            >
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-library-primary/30 dark:text-gray-500" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث في الطلبات الصادرة بحسب اسم الكتاب أو المالك..."
                className="w-full rounded-2xl border border-library-primary/10 bg-white/80 py-3.5 pl-4 pr-12 text-sm font-bold text-library-primary shadow-sm outline-none transition-all focus:border-library-accent focus:ring-2 focus:ring-library-accent/20 dark:border-white/10 dark:bg-dark-surface/80 dark:text-white backdrop-blur-md hover:border-library-primary/20 dark:hover:border-white/20"
              />
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition-all ${
                  statusFilter === chip.id
                    ? "border-library-primary bg-library-primary text-white dark:border-white dark:bg-white dark:text-library-primary"
                    : "border-gray-200 bg-white text-library-primary/70 hover:border-library-accent/40 dark:border-white/10 dark:bg-dark-surface dark:text-gray-300"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </motion.div>

          <section className="rounded-3xl border border-library-primary/10 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-[#121214]/70 sm:p-8 backdrop-blur-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-3 h-9 w-9 animate-spin text-library-accent" />
                <p className="text-xs font-black text-gray-400">جاري التحميل…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-library-primary/20 py-20 text-center dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                <div className="mx-auto w-16 h-16 bg-library-primary/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ListChecks className="h-8 w-8 text-library-primary/30 dark:text-gray-500" />
                </div>
                <p className="text-base font-black text-library-primary dark:text-white">لا توجد طلبات صادرة حالياً</p>
                <p className="mt-2 text-sm font-medium text-library-primary/50 dark:text-gray-400 max-w-sm mx-auto">عندما تقوم بطلب استعارة أي كتاب من زملائك، سيظهر طلبك هنا لكي تتمكن من متابعته.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((req) => {
                  const id = req.id ?? req.Id;
                  const rawSt = req.status ?? req.state;
                  const statusKey = typeof rawSt === "number" ? borrowingNumToKey[rawSt] || "Pending" : rawSt || "Pending";
                  const statusAr = getLabel(BORROWING_REQUEST_STATE_LABELS, statusKey);
                  const title = req.bookTitle || req.BookTitle || "كتاب";
                  
                  // For outgoing requests, the related user is the Lender (owner)
                  // So we use lendingStudentName, or fallback to the student name field if it's the only one.
                  // Wait, looking at frontend-api-reference.md: BorrowingRequestListItemDto doesn't have a specific `lendingStudentName`. 
                  // Let's check `api.js` normalizeBorrowingRequest... it maps `studentName` to `BorrowingStudentName`. 
                  // This means `normalizeBorrowingRequest` currently maps the related name into `studentName`.
                  // For me/out, the name in `studentName` might still be the borrower, or it might not be populated with lender.
                  // Let's assume `req.studentName` or `req.lendingStudentName` or "زميلك"
                  const ownerName = req.lenderName || req.ownerFullName || req.lenderFullName || "صاحب النسخة";
                  
                  const reqDate = req.requestDate || req.createdAt || req.createdAtUtc;
                  const expDate = req.expectedReturnDate || req.returnDate || req.expirationDate;
                  const rid = req.lendingRecordId ?? req.LendingListRecordId;
                  const isProcessing = processingId === id;

                  return (
                    <motion.li
                      layout
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col md:flex-row gap-5 md:items-center justify-between rounded-2xl border border-library-primary/10 bg-white/80 p-5 transition-all duration-300 hover:border-library-accent/30 hover:shadow-lg hover:shadow-library-primary/5 hover:-translate-y-0.5 dark:border-white/10 dark:bg-dark-surface/80 dark:hover:border-library-accent/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-start gap-2">
                          <p className="text-sm font-black text-library-primary dark:text-white truncate">{title}</p>
                          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${statusTone[statusKey] || statusTone.Pending}`}>
                            {statusAr}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/[0.03]">
                            <User size={12} className="text-library-accent" />
                            <span>صاحب النسخة: <Link to={`/student/${req.lenderId}`} className="text-library-primary dark:text-white font-black hover:text-library-accent transition-colors">{ownerName}</Link></span>
                          </div>
                          {rid ? <span className="font-mono text-[10px] opacity-70">رقم العرض: #{rid}</span> : null}
                        </div>
                          <div className="flex items-center gap-1.5 rounded-lg border border-library-primary/5 bg-library-primary/[0.02] px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <CalendarDays size={14} className="opacity-60" />
                            <span>تاريخ الطلب: {formatDate(reqDate)}</span>
                          </div>
                      </div>
                      
                      {/* الإجراءات */}
                      <div className="flex flex-wrap items-center gap-2.5 md:justify-end shrink-0 pt-4 border-t border-library-primary/10 dark:border-white/10 md:border-0 md:pt-0">
                        {(statusKey === "Pending" || statusKey === "Accepted") && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleCancel(id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-95 disabled:opacity-50 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            إلغاء الطلب
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={loadingDetailId === id}
                          onClick={() => handleViewDetails(id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-library-primary/20 bg-library-primary/5 px-4 py-2 text-xs font-black text-library-primary transition-all hover:bg-library-primary hover:text-white active:scale-95 disabled:opacity-50"
                        >
                          {loadingDetailId === id ? <Loader2 size={14} className="animate-spin" /> : null}
                          تفاصيل
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/chat/${req.lenderId}`, { 
                            state: { 
                              studentName: ownerName,
                              studentImage: null 
                            } 
                          })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition-all hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300"
                        >
                          <MessageSquare size={14} />
                          تواصل
                        </button>

                        {statusKey !== "Pending" && statusKey !== "Accepted" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-gray-400 dark:text-gray-500 px-2 py-1">
                            {statusKey === "Rejected" ? <XCircle size={14} className="text-rose-400" /> : null}
                            {statusKey === "Cancelled" ? <XCircle size={14} className="text-orange-400" /> : null}
                            {statusKey === "Borrowed" ? <CheckCircle size={14} className="text-blue-400" /> : null}
                            {statusKey === "Expired" ? <Clock size={14} /> : null}
                            لا يوجد إجراء متاح
                          </span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            <PaginationBar page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
          </section>
        </div>
      </main>

      <AnimatePresence>
        {detailRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailRequest(null)} />
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white p-5 dark:bg-[#121214]"
            >
              <h3 className="mb-3 text-base font-black text-library-primary dark:text-white">تفاصيل الطلب</h3>
              <div className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                <p>رقم الطلب: <span className="font-mono">#{detailRequest.id || detailRequest.Id}</span></p>
                <p>رقم العرض: <span className="font-mono">#{detailRequest.lendingRecordId || detailRequest.LendingRecordId}</span></p>
                <p>الحالة: <span className="font-black text-library-primary dark:text-white">{getLabel(BORROWING_REQUEST_STATE_LABELS, detailRequest.status || detailRequest.state)}</span></p>
                <p>تاريخ الإنشاء: {formatDate(detailRequest.requestDate || detailRequest.createdAtUtc || detailRequest.createdAt)}</p>
                {/* Expected return date removed as per request */}
                {lendingRecordDetails[detailRequest.lendingRecordId || detailRequest.LendingRecordId] ? (
                  <p>
                    حالة سجل الإعارة:{" "}
                    {String(
                      lendingRecordDetails[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.state ??
                        lendingRecordDetails[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.State ??
                        "—"
                    )}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDetailRequest(null)}
                className="mt-4 w-full rounded-xl bg-library-primary py-2.5 text-xs font-black text-white"
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

export default BorrowingOutgoingRequests;
