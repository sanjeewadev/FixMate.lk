import api from "../lib/api";

/**
 * createApplication(form)
 * fields: full_name, email, phone_number, address, district,
 *         specialization, experience_years, note (optional), profile_image (File)
 */
export async function createApplication(form) {
  const fd = new FormData();
  fd.append("full_name", form.full_name);
  fd.append("email", form.email);
  fd.append("phone_number", form.phone_number);
  fd.append("address", form.address);
  fd.append("district", form.district);
  fd.append("specialization", form.specialization);
  fd.append("experience_years", String(form.experience_years || 0));
  if (form.note) fd.append("note", form.note);
  if (form.profile_image instanceof File) {
    fd.append("profile_image", form.profile_image); // field name expected by your Cloudinary uploader
  }

  const { data } = await api.post("/api/apply/technician", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data; // { message, application }
}