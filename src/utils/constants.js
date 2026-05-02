export const API_BASE_URL =
  (process.env.REACT_APP_API_URL || "http://localhost:7240");
export const API_V1 = `${API_BASE_URL}/api/v1`;

// ─── Token Storage ───────────────────────────────────────────────────────────
export const tokenStore = {
  get: () => {
    const storage = localStorage.getItem("accessToken") ? localStorage : sessionStorage;
    return {
      accessToken: storage.getItem("accessToken"),
      refreshToken: storage.getItem("refreshToken"),
      expiresOnUtc: storage.getItem("expiresOnUtc"),
    };
  },
  set: ({ accessToken, refreshToken, expiresOnUtc }, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("expiresOnUtc", expiresOnUtc);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresOnUtc");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("expiresOnUtc");
  },
};
// ─── Image URL Helpers ───────────────────────────────────────────────────────
export const getStudentImageUrl = (studentId) =>
  `${API_V1}/images/students/${studentId}`;

export const getBookImageUrl = (bookId) =>
  `${API_BASE_URL}/uploads/books/book${bookId}.jpg`;

// Re-maps localhost asset URLs to match the configured API_BASE_URL port/origin.
// Useful when the backend returns absolute localhost URLs that may differ from
// the current REACT_APP_API_URL env variable.
export const toApiAssetUrl = (value) => {
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
    if (raw.startsWith("/")) {
      try {
        const base = new URL(API_BASE_URL);
        return `${base.origin}${raw}`;
      } catch {
        return raw;
      }
    }
    // Relative path served from API host (some backends omit leading slash).
    if (/^uploads\//i.test(raw)) {
      try {
        const base = new URL(API_BASE_URL);
        return `${base.origin}/${raw.replace(/^\/+/, "")}`;
      } catch {
        return raw;
      }
    }
    return raw;
  }
};

// ─── Label Helper ────────────────────────────────────────────────────────────
export const getLabel = (labelsObject, key, defaultValue = "") => {
  if (key === null || key === undefined) return defaultValue;
  const s = String(key).trim();
  const lower = s.toLowerCase();
  const normalized = lower.replace(/[\s-]/g, '');
  
  // Try exact, then lowercase, then normalized (no spaces/dashes)
  return labelsObject[s] || labelsObject[lower] || labelsObject[normalized] || defaultValue || s;
};

// ─── Enum Display Labels ─────────────────────────────────────────────────────
export const STUDENT_STATE_LABELS = {
  Pending: "بانتظار تأكيد الإيميل",
  Approved: "مؤكد (بانتظار التوثيق)",
  Active: "نشط وموثق",
  Rejected: "مرفوض",
  Banned: "محظور",
  UnBanned: "نشط",
};

export const BOOK_STATE_LABELS = {
  Pending: "قيد المراجعة",
  Approved: "موافق عليه",
  Rejected: "مرفوض",
  Available: "متاح",
};

export const BOOK_COPY_CONDITION_LABELS = {
  New: "جديد",
  LikeNew: "كالجديد",
  Acceptable: "مقبول",
  Poor: "متهالك",
  0: "جديد",
  1: "كالجديد",
  2: "مقبول",
  3: "متهالك",
};

export const BOOK_COPY_STATE_LABELS = {
  Available: "متاح",
  Borrowed: "مستعار",
  Reserved: "محجوز",
  Lost: "مفقود",
  Damaged: "تالف",
  UnAvailable: "غير متاح",
  0: "متاح",
  1: "مستعار",
  2: "محجوز",
  3: "مفقود",
  4: "تالف",
  5: "غير متاح",
};

export const LENDING_STATE_LABELS = {
  Available: "متاح",
  Reserved: "محجوز",
  Borrowed: "مستعار",
  Expired: "منتهي",
  Closed: "مغلق",
};

export const BORROWING_REQUEST_STATE_LABELS = {
  Pending: "قيد الانتظار",
  pending: "قيد الانتظار",
  Accepted: "مقبول",
  accepted: "مقبول",
  Rejected: "مرفوض",
  rejected: "مرفوض",
  Cancelled: "ملغي",
  cancelled: "ملغي",
  Expired: "منتهي",
  expired: "منتهي",
  Delivered: "تم التسليم",
  delivered: "تم التسليم",
  Borrowed: "مستعار",
  borrowed: "مستعار",
  Returned: "مُرجع",
  returned: "مُرجع",
};

export const BORROWING_TRANSACTION_STATE_LABELS = {
  Borrowed: "مستعار",
  borrowed: "مستعار",
  Returned: "مُرجع",
  returned: "مُرجع",
  Overdue: "متأخر",
  overdue: "متأخر",
  Lost: "مفقود",
  lost: "مفقود",
};

export const BOOK_CATEGORY_LABELS = {
  Fiction: "خيال",
  Nonfiction: "غير خيالي",
  Mystery: "غموض",
  Thriller: "إثارة",
  Romance: "رومانسية",
  ScienceFiction: "خيال علمي",
  Fantasy: "فانتازيا",
  Horror: "رعب",
  HistoricalFiction: "تاريخي",
  Biography: "سيرة ذاتية",
  Autobiography: "سيرة شخصية",
  SelfHelp: "تطوير ذات",
  Business: "أعمال",
  Science: "علوم",
  Philosophy: "فلسفة",
  Psychology: "علم نفس",
  ReligionAndSpirituality: "دين وروحانيات",
  Travel: "سفر",
  Cooking: "طبخ",
  ChildrenBooks: "كتب أطفال",
  Academic: "أكاديمي",
  Engineering: "هندسة",
  Medical: "طبي",
  Programming: "برمجة",
  History: "تاريخ",
  General: "عام",
};