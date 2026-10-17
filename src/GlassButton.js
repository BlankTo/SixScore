// GlassButton.js
import React from "react";
import "./GlassButton.css";

const GlassButton = ({ children, onClick, type = "button" }) => {
  return (
    <button className="glass-btn" type={type} onClick={onClick}>
      {children}
    </button>
  );
};

export default GlassButton;
