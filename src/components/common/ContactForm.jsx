import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import emailjs from "@emailjs/browser";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // يرجى استبدال هذه القيم بالمعرفات الخاصة بك من EmailJS
      // أو استخدام process.env.REACT_APP_EMAILJS_SERVICE_ID
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID";
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";
      const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

      // نستخدم formRef.current مع EmailJS لإرسال الفورم بأكمله بما يتوافق مع القوالب
      await emailjs.sendForm(serviceId, templateId, formRef.current, publicKey);
      
      toast.success("تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريباً.");
      reset();
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast.error("حدث خطأ أثناء إرسال الرسالة. يرجى التأكد من إعدادات EmailJS والمحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-7 md:p-9 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="الاسم"
            className={`contact-input w-full ${errors.user_name ? "border-red-500/50 focus:border-red-500" : ""}`}
            {...register("user_name", { required: "يرجى إدخال اسمك" })}
          />
          {errors.user_name && <p className="text-red-400 text-xs mt-1.5 px-1">{errors.user_name.message}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className={`contact-input w-full ${errors.user_email ? "border-red-500/50 focus:border-red-500" : ""}`}
            {...register("user_email", { 
              required: "يرجى إدخال بريدك الإلكتروني",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.com$/i,
                message: "يرجى إدخال بريد إلكتروني صحيح يحتوي على @ وينتهي بـ .com"
              }
            })}
          />
          {errors.user_email && <p className="text-red-400 text-xs mt-1.5 px-1">{errors.user_email.message}</p>}
        </div>
      </div>
      <div>
        <input
          type="text"
          placeholder="الموضوع"
          className={`contact-input w-full ${errors.subject ? "border-red-500/50 focus:border-red-500" : ""}`}
          {...register("subject", { required: "يرجى إدخال الموضوع" })}
        />
        {errors.subject && <p className="text-red-400 text-xs mt-1.5 px-1">{errors.subject.message}</p>}
      </div>
      <div>
        <textarea
          placeholder="رسالتك..."
          rows="5"
          className={`contact-input w-full resize-none ${errors.message ? "border-red-500/50 focus:border-red-500" : ""}`}
          {...register("message", { required: "يرجى كتابة رسالتك" })}
        ></textarea>
        {errors.message && <p className="text-red-400 text-xs mt-1.5 px-1">{errors.message.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-library-accent text-library-primary font-black rounded-xl flex items-center justify-center gap-3 hover:bg-library-accent/90 transition-all group text-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isSubmitting ? (
          <>
            جاري الإرسال...
            <Loader2 size={15} className="animate-spin" />
          </>
        ) : (
          <>
            إرسال الرسالة
            <Send
              size={15}
              className="group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform rtl:group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>
  );
};

export default ContactForm;
