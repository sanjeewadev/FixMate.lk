import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  FileWarning,
  Image as ImageIcon,
  MapPin,
  Phone,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../lib/api.js";
import ComplaintModal from "./Complaints/ComplaintModal.jsx";
import "./BookingDetails.css";

function formatDateTime(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function getServiceName(booking) {
  return booking?.service?.name || booking?.serviceName || "Service";
}

function getStatusClass(value) {
  const status = String(value || "").toLowerCase();

  if (status.includes("complete")) return "isCompleted";
  if (status.includes("approve")) return "isApproved";
  if (status.includes("schedul")) return "isScheduled";
  if (status.includes("decline") || status.includes("cancel"))
    return "isDanger";
  if (status.includes("pending")) return "isPending";

  return "";
}

function StatusChip({ value }) {
  return (
    <span className={`fm-booking-details__status ${getStatusClass(value)}`}>
      {value || "—"}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="fm-booking-details__detailItem">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComplaint, setShowComplaint] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;

    async function loadBooking() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/api/bookings/${id}`);

        if (!dead) {
          setBooking(data?.booking || data);
        }
      } catch (err) {
        if (!dead) {
          setBooking(null);
          setError(
            err?.response?.data?.message || "Failed to load booking details.",
          );
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      dead = true;
    };
  }, [id]);

  const photos = useMemo(() => {
    if (!booking) return [];

    return booking.media || booking.photos || [];
  }, [booking]);

  if (loading) {
    return (
      <section className="fm-booking-details">
        <div className="fm-booking-details__empty">
          <Wrench size={24} />
          <strong>Loading booking</strong>
          <span>Please wait while booking details are loaded.</span>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="fm-booking-details">
        <button
          type="button"
          className="fm-booking-details__backBtn"
          onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="fm-booking-details__notice fm-booking-details__notice--error">
          <AlertCircle size={16} />
          <span>{error || "Booking not found."}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="fm-booking-details">
      <div className="fm-booking-details__header">
        <div>
          <button
            type="button"
            className="fm-booking-details__backBtn"
            onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="fm-booking-details__eyebrow">Booking Details</span>

          <h1>{getServiceName(booking)}</h1>

          <p>
            Review the visit details, problem information, uploaded photos, and
            complaint option for this service request.
          </p>
        </div>

        <StatusChip value={booking.status} />
      </div>

      {error ? (
        <div className="fm-booking-details__notice fm-booking-details__notice--error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="fm-booking-details__grid">
        <section className="fm-booking-details__card">
          <div className="fm-booking-details__cardHeader">
            <span>
              <CalendarDays size={17} />
            </span>

            <div>
              <h2>Visit</h2>
              <p>Appointment and customer contact information</p>
            </div>
          </div>

          <div className="fm-booking-details__detailGrid">
            <DetailItem
              label="Date"
              value={formatDateTime(booking.preferredAt)}
            />
            <DetailItem label="Time" value={booking.timeSlot || "Any"} />
            <DetailItem
              label="Address"
              value={booking.serviceAddress || booking.address}
            />
            <DetailItem
              label="District"
              value={booking.customerSnapshot?.district || booking.district}
            />
            <DetailItem
              label="Phone"
              value={
                booking.customerSnapshot?.phone_number || booking.phone_number
              }
            />
          </div>
        </section>

        <section className="fm-booking-details__card">
          <div className="fm-booking-details__cardHeader">
            <span>
              <FileWarning size={17} />
            </span>

            <div>
              <h2>Problem</h2>
              <p>Issue details submitted with the booking</p>
            </div>
          </div>

          <div className="fm-booking-details__detailGrid">
            <DetailItem label="Title" value={booking.problemTitle} />
            <DetailItem label="Brand / Model" value={booking.brandModel} />
            <DetailItem label="Equipment Age" value={booking.equipmentAge} />

            <div className="fm-booking-details__detailItem isWide">
              <span>Description</span>
              <strong>{booking.problemDescription || "—"}</strong>
            </div>

            <div className="fm-booking-details__detailItem isWide">
              <span>Special Instructions</span>
              <strong>{booking.specialInstructions || "—"}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="fm-booking-details__card">
        <div className="fm-booking-details__cardHeader">
          <span>
            <ImageIcon size={17} />
          </span>

          <div>
            <h2>Photos</h2>
            <p>Images attached to this service request</p>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="fm-booking-details__empty isCompact">
            <ImageIcon size={22} />
            <strong>No photos</strong>
            <span>No images were attached to this booking.</span>
          </div>
        ) : (
          <div className="fm-booking-details__photoGrid">
            {photos.map((media, index) => {
              const url = media.url || media.secure_url || media;

              return (
                <a
                  key={`${url}-${index}`}
                  className="fm-booking-details__photo"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open image">
                  <img src={url} alt={`Booking media ${index + 1}`} />
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section className="fm-booking-details__actionCard">
        <div>
          <span>
            <TriangleAlert size={17} />
          </span>

          <div>
            <h2>Need help with this booking?</h2>
            <p>
              File a complaint if there is a problem with this service request.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="fm-booking-details__btn fm-booking-details__btn--danger"
          onClick={() => setShowComplaint(true)}>
          File a complaint
        </button>
      </section>

      {showComplaint ? (
        <ComplaintModal
          bookingId={booking._id}
          onClose={() => setShowComplaint(false)}
          onCreated={() => setShowComplaint(false)}
        />
      ) : null}
    </section>
  );
}
