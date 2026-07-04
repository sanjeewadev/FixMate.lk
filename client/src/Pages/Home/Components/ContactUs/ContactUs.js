export const contactSectionContent = {
  eyebrow: "Contact FixMate",
  title: "Need help, service support or a technician partnership?",
  subtitle:
    "Send us your question and our team will guide you with bookings, services, technician applications or partnership inquiries.",

  infoEyebrow: "Support center",
  infoTitle: "Talk to the FixMate team",
  infoText:
    "For faster service support, share your issue clearly with your location and contact details. Photos can be shared later through WhatsApp or direct communication.",

  checklistTitle: "Before contacting us",
  responseTitle: "Need urgent service support?",
  responseNote:
    "For faster help, share your repair issue, location and preferred service time.",

  formEyebrow: "Send inquiry",
  formTitle: "Tell us what you need",
  formText:
    "Add your details and a short message. We will review it and contact you.",

  submitLabel: "Submit Inquiry",
  submittingLabel: "Submitting...",
  privacyText:
    "By submitting, you agree that FixMate can contact you about this inquiry.",
};

export const contactMethods = [
  {
    label: "Email",
    value: "fixmate@gmail.com",
    href: "mailto:fixmate@gmail.com",
    short: "@",
  },
  {
    label: "Phone",
    value: "+94 71 010 102",
    href: "tel:+9471010102",
    short: "+",
  },
  {
    label: "Service area",
    value: "Colombo, Sri Lanka",
    href: null,
    short: "●",
  },
];

export const contactStats = [
  {
    value: "24/7",
    label: "Request access",
  },
  {
    value: "1 day",
    label: "Typical reply",
  },
  {
    value: "8+",
    label: "Service types",
  },
];

export const inquiryTypes = [
  {
    label: "Book service",
    value: "service",
  },
  {
    label: "Become partner",
    value: "partner",
  },
  {
    label: "General support",
    value: "support",
  },
];

export const contactChecklist = [
  "Describe the issue clearly",
  "Mention your district or city",
  "Add the best contact number",
  "Share preferred service time",
];

export const initialContactForm = {
  name: "",
  phone: "",
  email: "",
  inquiryType: "service",
  message: "",
};

export const validateContactForm = (form) => {
  if (!form.name.trim()) return "Please enter your name.";
  if (!form.email.trim()) return "Please enter your email address.";

  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (!form.message.trim())
    return "Please add a short message about your inquiry.";

  if (form.message.trim().length < 10) {
    return "Please add a little more detail to your message.";
  }

  return null;
};

export const submitContactInquiry = async () => {
  await new Promise((resolve) => setTimeout(resolve, 650));

  return {
    ok: true,
    message: "Thanks. Your inquiry has been received.",
  };
};
