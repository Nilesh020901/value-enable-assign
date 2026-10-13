import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Calculator,
  TableProperties,
  LogOut,
  ShieldCheck,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import { api, User as UserType } from '../services/api';

interface LayoutProps {
  user: UserType | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      onLogout();
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                ValuEnable
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">Benefit Illustration</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <NavLink
              to="/policy"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/60'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <Calculator className="w-4 h-4" />
              Policy Calculation
            </NavLink>

            <NavLink
              to="/illustration"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/60'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <TableProperties className="w-4 h-4" />
              Illustration Table
            </NavLink>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {user && (
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 mb-3 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">{user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>DOB: {user.dob}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Life Insurance
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">Actuarial Illustration Module</span>
          </div>

          {user && (
            <div className="text-xs text-slate-500">
              Signed in as: <strong className="text-slate-800">{user.email}</strong>
            </div>
          )}
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};
