import React, { useEffect, useState } from 'react';
import './UserProfile.css';
import axios from 'axios';

function UserProfile() {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    dob: '',
    mobile: '',
    landline: '',
    address: '',
    district: '',
    profileImage: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    axios.get('/api/user/profile')
      .then(res => {
        setUserData(res.data);
        setImagePreview(`/uploads/${res.data.profileImage}`);
      })
      .catch(err => console.error(err));
  }, []);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();

    // ✅ Phone number validation
    const phoneRegex = /^\+94\d{9}$/;
    if (userData.mobile && !phoneRegex.test(userData.mobile)) {
      alert("Invalid phone number format. Use +94XXXXXXXXX");
      return;
    }

    axios.put('/api/user/profile', userData)
      .then(() => {
        alert('Profile updated!');
        setEditMode(false);
      })
      .catch(err => alert('Failed to update profile.'));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // ✅ Password match validation
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert("New passwords do not match!");
      return;
    }

    axios.post('/api/user/change-password', passwords)
      .then(() => alert("Password changed successfully!"))
      .catch(() => alert("Password update failed!"));
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img src={imagePreview || '/default-profile.png'} alt="Profile" className="profile-img" />
        <button className="change-pic">Change Profile Picture</button>
        <h3>{userData.fullName || 'User Name'}</h3>
        <p>{userData.email || 'email@example.com'}</p>
      </div>

      <button className="edit-toggle-btn" onClick={() => setEditMode(!editMode)}>
        {editMode ? 'Cancel Edit' : 'Edit Profile'}
      </button>

      {!editMode && (
        <div className="user-info-view">
          <div className="info-item"><div className="info-label">Full Name</div><div className="info-value">{userData.fullName || '-'}</div></div>
          <div className="info-item"><div className="info-label">Email</div><div className="info-value">{userData.email || '-'}</div></div>
          <div className="info-item"><div className="info-label">Mobile</div><div className="info-value">{userData.mobile || '-'}</div></div>
          <div className="info-item"><div className="info-label">Address</div><div className="info-value">{userData.address || '-'}</div></div>
          <div className="info-item"><div className="info-label">District</div><div className="info-value">{userData.district || '-'}</div></div>
        </div>
      )}

      {editMode && (
        <form onSubmit={handleProfileSave} className="profile-form" noValidate>
          <input type="text" name="fullName" value={userData.fullName} onChange={handleUserChange} placeholder="Full Name" required />
          <input type="email" name="email" value={userData.email} onChange={handleUserChange} placeholder="Email" />
          <input type="tel" name="mobile" value={userData.mobile} onChange={handleUserChange} placeholder="Mobile (+94XXXXXXXXX)" />
          <input type="text" name="address" value={userData.address} onChange={handleUserChange} placeholder="Address" />
          <input type="text" name="district" value={userData.district} onChange={handleUserChange} placeholder="District" />
          <button type="submit" className="btn-save">Save Changes</button>
        </form>
      )}

      <div className="password-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="password-form" noValidate>
          <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} placeholder="Current Password" required />
          <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} placeholder="New Password" required />
          <input type="password" name="confirmNewPassword" value={passwords.confirmNewPassword} onChange={handlePasswordChange} placeholder="Confirm New Password" required />
          <button type="submit" className="btn-password">Change Password</button>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;
