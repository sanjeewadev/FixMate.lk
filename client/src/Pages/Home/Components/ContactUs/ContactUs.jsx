import React, { useState } from "react";

import {
  contactChecklist,
  contactMethods,
  contactSectionContent,
  contactStats,
  initialContactForm,
  inquiryTypes,
  submitContactInquiry,
  validateContactForm,
} from "./ContactUs.js";

import "./ContactUs.css";

export default function ContactUs() {
  const [form, setForm] = useState(initialContactForm);
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (notice?.type === "error") {
      setNotice(null);
    }
  };

  const setInquiryType = (value) => {
    setForm((current) => ({
      ...current,
      inquiryType: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    const validationMessage = validateContactForm(form);

    if (validationMessage) {
      setNotice({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await submitContactInquiry(form);

      setNotice({
        type: "success",
        text: response?.message || "Thanks. We will get back to you shortly.",
      });

      setForm(initialContactForm);
    } catch {
      setNotice({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="fm-contact-showcase"
      aria-labelledby="fm-contact-showcase-title">
      <div className="fm-contact-showcase__container">
        <div className="fm-contact-showcase__header">
          <span className="fm-contact-showcase__eyebrow">
            {contactSectionContent.eyebrow}
          </span>

          <h2
            id="fm-contact-showcase-title"
            className="fm-contact-showcase__title">
            {contactSectionContent.title}
          </h2>

          <p className="fm-contact-showcase__subtitle">
            {contactSectionContent.subtitle}
          </p>
        </div>

        <div className="fm-contact-showcase__mainGrid">
          <aside className="fm-contact-showcase__infoPanel">
            <div className="fm-contact-showcase__infoTop">
              <span>{contactSectionContent.infoEyebrow}</span>

              <h3>{contactSectionContent.infoTitle}</h3>

              <p>{contactSectionContent.infoText}</p>
            </div>

            <div className="fm-contact-showcase__methodList">
              {contactMethods.map((method) => (
                <div
                  className="fm-contact-showcase__methodCard"
                  key={method.label}>
                  <span
                    className="fm-contact-showcase__methodIcon"
                    aria-hidden="true">
                    {method.short}
                  </span>

                  <div>
                    <strong>{method.label}</strong>

                    {method.href ? (
                      <a href={method.href}>{method.value}</a>
                    ) : (
                      <p>{method.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="fm-contact-showcase__stats">
              {contactStats.map((item) => (
                <div className="fm-contact-showcase__stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="fm-contact-showcase__checklist">
              <strong>{contactSectionContent.checklistTitle}</strong>

              <ul>
                {contactChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="fm-contact-showcase__formPanel">
            <div className="fm-contact-showcase__formHeader">
              <span>{contactSectionContent.formEyebrow}</span>

              <h3>{contactSectionContent.formTitle}</h3>

              <p>{contactSectionContent.formText}</p>
            </div>

            {notice?.text ? (
              <div
                className={`fm-contact-showcase__notice fm-contact-showcase__notice--${notice.type}`}
                role="status"
                aria-live="polite">
                {notice.text}
              </div>
            ) : null}

            <form
              className="fm-contact-showcase__form"
              onSubmit={onSubmit}
              noValidate>
              <div className="fm-contact-showcase__fieldGrid">
                <div className="fm-contact-showcase__field">
                  <label htmlFor="fm-contact-name">Your name *</label>

                  <input
                    id="fm-contact-name"
                    name="name"
                    type="text"
                    placeholder="e.g., Tharindu Perera"
                    value={form.name}
                    onChange={onChange}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="fm-contact-showcase__field">
                  <label htmlFor="fm-contact-phone">Phone</label>

                  <input
                    id="fm-contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g., +94 7X XXX XXXX"
                    value={form.phone}
                    onChange={onChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="fm-contact-showcase__field">
                <label htmlFor="fm-contact-email">Email *</label>

                <input
                  id="fm-contact-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="fm-contact-showcase__field">
                <label>Inquiry type</label>

                <div className="fm-contact-showcase__typeButtons">
                  {inquiryTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`fm-contact-showcase__typeButton ${
                        form.inquiryType === type.value
                          ? "fm-contact-showcase__typeButton--active"
                          : ""
                      }`}
                      onClick={() => setInquiryType(type.value)}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fm-contact-showcase__field">
                <label htmlFor="fm-contact-message">Message *</label>

                <textarea
                  id="fm-contact-message"
                  name="message"
                  rows="5"
                  placeholder="Tell us what service, support or partnership help you need."
                  value={form.message}
                  onChange={onChange}
                  required
                />
              </div>

              <button
                className="fm-contact-showcase__submit"
                type="submit"
                disabled={submitting}>
                {submitting
                  ? contactSectionContent.submittingLabel
                  : contactSectionContent.submitLabel}
              </button>

              <p className="fm-contact-showcase__privacy">
                {contactSectionContent.privacyText}
              </p>
            </form>
          </div>
        </div>

        <div className="fm-contact-showcase__bottomStrip">
          <strong>{contactSectionContent.responseTitle}</strong>
          <span>{contactSectionContent.responseNote}</span>

          <a href="tel:+9471010102">Call now</a>
        </div>
      </div>
    </section>
  );
}
