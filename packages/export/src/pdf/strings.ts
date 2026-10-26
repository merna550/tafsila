/** Words printed on the PDF, in Arabic and English (decision 288). Listed in docs/design/copy.md under "PDF". */

/** One language's strings. */
export interface PdfStrings {
  /** Caption under the test square. */
  readonly measure: string;
  /** Instruction to print at true size. */
  readonly printActual: string;
  /** Heading of the page map. */
  readonly pageMap: string;
  /** Note under the page map. */
  readonly emptyNote: string;
  /** Note for the copy shop on the A0 header. */
  readonly shopPrint: string;
  /** The word written in the overlap strip. */
  readonly overlap: string;
  /** Label before the version number. */
  readonly version: string;
  /** Label before the client. */
  readonly client: string;
  /** Label before the engine version. */
  readonly engine: string;
}

/** The strings of both languages. */
export const PDF_STRINGS: { readonly ar: PdfStrings; readonly en: PdfStrings } = {
  ar: {
    measure: "قس هنا: 10 سم",
    printActual: "اطبع بحجم 100٪ (الحجم الفعلي)، ولا تختر «ملاءمة الصفحة»",
    pageMap: "خريطة الصفحات",
    emptyNote: "الصفحات المشطوبة فارغة ولا تُطبع",
    shopPrint: "اطلب من المحل الطباعة بحجم 100٪ بدون تكبير أو تصغير",
    overlap: "تداخل",
    version: "النسخة",
    client: "العميل",
    engine: "المحرك",
  },
  en: {
    measure: "measure me: 10 cm",
    printActual: "Print at 100% / actual size, do not fit to page",
    pageMap: "Page map",
    emptyNote: "Crossed-out pages are empty and not printed",
    shopPrint: "Ask the shop to print at 100%, no scaling",
    overlap: "overlap",
    version: "Version",
    client: "Client",
    engine: "Engine",
  },
};
