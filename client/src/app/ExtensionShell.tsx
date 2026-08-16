import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';

export const ExtensionShell: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-surface">
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 right-4 z-50 bg-neutral/80 backdrop-blur text-text font-bold px-4 py-2 rounded-full shadow border border-neutral flex items-center gap-2 hover:bg-neutral transition-colors"
      >
        <ArrowRightLeft size={16} />
        Switch to Farmer
      </button>

      <Outlet />
    </div>
  );
};
