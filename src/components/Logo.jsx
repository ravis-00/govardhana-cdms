// src/components/Logo.jsx
import React from "react";

export default function GovardhanaLogo({ className = "w-12 h-12", showText = false, color = "#ea580c" }) {
  return (
    <div className={`flex items-center gap-3 ${className ? "" : ""}`}>
      {/* THE LOGO ICON */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* 1. The Govardhana Hill (Protective Arch) */}
        {/* Represents the hill lifted like an umbrella */}
        <path
          d="M10 65 C 10 30, 90 30, 90 65"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* 2. The Sun / Divinity (Optional Dot at top) */}
        <circle cx="50" cy="25" r="4" fill={color} />

        {/* 3. The Cow (Stylized Face under the hill) */}
        {/* Minimalist line art representing an indigenous breed (long ears, hump implication) */}
        <path
          d="M35 55 
             Q 30 65, 30 75 
             L 40 85 
             L 60 85 
             L 70 75 
             Q 70 65, 65 55 
             "
          fill="#1f2937" 
          stroke="#1f2937"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Cow Horns */}
        <path
          d="M35 55 Q 30 40, 50 45 Q 70 40, 65 55"
          fill="none"
          stroke="#1f2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* OPTIONAL TEXT (If used in Header/Sidebar) */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">
            Govardhana <span style={{ color: color }}>CDMS</span>
          </span>
        </div>
      )}
    </div>
  );
}