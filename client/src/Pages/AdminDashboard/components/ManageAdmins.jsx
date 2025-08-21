// src/Pages/AdminDashboard/components/ManageAdmins.jsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import "./ManageAdmins.css";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    profile_image_url: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Load admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      // keep your original path (looked odd but I won't change your backend)
      const res = await api.get("/api/admin/admin/admins");
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Create new admin
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/admins", form);
      setMessage("Admin created successfully ✅");
      setForm({ full_name: "", email: "", password: "", phone_number: "", profile_image_url: "" });
      fetchAdmins();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error creating admin");
    }
  };

  // ✅ Update existing admin
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admins/${editingId}`, form);
      setMessage("Admin updated successfully ✨");
      setEditingId(null);
      setForm({ full_name: "", email: "", password: "", phone_number: "", profile_image_url: "" });
      fetchAdmins();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error updating admin");
    }
  };

  // ✅ Delete admin
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/api/admins/${id}`);
      setMessage("Admin deleted 🗑️");
      fetchAdmins();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error deleting admin");
    }
  };

  // ✅ Start editing
  const startEdit = (admin) => {
    setEditingId(admin._id);
    setForm({
      full_name: admin.full_name,
      email: admin.email,
      password: "",
      phone_number: admin.phone_number,
      profile_image_url: admin.profile_image_url || "",
    });
  };

  return (
    <div className="manage-admins">
      <h2>Manage Admins</h2>
      {message && <p className="msg">{message}</p>}

      {/* Form */}
      <form onSubmit={editingId ? handleUpdate : handleCreate} className="admin-form">
        <input type="text" name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        {!editingId && (
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        )}
        <input type="text" name="phone_number" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} required />
        <input type="text" name="profile_image_url" placeholder="Profile Image URL (optional)" value={form.profile_image_url} onChange={handleChange} />

        <button type="submit" className="btn">
          {editingId ? "Update Admin" : "Create Admin"}
        </button>
        {editingId && (
          <button type="button" className="btn cancel" onClick={() => { setEditingId(null); setForm({ full_name: "", email: "", password: "", phone_number: "", profile_image_url: "" }); }}>
            Cancel
          </button>
        )}
      </form>

      {/* List */}
      <h3>Admin List</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="admins-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Profile</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a._id}>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                <td>{a.phone_number}</td>
                <td>{a.profile_image_url ? <img src={a.profile_image_url} alt="profile" className="avatar" /> : "—"}</td>
                <td>{a.role}</td>
                <td>
                  <button onClick={() => startEdit(a)} className="btn small">Edit</button>
                  <button onClick={() => handleDelete(a._id)} className="btn small danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
