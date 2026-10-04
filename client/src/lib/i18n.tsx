import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fa" | "en";
const STORAGE_KEY = "4miem-lang";

const fa = {
  nav: {
    label: "صفحه‌های استودیو",
    home: "خانه",
    gallery: "گالری",
    services: "خدمات",
    shop: "فروشگاه",
    ai: "هوش مصنوعی",
    about: "درباره",
    contact: "تماس",
    skip: "پرش به محتوا",
    switchLang: "Switch to English",
    langShort: "EN",
    soundOn: "قطع صدا",
    soundOff: "روشن کردن صدا",
  },
  home: {
    bootPrompt: "برای ورود به اتاق فرمان و فعال‌سازی سیستم صوتی کلیک کنید",
    bootStart: "اتصال و شروع سیستم",
    bootSkip: "ورود به استودیو",
    bootSub: "استودیوی مستقل تصویرسازی برای ایده‌هایی که آرام نمی‌گیرند.",
    kicker: "استودیوی مستقل تصویرسازی",
    hint: "برای ورود، تندیس بی‌نهایت را لمس کن.",
    enter: "ورود به گالری",
    footer: "بکشید یا لمس کنید",
    sceneIdle: "MOVE CLOSER / TAP TO ENTER",
  },
  contact: {
    title: "جرقه را برایمان بگو.",
    subtitle: "یک جمله، یک حس یا یک تصویر کافی‌ست تا شروع کنیم.",
    close: "بستن",
    name: "نام شما",
    email: "ایمیل",
    phone: "شماره تماس",
    service: "نوع پروژه",
    brief: "خلاصه پروژه",
    namePh: "علیرضا",
    briefPh: "درباره پروژه‌تان بنویسید...",
    services: { "Film & commercial": "فیلم و تبلیغات", Branding: "برندینگ", "Web & 3D Experience": "وب و تجربه سه‌بعدی" } as Record<string, string>,
    submit: "ارسال پیام و ثبت نهایی",
    sending: "در حال ثبت اطلاعات...",
    okTitle: "پیام شما با موفقیت ثبت شد",
    okText: "اطلاعات شما ثبت شد. برای گفتگوی مستقیم، می‌توانید از طریق واتساپ نیز اقدام کنید:",
    whatsapp: "ارتباط مستقیم در واتساپ 💬",
    again: "بازگشت به فرم / ارسال پیام جدید",
    badPhone: "لطفاً شماره تماس معتبر وارد کنید (مثال: 09123456789 یا +441234567890)",
    badEmail: "لطفاً یک ایمیل معتبر وارد کنید.",
    invalid: "اطلاعات واردشده معتبر نیست. فرم را بررسی کنید.",
    network: "خطا در ارتباط با سرور. اینترنت را بررسی کنید و دوباره تلاش کنید.",
    tooMany: "تعداد درخواست‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.",
    waMessage: (name: string, service: string) => `سلام، من ${name} هستم. درخواست پروژه (${service}) را در سایت ثبت کردم.`,
  },
  shop: {
    eyebrow: "04 / فروشگاه استودیو",
    title: "یک قالب",
    titleEm: "انتخاب کن.",
    intro: "بسته‌های تولید بر اساس بریف شما تعیین می‌شوند. برآورد را تنظیم کنید و گفتگو را شروع کنید.",
    packages: "بسته‌های استودیو",
    package: "بسته",
    from: "از",
    toman: "تومان",
    quick: "برآورد سریع",
    scope: "گستره تولید",
    standard: "استاندارد / ۱.۰×",
    expanded: "گسترده / ۱.۴۵×",
    deliverables: "تعداد خروجی",
    less: "کم کردن",
    more: "زیاد کردن",
    total: "برآورد کل",
    note: "قیمت نهایی پس از بررسی بریف پروژه تایید می‌شود.",
    cta: "گفتگو درباره این بسته",
    products: {
      campaign: { name: "فیلم کمپین با هوش مصنوعی", type: "برند / ۳۰ تا ۶۰ ثانیه" },
      identity: { name: "پکیج هویت بصری", type: "هویت / دیجیتال" },
      music: { name: "دنیای موزیک‌ویدیو", type: "موسیقی / ۲۰ تا ۴۵ ثانیه" },
    } as Record<string, { name: string; type: string }>,
  },
  ai: {
    eyebrow: "05 / استودیوی هوش مصنوعی 4MIEM",
    title: "ناممکن را",
    titleEm: "بساز.",
    intro: "ایده‌ات را بنویس؛ کانسپت و تصویر هوش مصنوعی بگیر.",
    tools: "ابزارهای هوش مصنوعی",
    promptLabel: "ایده‌ات را بنویس",
    promptPh: "مثلاً: یک خیابان خیس نئونی در تهران، سال ۲۰۸۰...",
    generate: "بساز",
    working: "در حال ساخت...",
    thinking: "هوش مصنوعی در حال فکر کردن است...",
    rendering: "در حال ساخت تصویر...",
    reset: "شروع دوباره",
    ready: "آماده / منتظر ایده",
    response: "پاسخ هوش مصنوعی",
    error: "خطا در اتصال",
    yourPrompt: "ایده شما:",
    clear: "پاک کردن",
    sceneLabel: "ایده صحنه",
    empty: "پاسخی دریافت نشد.",
    errOffline: "سرویس هوش مصنوعی فعلاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    errBusy: "درخواست‌ها زیاد است. یک دقیقه صبر کنید و دوباره تلاش کنید.",
    errTimeout: "زمان انتظار تمام شد. دوباره تلاش کنید.",
    imgFail: "ساخت تصویر انجام نشد (سرویس در دسترس نیست یا سهمیه تمام شده). فقط پاسخ متنی نمایش داده شد.",
    tools_: {
      image: { name: "کارگاه تصویر", type: "تصویر ثابت / استایل‌فریم" },
      motion: { name: "آزمایشگاه حرکت", type: "ویدیو / لوپ" },
      portrait: { name: "سیگنال پرتره", type: "پرتره / پرفورمنس" },
    } as Record<string, { name: string; type: string }>,
  },
  notFound: {
    title: "این صفحه پیدا نشد",
    text: "آدرس اشتباه است یا صفحه جابه‌جا شده.",
    home: "بازگشت به خانه",
  },
  services: {
    eyebrow: "03 / خدمات",
    lead: "تیزر، فیلم تبلیغاتی، هویت بصری و تجربه‌های وب سه‌بعدی؛ همه با ترکیب هوش مصنوعی و کارگردانی انسانی.",
    process: "روش کار",
    faq: "پرسش‌های متداول",
    ctaTitle: "پروژه‌ای در ذهن داری؟",
    ctaText: "یک جمله بنویس تا شروع کنیم.",
    cta: "شروع پروژه",
    ctaShop: "دیدن بسته‌ها",
  },
};

type Dict = typeof fa;

const en: Dict = {
  nav: {
    label: "Studio pages",
    home: "HOME",
    gallery: "GALLERY",
    services: "SERVICES",
    shop: "SHOP",
    ai: "AI STUDIO",
    about: "ABOUT",
    contact: "CONTACT",
    skip: "Skip to content",
    switchLang: "تغییر به فارسی",
    langShort: "FA",
    soundOn: "Mute sound",
    soundOff: "Turn sound on",
  },
  home: {
    bootPrompt: "Click to enter the control room and enable sound",
    bootStart: "Connect and start the system",
    bootSkip: "ENTER STUDIO",
    bootSub: "An independent image-making studio for ideas that refuse to stay still.",
    kicker: "INDEPENDENT IMAGE-MAKING STUDIO",
    hint: "Touch the infinity monolith to enter.",
    enter: "Enter the gallery",
    footer: "DRAG / TOUCH TO EXPLORE",
    sceneIdle: "MOVE CLOSER / TAP TO ENTER",
  },
  contact: {
    title: "Tell us the spark.",
    subtitle: "One sentence, one feeling or one image is enough to begin.",
    close: "Close",
    name: "Your Name",
    email: "Email",
    phone: "Phone Number",
    service: "Project Type",
    brief: "The Short Version",
    namePh: "Your name",
    briefPh: "Tell us about your project...",
    services: { "Film & commercial": "Film & commercial", Branding: "Branding", "Web & 3D Experience": "Web & 3D Experience" },
    submit: "Send message",
    sending: "Sending...",
    okTitle: "Your message was received",
    okText: "We have your details. For a direct conversation you can also reach us on WhatsApp:",
    whatsapp: "Chat on WhatsApp 💬",
    again: "Back to the form / send another message",
    badPhone: "Please enter a valid phone number (e.g. 09123456789 or +441234567890)",
    badEmail: "Please enter a valid email address.",
    invalid: "Some details look invalid. Please check the form.",
    network: "Could not reach the server. Check your connection and try again.",
    tooMany: "Too many requests. Please try again in a few minutes.",
    waMessage: (name: string, service: string) => `Hi, I'm ${name}. I just submitted a project request (${service}) on your website.`,
  },
  shop: {
    eyebrow: "04 / STUDIO SHOP",
    title: "Choose a",
    titleEm: "format.",
    intro: "Production packages are scoped to your brief. Adjust the estimate, then start a conversation.",
    packages: "Studio packages",
    package: "PACKAGE",
    from: "From",
    toman: "Toman",
    quick: "QUICK ESTIMATE",
    scope: "PRODUCTION SCOPE",
    standard: "Standard / 1.0×",
    expanded: "Expanded / 1.45×",
    deliverables: "DELIVERABLES",
    less: "Decrease quantity",
    more: "Increase quantity",
    total: "ESTIMATED TOTAL",
    note: "Final pricing is confirmed after reviewing the production brief.",
    cta: "DISCUSS THIS PACKAGE",
    products: {
      campaign: { name: "AI Campaign Film", type: "BRAND / 00:30—01:00" },
      identity: { name: "Visual Identity Kit", type: "IDENTITY / DIGITAL" },
      music: { name: "Music Video World", type: "MUSIC / 00:20—00:45" },
    },
  },
  ai: {
    eyebrow: "05 / 4MIEM AI STUDIO",
    title: "Make the",
    titleEm: "impossible.",
    intro: "Write your idea and get an AI concept and image.",
    tools: "AI media tools",
    promptLabel: "Describe your idea",
    promptPh: "e.g. A neon-soaked rainy street in Tehran, year 2080...",
    generate: "Generate",
    working: "Working...",
    thinking: "THE AI IS THINKING...",
    rendering: "RENDERING IMAGE...",
    reset: "Start over",
    ready: "READY / WAITING FOR PROMPT",
    response: "AI RESPONSE",
    error: "CONNECTION ERROR",
    yourPrompt: "Prompt:",
    clear: "CLEAR",
    sceneLabel: "SCENE PROMPT",
    empty: "No response received.",
    errOffline: "The AI service is unavailable right now. Please try again shortly.",
    errBusy: "Too many requests. Wait a minute and try again.",
    errTimeout: "The request timed out. Please try again.",
    imgFail: "The image could not be created (service unavailable or quota used up). Only the text answer is shown.",
    tools_: {
      image: { name: "Image Foundry", type: "STILL / STYLE FRAME" },
      motion: { name: "Motion Lab", type: "VIDEO / LOOP" },
      portrait: { name: "Portrait Signal", type: "PORTRAIT / PERFORMANCE" },
    },
  },
  notFound: {
    title: "Page not found",
    text: "The address is wrong or the page has moved.",
    home: "Back to home",
  },
  services: {
    eyebrow: "03 / SERVICES",
    lead: "Teasers, commercial films, visual identity and 3D web experiences, all built by combining AI with human direction.",
    process: "How we work",
    faq: "Frequently asked questions",
    ctaTitle: "Have a project in mind?",
    ctaText: "Write one sentence and we'll start.",
    cta: "Start a project",
    ctaShop: "See packages",
  },
};

const DICTS: Record<Lang, Dict> = { fa, en };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: Dict; dir: "rtl" | "ltr" };
const LangContext = createContext<Ctx | null>(null);

function initialLang(): Lang {
  if (typeof window === "undefined") return "fa";
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "fa" || q === "en") return q;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "fa" || saved === "en") return saved;
  } catch {
    /* storage can be blocked */
  }
  return "fa";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Only the `lang` attribute changes on <html>. Layout stays LTR because the 3D scenes and
  // overlays are positioned for it; Persian text blocks set dir="rtl" themselves.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);
  const toggle = useCallback(() => setLang(lang === "fa" ? "en" : "fa"), [lang, setLang]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, toggle, t: DICTS[lang], dir: lang === "fa" ? "rtl" : "ltr" }),
    [lang, setLang, toggle],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
