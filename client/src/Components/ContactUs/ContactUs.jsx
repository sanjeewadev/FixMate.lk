import React, { useState } from "react";
import "./ContactUs.css";

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.message.trim()) return "A short message helps us help you 🙂";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    const v = validate();
    if (v) { setBanner({ type: "error", text: v }); return; }

    try {
      setSubmitting(true);
      setTimeout(() => {
        setBanner({ type: "success", text: "Thanks! We’ll get back to you shortly." });
        setForm({ name: "", phone: "", email: "", message: "" });
        setSubmitting(false);
      }, 600);
    } catch {
      setSubmitting(false);
      setBanner({ type: "error", text: "Something went wrong. Please try again." });
    }
  };

  return (
    <section className="contactSection fontBody" aria-labelledby="contact-title">
      <h2 id="contact-title" className="contactTitle fontHeading">Contact Us</h2>

      <div className="contactCard">
        <aside className="contactInfo">
          <h3 className="infoHead fontHeading">Say hello 👋</h3>
          <p className="infoText">
            If you've got a question about bookings, services, or partnerships,
            drop us a message. We usually reply within a business day.
          </p>

          <ul className="infoList">
            <li>
              <span className="infoIcon" aria-hidden>📧</span>
              <a className="link-a" href="mailto:fixmate@gmail.com">fixmate@gmail.com</a>
            </li>
            <li>
              <span className="infoIcon" aria-hidden>📞</span>
              <a className="link-a" href="tel:+9471010102">+94 71 010 102</a>
            </li>
            <li>
              <span className="infoIcon" aria-hidden>📍</span>
              Colombo, Sri Lanka
            </li>
          </ul>

          <div className="infoNote">
            Prefer WhatsApp? Ping us and share photos of the issue for faster help.
          </div>
        </aside>

        <div className="contactForm">
          <h3 className="formHead fontHeading">Become a Partner</h3>
          <p className="formSub">Tell us a bit about you and your work.</p>

          {banner?.text && (
            <div className={`banner ${banner.type}`}>{banner.text}</div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Your name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Tharindu Perera"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g., +94 7X XXX XXXX"
                value={form.phone}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="What would you like to collaborate on?"
                value={form.message}
                onChange={onChange}
                required
              />
            </div>

            <button className="btnSend" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit"}
            </button>

            <p className="privacyHint">
              By submitting, you agree that we can contact you about this inquiry.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}