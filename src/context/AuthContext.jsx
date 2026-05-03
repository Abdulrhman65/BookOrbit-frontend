import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { identityApi, studentsApi, normalizeStudent } from "../services/api";
import {
  API_BASE_URL,
  getStudentImageUrl,
  tokenStore,
} from "../utils/constants";

const AuthContext = createContext(null);
let profileObjectUrl = null;

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Stable fingerprint of current user — prevents setUser from triggering cascading re-renders
  // when refreshProfile() returns equivalent data
  const userFingerprintRef = React.useRef(null);
  const AUTO_REFRESH_INTERVAL_MS = 9 * 60 * 1000;

  const buildAbsoluteUrl = useCallback((value) => {
    if (!value) return null;
    const raw = String(value).trim();
    
    try {
      const url = new URL(raw);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        const base = new URL(API_BASE_URL);
        return `${base.origin}${url.pathname}${url.search}${url.hash}`;
      }
      return raw;
    } catch {
      if (raw.startsWith("/")) return `${API_BASE_URL}${raw}`;
      return `${API_BASE_URL}/${raw.replace(/^\/+/, "")}`;
    }
  }, []);

  const fetchProtectedImageAsSrc = useCallback(async (url) => {
    const { accessToken } = tokenStore.get();
    if (!accessToken) return null;

    // Add cache buster to ensure we get the fresh image after an update
    const buster = `t=${Date.now()}`;
    const separator = url.includes("?") ? "&" : "?";
    const finalUrl = `${url}${separator}${buster}`;

    const res = await fetch(finalUrl, {
      cache: "no-cache",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "ngrok-skip-browser-warning": "69420",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const blob = await res.blob();

    // Direct image payload (image/* or binary stream): render as object URL.
    if (
      contentType.startsWith("image/") ||
      contentType.includes("octet-stream")
    ) {
      if (profileObjectUrl) URL.revokeObjectURL(profileObjectUrl);
      profileObjectUrl = URL.createObjectURL(blob);
      return profileObjectUrl;
    }

    const raw = (await blob.text()).trim();
    if (!raw) return null;

    let encoded = raw;
    if (encoded.startsWith('"') && encoded.endsWith('"')) {
      encoded = encoded.slice(1, -1);
    }

    if (encoded.startsWith("{") || encoded.startsWith("[")) {
      try {
        const parsed = JSON.parse(encoded);
        if (typeof parsed === "string") {
          encoded = parsed;
        } else if (parsed && typeof parsed === "object") {
          encoded =
            parsed.image ||
            parsed.base64 ||
            parsed.data ||
            parsed.content ||
            parsed.result ||
            "";
        } else {
          encoded = "";
        }
      } catch {
        // keep original encoded value
      }
    }

    if (encoded.startsWith("data:image/")) {
      return encoded;
    }

    encoded = encoded.replace(/\s/g, "");
    return encoded ? `data:image/jpeg;base64,${encoded}` : null;
  }, []);

  const loadStudentProfileImage = useCallback(
    async (studentId, rawImageValue) => {
      const imageValue =
        typeof rawImageValue === "string" ? rawImageValue.trim() : "";
      if (imageValue) {
        const imageUrl = buildAbsoluteUrl(imageValue);
        const isProtectedApiImage = /\/api\/v1\/images\//i.test(imageUrl || "");
        if (isProtectedApiImage) {
          try {
            const protectedSrc = await fetchProtectedImageAsSrc(imageUrl);
            if (protectedSrc) return protectedSrc;
            return null;
          } catch {
            return null;
          }
        }
        return imageUrl;
      }
      if (!studentId) return null;
      const endpoint = getStudentImageUrl(studentId);

      try {
        const protectedSrc = await fetchProtectedImageAsSrc(endpoint);
        if (protectedSrc) return protectedSrc;
        return null;
      } catch {
        return null;
      }
    },
    [buildAbsoluteUrl, fetchProtectedImageAsSrc],
  );

  // Helper to fetch full user profile (Identity + Student info)
  const fetchFullProfile = useCallback(async () => {
    try {
      const identityData = await identityApi.getMe();

      if (identityData) {
        const identityEmailConfirmed = identityData.emailConfirmed === true;

        // Stage 1: Email not confirmed → force confirmation flow
        if (!identityEmailConfirmed) {
          return null;
        }

        // Extract role
        const roles = identityData.roles || [];
        const isAdmin =
          roles.some((r) => r.toLowerCase().includes("admin")) ||
          (identityData.role &&
            identityData.role.toLowerCase().includes("admin"));
        const userRole = isAdmin ? "Admin" : roles[0] || "Student";

        // Admin → skip student data fetch
        if (isAdmin) {
          return {
            ...identityData,
            id: identityData.userId || identityData.id,
            role: "Admin",
            status: "active",
            isEmailConfirmed: true,
            fullName:
              identityData.Name ||
              identityData.name ||
              identityData.userName ||
              "مدير النظام",
          };
        }

        // Student flow: fetch student data to get the actual state
        try {
          const studentData = await studentsApi.getMe();
          const studentState = studentData.state ?? studentData.State;

          // Stage 2: Email confirmed but state is pending (0) → awaiting admin approval
          if (
            studentState === 0 ||
            studentState === "pending" ||
            (typeof studentState === "string" &&
              studentState.toLowerCase() === "pending")
          ) {
            return { awaitingApproval: true, email: identityData.email };
          }

          const studentId =
            studentData.id ||
            studentData.Id ||
            identityData.userId ||
            identityData.id;
          const rawImageValue =
            studentData.PersonalPhoto ||
            studentData.personalPhoto ||
            studentData.personalPhotoUrl ||
            studentData.image ||
            studentData.profileImage;
          let resolvedImage = await loadStudentProfileImage(
            studentId,
            rawImageValue,
          );
          const identityStudentId = identityData.userId || identityData.id;
          if (
            !resolvedImage &&
            identityStudentId &&
            identityStudentId !== studentId
          ) {
            resolvedImage = await loadStudentProfileImage(
              identityStudentId,
              rawImageValue,
            );
          }

          return {
            ...identityData,
            id: identityData.userId || identityData.id,
            role: userRole,
            fullName:
              studentData.Name ||
              studentData.name ||
              studentData.fullName ||
              studentData.FullName,
            phoneNumber: studentData.PhoneNumber || studentData.phoneNumber,
            university: studentData.University || studentData.university,
            studentId,
            ...normalizeStudent(studentData),
            image: resolvedImage,
          };
        } catch (sErr) {
          console.warn("User is not a student or profile not found", sErr);
          const identityStudentId = identityData.userId || identityData.id;
          const resolvedImage = await loadStudentProfileImage(
            identityStudentId,
            null,
          );
          return {
            ...identityData,
            id: identityData.userId || identityData.id,
            role: userRole,
            fullName:
              identityData.Name ||
              identityData.name ||
              identityData.userName ||
              "طالب",
            studentId: identityStudentId,
            status: "pending",
            image: resolvedImage,
          };
        }
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch profile", err);
      return null;
    }
  }, [loadStudentProfileImage]);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = tokenStore.get();
      if (tokens?.accessToken) {
        const fullUser = await fetchFullProfile();
        if (fullUser && !fullUser.awaitingApproval) {
          const fingerprint = JSON.stringify({
            id: fullUser.id,
            studentId: fullUser.studentId,
            fullName: fullUser.fullName,
            telegramUserId: fullUser.telegramUserId,
            phoneNumber: fullUser.phoneNumber,
            status: fullUser.status,
            image: fullUser.image,
            points: fullUser.points,
          });
          userFingerprintRef.current = fingerprint;
          setUser(fullUser);
        } else {
          tokenStore.clear();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchFullProfile]);

  const refreshProfile = useCallback(async () => {
    const fullUser = await fetchFullProfile();
    if (fullUser && !fullUser.awaitingApproval) {
      // Only call setUser if something meaningful actually changed
      // This prevents cascading re-renders from useEffect([user]) across the app
      const fingerprint = JSON.stringify({
        id: fullUser.id,
        studentId: fullUser.studentId,
        fullName: fullUser.fullName,
        telegramUserId: fullUser.telegramUserId,
        phoneNumber: fullUser.phoneNumber,
        status: fullUser.status,
        image: fullUser.image,
        points: fullUser.points,
      });
      if (fingerprint !== userFingerprintRef.current) {
        userFingerprintRef.current = fingerprint;
        setUser(fullUser);
      }
      return fullUser;
    }
    return null;
  }, [fetchFullProfile]);

  const refreshSessionToken = useCallback(async () => {
    const { accessToken, refreshToken } = tokenStore.get();
    if (!accessToken || !refreshToken) return;
    try {
      const newTokens = await identityApi.refreshToken(
        refreshToken,
        accessToken,
      );
      const rememberMe = localStorage.getItem("refreshToken") !== null;
      tokenStore.set(newTokens, rememberMe);
    } catch {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
  }, []);

  const login = async (email, password, rememberMe = true) => {
    try {
      const tokens = await identityApi.login(email, password);

      if (!tokens?.accessToken) {
        return { success: false, error: "لم يتم استلام توكن من الخادم" };
      }

      tokenStore.set(tokens, rememberMe);

      const fullUser = await fetchFullProfile();

      // Case 1: awaitingApproval returned (email confirmed but state=pending)
      if (fullUser && fullUser.awaitingApproval) {
        tokenStore.clear();
        return {
          success: false,
          error:
            "حسابك بانتظار الموافقة من قبل الإدارة. يرجى مراجعة الموقع لاحقاً.",
        };
      }

      // Case 2: null returned (email not confirmed)
      if (!fullUser) {
        const identityData = await identityApi.getMe().catch(() => null);
        tokenStore.clear();
        if (identityData && identityData.emailConfirmed === false) {
          return {
            success: true,
            user: null,
            requiresEmailConfirmation: true,
            email: identityData.email,
          };
        }
        return { success: false, error: "فشل في جلب بيانات الملف الشخصي" };
      }

      setUser(fullUser);

      return {
        success: true,
        user: fullUser,
        requiresEmailConfirmation: false,
      };
    } catch (err) {
      tokenStore.clear();
      if (err.status === 400 || err.status === 401) {
        const lowerMsg = (err.detail || err.message || "").toLowerCase();
        if (
          lowerMsg.includes("confirm") ||
          lowerMsg.includes("verify") ||
          lowerMsg.includes("تأكيد")
        ) {
          return { success: true, requiresEmailConfirmation: true };
        }
        return {
          success: false,
          error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        };
      }
      if (err.status === 429) {
        return {
          success: false,
          error: "محاولات كثيرة جداً! يرجى الانتظار دقيقة.",
        };
      }
      return {
        success: false,
        error: err.detail || err.message || "حدث خطأ أثناء تسجيل الدخول",
      };
    }
  };

  const register = async (formData) => {
    try {
      const response = await studentsApi.create(formData);
      return {
        success: true,
        userId: response.id,
        student: response,
      };
    } catch (err) {
      return {
        success: false,
        error: err.detail || err.message,
        status: err.status,
        errors: err.errors,
      };
    }
  };

  const logout = () => {
    if (profileObjectUrl) {
      URL.revokeObjectURL(profileObjectUrl);
      profileObjectUrl = null;
    }
    tokenStore.clear();
    setUser(null);
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 0);
  };

  useEffect(() => {
    const handleLogout = () => {
      tokenStore.clear();
      setUser(null);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 0);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      refreshSessionToken();
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, refreshSessionToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshProfile,
        isLoggedIn: !!user,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
