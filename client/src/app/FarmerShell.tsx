import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../features/voice/components/LanguageSwitcher';
import { GlobalMicButton } from '../features/voice/components/GlobalMicButton';
import { ArrowRightLeft } from 'lucide-react';
import { FieldProvider } from './providers/FieldProvider';

export const FarmerShell: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FieldProvider>
      <div className="min-h-screen bg-surface flex justify-center p-4 relative">
        <GlobalMicButton />

        <button
          onClick={() => navigate('/extension')}
          className="absolute top-4 right-4 z-50 bg-neutral/80 backdrop-blur text-text font-bold px-4 py-2 rounded-full shadow border border-neutral flex items-center gap-2 hover:bg-neutral transition-colors"
        >
          <ArrowRightLeft size={16} />
          Switch to Extension Officer
        </button>

        <div className="w-full max-w-md flex flex-col mt-8">
          <header className="mb-6 flex justify-between items-start">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-black text-text tracking-tight">AgriMesh</h1>
              <p className="text-text-muted">Field Intelligence Dashboard</p>
            </Link>
            <LanguageSwitcher />
          </header>

          {/* This is where the nested routes (Home, Field) will render */}
          <Outlet />
        </div>
      </div>
    </FieldProvider>
  );
};
