// src/Components/MenuLink/MenuLink.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MenuLink({ linkName, url, requireAuth = false }) {
  const { isAuth } = useAuth();

  const handleClick = (e) => {
    if (requireAuth && !isAuth) {
      e.preventDefault();
      // Ask Navbar to open the login modal
      window.dispatchEvent(new Event("fm:open-login"));
    }
  };

  return (
    <NavLink
      to={url}
      onClick={handleClick}
      className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
    >
      {linkName}
    </NavLink>
  );
}
