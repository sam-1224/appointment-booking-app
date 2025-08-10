import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Header from "./components/Header";

export default function App() {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
  });

  const handleAuth = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setAuth({ token, role });
  };

  const logout = () => {
    localStorage.clear();
    setAuth({ token: null, role: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header auth={auth} logout={logout} />
      <div className="p-4">
        <Routes>
          <Route
            index
            element={
              auth.token ? (
                auth.role === "admin" ? (
                  <AdminDashboard token={auth.token} />
                ) : (
                  <PatientDashboard token={auth.token} />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/login"
            element={
              auth.token ? (
                <Navigate to="/" />
              ) : (
                <Login onAuth={handleAuth} />
              )
            }
          />
          <Route
            path="/register"
            element={
              auth.token ? <Navigate to="/" /> : <Register />
            }
          />
        </Routes>
      </div>
    </div>
  );
}
