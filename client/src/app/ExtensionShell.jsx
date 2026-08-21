import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";
import "./ExtensionShell.css";

export const ExtensionShell = () => {
  const navigate = useNavigate();

  return (
    <div className="extension-shell-container">
      <button
        onClick={() => navigate("/")}
        className="extension-switch-btn"
      >
        <ArrowRightLeft size={16} />
        Switch to Farmer
      </button>

      <Outlet />
    </div>
  );
};
