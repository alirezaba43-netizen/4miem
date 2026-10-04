import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());
app.use(cors());

// تنظیمات ایمیل با اکانت 4miime@gmail.com
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "4miime@gmail.com",
    pass: "roowglonlfdokpak", // رمز عبور ۱۶ رقمی App Password
  },
});

// لینک جدید وب‌اسکریپت گوگل شیت (بعد از New Version دیپوی کردن)
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyP0C6DqiR74c4wyUxgvGrXItgR6YX276OF6OaYfxAYN3M3c5paSuVXpZ5F7U5Hy_UNOw/exec";

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, service, brief } = req.body;

  if (!name || !email || !phone || !brief) {
    return res.status(400).json({ success: false, message: "تمامی فیلدها الزامی هستند." });
  }

  const newLead = {
    id: Date.now(),
    date: new Date().toISOString(),
    name,
    email,
    phone,
    service,
    brief,
  };

  // ۱. ذخیره محلی در فایل leads.json
  const filePath = path.join(process.cwd(), "leads.json");
  let leads = [];
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      leads = JSON.parse(fileData);
    }
  } catch (err) {
    leads = [];
  }

  leads.push(newLead);
  fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), "utf-8");
  console.log(`[LEAD SAVED] اطلاعات جدید از ${name} در فایل محلی ذخیره شد.`);

  // ۲. ارسال اطلاعات به گوگل شیت
  try {
    const sheetResponse = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLead),
    });
    const sheetResult = await sheetResponse.text();
    console.log("[GOOGLE SHEET RESPONSE]:", sheetResult);
  } catch (sheetError) {
    console.error("خطا در ارتباط با گوگل شیت:", sheetError);
  }

  // ۳. ارسال ایمیل‌ها
  try {
    // ایمیل خوش‌آمد به مشتری
    await transporter.sendMail({
      from: '"استودیوی خلاق" <4miime@gmail.com>',
      to: email,
      subject: "درخواست شما با موفقیت دریافت شد",
      html: `<h3>سلام ${name} عزیز،</h3><p>پیام شما برای پروژه (${service}) ثبت شد. به زودی با شما در ارتباط خواهیم بود.</p>`,
    });

    // ایمیل گزارش مدیریتی به خودتان
    await transporter.sendMail({
      from: '"سیستم لید سایت" <4miime@gmail.com>',
      to: "4miime@gmail.com",
      subject: `🔥 لید جدید از طرف ${name}`,
      html: `
        <h2>اطلاعات مشتری جدید ثبت شد:</h2>
        <ul>
          <li><b>نام:</b> ${name}</li>
          <li><b>ایمیل:</b> ${email}</li>
          <li><b>تلفن:</b> ${phone}</li>
          <li><b>نوع پروژه:</b> ${service}</li>
          <li><b>توضیحات:</b> ${brief}</li>
        </ul>
      `,
    });
    console.log("[EMAILS SENT] ایمیل‌های مشتری و گزارش مدیریت با موفقیت ارسال شدند.");
  } catch (mailError: any) {
    console.error("خطا در ارسال ایمیل (Nodemailer Error):", mailError.message || mailError);
  }

  res.json({ success: true, message: "اطلاعات با موفقیت ثبت شد." });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});