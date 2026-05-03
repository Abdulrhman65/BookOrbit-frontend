import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import { identityApi } from "../services/api";

const hasUpper = (v) => /[A-Z]/.test(v);
const hasLower = (v) => /[a-z]/.test(v);
const hasDigit = (v) => /\d/.test(v);

const ChangePassword = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const validation = {
    currentPassword: form.currentPassword.trim().length > 0,
    newPasswordMin: form.newPassword.length >= 8,
    newPasswordUpper: hasUpper(form.newPassword),
    newPasswordLower: hasLower(form.newPassword),
    newPasswordDigit: hasDigit(form.newPassword),
    newPasswordDifferent: form.newPassword.length > 0 && form.newPassword !== form.currentPassword,
    confirmMatch: form.confirmPassword.length > 0 && form.confirmPassword === form.newPassword,
  };

  const isFormValid =
    validation.currentPassword &&
    validation.newPasswordMin &&
    validation.newPasswordUpper &&
    validation.newPasswordLower &&
    validation.newPasswordDigit &&
    validation.newPasswordDifferent &&
    validation.confirmMatch;

  const fieldState = (key) => {
    if (!touched[key]) return "idle";
    if (key === "currentPassword") return validation.currentPassword ? "valid" : "invalid";
    if (key === "newPassword") {
      return validation.newPasswordMin &&
        validation.newPasswordUpper &&
        validation.newPasswordLower &&
        validation.newPasswordDigit &&
        validation.newPasswordDifferent
        ? "valid"
        : "invalid";
    }
    if (key === "confirmPassword") return validation.confirmMatch ? "valid" : "invalid";
    return "idle";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({
        currentPassword: true,
        newPassword: true,
        confirmPassword: true,
      });
      toast.error("راجع الحقول غير الصحيحة قبل المتابعة");
      return;
    }

    setIsSubmitting(true);
    const t = toast.loading("جاري تحديث كلمة المرور...");
    try {
      await identityApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("تم تغيير كلمة المرور بنجاح", { id: t });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      navigate("/profile");
    } catch (err) {
      toast.error(err?.message || "تعذر تغيير كلمة المرور", { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-library-paper dark:bg-dark-bg pb-12 pt-under-fixed-nav lg:pt-under-fixed-nav-lg" dir="rtl">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-xs font-black text-library-primary/60 transition-colors hover:text-library-accent dark:text-gray-400 dark:hover:text-library-accent"
        >
          <ArrowRight size={14} />
          رجوع
        </motion.button>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-dark-surface/90">
          <div className="relative border-b border-gray-100 bg-library-primary px-6 py-7 text-white dark:border-white/5 sm:px-8">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-library-accent/20 blur-3xl" aria-hidden />
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-library-paper">
              <ShieldCheck size={12} />
              الأمان والخصوصية
            </p>
            <h1 className="text-2xl font-black sm:text-3xl">تغيير كلمة المرور</h1>
            <p className="mt-2 text-sm font-bold text-white/70">
              واجهة آمنة مع تحقق لحظي لكل شرط أثناء الكتابة.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-5">
            <div className="border-b border-gray-100 p-6 dark:border-white/5 lg:col-span-3 lg:border-b-0 lg:border-l sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "currentPassword", label: "كلمة المرور الحالية", show: showCurrent, setShow: setShowCurrent },
              { key: "newPassword", label: "كلمة المرور الجديدة", show: showNew, setShow: setShowNew },
              { key: "confirmPassword", label: "تأكيد كلمة المرور الجديدة", show: showConfirm, setShow: setShowConfirm },
            ].map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-black text-library-primary/65 dark:text-gray-300">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.show ? "text" : "password"}
                    name={field.key}
                    value={form[field.key]}
                    onChange={handleChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border bg-white px-4 py-3 pl-11 pr-11 text-sm font-bold text-library-primary outline-none transition-all focus:ring-2 disabled:opacity-70 dark:bg-dark-surface dark:text-white ${
                      fieldState(field.key) === "valid"
                        ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200 dark:border-emerald-500/40"
                        : fieldState(field.key) === "invalid"
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200 dark:border-rose-500/40"
                          : "border-library-primary/10 focus:border-library-accent/40 focus:ring-library-accent/20 dark:border-white/10"
                    }`}
                    placeholder={field.label}
                    autoComplete={field.key === "currentPassword" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => field.setShow((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:text-library-accent"
                    aria-label="إظهار/إخفاء كلمة المرور"
                  >
                    {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {fieldState(field.key) === "valid" ? (
                      <CircleCheck size={14} className="text-emerald-500" />
                    ) : fieldState(field.key) === "invalid" ? (
                      <CircleAlert size={14} className="text-rose-500" />
                    ) : (
                      <KeyRound size={14} className="text-library-primary/25 dark:text-gray-500" />
                    )}
                  </div>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {fieldState(field.key) === "invalid" && field.key === "currentPassword" && (
                    <motion.p
                      key="err-current"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] font-black text-rose-500"
                    >
                      أدخل كلمة المرور الحالية.
                    </motion.p>
                  )}
                  {fieldState(field.key) === "invalid" && field.key === "confirmPassword" && (
                    <motion.p
                      key="err-confirm"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] font-black text-rose-500"
                    >
                      تأكيد كلمة المرور غير مطابق.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-xs font-black text-gray-600 transition-all hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-library-primary px-5 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-library-accent disabled:opacity-70 dark:bg-white dark:text-library-primary dark:hover:bg-library-accent dark:hover:text-white"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {isSubmitting ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
              </button>
            </div>
              </form>
            </div>

            <div className="bg-library-paper/70 p-6 dark:bg-dark-bg/40 lg:col-span-2 sm:p-8">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="mb-3 text-xs font-black text-amber-700 dark:text-amber-300">مستوى أمان كلمة المرور</p>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-700/20">
                  <motion.div
                    initial={false}
                    animate={{
                      width: `${[
                        validation.newPasswordMin,
                        validation.newPasswordUpper,
                        validation.newPasswordLower,
                        validation.newPasswordDigit,
                        validation.newPasswordDifferent,
                      ].filter(Boolean).length * 20}%`,
                    }}
                    transition={{ duration: 0.35 }}
                    className="h-full rounded-full bg-library-accent"
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { ok: validation.newPasswordMin, label: "8 أحرف على الأقل" },
                    { ok: validation.newPasswordUpper, label: "حرف كبير (A-Z)" },
                    { ok: validation.newPasswordLower, label: "حرف صغير (a-z)" },
                    { ok: validation.newPasswordDigit, label: "رقم واحد على الأقل" },
                    { ok: validation.newPasswordDifferent, label: "ليست الحالية" },
                    { ok: validation.confirmMatch, label: "التأكيد مطابق" },
                  ].map((rule) => (
                    <motion.div
                      key={rule.label}
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2 text-[11px] font-bold ${
                        rule.ok ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {rule.ok ? <CircleCheck size={13} /> : <CircleAlert size={13} />}
                      <span>{rule.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-library-primary/10 bg-white p-4 dark:border-white/10 dark:bg-dark-surface">
                <h3 className="mb-2 text-xs font-black text-library-primary dark:text-white">نصائح سريعة</h3>
                <ul className="space-y-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <li>لا تستخدم اسمك أو تاريخ ميلادك.</li>
                  <li>استخدم كلمة مرور مختلفة لكل منصة.</li>
                  <li>حدّث كلمة المرور بشكل دوري.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
