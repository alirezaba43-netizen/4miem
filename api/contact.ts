import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { name, email, phone, service, brief } = req.body ?? {};
  if (![name, email, phone, brief].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ success: false, message: "تمامی فیلدها الزامی هستند." });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || smtpUser;
  const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
  const lead = {
    id: Date.now(),
    date: new Date().toISOString(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    service: String(service ?? ""),
    brief: String(brief).trim(),
  };

  if (sheetUrl) {
    try {
      await fetch(sheetUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    } catch (error) {
      console.error("Google Sheets request failed:", error);
    }
  }

  if (smtpUser && smtpPassword && adminEmail) {
    try {
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPassword } });
      const safe = Object.fromEntries(Object.entries(lead).map(([key, value]) => [key, escapeHtml(value)]));
      await transporter.sendMail({
        from: `"4miem Contact" <${smtpUser}>`,
        to: lead.email,
        subject: "درخواست شما با موفقیت دریافت شد",
        html: `<h3>سلام ${safe.name} عزیز،</h3><p>پیام شما برای پروژه (${safe.service}) ثبت شد.</p>`,
      });
      await transporter.sendMail({
        from: `"4miem Leads" <${smtpUser}>`,
        to: adminEmail,
        subject: `لید جدید از طرف ${safe.name}`,
        html: `<h2>اطلاعات مشتری جدید</h2><ul><li>نام: ${safe.name}</li><li>ایمیل: ${safe.email}</li><li>تلفن: ${safe.phone}</li><li>نوع پروژه: ${safe.service}</li><li>توضیحات: ${safe.brief}</li></ul>`,
      });
    } catch (error) {
      console.error("Email request failed:", error);
    }
  }

  return res.status(200).json({ success: true, message: "اطلاعات با موفقیت ثبت شد." });
}
