import api from "../lib/api";

// create a new complaint (optionally link to a booking)
export async function createComplaint({ bookingId = null, title, details = "" }) {
  const { data } = await api.post("/api/complaints", { bookingId, title, details });
  return data; // complaint doc
}

// list my complaints (with staff responses)
export async function listMyComplaints() {
  const { data } = await api.get("/api/complaints/mine");
  return Array.isArray(data) ? data : [];
}