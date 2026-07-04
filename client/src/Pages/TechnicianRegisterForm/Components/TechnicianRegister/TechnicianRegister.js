import api from "../../../../lib/api";

export const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

export const SPECIALIZATIONS = [
  "Electrical",
  "Plumbing",
  "AC Repair",
  "Carpentry",
  "Painting",
  "Appliance Repair",
  "IT Support",
  "CCTV & Networking",
  "Roofing",
  "Flooring",
  "Landscaping",
  "Cleaning",
];

export const initialTechnicianForm = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  district: "",
  specialization: "",
  experience_years: "",
  note: "",
};

export const technicianRegisterContent = {
  eyebrow: "Application form",
  title: "Technician details",
  subtitle:
    "Add your contact details, service area and main skill. Required fields are marked with an asterisk.",
  defaultNotice:
    "After you submit this form, we will review it and contact you by phone or email.",
  imageSelectedNotice:
    "Profile image selected. Complete the form and submit your application.",
  submitLabel: "Submit Application",
  submittingLabel: "Submitting...",
  hint: "FixMate will review your application before approving your technician profile.",
};

export const validateTechnicianForm = (form) => {
  const phone = form.phone_number.trim();

  if (!form.full_name.trim()) return "Please enter your full name.";
  if (!form.email.trim()) return "Please enter your email address.";

  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (!phone) return "Please enter your phone number.";

  if (!/^\+94\d{9}$/.test(phone)) {
    return "Phone number must be in +94XXXXXXXXX format.";
  }

  if (!form.address.trim()) return "Please enter your address.";
  if (!form.district) return "Please choose your district.";
  if (!form.specialization) return "Please choose your specialization.";

  const years = Number(form.experience_years || 0);

  if (Number.isNaN(years) || years < 0) {
    return "Experience years must be zero or a positive number.";
  }

  return null;
};

export const validateProfileImage = (file) => {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    return "Please select a valid image file.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Profile image must be smaller than 5MB.";
  }

  return null;
};

export async function createApplication(form) {
  const fd = new FormData();

  fd.append("full_name", form.full_name.trim());
  fd.append("email", form.email.trim());
  fd.append("phone_number", form.phone_number.trim());
  fd.append("address", form.address.trim());
  fd.append("district", form.district);
  fd.append("specialization", form.specialization);
  fd.append("experience_years", String(form.experience_years || 0));

  if (form.note?.trim()) {
    fd.append("note", form.note.trim());
  }

  if (form.profile_image instanceof File) {
    fd.append("profile_image", form.profile_image);
  }

  const { data } = await api.post("/api/apply/technician", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
