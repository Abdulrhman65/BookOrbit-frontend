// ─── BookOrbit API Configuration ────────────────────────────────────────────
import { API_BASE_URL, API_V1, tokenStore, BOOK_CATEGORY_LABELS, getBookImageUrl, getLabel, BORROWING_REQUEST_STATE_LABELS } from "../utils/constants";

// ─── Token Refresh Queue ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const toLowerSafe = (value) => String(value ?? "").toLowerCase();
/** Rewrites localhost asset URLs so they align with REACT_APP_API_URL (same pattern as normalized books). */
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
    if (raw.startsWith("/")) {
      try {
        const base = new URL(API_BASE_URL);
        return `${base.origin}${raw}`;
      } catch {
        return raw;
      }
    }
    return raw;
  }
};

const studentStateMap = {
  0: "pending",   // Unconfirmed
  1: "approved",  // Confirmed (Browsing only)
  2: "active",    // Verified (Full permissions)
  3: "rejected",
  4: "banned",
  5: "unbanned",
};

const borrowingStateMap = {
  0: "Pending",
  1: "Accepted",
  2: "Rejected",
  3: "Cancelled",
  4: "Expired",
  5: "Delivered",
  6: "Returned",
};

export const normalizeStudent = (student = {}) => {
  const stateValue = student.state ?? student.State;
  
  // Direct mapping from backend state:
  // 0 / "pending"  => Pending (waiting for admin approval)
  // 1 / "approved" => Approved (waiting for admin activation)
  // 2 / "active"   => Active (fully verified)
  // 4 / "banned"   => Banned
  
  const status = typeof stateValue === "number"
    ? studentStateMap[stateValue] || "pending"
    : toLowerSafe(stateValue || "pending");

  return {
    ...student,
    id: student.Id || student.id || student.StudentId || student.studentId,
    fullName: student.fullName || student.name || student.Name || "طالب",
    name: student.name || student.Name || student.fullName,
    universityMailAddress: student.universityMailAddress || student.UniversityMailAddress || student.email || student.Email || "",
    email: student.email || student.Email || student.universityMailAddress || student.UniversityMailAddress || "",
    phoneNumber: student.phoneNumber || student.PhoneNumber || "",
    telegramUserId: student.telegramUserId || student.TelegramUserId || "",
    personalPhotoUrl: toApiAssetUrl(student.personalPhotoUrl || student.PersonalPhotoUrl || student.image || student.Image || ""),
    points: student.points ?? student.Points ?? 0,
    lendingsCount: student.lendingsCount ?? student.LendingsCount ?? 0,
    status: status,
    state: stateValue ?? status,
    creationDate: student.creationDate || student.joinDate || student.JoinDate,
  };
};



const normalizeBook = (book = {}) => {
  try {
    const stateValue = book.state ?? book.State;
    const statusValue = String(book.status ?? book.Status ?? "").toLowerCase();
    const normalizedState = stateValue ?? statusValue;
    // Robust check for approval: state 1, explicit true, or approved-like status strings
    const isApproved = 
      stateValue === 1 || 
      stateValue === true ||
      book.isApproved === true ||
      book.IsApproved === true ||
      ["approved", "active", "verified", "available"].includes(String(stateValue ?? "").toLowerCase()) ||
      ["approved", "active", "verified", "available"].includes(statusValue);
    
      const categoryRaw = book.categories ?? book.Categories ?? book.category ?? book.Category;
      let categoryLabel = "";
      
      if (Array.isArray(categoryRaw)) {
        const uniqueMapped = new Set();
        categoryRaw.forEach(cat => {
          if (!cat) return;
          let label = "";
          if (typeof cat === 'number') {
            const labels = Object.values(BOOK_CATEGORY_LABELS);
            label = labels[cat];
          } else {
            label = getLabel(BOOK_CATEGORY_LABELS, cat);
          }
          uniqueMapped.add(label);
        });
        categoryLabel = Array.from(uniqueMapped).filter(Boolean).join('، ');
      } else if (categoryRaw !== null && categoryRaw !== undefined) {
        if (typeof categoryRaw === 'number') {
          const labels = Object.values(BOOK_CATEGORY_LABELS);
          categoryLabel = labels[categoryRaw] || categoryRaw;
        } else {
          categoryLabel = getLabel(BOOK_CATEGORY_LABELS, categoryRaw);
        }
      }

      return {
        ...book,
        id: book.Id || book.id || book.BookId || book.bookId,
        title: book.title || book.Title || "بدون عنوان",
        author: book.author || book.Author || "مؤلف مجهول",
        publisher: book.publisher || book.Publisher || "",
        isbn: book.isbn || book.ISBN || "",
        category: categoryLabel || "عام",
        copiesCount: book.copiesCount ?? book.availableCopiesCount ?? 0,
        bookCoverImageUrl: toApiAssetUrl(
          book.bookCoverImageUrl || 
          book.BookCoverImageUrl || 
          book.coverImageUrl ||
          book.CoverImageUrl ||
          ((book.Id || book.id || book.BookId || book.bookId) ? getBookImageUrl(book.Id || book.id || book.BookId || book.bookId) : "")
        ),
        state: normalizedState,
        isApproved: isApproved,
        status:
          isApproved
            ? "active"
            : (String(normalizedState ?? "").toLowerCase() === "pending" || normalizedState === 0
                ? "pending"
                : "rejected")
      };
    } catch (err) {
      console.error("Error normalizing book:", err, book);
    }
};

export const normalizeBookCopy = (row = {}) => {
  const id = row.Id ?? row.id;
  const bookId = row.BookId ?? row.bookId ?? row.book?.Id ?? row.book?.id;
  const book = row.book ?? row.Book ?? {};
  
  // Handle lending data if embedded
  const lending = row.lendingRecord || row.LendingRecord || row.lendingListRecord || row.LendingListRecord || null;
  
  return {
    ...row,
    id,
    bookId,
    title: book.title || book.Title || row.bookTitle || row.BookTitle || row.title || "كتاب",
    authorName: book.author || book.Author || row.authorName || row.AuthorName || "مؤلف مجهول",
    condition: row.condition ?? row.Condition ?? 0,
    state: row.state ?? row.State,
    isOnLendingList: Boolean(row.isOnLendingList ?? row.IsOnLendingList ?? lending),
    cost: lending?.cost ?? lending?.Cost ?? row.cost ?? row.Cost ?? 0,
    borrowingDurationInDays: lending?.borrowingDurationInDays ?? lending?.BorrowingDurationInDays ?? row.borrowingDurationInDays ?? row.BorrowingDurationInDays ?? 0,
    bookCoverImageUrl: toApiAssetUrl(
      book.bookCoverImageUrl || 
      book.BookCoverImageUrl || 
      row.bookCoverImageUrl || 
      row.BookCoverImageUrl || 
      (bookId ? getBookImageUrl(bookId) : "")
    ),
  };
};

const normalizeBorrowingRequest = (request = {}) => {
  const stateValue = request.state ?? request.State;
  const mappedState = typeof stateValue === "number"
    ? borrowingStateMap[stateValue] || "Pending"
    : (stateValue || "Pending");
    
  const stateLabel = getLabel(BORROWING_REQUEST_STATE_LABELS, mappedState);

  return {
    ...request,
    id: request.Id || request.id,
    lendingRecordId: request.LendingRecordId || request.lendingRecordId || request.lendingListRecordId,
    studentName: request.studentName || request.borrowingStudentName || request.BorrowingStudentName || request.borrowerName || request.BorrowerName || request.student?.fullName || request.borrower?.fullName || "",
    studentId: request.studentId || request.borrowingStudentId || request.BorrowingStudentId || request.StudentId || request.borrowerId || request.BorrowerId || request.student?.id || "",
    lenderName: request.lenderName || request.LenderName || request.lenderStudentName || request.lenderStudentFullName || request.ownerFullName || request.ownerName || request.OwnerName || request.LendingStudentName || request.LenderStudentName || request.lendingStudentName || request.lenderFullName || request.owner?.fullName || request.lender?.fullName || "",
    lenderId: request.lenderId || request.LenderId || request.ownerId || request.OwnerId || request.lenderStudentId || request.LenderStudentId || request.owner?.id || "",
    bookTitle: request.bookTitle || request.BookTitle || "",
    bookId: request.bookId || request.BookId || "",
    requestDate: request.requestDate || request.createdAtUtc || request.createdAt || request.createdAtUTC,
    expectedReturnDate: request.expectedReturnDate || request.expirationDateUtc || request.expirationDate,
    returnDate: request.returnDate || request.expirationDateUtc || request.expirationDate,
    isOverdue: Boolean(request.isOverdue),
    status: stateLabel,
    state: stateValue ?? mappedState,
  };
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const commonErrorTranslations = {
  "Email already in use": "هذا البريد الإلكتروني مستخدم بالفعل",
  "Invalid credentials": "بيانات الدخول غير صحيحة",
  "Account not found": "الحساب غير موجود",
  "Passwords do not match": "كلمات المرور غير متطابقة",
  "Unauthorized": "غير مصرح لك بالقيام بهذا الإجراء",
  "Forbidden": "ليس لديك الصلاحيات الكافية",
  "Book not found": "الكتاب غير موجود",
  "ISBN already exists": "رقم الـ ISBN موجود بالفعل",
  "Internal server error": "حدث خطأ داخلي في الخادم",
  "The Email field is required": "حقل البريد الإلكتروني مطلوب",
  "The Password field is required": "حقل كلمة المرور مطلوب",
  "Bad Request": "طلب غير صالح",
  "Not Found": "غير موجود",
  "User is already verified": "هذا المستخدم موثق بالفعل",
  "Invalid token": "رمز غير صالح أو منتهي الصلاحية",
  "Password must have at least": "كلمة المرور يجب أن تحتوي على الأقل على حرف كبير ورقم ورمز",
  "User not found": "المستخدم غير موجود",
  "Incorrect current password": "كلمة المرور الحالية غير صحيحة",
  "Concurrency failure": "حدث خطأ في التزامن، يرجى المحاولة مرة أخرى",
  "DuplicateEmail": "البريد الإلكتروني موجود مسبقاً",
  "DuplicateUserName": "اسم المستخدم موجود مسبقاً",
};

const translateErrorMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return msg;
  for (const [en, ar] of Object.entries(commonErrorTranslations)) {
    if (msg.toLowerCase().includes(en.toLowerCase())) return ar;
  }
  return msg;
};

const buildQuery = (params) => {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => query.append(key, v));
    } else if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  return query.toString();
};

// ─── Core API Client ─────────────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  let { accessToken, refreshToken: storedRefreshToken, expiresOnUtc } = tokenStore.get();

  // ─── Proactive Token Refresh (Before 15m expiration) ──────────────────────
  if (accessToken && storedRefreshToken && expiresOnUtc && !options.skipAuth) {
    const expiresAt = new Date(expiresOnUtc).getTime();
    const now = new Date().getTime();
    const timeRemaining = expiresAt - now;

    // Refresh if less than 2 minutes (120000 ms) remain
    if (timeRemaining > 0 && timeRemaining < 2 * 60 * 1000) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_V1}/identity/token/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify({
              refreshToken: storedRefreshToken,
              expiredAccessToken: accessToken
            }),
          });

          if (refreshRes.ok) {
            const newTokens = await refreshRes.json();
            const rememberMe = localStorage.getItem("refreshToken") !== null;
            tokenStore.set(newTokens, rememberMe);
            accessToken = newTokens.accessToken; // Use the new token for this request
            processQueue(null, newTokens.accessToken);
          } else {
            throw new Error("Session expired during proactive refresh");
          }
        } catch (err) {
          processQueue(err, null);
          window.dispatchEvent(new CustomEvent("auth:logout"));
          throw err; // Proactive refresh failed, abort request
        } finally {
          isRefreshing = false;
        }
      } else {
        // If another request is already refreshing, wait for it
        try {
          accessToken = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
        } catch (e) {
          throw e;
        }
      }
    }
  }

  const headers = { ...options.headers, "ngrok-skip-browser-warning": "69420" };

  if (accessToken && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  } else if (!options.body) {
    delete headers["Content-Type"];
  }

  let finalUrl = path.startsWith("http") 
    ? path 
    : `${API_V1}${path.startsWith("/") ? "" : "/"}${path}`;

  if (options.params) {
    const qs = buildQuery(options.params);
    if (qs) finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
  }

  const response = await fetch(finalUrl, {
    ...options,
    method: (options.method || "GET").toUpperCase(),
    headers,
  });

  // ✅ قراءة الـ Response Body كنص أولاً للتعامل مع جميع الـ Content-Types
  const responseText = await response.text();

  if (!response.ok) {
    // ✅ محاولة تحليل الخطأ كـ JSON، ولو فشل نستخدم النص كما هو
    let errorData;
    try {
      errorData = responseText ? JSON.parse(responseText) : { detail: "حدث خطأ غير متوقع" };
    } catch {
      errorData = { detail: responseText || `HTTP ${response.status}` };
    }

    // ─── Rate Limit (429) Handling ──────────────────────────────────────────
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;

      const retryCount = options._retryCount || 0;
      if (retryCount < 2) { // Retry up to 2 times
        await new Promise(resolve => setTimeout(resolve, waitTime * (retryCount + 1)));
        return apiRequest(path, { ...options, _retryCount: retryCount + 1 });
      }
    }

    // ─── Token Refresh Interceptor ───────────────────────────────────────────
    if (response.status === 401 && !options.skipAuth && storedRefreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_V1}/identity/token/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify({
              refreshToken: storedRefreshToken,
              expiredAccessToken: accessToken
            }),
          });

          if (refreshRes.ok) {
            const newTokens = await refreshRes.json();
            // Preserve the storage type based on where it was found
            const rememberMe = localStorage.getItem("refreshToken") !== null;
            tokenStore.set(newTokens, rememberMe);
            processQueue(null, newTokens.accessToken);
            // Retry the original request that triggered the refresh
            return apiRequest(path, options);
          } else {
            throw new Error("Session expired");
          }
        } catch (err) {
          processQueue(err, null);
          window.dispatchEvent(new CustomEvent("auth:logout"));
          throw err;
        } finally {
          isRefreshing = false;
        }
      }

      // Wait in queue and retry when refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiRequest(path, options))
        .catch((err) => { throw err; });
    }

    // لو مفيش Refresh Token أو الـ Refresh نفسه فشل
    if (response.status === 401 && !options.skipAuth) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    const errorMessage = translateErrorMessage(errorData.detail || errorData.message || errorData.title || `HTTP ${response.status}`);

    const error = new Error(errorMessage);
    error.status = response.status;
    error.detail = errorData.detail;
    error.title = errorData.title;
    error.instance = errorData.instance;

    // ✅ دعم أخطاء التحقق من الحقول (لو موجودة)
    if (errorData.errors) {
      error.errors = errorData.errors;
    } else if (errorData.extensions?.errors) {
      error.errors = errorData.extensions.errors;
    }

    throw error;
  }

  // ✅ للتعامل مع 204 No Content
  if (response.status === 204) return null;

  // ✅ التعامل مع الـ Response بناءً على الـ Content-Type
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    try {
      return responseText ? JSON.parse(responseText) : null;
    } catch {
      return responseText;
    }
  } else {
    // لو الـ Response نص عادي (زي "Email Sent")، نرجعه كما هو
    return responseText;
  }
}

// ─── 1. IDENTITY ─────────────────────────────────────────────────────────────
export const identityApi = {
  /** POST /identity/token — Login */
  login: (email, password) =>
    apiRequest("/identity/token", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    }),

  /** POST /identity/token/refresh — Refresh tokens */
  refreshToken: (refreshToken, expiredAccessToken) =>
    apiRequest("/identity/token/refresh", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ refreshToken, expiredAccessToken }),
    }),

  /** GET /identity/users/me — Current user info */
  getMe: () => apiRequest("/identity/users/me"),

  /** ✅ POST /identity/users/send-email-confirmation?email={email} */
  sendEmailConfirmation: (email) =>
    apiRequest(`/identity/users/send-email-confirmation?email=${encodeURIComponent(email)}`, {
      method: "POST",
      skipAuth: true,
    }),

  /** POST /identity/confirm-email?email={email}&token={token} */
  confirmEmail: (email, token) =>
    apiRequest(`/identity/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
      method: "POST",
      skipAuth: true,
    }),

  /** POST /identity/users/send-reset-password?email={email} */
  requestPasswordReset: (email) =>
    apiRequest(`/identity/users/send-reset-password?email=${encodeURIComponent(email)}`, {
      method: "POST",
      skipAuth: true,
    }),

  /** POST /identity/reset-password */
  resetPassword: ({ email, token, newPassword }) =>
    apiRequest("/identity/reset-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        email: email,              // ✅ lowercase
        encodedToken: token,       // ✅ camelCase (مش Token!)
        newPassword: newPassword   // ✅ camelCase
      }),
    }),

  /** POST /identity/users/me/change-password */
  changePassword: ({ currentPassword, oldPassword, newPassword }) =>
    apiRequest("/identity/users/me/change-password", {
      method: "POST",
      body: JSON.stringify({
        oldPassword: oldPassword || currentPassword,
        newPassword,
      }),
    }),
};

// ─── 2. STUDENTS ─────────────────────────────────────────────────────────────
export const studentsApi = {
  /** POST /students — Register new student (multipart/form-data) */
  create: async (formData) => {
    const res = await apiRequest("/students", {
      method: "POST",
      skipAuth: true,
      body: formData
    });
    return normalizeStudent(res);
  },

  /** PATCH /students/{studentId} — Update student profile (multipart/form-data) */
  update: async (studentId, formData) => {
    const res = await apiRequest(`/students/${studentId}`, {
      method: "PATCH",
      body: formData
    });
    return normalizeStudent(res || {});
  },
  
  /** GET /students/me — Current student profile */
  getMe: async () => {
    const res = await apiRequest("/students/me");
    return normalizeStudent(res);
  },
  
  /** GET /students/profiles/{studentId} — Student profile by ID */
  getById: async (studentId) => {
    const res = await apiRequest(`/students/profiles/${studentId}`);
    return normalizeStudent(res);
  },
  
  /** GET /students — All students (Admin only) */
  getAll: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/students?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeStudent) : [];
    return {
      ...res,
      items,
      data: items,
    };
  },

  /** PATCH /students/{studentId} — Update student profile (multipart/form-data) */
  updateRaw: (studentId, formData) =>
    apiRequest(`/students/${studentId}`, {
      method: "PATCH",
      body: formData
    }),

  /** PATCH /students/{studentId}/approve */
  approve: (studentId) =>
    apiRequest(`/students/${studentId}/approve`, { method: "PATCH" }),

  /** PATCH /students/{studentId}/activate */
  activate: (studentId) =>
    apiRequest(`/students/${studentId}/activate`, { method: "PATCH" }),

  /** PATCH /students/{studentId}/ban */
  ban: (studentId) =>
    apiRequest(`/students/${studentId}/ban`, { method: "PATCH" }),

  /** PATCH /students/{studentId}/unban */
  unban: (studentId) =>
    apiRequest(`/students/${studentId}/unban`, { method: "PATCH" }),

  /** PATCH /students/{studentId}/reject */
  reject: (studentId) =>
    apiRequest(`/students/${studentId}/reject`, { method: "PATCH" }),

  /** PATCH /students/{studentId}/pend */
  pend: (studentId) =>
    apiRequest(`/students/${studentId}/pend`, { method: "PATCH" }),
};

// ─── 3. BOOKS ────────────────────────────────────────────────────────────────
export const booksApi = {
  /** POST /books — Create new book (multipart/form-data) */
  create: async (formData) => {
    const res = await apiRequest("/books", {
      method: "POST",
      body: formData
    });
    return normalizeBook(res);
  },

  /** GET /books — Paginated list of books */
  getAll: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/books?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeBook) : [];
    return {
      ...res,
      items,
      data: items,
    };
  },

  /** GET /books/{bookId} — Book by ID */
  getById: async (bookId) => {
    const res = await apiRequest(`/books/${bookId}`);
    return normalizeBook(res);
  },

  /** PATCH /books/{bookId} — Update book (multipart/form-data) */
  update: (bookId, formData) =>
    apiRequest(`/books/${bookId}`, {
      method: "PATCH",
      body: formData,
    }),

  /** DELETE /books/{bookId} — Delete book */
  delete: (bookId) =>
    apiRequest(`/books/${bookId}`, {
      method: "DELETE"
    }),

  /** PATCH /books/{bookId}/available — Approve book (Admin only) */
  approve: (bookId) =>
    apiRequest(`/books/${bookId}/available`, { method: "PATCH" }),

  /** PATCH /books/{bookId}/reject — Reject book (Admin only) */
  reject: (bookId) =>
    apiRequest(`/books/${bookId}/reject`, { method: "PATCH" }),
};

// ─── 4. BOOK COPIES ──────────────────────────────────────────────────────────
export const bookCopiesApi = {
  /** POST /students/me/books/{bookId}/copies — Create book copy */
  create: (bookId, condition) =>
    apiRequest(`/students/me/books/${bookId}/copies`, {
      method: "POST",
      body: JSON.stringify({ condition }),
    }),

  /** GET /books/copies/{bookCopyId} — Book copy by ID */
  getById: (bookCopyId) => apiRequest(`/books/copies/${bookCopyId}`),

  /** PATCH /books/copies/{bookCopyId} — Update book copy */
  update: (bookCopyId, condition) =>
    apiRequest(`/books/copies/${bookCopyId}`, {
      method: "PATCH",
      body: JSON.stringify({ condition }),
    }),

  /** GET /books/{bookId}/copies — Copies by book ID */
  getByBookId: (bookId, params = {}) => {
    const query = buildQuery(params);
    return apiRequest(`/books/${bookId}/copies?${query}`);
  },

  /** GET /students/{studentId}/books/copies — Copies by student ID */
  getByStudentId: async (studentId, params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/students/${studentId}/books/copies?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeBookCopy) : [];
    return { ...res, items, data: items };
  },

  /** GET /books/copies — All copies (paginated) */
  getAll: (params = {}) => {
    const query = buildQuery(params);
    return apiRequest(`/books/copies?${query}`);
  },

  /** POST /students/me/books/copies/{bookCopyId}/list — Add to lending list */
  listForLending: (bookCopyId, borrowingDurationInDays) =>
    apiRequest(
      `/students/me/books/copies/${bookCopyId}/list?borrowingDurationInDays=${borrowingDurationInDays}`,
      { method: "POST" }
    ),

  /** PATCH /books/copies/{bookCopyId}/available */
  markAvailable: (bookCopyId) =>
    apiRequest(`/books/copies/${bookCopyId}/available`, { method: "PATCH" }),

  /** PATCH /books/copies/{bookCopyId}/unavailable */
  markUnavailable: (bookCopyId) =>
    apiRequest(`/books/copies/${bookCopyId}/unavailable`, { method: "PATCH" }),
};

// ─── 5. LENDING LIST ─────────────────────────────────────────────────────────
export const lendingApi = {
  /** GET /lendinglist — Paginated list of lending records */
  getAll: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/lendinglist?${query}`);
    const items = Array.isArray(res?.items)
      ? res.items.map((item) => ({
          ...item,
          id: item.Id || item.id,
          bookTitle: item.bookTitle || item.title || item.Title || "",
          authorName: item.authorName || item.author || item.AuthorName || item.Author || "مؤلف مجهول",
          studentName: item.studentName || item.ownerName || item.OwnerName || item.StudentName || "",
          studentId: item.studentId || item.ownerId || item.OwnerId || item.StudentId || "",
          cost: item.cost ?? item.Cost ?? 0,
          borrowingDurationInDays: item.borrowingDurationInDays ?? item.BorrowingDurationInDays ?? item.duration ?? 0,
          bookCoverImageUrl: toApiAssetUrl(item.bookCoverImageUrl || item.BookCoverImageUrl || item.coverUrl || item.CoverUrl || "")
        }))
      : [];
    return {
      ...res,
      items,
      data: items,
    };
  },

  /** GET /lendinglist/{lendingListRecordId} — Record by ID */
  getById: (lendingListRecordId) =>
    apiRequest(`/lendinglist/${lendingListRecordId}`),

  /** GET /lendinglist/{lendingListRecordId}/contact-info */
  getContactInfo: (lendingListRecordId) =>
    apiRequest(`/lendinglist/${lendingListRecordId}/contact-info`),

  /** PATCH /lendinglist/{lendingListRecordId}/close */
  close: (lendingListRecordId) =>
    apiRequest(`/lendinglist/${lendingListRecordId}/close`, {
      method: "PATCH",
    }),
};

// ─── 6. BORROWING REQUESTS ───────────────────────────────────────────────────
export const borrowingApi = {
  /** GET /borrowingrequests — Paginated list of requests */
  getAll: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/borrowingrequests?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeBorrowingRequest) : [];
    return {
      ...res,
      items,
      data: items,
    };
  },

  /** GET /borrowingrequests/me/in — Incoming requests for current student */
  getMineIncoming: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/borrowingrequests/me/in?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeBorrowingRequest) : [];
    return { ...res, items, data: items };
  },

  /** GET /borrowingrequests/me/out — Outgoing requests from current student */
  getMineOutgoing: async (params = {}) => {
    const query = buildQuery(params);
    const res = await apiRequest(`/borrowingrequests/me/out?${query}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalizeBorrowingRequest) : [];
    return { ...res, items, data: items };
  },

  /** GET /borrowingrequests/{borrowingRequestId} — Request by ID */
  getById: async (borrowingRequestId) => {
    const res = await apiRequest(`/borrowingrequests/${borrowingRequestId}`);
    return normalizeBorrowingRequest(res);
  },

  /** POST /lendinglist/{lendingListRecordId}/request — Create borrowing request */
  create: (lendingListRecordId) =>
    apiRequest(`/lendinglist/${lendingListRecordId}/request`, {
      method: "POST",
    }),

  /** PATCH /borrowingrequests/{id}/accept */
  accept: (id) => apiRequest(`/borrowingrequests/${id}/accept`, { method: "PATCH" }),

  /** PATCH /borrowingrequests/{id}/reject */
  reject: (id) => apiRequest(`/borrowingrequests/${id}/reject`, { method: "PATCH" }),

  /** PATCH /borrowingrequests/{id}/cancel */
  cancel: (id) => apiRequest(`/borrowingrequests/${id}/cancel`, { method: "PATCH" }),

  /** POST /borrowingrequests/{id}/deliver */
  deliver: (id) => apiRequest(`/borrowingrequests/${id}/deliver`, { method: "POST" }),
};

// ─── 7. BORROWING TRANSACTIONS ───────────────────────────────────────────────
export const borrowingTransactionsApi = {
  /** GET /borrowingtransactions — Admin list */
  getAll: (params = {}) => {
    const query = buildQuery(params);
    return apiRequest(`/borrowingtransactions?${query}`);
  },

  /** GET /borrowingtransactions/{id} */
  getById: (id) => apiRequest(`/borrowingtransactions/${id}`),

  markReturned: (id) =>
    apiRequest(`/borrowingtransactions/${id}/return`, { method: "PATCH" }),

  markLost: (id) =>
    apiRequest(`/borrowingtransactions/${id}/lost`, { method: "PATCH" }),

  /** GET /borrowingtransactions/me/in — Lender transactions */
  getMeIn: (params = {}) => {
    const query = buildQuery(params);
    return apiRequest(`/borrowingtransactions/me/in?${query}`);
  },

  /** GET /borrowingtransactions/me/out — Borrower transactions */
  getMeOut: (params = {}) => {
    const query = buildQuery(params);
    return apiRequest(`/borrowingtransactions/me/out?${query}`);
  },
};

// ─── 8. IMAGES ───────────────────────────────────────────────────────────────
export const imagesApi = {
  /** GET /images/students/{studentId} — Student profile image */
  getStudentImage: (studentId) =>
    apiRequest(`/images/students/${studentId}`, {
      headers: { "Accept": "application/json" },
    }),

  /** GET /images/books/{bookId} — Book cover image */
  getBookImage: (bookId) => getBookImageUrl(bookId),
};

// ─── 9. REVIEWS ─────────────────────────────────────────────────────────────
export const reviewsApi = {
  /** POST /api/v1/borrowingtransactions/{id}/review */
  create: (borrowingTransactionId, reviewData) =>
    apiRequest(`/borrowingtransactions/${encodeURIComponent(borrowingTransactionId)}/review`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    }),

  /** GET /api/v1/borrowingreviews/{borrowingReviewId} */
  getById: (borrowingReviewId) =>
    apiRequest(`/borrowingreviews/${borrowingReviewId}`),

  /** GET /api/v1/borrowingreviews?ReviewedStudentId={studentId} */
  getByStudentId: (studentId) =>
    apiRequest(`/borrowingreviews`, { params: { ReviewedStudentId: studentId } }),
};
