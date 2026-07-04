import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./CustomersList.css";

const FALLBACK_100 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="34">U</text></svg>';

const getCustomerName = (customer) =>
  customer?.full_name || customer?.name_initials || "Unnamed customer";

const getAvatar = (customer) =>
  customer?.profile_image_url || customer?.profile_image?.url || FALLBACK_100;

export default function CustomersList({ title = "Customers", onSelect }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await api.get("/api/technician/customers/public");

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to load customers.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const stats = useMemo(() => {
    const districts = new Set(
      items.map((customer) => customer.district).filter(Boolean),
    );

    const withPhone = items.filter((customer) => customer.phone_number).length;
    const withAddress = items.filter((customer) => customer.address).length;

    return {
      total: items.length,
      districts: districts.size,
      withPhone,
      withAddress,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const searchText = q.trim().toLowerCase();

    if (!searchText) return items;

    return items.filter((customer) =>
      [
        customer.full_name,
        customer.name_initials,
        customer.email,
        customer.phone_number,
        customer.district,
        customer.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText)),
    );
  }, [items, q]);

  const handleCardKeyDown = (event, customer) => {
    if (!onSelect) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(customer);
    }
  };

  return (
    <section className="fm-staff-customers">
      <div className="fm-staff-customers__header">
        <div>
          <span className="fm-staff-customers__eyebrow">
            Customer Directory
          </span>

          <h1>{title}</h1>

          <p>
            View customer records, contact details, district information, and
            address details for coordination work.
          </p>
        </div>

        <button
          type="button"
          className="fm-staff-customers__btn fm-staff-customers__btn--outline"
          onClick={fetchCustomers}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-staff-customers__summaryGrid">
        <article className="fm-staff-customers__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total customers</p>
          </div>
        </article>

        <article className="fm-staff-customers__summaryCard">
          <span>
            <MapPin size={17} />
          </span>
          <div>
            <strong>{stats.districts}</strong>
            <p>Districts</p>
          </div>
        </article>

        <article className="fm-staff-customers__summaryCard">
          <span>
            <Phone size={17} />
          </span>
          <div>
            <strong>{stats.withPhone}</strong>
            <p>With phone</p>
          </div>
        </article>

        <article className="fm-staff-customers__summaryCard">
          <span>
            <Home size={17} />
          </span>
          <div>
            <strong>{stats.withAddress}</strong>
            <p>With address</p>
          </div>
        </article>
      </div>

      {err ? (
        <div
          className="fm-staff-customers__notice fm-staff-customers__notice--error"
          role="status"
          aria-live="polite">
          <X size={16} />
          <span>{err}</span>
        </div>
      ) : null}

      <section className="fm-staff-customers__card">
        <div className="fm-staff-customers__toolbar">
          <div>
            <span>Customer records</span>
            <h2>Directory</h2>
          </div>

          <div className="fm-staff-customers__actions">
            <label className="fm-staff-customers__search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search name, email, phone, district"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="fm-staff-customers__btn fm-staff-customers__btn--outline"
              onClick={() => setQ("")}
              disabled={!q}>
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="fm-staff-customers__empty">
            <RefreshCw size={24} />
            <strong>Loading customers</strong>
            <span>Please wait while customer records are loaded.</span>
          </div>
        ) : null}

        {!loading && !err ? (
          <div className="fm-staff-customers__grid">
            {filtered.length === 0 ? (
              <div className="fm-staff-customers__empty">
                <UserRound size={24} />
                <strong>No customers found</strong>
                <span>
                  {q
                    ? "Try a different search keyword."
                    : "Customer records will appear here."}
                </span>
              </div>
            ) : (
              filtered.map((customer) => (
                <article
                  key={customer._id}
                  className={`fm-staff-customers__cardItem ${
                    onSelect ? "isSelectable" : ""
                  }`}
                  onClick={() => onSelect?.(customer)}
                  onKeyDown={(event) => handleCardKeyDown(event, customer)}
                  role={onSelect ? "button" : undefined}
                  tabIndex={onSelect ? 0 : undefined}>
                  <div className="fm-staff-customers__avatarWrap">
                    <img
                      className="fm-staff-customers__avatar"
                      src={getAvatar(customer)}
                      alt={getCustomerName(customer)}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_100;
                      }}
                    />
                  </div>

                  <div className="fm-staff-customers__body">
                    <h3>{getCustomerName(customer)}</h3>

                    <span className="fm-staff-customers__status">
                      <UserRound size={13} />
                      Customer
                    </span>

                    <div className="fm-staff-customers__meta">
                      {customer.email ? (
                        <div>
                          <Mail size={14} />
                          <span>{customer.email}</span>
                        </div>
                      ) : null}

                      {customer.phone_number ? (
                        <div>
                          <Phone size={14} />
                          <span>{customer.phone_number}</span>
                        </div>
                      ) : null}

                      {customer.address ? (
                        <div>
                          <Home size={14} />
                          <span>{customer.address}</span>
                        </div>
                      ) : null}

                      <div>
                        <MapPin size={14} />
                        <span>{customer.district || "—"}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </section>
    </section>
  );
}
