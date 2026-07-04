import footerfb from "../../assets/footer-facebook.svg";
import footerinsta from "../../assets/footer-instagram.svg";
import footerx from "../../assets/footer-twitter.svg";
import footeryt from "../../assets/footer-youtube.svg";

export const footerBrand = {
  name: "FixMate.lk",
  description:
    "FixMate helps customers book trusted home repair, cleaning and maintenance services with a clear and simple service request flow.",
  email: "fixmate@gmail.com",
  phone: "+94 71 010 102",
  phoneHref: "tel:+9471010102",
  copyright: "© 2025 FixMate.lk. All rights reserved.",
};

export const footerLinks = [
  {
    title: "Explore",
    items: [
      { label: "Home", to: "/" },
      { label: "Services", to: "/Services" },
      { label: "About", to: "/AboutUs" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Customer",
    items: [
      { label: "Login", action: "login" },
      { label: "Book Service", to: "/Services" },
      { label: "Service Support", href: "/#contact" },
      { label: "Become a Technician", to: "/TechnicianRegisterForm" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Refunds & Policies", href: "/refunds" },
    ],
  },
];

export const footerSocials = [
  { label: "X", href: "https://x.com", icon: footerx },
  { label: "Instagram", href: "https://instagram.com", icon: footerinsta },
  { label: "Facebook", href: "https://facebook.com", icon: footerfb },
  { label: "YouTube", href: "https://youtube.com", icon: footeryt },
];

export const footerServiceBox = {
  eyebrow: "Need help?",
  title: "Book trusted service support in a few steps.",
  text: "Choose a service, send your request and let FixMate guide you to the right support.",
  primaryLabel: "Explore Services",
  primaryTo: "/Services",
  secondaryLabel: "Contact Us",
  secondaryHref: "/#contact",
};
