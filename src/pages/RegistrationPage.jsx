import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader, User, GraduationCap } from 'lucide-react';
import bg from '../images/bg.jpg';
import logo from '../images/logo.png';

const colleges = [
  'CICS — College of Information and Computing Sciences',
  'CAS — College of Arts and Sciences',
  'CBE — College of Business and Economics',
  'COE — College of Engineering',
  'CON — College of Nursing',
  'COE-Ed — College of Education',
  'CTHM — College of Tourism and Hospitality Management',
  'CCJE — College of Criminal Justice Education',
  'GRADUATE — Graduate School',
  'STAFF — Faculty / Staff',
];

const userTypes = ['Student', 'Faculty', 'Staff'];

export default function RegistrationPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollege || !selectedUserType) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        college: selectedCollege,
        userType: selectedUserType,
        updatedAt: serverTimestamp(),
      });

      // Redirect to check-in page
      navigate('/check-in');

    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-100 selection:text-blue-900 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Dark overlay with blur */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

      {/* Centered Minimalist Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-12">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src={logo} 
              alt="NEU Library Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-500 text-sm">
            Fill in your details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* College Selection */}
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-2">
              College or Department
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select your college</option>
                {colleges.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-3">
              User Type
            </label>
            <div className="flex flex-col space-y-3">
              {userTypes.map((type) => (
                <label key={type} className="flex items-center group cursor-pointer">
                  <input
                    type="radio"
                    value={type}
                    checked={selectedUserType === type}
                    onChange={(e) => setSelectedUserType(e.target.value)}
                    className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                    required
                  />
                  <span className="ml-3 text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Minimal Error State */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm text-center rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Clean Primary Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin text-slate-400" />
                <span>Saving Details...</span>
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Unobtrusive Footer Link */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}