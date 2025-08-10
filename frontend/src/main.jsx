import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";

// Always force dark mode
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
    <Toaster
      position="top-center"
      toastOptions={{
        style: { fontSize: "14px" },
        success: { style: { background: "#4ade80", color: "#fff" } },
        error: { style: { background: "#f87171", color: "#fff" } },
      }}
    />
  </React.StrictMode>
);
