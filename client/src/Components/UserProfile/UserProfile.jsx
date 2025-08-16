// src/Components/UserProfile/UserProfile.jsx
import React, { useEffect, useState } from "react";
import "./UserProfile.css";
import axios from "axios";

function UserProfile() {
  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    profile_image_url: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // ───────────────────────────────────────────
  // Fetch profile on mount
  // ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/api/customer/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUserData(res.data);
        setImagePreview(res.data.profile_image_url || "/default-profile.png");
      })
      .catch((err) => console.error("Profile fetch error:", err));
  }, []);

  // ───────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  // Optional: let user paste an image URL (backend expects profile_image_url string)
  const handleChangePicture = () => {
    const url = window.prompt("Paste a public image URL for your profile picture:");
    if (url) {
      setUserData((prev) => ({ ...prev, profile_image_url: url }));
      setImagePreview(url);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    // send only allowed fields
    const payload = {
      full_name: userData.full_name,
      phone_number: userData.phone_number,
      address: userData.address,
      district: userData.district,
      profile_image_url: userData.profile_image_url,
    };

    axios
      .put("/api/customer/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        alert("✅ Profile updated!");
        setUserData(res.data.customer);
        setImagePreview(res.data.customer?.profile_image_url || imagePreview);
        setEditMode(false);
      })
      .catch((err) => {
        console.error("Update error:", err?.response?.data || err.message);
        alert("❌ Failed to update profile.");
      });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert("❌ New passwords do not match!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .post("/api/customer/change-password", passwords, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("✅ Password changed successfully!");
        setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      })
      .catch((err) => {
        console.error("Change password error:", err?.response?.data || err.message);
        alert("❌ Password update failed!");
      });
  };

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <div className="user-profile">
      {/* Header */}
      <div className="profile-header">
        <img
          src={imagePreview || "/default-profile.png"}
          alt="Profile"
          className="profile-img"
        />
        <button type="button" className="change-pic" onClick={handleChangePicture}>
          Change Profile Picture
        </button>
        <h3>{userData.full_name || "User Name"}</h3>
        <p>{userData.email || "email@example.com"}</p>
      </div>

      {/* Toggle Edit */}
      <button
        className="edit-toggle-btn"
        onClick={() => setEditMode((v) => !v)}
      >
        {editMode ? "Cancel Edit" : "Edit Profile"}
      </button>

      {/* VIEW MODE */}
      {!editMode && (
        <div className="user-info-view">
          <div className="info-item">
            <div className="info-label">Full Name</div>
            <div className="info-value">{userData.full_name || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value">{userData.email || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Mobile</div>
            <div className="info-value">{userData.phone_number || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Address</div>
            <div className="info-value">{userData.address || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{userData.district || "-"}</div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
        <form onSubmit={handleProfileSave} className="profile-form" noValidate>
          <input
            type="text"
            name="full_name"
            value={userData.full_name}
            onChange={handleUserChange}
            placeholder="Full Name"
            required
          />
          <input
            type="email"
            name="email"
            value={userData.email}
            placeholder="Email"
            readOnly
          />
          <input
            type="tel"
            name="phone_number"
            value={userData.phone_number}
            onChange={handleUserChange}
            placeholder="Mobile (+94XXXXXXXXX)"
          />
          <input
            type="text"
            name="address"
            value={userData.address}
            onChange={handleUserChange}
            placeholder="Address"
          />
          <input
            type="text"
            name="district"
            value={userData.district}
            onChange={handleUserChange}
            placeholder="District"
          />
          <button type="submit" className="btn-save">
            Save Changes
          </button>
        </form>
      )}

      {/* Change Password */}
      <div className="password-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="password-form" noValidate>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current Password"
            required
          />
          <input
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            placeholder="New Password"
            required
          />
          <input
            type="password"
            name="confirmNewPassword"
            value={passwords.confirmNewPassword}
            onChange={handlePasswordChange}
            placeholder="Confirm New Password"
            required
          />
          <button type="submit" className="btn-password">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;
