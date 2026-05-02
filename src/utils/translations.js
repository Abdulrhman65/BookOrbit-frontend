export const notificationTranslations = {
  // الأنماط المعقدة (Complex Patterns - should be first)
  "Your request for the book": "طلبك لكتاب",
  "for the book": "للكتاب",
  "for your copy of the book": "لنسختك من كتاب",
  "A student has requested your copy of the book": "طلب أحد الطلاب استعارة نسختك من كتاب",
  "You have been rated": "لقد حصلت على تقييم",
  "stars": "نجوم",
  "star": "نجمة",
  "You have earned": "لقد ربحت",
  "points": "نقاط",
  "point": "نقطة",
  "Your": "طلبك الـ",

  // العناوين (Titles)
  "Borrowing Request": "طلب استعارة",
  "Request Accepted": "تم قبول الطلب",
  "Request Rejected": "تم رفض الطلب",
  "Request Cancelled": "تم إلغاء الطلب",
  "Book Delivered": "تم تسليم الكتاب",
  "Book Returned": "تم إرجاع الكتاب",
  "New Review": "تقييم جديد",
  "Points Received": "نقاط مكتسبة",
  "System Update": "تحديث النظام",
  "Reminder": "تذكير",

  // الجمل الشائعة (Messages)
  "has been accepted": "تم قبوله",
  "has been rejected": "تم رفضه",
  "wants to borrow": "يريد استعارة",
  "has returned the book": "قام بإرجاع الكتاب",
  "has delivered the book": "قام بتسليم الكتاب",
  "Successfully": "بنجاح",
  "Your request for": "طلبك لـ",
  "New borrowing request from": "طلب استعارة جديد من",
  "You received": "لقد استلمت",
};

export const translateNotificationText = (text) => {
  if (!text) return text;
  let translated = text;
  Object.entries(notificationTranslations).forEach(([en, ar]) => {
    const regex = new RegExp(en, "gi");
    translated = translated.replace(regex, ar);
  });
  return translated;
};
