// src/services/booking.js
import api from "../lib/api";

// Customer: all my bookings (your backend already populates assignedTechnician)
export async function getMyBookingsForCustomer() {
  const { data } = await api.get("/api/bookings/mine");
  return data || [];
}