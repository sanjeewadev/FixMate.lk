import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../../lib/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./BookService.css";

const initialForm = {
  serviceId: "",
  serviceName: "",
  problemTitle: "",
  problemDescription: "",
  brandModel: "",
  equipmentAge: "",
  preferredDate: "",
  timeSlot: "",
  address: "",
  district: "",
  phone_number: "",
  specialInstructions: "",
  photos: [],
};

function normalizeServices(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.services)) return data.services;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getServiceLabel(service) {
  return service?.name || service?.title || service?.serviceName || "Service";
}

function buildPreferredAt(date, time) {
  if (!date) return "";

  const safeTime = time || "09:00";

  try {
    return new Date(`${date}T${safeTime}:00`).toISOString();
  } catch {
    return date;
  }
}

export default function BookService() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      address: current.address || user.address || "",
      district: current.district || user.district || "",
      phone_number: current.phone_number || user.phone_number || "",
    }));
  }, [user]);

  useEffect(() => {
    let dead = false;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const { data } = await api.get("/api/services");

        if (!dead) {
          setServices(normalizeServices(data));
        }
      } catch {
        if (!dead) {
          setServices([]);
        }
      } finally {
        if (!dead) {
          setLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      dead = true;
    };
  }, []);

  const selectedService = useMemo(() => {
    return services.find(
      (service) =>
        String(service._id || service.id) === String(formData.serviceId),
    );
  }, [formData.serviceId, services]);

  const selectedServiceName = useMemo(() => {
    return selectedService
      ? getServiceLabel(selectedService)
      : formData.serviceName;
  }, [formData.serviceName, selectedService]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleServiceChange = (event) => {
    const serviceId = event.target.value;
    const service = services.find(
      (item) => String(item._id || item.id) === String(serviceId),
    );

    setFormData((current) => ({
      ...current,
      serviceId,
      serviceName: service ? getServiceLabel(service) : "",
    }));
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type?.startsWith("image/"),
    );

    setFormData((current) => ({
      ...current,
      photos: [...current.photos, ...files].slice(0, 6),
    }));

    event.target.value = "";
  };

  const removePhoto = (index) => {
    setFormData((current) => ({
      ...current,
      photos: current.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      ...initialForm,
      address: user?.address || "",
      district: user?.district || "",
      phone_number: user?.phone_number || "",
    });
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setMsg(null);

    if (!selectedServiceName.trim()) {
      setMsg({
        type: "error",
        text: "Please select or enter a service.",
      });
      return;
    }

    if (!formData.problemTitle.trim()) {
      setMsg({
        type: "error",
        text: "Please enter a short problem title.",
      });
      return;
    }

    if (!formData.address.trim()) {
      setMsg({
        type: "error",
        text: "Please enter the service address.",
      });
      return;
    }

    if (!formData.phone_number.trim()) {
      setMsg({
        type: "error",
        text: "Please enter your phone number.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        service: formData.serviceId || undefined,
        serviceId: formData.serviceId || undefined,
        serviceName: selectedServiceName,
        problemTitle: formData.problemTitle.trim(),
        problemDescription: formData.problemDescription.trim(),
        brandModel: formData.brandModel.trim(),
        equipmentAge: formData.equipmentAge.trim(),
        preferredAt: buildPreferredAt(
          formData.preferredDate,
          formData.timeSlot,
        ),
        timeSlot: formData.timeSlot || "Any",
        address: formData.address.trim(),
        serviceAddress: formData.address.trim(),
        district: formData.district.trim(),
        phone_number: formData.phone_number.trim(),
        phone: formData.phone_number.trim(),
        specialInstructions: formData.specialInstructions.trim(),
      };

      let response;

      if (formData.photos.length > 0) {
        const body = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            body.append(key, value);
          }
        });

        formData.photos.forEach((file) => {
          body.append("photos", file);
        });

        response = await api.post("/api/bookings", body);
      } else {
        response = await api.post("/api/bookings", payload);
      }

      const created = response?.data?.booking || response?.data;

      setMsg({
        type: "success",
        text: "Booking created successfully.",
      });

      resetForm();

      if (created?._id) {
        navigate(`/UserDashboard/booking/${created._id}`);
      } else {
        navigate("/UserDashboard/history");
      }
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to create booking. Please check the details and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="fm-user-book-service">
      <div className="fm-user-book-service__header">
        <div>
          <span className="fm-user-book-service__eyebrow">Booking</span>

          <h1>Book Service</h1>

          <p>
            Create a new repair or maintenance request. Add clear problem
            details so the support team can assign the correct technician.
          </p>
        </div>
      </div>

      {msg?.text ? (
        <div
          className={`fm-user-book-service__notice fm-user-book-service__notice--${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <form className="fm-user-book-service__card" onSubmit={submitBooking}>
        <div className="fm-user-book-service__cardHeader">
          <span>
            <CalendarPlus size={17} />
          </span>

          <div>
            <h2>Service Request</h2>
            <p>Fill the required details and submit your booking.</p>
          </div>
        </div>

        <div className="fm-user-book-service__grid">
          <label>
            <span>Service *</span>

            {loadingServices ? (
              <div className="fm-user-book-service__loadingField">
                <RefreshCw size={15} />
                Loading services
              </div>
            ) : services.length > 0 ? (
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleServiceChange}>
                <option value="">Select service</option>
                {services.map((service) => {
                  const id = service._id || service.id;
                  return (
                    <option value={id} key={id}>
                      {getServiceLabel(service)}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="Service name"
              />
            )}
          </label>

          {services.length > 0 ? (
            <label>
              <span>Selected service</span>
              <input value={selectedServiceName || ""} readOnly />
            </label>
          ) : null}

          <label>
            <span>Problem title *</span>
            <input
              name="problemTitle"
              value={formData.problemTitle}
              onChange={handleChange}
              placeholder="Example: AC not cooling"
              required
            />
          </label>

          <label>
            <span>Brand / model</span>
            <input
              name="brandModel"
              value={formData.brandModel}
              onChange={handleChange}
              placeholder="Example: LG Dual Inverter"
            />
          </label>

          <label>
            <span>Equipment age</span>
            <input
              name="equipmentAge"
              value={formData.equipmentAge}
              onChange={handleChange}
              placeholder="Example: 2 years"
            />
          </label>

          <label>
            <span>Preferred date</span>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Preferred time</span>
            <select
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}>
              <option value="">Any time</option>
              <option value="09:00">Morning 9:00 AM</option>
              <option value="11:00">Late morning 11:00 AM</option>
              <option value="14:00">Afternoon 2:00 PM</option>
              <option value="16:00">Evening 4:00 PM</option>
            </select>
          </label>

          <label>
            <span>Phone number *</span>
            <input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+94XXXXXXXXX"
              required
            />
          </label>

          <label>
            <span>District</span>
            <input
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="District"
            />
          </label>

          <label className="isWide">
            <span>Service address *</span>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter the full service address"
              required
            />
          </label>

          <label className="isWide">
            <span>Problem description</span>
            <textarea
              name="problemDescription"
              rows="4"
              value={formData.problemDescription}
              onChange={handleChange}
              placeholder="Describe the issue clearly"
            />
          </label>

          <label className="isWide">
            <span>Special instructions</span>
            <textarea
              name="specialInstructions"
              rows="3"
              value={formData.specialInstructions}
              onChange={handleChange}
              placeholder="Any access instructions, preferred notes, or extra details"
            />
          </label>
        </div>

        <div className="fm-user-book-service__uploadBox">
          <div>
            <span>
              <ImagePlus size={17} />
            </span>

            <div>
              <h3>Photos</h3>
              <p>Add up to 6 images that show the issue.</p>
            </div>
          </div>

          <label className="fm-user-book-service__fileBtn">
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
            />
          </label>
        </div>

        {formData.photos.length > 0 ? (
          <div className="fm-user-book-service__photoList">
            {formData.photos.map((file, index) => (
              <article key={`${file.name}-${index}`}>
                <div>
                  <strong>{file.name}</strong>
                  <span>{Math.round(file.size / 1024)} KB</span>
                </div>

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label="Remove photo">
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : null}

        <div className="fm-user-book-service__actions">
          <button
            type="button"
            className="fm-user-book-service__btn fm-user-book-service__btn--outline"
            onClick={resetForm}
            disabled={submitting}>
            Reset
          </button>

          <button
            type="submit"
            className="fm-user-book-service__btn fm-user-book-service__btn--primary"
            disabled={submitting}>
            <Send size={16} />
            {submitting ? "Submitting" : "Submit Booking"}
          </button>
        </div>
      </form>
    </section>
  );
}
