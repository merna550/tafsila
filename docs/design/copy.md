# UI copy rules (Arabic and English)

Every user-facing string lives in `apps/web/messages/ar.json` and `en.json`. Both files always have the same keys; a missing key is a failing test, not a fallback.

## Arabic: simple Modern Standard Arabic

- **Fusha, not dialect.** No Egyptian or Levantine forms ("لسا", "بيـ", "هاي", "عشان").
- **Simple, not bureaucratic.** "لا توجد عميلات بعد", not "لا توجد سجلات متاحة حالياً".
- **Gender-neutral toward the user.** Tailors may be women or men. Avoid feminine or masculine imperatives:
  - actions and buttons use the verbal noun: "إضافة عميلة", "تأكيد", "حفظ المقاسات";
  - instructions use the passive or "يمكن": "يُقاس فوق ملابس خفيفة", "يمكن طلب رمز جديد بعد دقيقة";
  - second person only where it is neutral in writing: "سنرسل إليك رمزاً", "حسابي".
- **The client is a woman** (the product is women's wear): "عميلة / عميلات", feminine pronouns for her ("مقاساتها").
- Short sentences; one idea per message. Errors say what is wrong and how to fix it.

## English: plain and friendly

- Sentence case for everything (buttons, titles, tabs): "Add client", not "Add Client".
- Second person, active voice: "We sent a code to…", "Enter the code".
- Same meaning as the Arabic, not a word-for-word translation; keep it as short.

## Glossary (use these words, nothing else)

| Concept                            | Arabic                                             | English                             |
| ---------------------------------- | -------------------------------------------------- | ----------------------------------- |
| client (the tailor's customer)     | عميلة / العميلات / عميلاتي                         | client / clients / my clients       |
| delete account (confirmation word) | حذف الحساب (الكلمة: حذف)                           | delete account (word: DELETE)       |
| measurement set                    | مجموعة مقاسات                                      | measurement set                     |
| a single measurement               | قياس                                               | measurement                         |
| standard size                      | مقاس جاهز                                          | standard size                       |
| base size                          | المقاس الأساسي                                     | base size                           |
| override / overridden              | تعديل / معدَّل                                     | override / adjusted                 |
| custom measurements                | مقاسات مخصّصة                                      | custom measurements                 |
| pattern                            | باترون / باترونات                                  | pattern / patterns                  |
| my designs                         | تصاميمي                                            | my designs                          |
| design (one garment design)        | تصميم / تصاميم                                     | design / designs                    |
| version (saved copy of a pattern)  | نسخة / النسخ                                       | version / versions                  |
| save version / restore version     | حفظ نسخة / استعادة النسخة                          | save version / restore version      |
| ease preference                    | الراحة: ضيّق / عادي / فضفاض                        | ease: fitted / regular / loose      |
| seam allowance                     | سماحة الخياطة                                      | seam allowance                      |
| validation report                  | تقرير التحقق                                       | validation report                   |
| dress / skirt / blouse             | فستان / تنورة / بلوزة                              | dress / skirt / blouse              |
| phone number                       | رقم الهاتف                                         | phone number                        |
| verification code                  | رمز التأكيد                                        | verification code                   |
| verified / not verified            | مؤكَّد / غير مؤكَّد                                | verified / not verified             |
| admin panel                        | لوحة الإدارة                                       | admin panel                         |
| admin (the link)                   | الإدارة                                            | admin                               |
| users (admin list)                 | المستخدمون                                         | users                               |
| size chart                         | جدول المقاسات                                      | size chart                          |
| import / export CSV                | استيراد CSV / تصدير CSV                            | import CSV / export CSV             |
| discard changes                    | تجاهل التعديلات                                    | discard changes                     |
| password                           | كلمة المرور                                        | password                            |
| sign in / sign up / sign out       | تسجيل الدخول / حساب جديد / تسجيل الخروج            | sign in / create account / sign out |
| admin panel                        | لوحة الإدارة                                       | admin                               |
| size chart                         | جدول المقاسات                                      | size chart                          |
| centimetre                         | سم / سنتيمتر                                       | cm / centimetres                    |
| back                               | العودة                                             | back                                |
| free trial                         | تجربة مجانية                                       | free trial                          |
| resend code                        | إعادة الإرسال                                      | resend code                         |
| seam / dart / hem                  | خياطة / دارت / ذيل                                 | seam / dart / hem                   |
| facing / interfacing               | بطانة داخلية / حشوة لاصقة                          | facing / interfacing                |
| press / gather / bind              | اكوي / جمّعي / قفّلي بشريط مائل                    | press / gather / bind               |
| zip / buttonhole                   | سوستة / عروة                                       | zip / buttonhole                    |
| projector / calibration            | بروجكتر / معايرة                                   | projector / calibration             |
| verification square                | مربع التحقق                                        | verification square                 |
| direct cut / marking step          | قص مباشر / خطوة تعليم                              | direct cut / marking step           |
| clear ticks / curve point spacing  | إعادة ضبط التقدّم / المسافة بين النقاط على المنحنى | clear ticks / curve point spacing   |
| print view                         | عرض الطباعة                                        | print view                          |
| reference line / fold / selvedge   | خط مرجعي / الطيّة / حافة القماش                    | reference line / fold / selvedge    |
| top line / notch / grain line      | الخط العلوي / علامة المطابقة / خط النسيج           | top line / notch / grain line       |
| tile / overlap                     | صفحة (من الباترون المقسّم) / تداخل                 | tile / overlap                      |
| test square                        | مربع اختباري (10 سم)                               | test square (10 cm)                 |
| use this version / mirror          | استخدمي هذه النسخة / عكس                           | use this version / mirror           |

### PDF (A4 print file, `packages/export/src/pdf/strings.ts`)

| Where                 | Arabic                                                  | English                                         |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| Under the test square | قس هنا: 10 سم                                           | measure me: 10 cm                               |
| Print line            | اطبع بحجم 100٪ (الحجم الفعلي)، ولا تختر «ملاءمة الصفحة» | Print at 100% / actual size, do not fit to page |
| Page map heading      | خريطة الصفحات                                           | Page map                                        |
| Page map note         | الصفحات المشطوبة فارغة ولا تُطبع                        | Crossed-out pages are empty and not printed     |
| Overlap strip         | تداخل                                                   | overlap                                         |

A0 header (issue #290, sheet 1 of the A0 file):

| Where          | Arabic                                              | English                                   |
| -------------- | --------------------------------------------------- | ----------------------------------------- |
| Copy-shop note | اطلب من المحل الطباعة بحجم 100٪ بدون تكبير أو تصغير | Ask the shop to print at 100%, no scaling |

The export dialog rows: `A0 (محل الطباعة)` / `A0 (copy shop)`, hint "ورقة واحدة كبيرة لمحل الطباعة. اطلبي منهم الطباعة بحجم 100%." / "One big sheet for a copy shop. Ask the shop to print at 100%."

Add a row here in the same PR whenever a new product term appears.
