// src/services/support.js
export async function listSupportStaff() {
  const res = await fetch("/support-staff.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load support staff directory");
  const data = await res.json();
  // Normalize a bit
  return (data || []).map(x => ({
    _id: x._id,
    full_name: x.full_name || "Support",
    role: x.role || "coordinator",
    email: x.email || "",
    profile_image_url: x.profile_image_url || ""
  }));
}
