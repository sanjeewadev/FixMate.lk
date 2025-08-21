import api from "../lib/api";

/** Completed bookings with payments (for this customer) */
export async function listReceipts() {
  const { data } = await api.get("/api/customer/bookings/receipts");
  return data?.items || [];
}

/** One completed+paid booking (owned by this customer) */
export async function getReceipt(bookingId) {
  const { data } = await api.get(`/api/customer/bookings/${bookingId}/receipt`);
  return data?.item || null;
}

/** Download PDF (uses fetch to stream blob) */
export async function downloadReceiptPdf(bookingId) {
  // If your token is stored elsewhere, adjust this getter.
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    "";

  const res = await fetch(`/api/customer/bookings/${bookingId}/receipt.pdf`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to download receipt");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; // filename will come from server headers
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
