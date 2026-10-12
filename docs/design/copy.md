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

| Concept                        | Arabic                                  | English                             |
| ------------------------------ | --------------------------------------- | ----------------------------------- |
| client (the tailor's customer) | عميلة / العميلات / عميلاتي              | client / clients / my clients       |
| measurement set                | مجموعة مقاسات                           | measurement set                     |
| a single measurement           | قياس                                    | measurement                         |
| standard size                  | مقاس جاهز                               | standard size                       |
| base size                      | المقاس الأساسي                          | base size                           |
| override / overridden          | تعديل / معدَّل                          | override / adjusted                 |
| custom measurements            | مقاسات مخصّصة                           | custom measurements                 |
| pattern                        | باترون / باترونات                       | pattern / patterns                  |
| my designs                     | تصاميمي                                 | my designs                          |
| phone number                   | رقم الهاتف                              | phone number                        |
| verification code              | رمز التأكيد                             | verification code                   |
| verified / not verified        | مؤكَّد / غير مؤكَّد                     | verified / not verified             |
| password                       | كلمة المرور                             | password                            |
| sign in / sign up / sign out   | تسجيل الدخول / حساب جديد / تسجيل الخروج | sign in / create account / sign out |
| admin panel                    | لوحة الإدارة                            | admin                               |
| size chart                     | جدول المقاسات                           | size chart                          |
| centimetre                     | سم / سنتيمتر                            | cm / centimetres                    |
| back                           | العودة                                  | back                                |
| free trial                     | تجربة مجانية                            | free trial                          |
| resend code                    | إعادة الإرسال                           | resend code                         |

Add a row here in the same PR whenever a new product term appears.
