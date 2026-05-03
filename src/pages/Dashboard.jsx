import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookMarked,
  ArrowUpLeft,
  ShieldCheck,
  Sparkles,
  Star,
  LayoutGrid,
  Loader2,
  Search,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { booksApi } from "../services/api";
import { getBookImageUrl } from "../utils/constants";
import { showReadableAccessErrorToast } from "../utils/accessMessages";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const bookGridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const bookCardItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const BookCard3D = ({ book }) => {
  const availableCopies = Number(book.availableCopiesCountActual ?? 0);
  const available = availableCopies > 0;
  const navigate = useNavigate();
  return (
    <motion.div
      variants={bookCardItem}
      whileHover={{ y: -8 }}
      className="relative flex flex-col items-center group h-full"
    >
      {/* 3D Book Container */}
      <div className="relative w-[130px] h-[190px] [perspective:1200px] z-10 mb-[-25px] mt-2 transition-transform duration-300 group-hover:scale-[1.02]">
        <motion.div className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-500 ease-out [transform:rotateY(30deg)_rotateX(5deg)] group-hover:[transform:rotateY(0deg)_rotateX(0deg)] cursor-pointer drop-shadow-2xl dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <div
            className={`absolute inset-0 ${
              book.color || "bg-library-primary"
            } rounded-l-md [transform:translateZ(-12px)] overflow-hidden border-l border-black/20`}
          ></div>
          <div
            className="absolute inset-y-[3px] left-[1px] w-[24px] bg-[#f5f5f5] [transform:translateX(-12px)_rotateY(-90deg)] overflow-hidden border-y border-gray-300 shadow-inner"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom,#e0e0e0 0,#e0e0e0 1px,transparent 1px,transparent 6px)",
            }}
          />
          <div
            className="absolute top-[1px] left-[2px] right-0 h-[24px] bg-[#f5f5f5] [transform:translateY(-12px)_rotateX(90deg)] overflow-hidden border-r border-gray-300 shadow-inner"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right,#e0e0e0 0,#e0e0e0 1px,transparent 1px,transparent 6px)",
            }}
          />
          <div
            className="absolute bottom-[1px] left-[2px] right-0 h-[24px] bg-[#e5e5e5] [transform:translateY(12px)_rotateX(-90deg)] overflow-hidden border-r border-gray-300"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right,#d0d0d0 0,#d0d0d0 1px,transparent 1px,transparent 6px)",
            }}
          />
          <div
            className={`absolute inset-y-0 right-0 w-[24px] ${
              book.color || "bg-library-primary"
            } [transform:translateX(12px)_rotateY(90deg)] rounded-r-sm overflow-hidden shadow-[inset_2px_0_5px_rgba(0,0,0,0.3)]`}
          ></div>
          <div className="absolute inset-0 bg-white rounded-r-md rounded-l-sm overflow-hidden [transform:translateZ(12px)] shadow-[-5px_5px_15px_rgba(0,0,0,0.2)] border-l-2 border-black/10">
            {book.bookCoverImageUrl || book.id ? (
              <img
                src={book.bookCoverImageUrl || getBookImageUrl(book.id)}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-library-primary flex flex-col items-center justify-center p-3 text-center">
                <h3 className="text-white font-bold text-sm mb-1 leading-tight">
                  {book.title}
                </h3>
                <p className="text-white/80 text-[10px]">{book.author}</p>
              </div>
            )}
            <div className="absolute top-2 end-2 z-20">
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border ${
                  available
                    ? "bg-emerald-500/95 text-white border-emerald-400/30"
                    : "bg-rose-500/95 text-white border-rose-400/30"
                }`}
              >
                {available ? "متاح للاستعارة" : "غير متاح"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full bg-white/92 dark:bg-dark-surface/92 backdrop-blur-xl rounded-3xl pt-11 pb-5 px-5 border border-library-primary/[0.07] dark:border-white/[0.07] shadow-lg shadow-library-primary/[0.05] dark:shadow-black/40 transition-all duration-300 relative z-0 flex flex-col items-center flex-grow group-hover:border-library-accent/25 dark:group-hover:border-library-accent/20 group-hover:shadow-xl group-hover:shadow-library-primary/10">
        <h3 className="font-black text-library-primary dark:text-white text-center text-[15px] leading-snug mb-1 line-clamp-2 w-full min-h-[2.5rem]">
          {book.title}
        </h3>
        <p className="text-library-accent text-xs font-bold mb-3 text-center line-clamp-1 w-full">
          {book.author}
        </p>
        <div className="w-full mt-auto">
          <div className="mb-3 h-px w-full bg-library-primary/10 dark:bg-white/10" />
          <div className="flex justify-between items-center w-full mb-4 gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-library-primary/65 dark:text-gray-400 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-library-primary/[0.06] dark:bg-white/[0.06]">
                <BookMarked
                  size={13}
                  className="text-library-accent"
                  strokeWidth={2}
                />
              </span>
              <span className="truncate">{book.category || "عام"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/catalog/${book.id}`)}
            className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 bg-library-primary text-white border border-library-primary shadow-md hover:bg-library-accent hover:border-library-accent hover:shadow-lg dark:bg-white dark:text-library-primary dark:border-white dark:hover:bg-library-accent dark:hover:text-white dark:hover:border-library-accent`}
          >
            عرض التفاصيل
            <ArrowUpLeft size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [booksData, setBooksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Prioritize fullName from the student profile
  const rawName =
    user?.fullName ||
    user?.Name ||
    user?.name ||
    user?.userName ||
    user?.email?.split("@")[0] ||
    "يا بطل";
  const firstName = rawName.split(" ")[0];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await booksApi.getAll({
        page: 1,
        pageSize: 30,
        sortColumn: "createdAt",
        sortDirection: "desc",
        searchTerm: debouncedSearch || undefined,
        Statuses: "available", // ← فلترة على مستوى الـ API مباشرة
      });
      const rows = res.items ?? res.data ?? [];

      // Use availability count from the API response directly — no extra calls needed
      const booksWithAvailability = rows.map((book) => ({
        ...book,
        availableCopiesCountActual:
          book.availableCopiesCount ??
          book.AvailableCopiesCount ??
          book.availableLendingRecordsCount ??
          book.AvailableLendingRecordsCount ??
          0,
      }));

      setBooksData(booksWithAvailability);
    } catch (e) {
      showReadableAccessErrorToast(e, user, "تعذر تحميل الكتب المتاحة للإعارة");
      setBooksData([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, user?.studentId]); // user?.studentId is stable — avoids re-fetch on every user object recreation

  useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  const availableCount = useMemo(
    () =>
      booksData.filter(
        (book) => Number(book.availableCopiesCountActual ?? 0) > 0,
      ).length,
    [booksData],
  );

  return (
    <div className="min-h-screen relative bg-library-paper dark:bg-dark-bg text-library-primary dark:text-library-paper transition-colors duration-300 overflow-x-hidden">
      {/* خلفية هادئة — بدون صورة خارجية أو نبض scale يفسد التركيب */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-40 -end-32 w-[min(90vw,520px)] h-[min(90vw,520px)] rounded-full bg-library-primary/[0.06] dark:bg-library-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -start-40 w-80 h-80 rounded-full bg-library-accent/[0.06] dark:bg-library-accent/10 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-12 pt-under-fixed-nav lg:pt-under-fixed-nav-lg">
        {/* ترحيب — نفس أسلوب البطاقات الزجاجية في لوحة الطالب */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-5 lg:gap-8 mb-10 lg:mb-12"
        >
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-library-accent/30 bg-library-accent/10 px-3 py-1.5 text-[10px] font-black text-library-accent">
                <Sparkles size={12} strokeWidth={2} />
                الأرشيف الرقمي
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-library-primary dark:text-white mb-2 leading-tight tracking-tight">
                مرحباً، {firstName} 👋
              </h1>
              <p className="text-sm md:text-base text-library-primary/70 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
                أهلاً بك في مكتبتك التبادلية؛ تصفّح المراجع المتاحة للإعارة من
                زملائك.
              </p>
            </div>
          </div>
          <Link
            to="/addbook"
            className="w-full shrink-0 sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-library-primary px-7 py-4 text-sm font-black text-white shadow-lg shadow-library-primary/20 ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-library-accent hover:shadow-xl active:translate-y-0 dark:bg-white dark:text-library-primary dark:ring-white/20 dark:hover:bg-library-accent dark:hover:text-white"
          >
            <BookMarked size={20} strokeWidth={2} />
            أضف كتاباً لمكتبتك
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-1 space-y-5 lg:space-y-6"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <h3 className="mb-1 flex items-center gap-2.5 text-base font-black text-library-primary dark:text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-library-accent/25 bg-library-accent/10 text-library-accent">
                  <Search size={18} strokeWidth={2} />
                </span>
                بحث في الكتب المتاحة
              </h3>
              <p className="text-xs text-library-primary/50 dark:text-gray-500 font-bold mb-5">
                حالة الإتاحة تُحسب من النسخ الفعلية المعروضة حالياً.
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-library-primary/60 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    ابحث بالعنوان / المالك
                  </h4>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="مثال: فيزياء، أحمد..."
                    className="w-full bg-library-paper/80 dark:bg-dark-bg/80 border border-library-primary/12 dark:border-white/10 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-library-accent/30 focus:border-library-accent/50 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-library-primary dark:bg-dark-bg p-6 border border-white/10 text-white shadow-xl relative overflow-hidden group ring-1 ring-white/10">
              <div
                className="absolute start-6 top-0 h-1 w-14 rounded-b-md bg-library-accent"
                aria-hidden
              />
              <div className="absolute -right-10 -top-10 w-36 h-36 bg-library-accent/25 blur-3xl rounded-full group-hover:bg-library-accent/35 transition-all duration-500" />
              <div className="absolute -left-8 bottom-0 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
              <ShieldCheck
                size={30}
                className="text-library-accent mb-3 relative z-10 mt-2"
                strokeWidth={1.75}
              />
              <h3 className="font-black text-lg mb-2 relative z-10">
                مؤشر سريع
              </h3>
              <p className="text-white/75 text-sm mb-5 relative z-10 leading-relaxed">
                يوجد الآن {availableCount} كتاباً متاحاً للاستعارة في الأرشيف.
              </p>
              <Link
                to="/lending/outgoing"
                className="inline-flex w-full items-center justify-center bg-library-accent text-library-primary font-black py-3 rounded-xl text-sm hover:bg-white transition-all relative z-10 shadow-md"
              >
                متابعة طلباتك
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-3 min-w-0 space-y-6"
          >
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-library-primary text-white shadow-md ring-1 ring-library-primary/20 dark:bg-white dark:text-library-primary">
                  <LayoutGrid size={20} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-library-primary dark:text-white sm:text-lg">
                    كتب الأرشيف
                  </h2>
                  <p className="mt-0.5 text-xs font-bold text-library-primary/55 dark:text-gray-500">
                    <span className="text-library-accent">
                      {availableCount}
                    </span>{" "}
                    كتاباً متاحاً حالياً
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-11 sm:gap-y-12"
              variants={bookGridContainer}
              initial="hidden"
              animate="visible"
            >
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-library-accent" />
                </div>
              ) : booksData.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-white/10">
                  <p className="text-sm font-black text-library-primary dark:text-white">
                    لا توجد كتب متاحة حالياً
                  </p>
                  <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                    جرّب تعديل البحث أو عد لاحقاً.
                  </p>
                </div>
              ) : (
                booksData.map((book) => (
                  <BookCard3D key={book.id} book={book} />
                ))
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
