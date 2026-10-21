# ديمو مواقع العيادات — Digital Solution Egypt

3 ديمو جاهزين للرفع على Cloudflare Pages، متبنيين على الـ PRD (عربي أولًا، RTL، Mobile-first، حجز 24/7، واتساب، وامتثال للائحة):

| الديمو | النوع | المسار | المميز فيه |
|---|---|---|---|
| `dr-ahmed-samy` | براند دكتور (عظام) | `/dr-ahmed-samy/` | فرعين، وحجز بميعاد محدد |
| `dr-mona-elsherif` | براند دكتورة (أنف وأذن) | `/dr-mona-elsherif/` | فرع بنظام **أسبقية الحضور** وفرع بميعاد |
| `smile-line-dental` | مركز / عيادة (أسنان) | `/smile-line-dental/` | 3 أطباء، والحجز فيه خطوة **اختيار الدكتور** |

كل ديمو فيه: الرئيسية، وعن الدكتور (أو صفحة لكل دكتور في المركز)، و3 خدمات، والفروع (صفحة لكل فرع فيها خريطة ومواعيد وحالة "مفتوح/مقفول" دلوقتي)، والحجز (wizard)، والتقييمات، و3 مقالات، والأسئلة الشائعة، والخصوصية، و**لوحة العيادة** (`/dashboard/`)، وصفحة هبوط للحملة (`/lp/...`). وفيه كمان Schema كامل (Physician / MedicalClinic / FAQPage / BreadcrumbList)، والتقاط UTM وgclid وfbclid مع كل حجز، وevents بأسماء محايدة.

> كل الصفحات `noindex` لأنها ديمو، ومكتوب عليها بانر "نموذج تجريبي".

---

## 1) تحط اسم الدكتور الحقيقي وصوره من Google Maps

كل ديمو عبارة عن ملف واحد: `demos/<slug>/site.json`.

1. **انسخ أقرب ديمو للتخصص** (عشان ماتبوظش الأصلي):
   ```bash
   node scripts/new-demo.mjs dr-ahmed-samy dr-mohamed-xxx
   ```
2. افتح `demos/dr-mohamed-xxx/site.json` وغيّر الحاجات دي:
   - `brand` (الاسم والعنوان والسطر الفرعي)، و`doctors[0]` (الاسم والمؤهلات والنبذة).
   - `branches`: العنوان والتليفون والمواعيد، و`lat`/`lng`، و`mapsUrl` (لينك الدكتور على جوجل ماب)، و`reviewUrl`.
   - `rating`: التقييم الحقيقي وعدد التقييمات من بروفايل GBP.
   - **`whatsapp` و`phone`:** حط رقم الوكالة أو الرقم اللي هتجرّب عليه (`201xxxxxxxxx`). القيمة الحالية `201000000000` وهمية، **غيّرها قبل ما تبعت أي لينك**.
3. **الصور من Google Maps:** افتح بروفايل الدكتور ← Photos ← افتح الصورة ← كليك يمين ← *Copy image address*. هتلاقي لينك بيبدأ بـ `https://lh3.googleusercontent.com/...`. الصقه في:
   - `doctors[i].photo` ← صورة الدكتور.
   - `branches[i].photos` ← لحد 3 صور (الواجهة، الاستقبال، غرفة الكشف).
   - `brand.heroPhoto` ← اختياري، لو عايز صورة غير صورة الدكتور في الـ Hero.

   أو نزّل الصورة وحطها في `demos/<slug>/photos/doctor.jpg` واكتب `"photo": "photos/doctor.jpg"`. **ده الأضمن**، لأن لينكات جوجل ممكن تتغير.
   لو مافيش صورة، الموقع بيعرض placeholder شيك بالحروف الأولى من الاسم.
4. ابني: `node build.mjs`

> **ملاحظة مهمة:** الصور اللي على Google Maps ملك اللي رفعها، سواء الدكتور أو المرضى. استخدامها في ديمو بتبعته للدكتور نفسه مقبول، لكن **قبل ما الموقع يتنشر رسميًا لازم تاخد موافقة الدكتور وصور منه**. ومن غير صور مرضى خالص.
> التقييمات المعروضة في الديمو نماذج ومكتوب عليها كده. ماتكتبش تقييمات باسم ناس حقيقيين.

## 2) الرفع على Cloudflare Pages

**الطريقة الأسهل (من غير أي برنامج):**
Cloudflare Dashboard ← Workers & Pages ← Create ← Pages ← *Upload assets* ← اسحب فولدر `dist` كله. فولدر `dist` متبني ومرفوع في الريبو جاهز.
اللينكات هتبقى: `https://<project>.pages.dev/dr-ahmed-samy/` وهكذا.

**بالـ CLI (لو عايز تأكيد الواتساب الحقيقي يشتغل):**
```bash
npx wrangler login
npm run deploy        # = node build.mjs && wrangler pages deploy dist --project-name dse-demos
```
الطريقة دي بترفع كمان `functions/api/book.js`. أما الـ Upload من الداشبورد فمابيرفعش الـ functions، والحجز ساعتها بيشتغل بالـ fallback.

**تربطه بـ GitHub:** اعمل Pages project من الريبو، وBuild command: `node build.mjs`، وOutput: `dist`.

**ديمو لوحده على دومين خاص** (مثلًا `dr-x.dse-demo.com`): ابنيه بـ `BASE=/ node build.mjs dr-x`، وبعدها ارفع `dist` في project لوحده.

## 3) "لحظة الإبهار": تأكيد الواتساب

- **من غير إعداد:** بعد الحجز بيظهر زرار "افتح رسالة التأكيد على واتساب"، وده بيفتح رسالة التأكيد الكاملة جاهزة على رقم الموبايل اللي اتكتب في الحجز. الدكتور يكتب رقمه ويشوف الرسالة على موبايله.
- **تأكيد حقيقي أوتوماتيك** (WhatsApp Cloud API):
  1. اعمل template من نوع **UTILITY** اسمه `appointment_confirmation` باللغة `ar`، وفيه 6 متغيرات:
     `أهلًا {{1}}، ميعادك مع {{2}} اتأكد: {{3}} – {{4}}، فرع {{5}}. الخريطة: {{6}}`
  2. في Pages ← Settings ← Variables and Secrets ضيف: `WA_TOKEN` (secret)، و`WA_PHONE_NUMBER_ID`، واختياري `WA_TEMPLATE` و`WA_LANG` و`WA_NOTIFY` (رقم السكرتارية لإشعار "حجز جديد").
  3. اختياري: KV binding اسمه `BOOKINGS` علشان الحجوزات تتحفظ على السيرفر لمدة 30 يوم.
  ماتحطش أي "عرض" أو "خصم" في القالب، علشان مايتصنّفش marketing وتدفع حوالي 18 ضعف.

## 4) التتبّع

حط IDs في `tracking` جوه `site.json`، وهي `ga4` و`metaPixel`. السكريبتات بتتحمّل بعد أول تفاعل علشان الأداء.
الـ events: `cta_whatsapp_click`، و`cta_call_click`، و`cta_book_click`، و`booking_start`، و`booking_step`، و`booking_submit` (وده بيتبعت لـ GA4 كـ `generate_lead`)، و`directions_click`. وفي Meta بتتبعت بأسماء custom محايدة: `ContactWA`، و`FlowStart`، و`FlowComplete`.
**ممنوع** يتبعت اسم الخدمة أو سبب الزيارة لأي pixel. سبب الزيارة والملاحظة بيفضلوا على الجهاز ومش بيتبعتوا حتى للـ API.

جرّب الإسناد: افتح `/<slug>/book/?utm_source=facebook&utm_medium=paid_social` واحجز، وبعدها افتح `/<slug>/dashboard/`.

## هيكل الملفات

```
build.mjs              المولّد (Node 18+، من غير dependencies)
demos/<slug>/site.json بيانات كل ديمو
demos/<slug>/photos/   صور محلية (اختياري)
assets/                CSS + JS (site / book / dash)
functions/api/book.js  Cloudflare Pages Function لإرسال الواتساب
static/                _headers (noindex + أمان) و robots.txt
dist/                  الناتج الجاهز للرفع
```

## قبل ما تبعت لأي دكتور (Checklist)

- [ ] الاسم والتخصص والفروع والمواعيد بتاعته هو.
- [ ] صورته شغالة (افتح الديمو من موبايلك).
- [ ] رقم الواتساب والاتصال رقم الوكالة مش `201000000000`.
- [ ] مافيش "الأفضل" أو "رقم 1" أو "خصم" أو "عرض" أو "تقسيط" في أي نص.
- [ ] جرّبت الحجز كامل من الموبايل.
