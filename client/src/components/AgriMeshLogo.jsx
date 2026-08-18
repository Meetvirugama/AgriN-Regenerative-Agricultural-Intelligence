import React from 'react';

export const AgriMeshLogo = ({ size = 28, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon / Mesh Network lines */}
      <polygon 
        points="50,5 90,28 90,72 50,95 10,72 10,28" 
        stroke="#16A34A" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        strokeDasharray="4 4"
        opacity="0.3"
      />
      
      {/* Network Nodes */}
      <circle cx="50" cy="5" r="4.5" fill="#16A34A" />
      <circle cx="90" cy="28" r="4.5" fill="#16A34A" />
      <circle cx="90" cy="72" r="4.5" fill="#16A34A" />
      <circle cx="50" cy="95" r="4.5" fill="#16A34A" />
      <circle cx="10" cy="72" r="4.5" fill="#16A34A" />
      <circle cx="10" cy="28" r="4.5" fill="#16A34A" />

      {/* Network Connections */}
      <line x1="50" y1="5" x2="90" y2="28" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
      <line x1="90" y1="28" x2="90" y2="72" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
      <line x1="90" y1="72" x2="50" y2="95" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="95" x2="10" y2="72" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
      <line x1="10" y1="72" x2="10" y2="28" stroke="#16A34A" strokeWidth="2" opacity="0.4" />
      <line x1="10" y1="28" x2="50" y2="5" stroke="#16A34A" strokeWidth="2" opacity="0.4" />

      {/* Modern Center Leaf Structure */}
      {/* Center Stem */}
      <path 
        d="M50,95 L50,45" 
        stroke="#16A34A" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
      
      {/* Top Main Leaf */}
      <path 
        d="M50,45 C38,32 50,15 50,15 C50,15 62,32 50,45 Z" 
        fill="url(#leafGrad)" 
        stroke="#15803D" 
        strokeWidth="3.5" 
        strokeLinejoin="round" 
      />
      
      {/* Left Leaf */}
      <path 
        d="M50,65 C25,60 25,35 45,32 C45,32 40,55 50,65 Z" 
        fill="url(#leafGrad)" 
        stroke="#15803D" 
        strokeWidth="3.5" 
        strokeLinejoin="round" 
      />
      
      {/* Right Leaf */}
      <path 
        d="M50,65 C75,60 75,35 55,32 C55,32 60,55 50,65 Z" 
        fill="url(#leafGrad)" 
        stroke="#15803D" 
        strokeWidth="3.5" 
        strokeLinejoin="round" 
      />
      
      {/* Abstract Circuit/Network nodes inside the leaves */}
      <circle cx="50" cy="27" r="3" fill="#ffffff" stroke="#15803D" strokeWidth="1.5" />
      <circle cx="37" cy="48" r="3" fill="#ffffff" stroke="#15803D" strokeWidth="1.5" />
      <circle cx="63" cy="48" r="3" fill="#ffffff" stroke="#15803D" strokeWidth="1.5" />
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="leafGrad" x1="50" y1="15" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
    </svg>
  );
};
export default AgriMeshLogo;
