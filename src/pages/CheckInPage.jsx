import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Book, 
  Lightbulb, 
  Laptop, 
  Users, 
  FileText,
  Loader,
  LogOut,
  Clock,
  CheckCircle,
  LogIn
} from 'lucide-react';
// Assuming the logo is in this path based on previous pages
import logo from '../images/logo.png'; 
import { seedRealisticDatabase } from '../lib/seedData'; // <-- Import the seeding function
const purposes = [
  { id: 'reading', label: 'Reading', icon: Book },
  { id: 'studying', label: 'Studying', icon: Lightbulb },
  { id: 'computer', label: 'Computer', icon: Laptop },
  { id: 'research', label: 'Research', icon: FileText },
  { id: 'meeting', label: 'Meeting', icon: Users },
];

export default function CheckInPage() {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeLog, setActiveLog] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPurpose) {
      setError('Please select a purpose');
      return;
    }

    if (activeLog) {
      setError('You are already checked in. Please check out first.');
      return;
    }

    if (userData?.isBlocked) {
      setError('Your account is blocked. Please contact admin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      let currentCollege = userData?.college;
      let currentUserType = userData?.userType;
      let currentIsBlocked = userData?.isBlocked;

      if (!currentCollege || !currentUserType) {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          const userDocData = userSnapshot.data();
          currentCollege = currentCollege || userDocData.college || '';
          currentUserType = currentUserType || userDocData.userType || '';
          currentIsBlocked = currentIsBlocked ?? userDocData.isBlocked;
        }
      }

      if (currentIsBlocked) {
        setError('Your account is blocked. Please contact admin.');
        setIsSubmitting(false);
        return;
      }

      if (!currentCollege || !currentUserType) {
        setError('College and user type must be set before checking in. Please complete registration.');
        setIsSubmitting(false);
        return;
      }

      const logsRef = collection(db, 'visitorLogs');
      const docRef = await addDoc(logsRef, {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        college: currentCollege,
        purpose: selectedPurpose,
        userType: currentUserType,
        timeIn: serverTimestamp(),
        timeOut: null,
        duration: null,
        status: 'checked-in',
        createdAt: serverTimestamp(),
      });

      setSelectedPurpose(null);
      setActiveLog({
        id: docRef.id,
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        college: currentCollege,
        purpose: selectedPurpose,
        userType: currentUserType,
        timeIn: new Date(),
        isBlocked: false,
        status: 'checked-in',
      });
      setError(null);
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Failed to check in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const performCheckout = async () => {
    if (!activeLog) return;

    try {
      setIsProcessing(true);
      const logRef = doc(db, 'visitorLogs', activeLog.id);
      const timeIn = activeLog.timeIn?.toDate?.() || new Date(activeLog.timeIn);
      const timeOut = new Date();
      const durationMinutes = Math.round((timeOut - timeIn) / 60000);
      const duration = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

      await updateDoc(logRef, {
        timeOut: serverTimestamp(),
        duration,
        status: 'checked-out',
        updatedAt: serverTimestamp(),
      });

      setActiveLog(null);
      setError(null);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to check out. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (activeLog) {
        await performCheckout();
      }
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    const loadActiveLog = async () => {
      if (!user?.uid) return;
      try {
        const logsQuery = query(
          collection(db, 'visitorLogs'),
          where('uid', '==', user.uid),
          where('status', '==', 'checked-in')
        );
        const snapshot = await getDocs(logsQuery);
        if (!snapshot.empty) {
          const docSnapshot = snapshot.docs
            .sort((a, b) => b.data().timeIn?.toDate?.() - a.data().timeIn?.toDate?.())[0];
          setActiveLog({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setActiveLog(null);
        }
      } catch (err) {
        console.error('Error loading active log:', err);
      }
    };
    loadActiveLog();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sm:px-8 z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo and App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={logo} 
                alt="NEU Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">NEU Library</h1>
              <p className="text-slate-500 text-sm font-medium">Visitor Kiosk</p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.displayName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Welcome to NEU Library!
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            {activeLog
              ? `Hello ${activeLog.name}, you are securely checked in for library use.`
              : 'Please select the primary purpose of your visit today to complete check-in.'}
          </p>
        </div>

        {/* Central Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-6 sm:p-12">
          {activeLog ? (
            
            /* Checked In State */
            <div className="space-y-6">
              <div className="px-6 py-10 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-semibold text-emerald-900 mb-6 tracking-tight">Visit Registered Successfully</h3>
                
                <div className="inline-block text-left bg-white px-6 py-5 rounded-xl border border-emerald-100 shadow-sm space-y-2">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold text-emerald-950 mr-2">Purpose:</span> 
                    <span className="capitalize font-medium">{activeLog.purpose}</span>
                  </p>
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold text-emerald-950 mr-2">User Type:</span> 
                    <span className="font-medium">{activeLog.userType}</span>
                  </p>
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold text-emerald-950 mr-2">College:</span> 
                    <span className="font-medium">{activeLog.college}</span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-rose-600 text-sm font-medium text-center">{error}</p>
                </div>
              )}

              <button
                onClick={performCheckout}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing Check Out...</span>
                  </>
                ) : (
                  <span>Check Out of Library</span>
                )}
              </button>
            </div>
            
          ) : (
            
            /* Check In Form */
            <>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Purpose of Visit Grid */}
                <div className="mb-10">
                  <label className="block text-slate-900 font-semibold mb-4 text-lg">
                    Purpose of Visit
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                    {purposes.map((purpose) => {
                      const Icon = purpose.icon;
                      const isSelected = selectedPurpose === purpose.id;
                      
                      return (
                        <button
                          key={purpose.id}
                          type="button"
                          onClick={() => setSelectedPurpose(purpose.id)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md scale-[1.02]'
                              : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-center">
                            {purpose.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin text-slate-400" />
                      <span>Checking In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Check In Now</span>
                    </>
                  )}
                </button>
              </form>

              {/* Additional Info Footer */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-slate-400 text-center text-sm font-medium flex items-center justify-center gap-2.5 max-w-lg mx-auto leading-relaxed">
                  <Clock className="w-4 h-4 shrink-0 text-slate-300" />
                  Your check-in is logged securely in the system for official university library records and safety protocols.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}