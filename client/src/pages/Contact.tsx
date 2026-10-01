import React, { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Film & commercial",
    brief: "",
  });

  const [step, setStep] = useState<"form" | "success">("form");
  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({
    loading: false,
    success: null,
    message: "",
  });

  // اعتبارسنجی ساختار شماره موبایل ایران (شروع با 09 و ۱۱ رقم)
  const validateIranianPhone = (phone: string) => {
    const regex = /^09[0-9]{9}$/;
    return regex.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, message: "" });

    if (!validateIranianPhone(formData.phone)) {
      setStatus({
        loading: false,
        success: false,
        message: "لطفا یک شماره موبایل معتبر ایرانی وارد کنید (مثال: 09123456789)",
      });
      return;
    }

    // لینک وب‌اپلیکیشن گوگل اسکریپت شما
    const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyP0C6DqiR74c4wyUxgvGrXItgR6YX276OF6OaYfxAYN3M3c5paSuVXpZ5F7U5Hy_UNOw/exec";

    try {
      // ارسال مستقیم داده‌ها به وب‌اسکریپت گوگل (برای ثبت در شیت و ارسال ایمیل‌ها)
      await fetch(GOOGLE_SHEET_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setStep("success");
      setStatus({ loading: false, success: true, message: "پیام شما با موفقیت ثبت شد!" });
    } catch (error: any) {
      setStatus({ loading: false, success: false, message: "خطا در ارتباط با سرور گوگل." });
    }
  };

  // لینک هدایت مستقیم به واتساپ شما
  const adminWhatsAppNumber = "989108178424";
  const whatsappMessage = encodeURIComponent(
    `سلام، من ${formData.name} هستم. درخواست پروژه (${formData.service}) را در سایت ثبت کردم.`
  );
  const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${whatsappMessage}`;

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0b0f0e] text-[#e0e0e0] flex flex-col items-center p-6 pb-28">
      <div className="w-full max-w-2xl my-auto bg-[#121816] p-8 rounded-2xl border border-[#1f2d28] shadow-2xl relative">
        
        {/* دکمه ضربدر (بستن) در بالای کارت */}
        <button
          onClick={() => {
            setStep("form");
            setFormData({ name: "", email: "", phone: "", service: "Film & commercial", brief: "" });
            // اگر می‌خواهید صفحه کاملاً بسته شود یا به بالا اسکرول شود می‌توانید اینجا اضافه کنید
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="absolute top-6 left-6 text-gray-400 hover:text-white text-sm transition-colors"
          title="بستن / بازگشت"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-center mb-2 text-white">Tell us the spark.</h2>
        <p className="text-center text-sm text-gray-400 mb-8">یک جمله، یک حس یا یک تصویر کافی‌ست تا شروع کنیم.</p>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                placeholder="علیرضا"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                placeholder="09123456789"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Project Type</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Film & commercial">Film & commercial</option>
                <option value="Branding">Branding</option>
                <option value="Web & 3D Experience">Web & 3D Experience</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">The Short Version</label>
              <textarea
                name="brief"
                value={formData.brief}
                onChange={handleChange}
                rows={4}
                required
                className="w-full bg-[#18221f] border border-[#2a3c35] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                placeholder="درباره پروژه‌تان بنویسید..."
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {status.loading ? "در حال ثبت اطلاعات..." : "ارسال پیام و ثبت نهایی"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-5 py-6">
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
              onClick={() => {
                setStep("form");
                setFormData({ name: "", email: "", phone: "", service: "Film & commercial", brief: "" });
              }}
              className="w-full bg-[#18221f] hover:bg-[#202c28] border border-[#2a3c35] text-gray-300 font-medium py-3 rounded-lg transition-colors"
            >
              بازگشت به فرم / ارسال پیام جدید
            </button>
          </div>
        )}

        {status.message && step === "form" && (
          <p className={`text-center text-sm mt-4 ${status.success ? "text-emerald-400" : "text-red-400"}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
