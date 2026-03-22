import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Users, Home } from 'lucide-react';
import logo from '../images/logo.png'; // Using the same logo as the Check-In page

export default function Sidebar({ userRole }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const links = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: Home },
    { path: '/visitor-logs', label: 'Visitor Logs', icon: FileText },
  ];

  // Add User Management for Admin and Super Admin
  if (userRole === 'super') {
    links.push({ path: '/user-management', label: 'User Management', icon: Users });
  } else if (userRole === 'admin') {
    links.push({ path: '/admin-user-management', label: 'User Management', icon: Users });
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col z-20">
      
      {/* Logo Area */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img 
              src={logo} 
              alt="NEU Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">NEU Library</h1>
            <p className="text-xs font-medium text-slate-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {links.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-md font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Role Info */}
      <div className="pt-6 border-t border-slate-100 mt-auto">
        <div className="text-xs text-slate-500 space-y-1.5">
          <p className="flex items-center gap-1.5">
            Role: 
            <span className="font-semibold text-slate-900 capitalize px-2 py-0.5 bg-slate-100 rounded-md">
              {userRole || 'User'}
            </span>
          </p>
          <p className="text-slate-400 font-medium">© 2026 NEU Library</p>
        </div>
      </div>
    </div>
  );
}