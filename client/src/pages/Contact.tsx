import React, { useRef, useState } from "react";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  service: "Film & commercial",
  brief: "",
};

// لینک وب‌اپلیکیشن گوگل اسکریپت شما
const GOOGLE_SHEET_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyP0C6DqiR74c4wyUxgvGrXItgR6YX276OF6OaYfxAYN3M3c5paSuVXpZ5F7U5Hy_UNOw/exec";

// لینک هدایت مستقیم به واتساپ شما
const ADMIN_WHATSAPP_NUMBER = "989108178424";

// تبدیل ارقام فارسی و عربی به انگلیسی و پاک‌کردن فاصله و خط تیره
const normalizePhone = (value: string) => {
  let digits = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[\s\-()]/g, "");

  // +98912... یا 0098912... یا 98912... را به 0912... تبدیل می‌کنیم
  if (digits.startsWith("+98")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0098")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = "0" + digits.slice(2);

  return digits;
};

// اعتبارسنجی ساختار شماره موبایل ایران (شروع با 09 و ۱۱ رقم)
const validateIranianPhone = (phone: string) => /^09[0-9]{9}$/.test(phone);

type Status = {
  loading: boolean;
  success: boolean | null;
  message: string;
};

export default function Contact({ onClose }: { onClose?: () => void }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState<"form" | "success">("form");
  const [status, setStatus] = useState<Status>({
    loading: false,
    success: null,
    message: "",
  });

  // فیلد مخفی ضد ربات: انسان‌ها نمی‌بینن و پر نمی‌کنن
  const honeypotRef = useRef<HTMLInputElement>(null);
  // ناحیه‌ی قابل اسکرول صفحه
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetAll = () => {
    setStep("form");
    setFormData(EMPTY_FORM);
    setStatus({ loading: false, success: null, message: "" });
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClose = () => {
    if (onClose) onClose();
    else resetAll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.loading) return;

    // اگر ربات فیلد مخفی را پر کرده باشد، بی‌صدا نادیده می‌گیریم
    if (honeypotRef.current?.value) {
      setStep("success");
      return;
    }

    const phone = normalizePhone(formData.phone);

    if (!validateIranianPhone(phone)) {
      setStatus({
        loading: false,
        success: false,
        message: "لطفا یک شماره موبایل معتبر ایرانی وارد کنید (مثال: 09123456789)",
      });
      return;
    }

    setStatus({ loading: true, success: null, message: "" });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);

    try {
      // ارسال مستقیم داده‌ها به وب‌اسکریپت گوگل (برای ثبت در شیت و ارسال ایمیل‌ها)
      // توجه: با no-cors مرورگر پاسخ سرور را نمی‌بیند، پس موفقیت را باید در شیت چک کرد
      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, phone }),
        signal: controller.signal,
      });

      setFormData({ ...formData, phone });
      setStep("success");
      setStatus({ loading: false, success: true, message: "پیام شما با موفقیت ثبت شد!" });
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStatus({
        loading: false,
        success: false,
        message: "خطا در ارتباط با سرور. اینترنت را بررسی کنید و دوباره تلاش کنید.",
      });
    } finally {
      window.clearTimeout(timer);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `سلام، من ${formData.name} هستم. درخواست پروژه (${formData.service}) را در سایت ثبت کردم.`
  );
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const inputClass =
    "w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500";
  const labelClass = "block text-xs uppercase tracking-wider text-gray-400 mb-2";

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#0b0f0e] text-[#e0e0e0] flex flex-col items-center p-6 pb-28"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain", touchAction: "pan-y" }}
    >
      <div className="w-full max-w-2xl my-auto bg-[#121816] p-8 rounded-2xl border border-[#1f2d28] shadow-2xl relative">
        {/* دکمه ضربدر (بستن) در بالای کارت */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 left-6 text-gray-400 hover:text-white text-sm transition-colors"
          title="بستن / بازگشت"
          aria-label="بستن"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Tell us the spark.</h2>
        <p dir="rtl" className="text-center text-sm text-gray-400 mb-8">
          یک جمله، یک حس یا یک تصویر کافی‌ست تا شروع کنیم.
        </p>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* فیلد مخفی ضد ربات */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />

            <div>
              <label htmlFor="contact-name" className={labelClass}>Your Name</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                dir="auto"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="علیرضا"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className={labelClass}>Email</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                dir="ltr"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className={labelClass}>Phone Number</label>
              <input
                id="contact-phone"
                type="tel"
                name="phone"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="09123456789"
              />
            </div>

            <div>
              <label htmlFor="contact-service" className={labelClass}>Project Type</label>
              <select
                id="contact-service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Film & commercial">Film & commercial</option>
                <option value="Branding">Branding</option>
                <option value="Web & 3D Experience">Web & 3D Experience</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-brief" className={labelClass}>The Short Version</label>
              <textarea
                id="contact-brief"
                name="brief"
                dir="auto"
                value={formData.brief}
                onChange={handleChange}
                rows={4}
                required
                className={inputClass}
                placeholder="درباره پروژه‌تان بنویسید..."
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {status.loading ? "در حال ثبت اطلاعات..." : "ارسال پیام و ثبت نهایی"}
            </button>
          </form>
        ) : (
          <div dir="rtl" className="text-center space-y-5 py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-white">پیام شما با موفقیت ثبت شد</h3>
            <p className="text-sm text-gray-300">
              اطلاعات شما ثبت شد و ایمیل تأیید ارسال گردید. برای گفتگوی مستقیم، می‌توانید از طریق واتساپ نیز اقدام کنید:
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-lg transition-colors text-center"
            >
              ارتباط مستقیم در واتساپ 💬
            </a>

            {/* دکمه بازگشت و بستن صفحه موفقیت */}
            <button
              type="button"
              onClick={resetAll}
              className="w-full bg-[#18221f] hover:bg-[#202c28] border border-[#2a3c35] text-gray-300 font-medium py-3 rounded-lg transition-colors"
            >
              بازگشت به فرم / ارسال پیام جدید
            </button>
          </div>
        )}

        {status.message && step === "form" && (
          <p
            dir="rtl"
            role="alert"
            className={`text-center text-sm mt-4 ${status.success ? "text-emerald-400" : "text-red-400"}`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
