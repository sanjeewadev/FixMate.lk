import api from "../lib/api";

export async function rateBooking(bookingId, { stars, comment = "" }) {
  const { data } = await api.post(`/api/bookings/${bookingId}/rate`, { stars, comment });
  return data; // { message, rating: { stars, comment, createdAt } }
}
