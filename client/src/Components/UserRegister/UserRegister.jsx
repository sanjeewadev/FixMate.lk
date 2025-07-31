import React, { useState } from 'react';
import { SHA256 } from 'crypto-js';
import './UserRegister.css';

function UserRegister({ onSwitch }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    district: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    const hashedPassword = SHA256(formData.password).toString();
    const userData = {
      ...formData,
      password: hashedPassword,
      profileImage: imageFile ? imageFile.name : null,
    };
    console.log("Register:", userData);
    alert("Registration successful!");
  };

  return (
    <form className="userregister-form" onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="district"
        placeholder="District"
        value={formData.district}
        onChange={handleChange}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        required
      />
      {imagePreview && (
        <img
          className="profile-preview"
          src={imagePreview}
          alt="Profile Preview"
        />
      )}
      <button type="submit">Register</button>
      <p className="userregister-link">
        Already have an account?{' '}
        <span
          style={{ color: '#0070f3', cursor: 'pointer', fontWeight: 500 }}
          onClick={onSwitch}
        >
          Login
        </span>
      </p>
    </form>
  );
}

export default UserRegister;
