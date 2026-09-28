import { useState, type FormEvent } from "react";
import { ArrowUpRight, Instagram, Send } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", service: "", brief: "" });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return <main className="site-shell three-act standalone-page contact-page">
    <div className="page-view-inner">
      <header className="page-heading"><span className="eyebrow">03 / OPEN A PROJECT FILE</span><h1>Tell us<br /><em>the spark.</em></h1><p dir="rtl">یک جمله، یک حس یا یک تصویر کافی‌ست تا شروع کنیم.</p></header>
      <div className="contact-layout">
        <aside className="contact-details">
          <span className="eyebrow">DIRECT CHANNEL</span>
          <a href="https://www.instagram.com/4miem/" target="_blank" rel="noreferrer"><Instagram size={15} /> DM @4MIEM <ArrowUpRight size={14} /></a>
          <div><span>STUDIO</span><b>MEM STUDIO / TEHRAN</b></div>
          <div><span>RESPONSE WINDOW</span><b>01—03 WORKING DAYS</b></div>
        </aside>
        <form className="contact-form" onSubmit={submit}>
          {sent ? <div className="contact-success"><span className="eyebrow">TRANSMISSION RECEIVED</span><h2>Signal logged.</h2><p>Thanks, {form.name}. Your project note is ready for the 4miem team.</p><a href="https://www.instagram.com/4miem/" target="_blank" rel="noreferrer">CONTINUE ON INSTAGRAM <ArrowUpRight size={14} /></a></div> : <>
            <label><span>YOUR NAME</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name / studio" /></label>
            <label><span>EMAIL</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@studio.com" /></label>
            <label><span>PROJECT TYPE</span><select required value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option value="" disabled>Select a service</option><option>Film & commercial</option><option>Music video</option><option>AI world</option><option>Digital identity</option></select></label>
            <label><span>THE SHORT VERSION</span><textarea required rows={4} value={form.brief} onChange={(event) => setForm({ ...form, brief: event.target.value })} placeholder="A sentence, a mood, a problem..." /></label>
            <button className="page-submit" type="submit"><span>SEND PROJECT FILE</span><Send size={15} /></button>
          </>}
        </form>
      </div>
    </div>
  </main>;
}
