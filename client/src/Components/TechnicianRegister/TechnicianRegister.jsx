import React, { useState } from 'react';
import { SHA256 } from 'crypto-js';
import './TechnicianRegister.css'; 

function TechnicianRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    district: '',
    specialization: '',
    experienceYears: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Phone number validation (+94 followed by 9 digits)
    const phoneRegex = /^\+94\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("Invalid phone number format. Use +94XXXXXXXXX");
      return;
    }

    // Hash password
    const hashedPassword = SHA256(formData.password).toString();

    // Final form data
    const technicianData = {
      ...formData,
      password: hashedPassword,
      profileImage: imageFile ? imageFile.name : null,
    };

    console.log("Technician Registration Data:", technicianData);
    alert("Technician registered successfully!");

    // You can now send `technicianData` to your backend API
  };

  return (
    <form onSubmit={handleSubmit} className="technician-register-form">
      <h2>Technician Registration</h2>

      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={handleChange}
        required
      /><br />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      /><br />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      /><br />

      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      /><br />

      <input
        type="tel"
        name="phone"
        placeholder="Phone Number (e.g., +94712345678)"
        value={formData.phone}
        onChange={handleChange}
        pattern="^\+94\d{9}$"
        title="Phone number must be in format +94XXXXXXXXX"
        required
      /><br />

      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        required
      /><br />

      <input
        type="text"
        name="district"
        placeholder="District"
        value={formData.district}
        onChange={handleChange}
        required
      /><br />

      <input
        type="text"
        name="specialization"
        placeholder="Specialization (e.g., Plumbing, Electrical)"
        value={formData.specialization}
        onChange={handleChange}
        required
      /><br />

      <input
        type="number"
        name="experienceYears"
        placeholder="Years of Experience"
        value={formData.experienceYears}
        onChange={handleChange}
        min="0"
        required
      /><br />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        required
      /><br />

      {imagePreview && (
        <img
          className="profile-preview"
          src={imagePreview}
          alt="Profile Preview"
          style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }}
        />
      )}<br />

      <button type="submit">Register</button>
    </form>
  );
}

export default TechnicianRegister;
