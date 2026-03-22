import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { LogOut, User, Plus, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function AdminUserManagementPage() {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    fetchUsers();
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setUsers(usersData.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0)));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@neu.edu.ph')) {
      setError('Please enter a valid @neu.edu.ph email');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const existingUser = users.find(u => u.email === newEmail);
      if (existingUser) {
        setError('User already exists. Admin can only manage regular users.');
        return;
      }

      const randomId = `temp_${Date.now()}`;
      await setDoc(doc(db, 'users', randomId), {
        email: newEmail,
        role: 'student',
        displayName: newEmail.split('@')[0],
        isBlocked: false,
        college: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewEmail('');
      setShowAddModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = async (uid, currentBlocked) => {
    try {
      const targetUser = users.find(u => u.uid === uid);
      if (targetUser) {
        await updateDoc(doc(db, 'users', uid), {
          isBlocked: !currentBlocked,
          updatedAt: serverTimestamp(),
        });
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Failed to update user');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 sm:px-8 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">User Management <span className="text-slate-400 font-medium text-base ml-1">(Admin)</span></h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                <span>Add User</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium text-sm">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr
                          key={user.uid}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {user.displayName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              user.isBlocked
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                              {user.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <button
                              onClick={() => handleBlockUser(user.uid, user.isBlocked)}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                user.isBlocked
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200/50'
                              }`}
                              title={user.isBlocked ? 'Unblock user' : 'Block user'}
                            >
                              {user.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add New User</h2>
                <p className="text-sm text-slate-500 mt-1">Create a new student account manually.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="mb-6">
                <label className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@neu.edu.ph"
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-slate-400"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}