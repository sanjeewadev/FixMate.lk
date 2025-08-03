import React from 'react';
import './ContactUs.css';

function ContactUs() {
  return (
    <div className="contact-container">
      <h2>Contact Us</h2>
      <div className="contact-wrapper">
      <div className="contact-box">
        <div className="contact-info">
          <h3>Contact Info</h3>
          <p><span>📧</span> fixmate@gmail.com</p>
          <p><span>📞</span> +9471010102</p>
          <p><span>📍</span> Colombo, Sri Lanka</p>
        </div>

        <div className="contact-form">
          <h3>Become a Partner</h3>
          <p className="form-subtitle">Break the ice! Let us help you out</p>
          <form>
            <input type="text" placeholder="What's your name?" />
            <input type="text" placeholder="What's your phone number?" />
            <input type="email" placeholder="Whats your email?" />
            <textarea placeholder="Describe your interest"></textarea>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ContactUs;
