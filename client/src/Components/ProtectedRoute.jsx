import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OpenLoginRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    // bounce home + open login modal
    navigate("/", { replace: true });
    setTimeout(() => window.dispatchEvent(new Event("fm:open-login")), 0);
  }, [navigate]);
  return null;
}

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuth) return <OpenLoginRedirect key={location.pathname} />;

  return children;
}
