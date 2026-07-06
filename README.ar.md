<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="GLB_FACTORY — استوديو تحويل الصور إلى أفاتار ثلاثي الأبعاد" width="100%"/>
</p>

# GLB_FACTORY

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-f59e0b?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/photo-to-glb-spin.svg" alt="رسم متحرك: صورة شخصية تتحول إلى أفاتار GLB ثلاثي الأبعاد يدور" width="420"/>
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/GLB_FACTORY/"><img src="https://img.shields.io/badge/🌐_عرض_مباشر-f59e0b?style=for-the-badge" alt="عرض مباشر"/></a>
  <img src="https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

**استوديو تفاعلي لتحويل الصور الشخصية إلى أفاتار ثلاثي الأبعاد.** ارفعي صورة شخصية، ودعي
التطبيق يقرأ الوجه ولون البشرة والشعر والملابس، ثم صدّري نموذج **GLB** جاهزًا بالكامل
لمحركات الألعاب، من دون أي خبرة في النمذجة ثلاثية الأبعاد.

التطبيق المباشر: [dacameragirl.github.io/GLB_FACTORY](https://dacameragirl.github.io/GLB_FACTORY/)

---

## أبرز المزايا

| الميزة | ماذا تفعل |
|---|---|
| **صورة ← أفاتار** | ارفعي صورة شخصية واحدة واحصلي على شخصية ثلاثية الأبعاد جاهزة للألعاب |
| **استخراج الألوان اعتمادًا على الوجه** | يكتشف لون البشرة والشعر والملابس مباشرة من الصورة |
| **اقتراح تسريحة الشعر** | يقترح نوع تسريحة مناسبًا بناءً على الصورة الأصلية |
| **معاينة ثلاثية الأبعاد مباشرة** | دوّري وكبّري وافحصي الأفاتار الناتج في عارض Three.js قبل التصدير |
| **تصدير GLB بنقرة واحدة** | نزّلي ملف `.glb` قياسي جاهزًا لمحركات الألعاب وعارضات النماذج ثلاثية الأبعاد |
| **يعمل بوجود خادم أو من دونه** | تحليل كامل عبر Gemini عند الاستضافة، وتحوّل تلقائي إلى تحليل بالمتصفح في الوضع الساكن |

## بنية ذات وضعين

صُمم GLB_FACTORY للعمل بطريقتين مختلفتين حسب مكان نشره، ويختار الطريقة المناسبة تلقائيًا:

1. **الوضع المدعوم بالذكاء الاصطناعي (استضافة Node/Express)** — في بيئة متكاملة مثل
   التطوير المحلي أو حاوية سحابية، يتواصل التطبيق مع وسيط خلفي متصل بـ **Gemini 3.5 Flash**.
   يحدد Gemini موقع الوجه تلقائيًا ويستخرج لون البشرة ولون الشعر ولون الملابس وتسريحة
   مقترحة بدقة بصرية عالية.

2. **وضع الاحتياط الساكن (GitHub Pages)** — عند عدم توفر خادم خلفي، يكتشف التطبيق البيئة
   الساكنة وينتقل إلى **تحليل الوجه من جهة المتصفح**: يقرأ عيّن كانفاس HTML5 خفيف بيانات
   بكسل الصورة مباشرة داخل المتصفح، ويستخرج نفس ألوان البشرة والشعر والملابس من دون أي
   طلبات شبكة.

نفس الواجهة، ونفس نتيجة GLB، لكن بمحركين مختلفين خلف الكواليس، بحسب ما يمكن لبيئة النشر
تشغيله فعليًا.

---

## البدء السريع

```bash
npm install
npm run dev
```

افتحي [http://localhost:3000](http://localhost:3000) في المتصفح.

لتفعيل التحليل بالذكاء الاصطناعي محليًا، أضيفي مفتاح Gemini:

```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

من دون مفتاح، يظل التطبيق يعمل، ويستخدم فقط محلل الاحتياط من جهة المتصفح.

## النشر على GitHub Pages

يتضمن المستودع ملف `.github/workflows/deploy.yml` الذي يبني وينشر التطبيق الساكن مع كل
دفع (push) إلى فرع `main`.

1. اذهبي إلى المستودع على GitHub، ثم **Settings**.
2. ضمن **Code and automation → Pages**، اضبطي **Source** على **GitHub Actions**.
3. ادفعي إلى `main` وتابعي عملية البناء من تبويب **Actions**.

---

## التقنيات المستخدمة

| الطبقة | التقنية |
|---|---|
| العرض ثلاثي الأبعاد | **Three.js** — عرض WebGL وبناء شبكي إجرائي للأفاتار |
| الواجهة الأمامية | **React 19** + **Vite 6** — بيئة تشغيل وبناء التطبيق أحادي الصفحة |
| التنسيق | **Tailwind CSS v4** |
| الأيقونات | **Lucide React** |
| الخلفية | **Express** + **Google GenAI SDK** — وسيط لواجهة برمجة Gemini |

## المساهمون

- Angela — توجيه المنتج، الاختبار
- Claude — التنفيذ وسير عمل GitHub

## إشعار قانوني

تُعالج الصور المرفوعة فقط بغرض توليد أفاتار ثلاثي الأبعاد. في الوضع المدعوم بالذكاء
الاصطناعي، تُرسل بيانات الصورة إلى واجهة Gemini وفق شروط Google؛ وفي وضع الاحتياط الساكن،
يتم التحليل بالكامل داخل المتصفح ولا تغادر أي بيانات الجهاز.
