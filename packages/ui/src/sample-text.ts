/** Sample Arabic and English strings used by stories (stories are not shipped; real screens use messages files). */
const SAMPLE = {
  rtl: {
    name: "الاسم",
    hint: "كما يظهر في الفاتورة",
    error: "الاسم مطلوب",
    pick: "اختاري المقاس",
    send: "إرسال",
    link: "المساعدة",
    notes: "ملاحظات",
    options: ["صغير", "متوسط", "كبير"],
    cards: ["بدون ياقة", "ياقة صينية", "ياقة بحّارة", "ياقة قميص"],
    cardReason: "لا تناسب الرقبة المختارة",
    lowConfidence: "راجعي هذا الخيار",
    title: "العملاء",
    body: "قائمة العميلات وآخر القياسات المسجلة لكل واحدة.",
    close: "إغلاق",
    retry: "حاولي مرة أخرى",
    loading: "جارٍ التحميل",
    emptyTitle: "لا توجد عميلات بعد",
    errorTitle: "تعذر تحميل البيانات",
    status: "مدفوع",
    initials: "مس",
    banner: "لا يوجد اتصال بالإنترنت",
    navigation: "التنقل الرئيسي",
    tabs: ["القياسات", "الطلبات"],
    columns: ["الاسم", "المبلغ"],
  },
  ltr: {
    name: "Name",
    hint: "As shown on the invoice",
    error: "Name is required",
    pick: "Pick a size",
    send: "Send",
    link: "Help",
    notes: "Notes",
    options: ["Small", "Medium", "Large"],
    cards: ["No collar", "Mandarin collar", "Sailor collar", "Shirt collar"],
    cardReason: "Does not suit the chosen neck",
    lowConfidence: "Please check this",
    title: "Clients",
    body: "The list of clients and the latest measurements saved for each.",
    close: "Close",
    retry: "Try again",
    loading: "Loading",
    emptyTitle: "No clients yet",
    errorTitle: "Could not load the data",
    status: "Paid",
    initials: "MS",
    banner: "You are offline",
    navigation: "Main navigation",
    tabs: ["Measurements", "Orders"],
    columns: ["Name", "Amount"],
  },
} as const;

/** Sample strings for one reading direction. */
export type SampleText = (typeof SAMPLE)[keyof typeof SAMPLE];

/**
 * Picks the sample strings for the direction chosen in the Storybook toolbar.
 *
 * @param context - Story context carrying the `direction` global.
 * @param context.globals - The Storybook globals.
 * @returns Arabic strings for "rtl", English for anything else.
 */
export function sampleFor(context: { readonly globals: Record<string, unknown> }): SampleText {
  return context.globals.direction === "ltr" ? SAMPLE.ltr : SAMPLE.rtl;
}

/**
 * Turns the sample option labels into select options.
 *
 * @param text - Sample strings.
 * @returns Options with values "s", "m", "l".
 */
export function sizeOptions(text: SampleText): { value: string; label: string }[] {
  return ["s", "m", "l"].map((value, index) => ({ value, label: text.options[index] ?? value }));
}
