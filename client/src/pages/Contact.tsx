import React, { useRef, useState } from "react";
import { useLang } from "../lib/i18n";

const SERVICE_VALUES = ["Film & commercial", "Branding", "Web & 3D Experience"] as const;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  service: SERVICE_VALUES[0] as string,
  brief: "",
};

// شماره واتساپ استودیو
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

// موبایل ایران (09xxxxxxxxx) یا شماره بین‌المللی (۷ تا ۱۵ رقم، با + اختیاری)
const validatePhone = (phone: string) => /^09[0-9]{9}$/.test(phone) || /^\+?[0-9]{7,15}$/.test(phone);
const validateEmail = (email: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email);

type Status = {
  loading: boolean;
  success: boolean | null;
  message: string;
};

export default function Contact({ onClose }: { onClose?: () => void }) {
  const { lang, dir, t } = useLang();
  const c = t.contact;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState<"form" | "success">("form");
  const [status, setStatus] = useState<Status>({ loading: false, success: null, message: "" });

  // فیلد مخفی ضد ربات: انسان‌ها نمی‌بینن و پر نمی‌کنن
  const honeypotRef = useRef<HTMLInputElement>(null);
  // ناحیه‌ی قابل اسکرول صفحه
  const scrollRef = useRef<HTMLElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const fail = (message: string) => setStatus({ loading: false, success: false, message });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.loading) return;

    const phone = normalizePhone(formData.phone);
    const email = formData.email.trim();

    if (!validateEmail(email)) return fail(c.badEmail);
    if (!validatePhone(phone)) return fail(c.badPhone);

    setStatus({ loading: true, success: null, message: "" });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 25000);

    try {
      // فرم به سرور خودمان (/api/lead) می‌رود؛ آنجا بررسی و محدودیت تعداد انجام می‌شود
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: formData.name.trim(),
          email,
          phone,
          service: formData.service,
          brief: formData.brief.trim(),
          website: honeypotRef.current?.value ?? "",
        }),
      });

      if (res.status === 429) return fail(c.tooMany);
      if (!res.ok) return fail(res.status === 400 ? c.invalid : c.network);

      setFormData({ ...formData, phone });
      setStep("success");
      setStatus({ loading: false, success: true, message: "" });
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      fail(c.network);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const serviceLabel = c.services[formData.service] ?? formData.service;
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(c.waMessage(formData.name, serviceLabel))}`;

  const inputClass =
    "w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500";
  const labelClass = "block text-xs uppercase tracking-wider text-gray-400 mb-2";

  return (
    <main
      id="main"
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#0b0f0e] text-[#e0e0e0] flex flex-col items-center p-6 pb-28"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain", touchAction: "pan-y" }}
    >
      <div dir={dir} className="w-full max-w-2xl my-auto bg-[#121816] p-8 rounded-2xl border border-[#1f2d28] shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 end-6 text-gray-400 hover:text-white text-sm transition-colors"
          title={c.close}
          aria-label={c.close}
        >
          ✕
        </button>

        <h1 className="text-3xl font-bold text-center mb-2 text-white">{c.title}</h1>
        <p className="text-center text-sm text-gray-400 mb-8">{c.subtitle}</p>

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
              <label htmlFor="contact-name" className={labelClass}>{c.name}</label>
              <input id="contact-name" type="text" name="name" dir="auto" autoComplete="name" maxLength={80}
                value={formData.name} onChange={handleChange} required className={inputClass} placeholder={c.namePh} />
            </div>

            <div>
              <label htmlFor="contact-email" className={labelClass}>{c.email}</label>
              <input id="contact-email" type="email" name="email" dir="ltr" autoComplete="email" maxLength={160}
                value={formData.email} onChange={handleChange} required className={inputClass} placeholder="name@example.com" />
            </div>

            <div>
              <label htmlFor="contact-phone" className={labelClass}>{c.phone}</label>
              <input id="contact-phone" type="tel" name="phone" dir="ltr" inputMode="tel" autoComplete="tel" maxLength={20}
                value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="09123456789" />
            </div>

            <div>
              <label htmlFor="contact-service" className={labelClass}>{c.service}</label>
              <select id="contact-service" name="service" value={formData.service} onChange={handleChange} className={inputClass}>
                {SERVICE_VALUES.map((value) => (
                  <option key={value} value={value}>{c.services[value]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-brief" className={labelClass}>{c.brief}</label>
              <textarea id="contact-brief" name="brief" dir="auto" value={formData.brief} onChange={handleChange}
                rows={4} maxLength={2000} required className={inputClass} placeholder={c.briefPh} />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {status.loading ? c.sending : c.submit}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-5 py-6" role="status">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white">{c.okTitle}</h2>
            <p className="text-sm text-gray-300">{c.okText}</p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-lg transition-colors text-center"
            >
              {c.whatsapp}
            </a>

            <button
              type="button"
              onClick={resetAll}
              className="w-full bg-[#18221f] hover:bg-[#202c28] border border-[#2a3c35] text-gray-300 font-medium py-3 rounded-lg transition-colors"
            >
              {c.again}
            </button>
          </div>
        )}

        {status.message && step === "form" && (
          <p role="alert" className={`text-center text-sm mt-4 ${status.success ? "text-emerald-400" : "text-red-400"}`}>
            {status.message}
          </p>
        )}
      </div>
    </main>
  );
}
