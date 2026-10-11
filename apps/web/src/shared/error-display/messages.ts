/** Fixed texts of the error display, in Arabic first (until next-intl lands, these live here, not in components). */
import type { Locale } from "../api";

/** Texts one language needs. */
export interface ErrorDisplayMessages {
  readonly retry: string;
  readonly pageErrorTitle: string;
  readonly noPermissionTitle: string;
  readonly referenceLabel: string;
  readonly copyReference: string;
  readonly copied: string;
  readonly signInRedirect: string;
  readonly offlineBanner: string;
  readonly fallbackTitle: string;
  readonly fallbackDescription: string;
  readonly emptyTitle: string;
  readonly toastRegion: string;
  readonly toastClose: string;
  readonly brand: string;
}

/** The texts per language. */
export const ERROR_DISPLAY_MESSAGES: Record<Locale, ErrorDisplayMessages> = {
  ar: {
    retry: "حاولي تاني",
    pageErrorTitle: "مقدرناش نحمّل البيانات",
    noPermissionTitle: "ليس لديك صلاحية",
    referenceLabel: "رقم المرجع",
    copyReference: "نسخ رقم المرجع",
    copied: "تم النسخ",
    signInRedirect: "انتهت الجلسة، جاري تحويلك لتسجيل الدخول",
    offlineBanner: "مفيش اتصال بالإنترنت، اتأكدي من الشبكة",
    fallbackTitle: "حصلت مشكلة غير متوقعة",
    fallbackDescription: "جرّبي تحمّلي الصفحة تاني. لو المشكلة استمرت ابعتي لنا رقم المرجع.",
    emptyTitle: "لسه مفيش حاجة هنا",
    toastRegion: "الإشعارات",
    toastClose: "إغلاق",
    brand: "تفصيلة",
  },
  en: {
    retry: "Try again",
    pageErrorTitle: "We could not load the data",
    noPermissionTitle: "You do not have permission",
    referenceLabel: "Reference",
    copyReference: "Copy reference",
    copied: "Copied",
    signInRedirect: "Session expired, taking you to sign-in",
    offlineBanner: "No internet connection, check your network",
    fallbackTitle: "Something unexpected happened",
    fallbackDescription: "Try reloading the page. If it keeps happening, send us the reference.",
    emptyTitle: "Nothing here yet",
    toastRegion: "Notifications",
    toastClose: "Close",
    brand: "Tafsila",
  },
};

/** The UI language until a locale switcher exists (Arabic first, NFR-06). */
export const DEFAULT_LOCALE: Locale = "ar";
