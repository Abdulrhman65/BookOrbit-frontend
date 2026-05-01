import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { identityApi } from "../services/api";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const emailParam = params.get("email");
    const tokenParam = params.get("token");

    if (!emailParam || !tokenParam) {
      setError(
        "رابط إعادة التعيين غير صالح. الرجاء التأكد من الرابط المرسل إليك.",
      );
    } else {
      setEmail(emailParam);
      setToken(tokenParam);
    }
  }, [params]);

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error("كلمة المرور لا تستوفي الشروط المطلوبة");
      return;
    }

    setIsResetting(true);
    try {
      await identityApi.resetPassword({
        email,
        token,
        newPassword,
      });

      setIsSuccess(true);
      toast.success("تم تغيير كلمة المرور بنجاح!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      const msg =
        err.detail || err.message || "حدث خطأ أثناء محاولة تغيير كلمة المرور";
      toast.error(msg);
      console.error("Reset password error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-3 bg-white dark:bg-dark-surface border ${
      hasError
        ? "border-red-500/50 focus:ring-red-500/30 animate-shake"
        : "border-library-primary/10 dark:border-white/[0.08] focus:ring-library-accent/50"
    } rounded-xl focus:outline-none focus:ring-2 focus:border-library-accent shadow-sm focus:shadow-md focus:shadow-library-accent/10 dark:text-white transition-all text-sm`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-library-paper dark:bg-dark-bg"
      dir="rtl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-library-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-library-accent/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-library-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck size={32} className="text-library-accent" />
            </div>
            <h1 className="text-2xl font-black text-library-primary dark:text-white mb-2">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-sm text-library-primary/60 dark:text-gray-400">
              {isSuccess
                ? "تم تحديث كلمة المرور الخاصة بك. سيتم تحويلك لصفحة الدخول."
                : "أدخل كلمة المرور الجديدة والقوية لحماية حسابك."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                  تم بنجاح!
                </h2>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-library-accent font-bold hover:underline"
                >
                  <ArrowRight size={18} />
                  الذهاب لتسجيل الدخول الآن
                </Link>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <p className="text-red-500 font-bold mb-6">{error}</p>
                <Link
                  to="/"
                  className="px-6 py-3 bg-library-primary dark:bg-white text-white dark:text-library-primary rounded-xl font-bold hover:shadow-lg transition-all inline-block"
                >
                  العودة للرئيسية
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Email Display (Read-only) */}
                <div className="bg-library-primary/5 dark:bg-white/5 p-3 rounded-xl border border-library-primary/10 dark:border-white/10">
                  <span className="text-[10px] uppercase font-black text-library-primary/40 dark:text-white/40 block mb-1">
                    البريد الإلكتروني
                  </span>
                  <span className="text-sm font-bold text-library-primary/80 dark:text-white/80">
                    {email}
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-library-primary/70 dark:text-gray-300 mb-2 mr-1">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-library-primary/30"
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass(false)} pr-10 pl-10`}
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      disabled={isResetting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-library-primary/60 dark:text-white/60 hover:text-library-accent transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-library-primary/70 dark:text-gray-300 mb-2 mr-1">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-library-primary/30"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass(newPassword !== confirmPassword && confirmPassword !== "")} pr-10 pl-10`}
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      disabled={isResetting}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-library-primary/60 dark:text-white/60 hover:text-library-accent transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {newPassword !== confirmPassword &&
                    confirmPassword !== "" && (
                      <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> كلمتا المرور غير متطابقتين
                      </p>
                    )}
                </div>

                <button
                  type="submit"
                  disabled={
                    isResetting ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    !validatePassword(newPassword)
                  }
                  className="w-full py-4 bg-library-primary dark:bg-white text-white dark:text-library-primary font-black rounded-xl hover:shadow-xl hover:shadow-library-primary/20 dark:hover:shadow-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isResetting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      تحديث كلمة المرور
                      <ArrowRight
                        size={20}
                        className="group-hover:translate-x-[-4px] transition-transform"
                      />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-library-primary/50 dark:text-gray-500 font-medium">
          هل تذكرت كلمة المرور؟{" "}
          <Link
            to="/login"
            className="text-library-accent font-bold hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
