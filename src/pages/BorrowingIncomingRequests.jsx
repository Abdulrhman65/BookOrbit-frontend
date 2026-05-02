import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  Inbox,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Check,
  X,
  Truck,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  KeyRound,
  ShieldCheck
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
  5: "Delivered",
  6: "Returned",
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

const BorrowingIncomingRequests = () => {
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
  const [deliveredIds, setDeliveredIds] = useState(new Set());
  const [detailRequest, setDetailRequest] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [lendingRecordDetails, setLendingRecordDetails] = useState({});
  const [contactInfoByRecord, setContactInfoByRecord] = useState({});
  const [loadingContactRecordId, setLoadingContactRecordId] = useState(null);
  const [closingRecordId, setClosingRecordId] = useState(null);
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTargetId, setOtpTargetId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);

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

      const res = await borrowingApi.getMineIncoming(params);
      const raw = res.items ?? res.data ?? [];
      setItems(raw);
      const total = res.totalCount ?? res.TotalCount ?? raw.length;
      const tp = res.totalPages ?? res.TotalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
      setTotalPages(tp);
    } catch (err) {
      showReadableAccessErrorToast(err, user, "فشل تحميل الطلبات الواردة");
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (user && !isAdmin) fetchRequests();
  }, [fetchRequests, user, isAdmin]);

  const handleAction = async (id, actionFn, successMsg, isDeliver = false) => {
    if (isDeliver) {
      // For delivery, we need OTP first
      setProcessingId(id);
      setIsOtpSending(true);
      try {
        await borrowingApi.sendDeliverOtp(id);
        setOtpTargetId(id);
        setShowOtpModal(true);
        toast.success("تم إرسال رمز التأكيد للمستعير");
      } catch (err) {
        showReadableAccessErrorToast(err, user, "فشل إرسال رمز التأكيد");
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
      await fetchRequests();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "حدث خطأ أثناء التنفيذ", { id: t });
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
    const t = toast.loading("جاري التحقق من الرمز...");
    try {
      await borrowingApi.deliver(otpTargetId, otpValue);
      toast.success("تم تسليم الكتاب بنجاح!", { id: t });
      setShowOtpModal(false);
      setOtpValue("");
      await fetchRequests();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "رمز التأكيد غير صحيح", { id: t });
    } finally {
      setIsOtpVerifying(false);
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

  const handleLoadContactInfo = async (lendingRecordId) => {
    if (!lendingRecordId) return;
    if (contactInfoByRecord[lendingRecordId]) return;
    setLoadingContactRecordId(lendingRecordId);
    try {
      const res = await lendingApi.getContactInfo(lendingRecordId);
      setContactInfoByRecord((prev) => ({ ...prev, [lendingRecordId]: res || {} }));
      toast.success("تم تحميل بيانات التواصل");
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر تحميل بيانات التواصل");
    } finally {
      setLoadingContactRecordId(null);
    }
  };

  const handleCloseListing = async (lendingRecordId) => {
    if (!lendingRecordId) return;
    if (!window.confirm("هل تريد إغلاق هذا العرض ومنع طلبات جديدة عليه؟")) return;
    setClosingRecordId(lendingRecordId);
    const t = toast.loading("جاري إغلاق العرض...");
    try {
      await lendingApi.close(lendingRecordId);
      toast.success("تم إغلاق العرض بنجاح", { id: t });
      await fetchRequests();
    } catch (err) {
      showReadableAccessErrorToast(err, user, "تعذر إغلاق العرض", { id: t });
    } finally {
      setClosingRecordId(null);
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-library-accent/10 border border-library-accent/20 text-[10px] font-bold text-library-accent mb-4 uppercase tracking-widest">
                  <Inbox size={12} /> 
                  طلبات للاستعارة من نسخي
                </div>
                <h1 className="text-2xl font-black tracking-tight text-library-primary dark:text-white sm:text-3xl mb-2">طلبات الاستعارة الواردة</h1>
                <p className="max-w-xl text-sm font-medium text-library-primary/60 dark:text-gray-400 leading-relaxed">
                  هنا تجد الطلبات من زملائك لاستعارة نسخ الكتب التي تعرضها. يمكنك قبول الطلب ثم تسليم الكتاب، أو الرفض.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Link
                  to="/my-copies"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-library-primary px-5 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-library-accent hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shrink-0"
                >
                  إدارة نسخي الخاصة
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
                placeholder="ابحث في الطلبات الواردة بحسب اسم الكتاب أو الطالب..."
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
              <p className="text-base font-black text-library-primary dark:text-white">لا توجد طلبات واردة حالياً</p>
              <p className="mt-2 text-sm font-medium text-library-primary/50 dark:text-gray-400 max-w-sm mx-auto">عندما يطلب أحد زملائك استعارة إحدى نسخك، ستظهر طلباتهم هنا للمراجعة والموافقة.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((req) => {
                const id = req.id ?? req.Id;
                const rawSt = req.status ?? req.state;
                let statusKey = typeof rawSt === "number" ? borrowingNumToKey[rawSt] || "Pending" : rawSt || "Pending";
                if (typeof statusKey === "string") {
                  statusKey = statusKey.charAt(0).toUpperCase() + statusKey.slice(1).toLowerCase();
                  if (statusKey === "Approved") statusKey = "Accepted";
                }
                const statusAr = getLabel(BORROWING_REQUEST_STATE_LABELS, statusKey);
                const title = req.bookTitle || req.BookTitle || "كتاب";
                const studentName = req.studentName || req.borrowingStudentName || "طالب";
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
                          <span>الطالب المستعير: <Link to={`/student/${req.studentId}`} className="text-library-primary dark:text-white font-black hover:text-library-accent transition-colors">{studentName}</Link></span>
                        </div>
                        {rid ? <span className="font-mono text-[10px] opacity-70">رقم العرض: #{rid}</span> : null}
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 max-w-sm">
                        <div className="flex items-center gap-1.5 rounded-lg border border-library-primary/5 bg-library-primary/[0.02] px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                          <CalendarDays size={14} className="opacity-60" />
                          <span>تاريخ الطلب: {formatDate(reqDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* الإجراءات */}
                    <div className="flex flex-wrap items-center gap-2.5 md:justify-end shrink-0 pt-4 border-t border-library-primary/10 dark:border-white/10 md:border-0 md:pt-0">
                      {statusKey === "Pending" && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAction(id, borrowingApi.accept, "تم قبول الطلب بنجاح. يمكنك الآن تسليم الكتاب.")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            موافقة
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAction(id, borrowingApi.reject, "تم رفض الطلب.")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-95 disabled:opacity-50 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            رفض
                          </button>
                        </>
                      )}

                      {statusKey === "Accepted" && (
                        <>
                          {deliveredIds.has(id) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                              <Truck size={14} />
                              تم التسليم
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleAction(id, borrowingApi.deliver, "تم تسجيل تسليم الكتاب للطالب بنجاح.", true)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-library-accent px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-library-primary active:scale-95 disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                              تسليم
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/chat/${req.studentId}`, { 
                              state: { 
                                studentName: studentName,
                                studentImage: req.studentPersonalPhotoUrl || req.PersonalPhotoUrl || null
                              } 
                            })}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition-all hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300"
                          >
                            <MessageSquare size={14} />
                            تواصل
                          </button>
                        </>
                      )}

                      {statusKey !== "Pending" && statusKey !== "Accepted" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-gray-400 dark:text-gray-500 px-2 py-1">
                          {statusKey === "Rejected" ? <XCircle size={14} className="text-rose-400" /> : null}
                          {statusKey === "Cancelled" ? <XCircle size={14} className="text-orange-400" /> : null}
                          {(statusKey === "Borrowed" || statusKey === "Delivered") ? <CheckCircle size={14} className="text-emerald-500" /> : null}
                          {statusKey === "Expired" ? <Clock size={14} /> : null}
                          {(statusKey === "Borrowed" || statusKey === "Delivered") ? "في عهدة المستعير" : "لا يوجد إجراء متاح"}
                        </span>
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
                {/* Dates removed as per request */}
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
                {contactInfoByRecord[detailRequest.lendingRecordId || detailRequest.LendingRecordId] ? (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                    <p>
                      الهاتف:{" "}
                      {contactInfoByRecord[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.phoneNumber ||
                        contactInfoByRecord[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.PhoneNumber ||
                        "غير متاح"}
                    </p>
                    <p>
                      تيليجرام:{" "}
                      {contactInfoByRecord[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.telegramUserId ||
                        contactInfoByRecord[detailRequest.lendingRecordId || detailRequest.LendingRecordId]?.TelegramUserId ||
                        "غير متاح"}
                    </p>
                  </div>
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
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-library-accent to-library-primary" />
              
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute top-6 left-6 text-gray-400 hover:text-library-primary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-library-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-4 relative">
                  <ShieldCheck size={40} className="text-library-accent" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-library-accent/5 rounded-3xl"
                  />
                </div>
                <h3 className="text-2xl font-black text-library-primary dark:text-white">تأكيد التسليم</h3>
                <p className="mt-2 text-sm font-bold text-gray-500 leading-relaxed">
                  تم إرسال رمز التأكيد إلى المستعير. يرجى الحصول على الرمز منه لإكمال عملية التسليم بأمان.
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
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 pl-4 pr-12 text-center text-xl font-black tracking-[0.5em] outline-none transition-all focus:border-library-accent focus:bg-white dark:border-white/5 dark:bg-white/5 dark:text-white dark:focus:border-library-accent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isOtpVerifying || !otpValue}
                    className="flex-1 rounded-2xl bg-library-primary py-4 text-sm font-black text-white shadow-xl shadow-library-primary/20 transition-all hover:bg-library-accent hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale"
                  >
                    {isOtpVerifying ? (
                      <Loader2 className="mx-auto animate-spin" size={20} />
                    ) : (
                      "تحقق وإكمال التسليم"
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

export default BorrowingIncomingRequests;

