import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('full_name', formData.fullName);
      formPayload.append('email', formData.email);
      formPayload.append('password', formData.password); // raw password
      formPayload.append('phone_number', formData.phone);
      formPayload.append('address', formData.address);
      formPayload.append('district', formData.district);
      if (imageFile) formPayload.append('profileImage', imageFile);

      const response = await fetch('http://localhost:7001/api/customer/register', {
        method: 'POST',
        body: formPayload,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        onSwitch(); // Switch to login screen
      } else {
        alert(result.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration.");
    }
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
          style={{ maxWidth: '150px', marginTop: '10px' }}
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
