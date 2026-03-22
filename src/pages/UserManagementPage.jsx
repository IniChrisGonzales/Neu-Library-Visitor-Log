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
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { LogOut, Trash2, Shield, User, Plus, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function UserManagementPage() {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Only Super Admin can access this page
  useEffect(() => {
    if (userRole && userRole !== 'super') {
      navigate('/admin-dashboard');
      return;
    }
    fetchUsers();
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData.sort((a, b) => 
        new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0)
      ));
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

      // Check if user already exists
      const existingUser = users.find(u => u.email === newEmail);

      if (existingUser) {
        // Toggle role for existing user
        const newRole = existingUser.role === 'admin' ? 'student' : 'admin';
        await setDoc(doc(db, 'users', existingUser.uid), {
          ...existingUser,
          role: newRole,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new admin user (pre-authorized)
        const randomId = `temp_${Date.now()}`;
        await setDoc(doc(db, 'users', randomId), {
          email: newEmail,
          role: selectedRole,
          displayName: newEmail.split('@')[0],
          isBlocked: false,
          college: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setNewEmail('');
      setSelectedRole('admin');
      setShowAddModal(false);
      await fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (uid, email) => {
    if (!window.confirm(`Remove admin privileges from ${email}?`)) return;

    try {
      const user = users.find(u => u.uid === uid);
      if (user) {
        await setDoc(doc(db, 'users', uid), {
          ...user,
          role: 'student',
          updatedAt: serverTimestamp(),
        });
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error removing admin:', err);
      setError('Failed to update user');
    }
  };

  const handleBlockUser = async (uid, email, currentBlocked) => {
    try {
      const user = users.find(u => u.uid === uid);
      if (user) {
        await setDoc(doc(db, 'users', uid), {
          ...user,
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
    <div className="flex h-screen bg-dark-950">
      <Sidebar userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-dark-900 border-b border-dark-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Add Admin Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-neu-blue hover:bg-neu-blue hover:opacity-90 text-white px-6 py-2 rounded-lg mb-8 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-dark-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-dark-400">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-800 border-b border-dark-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-dark-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.uid}
                        className="border-b border-dark-800 hover:bg-dark-800 hover:bg-opacity-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">
                          {user.displayName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium ${
                            user.role === 'super'
                              ? 'bg-red-900 bg-opacity-30 text-red-200'
                              : user.role === 'admin'
                              ? 'bg-neu-blue bg-opacity-20 text-neu-blue'
                              : 'bg-dark-700 text-dark-300'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {user.role || 'student'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${
                            user.isBlocked
                              ? 'bg-red-900 bg-opacity-30 text-red-200'
                              : 'bg-green-900 bg-opacity-30 text-green-200'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          {user.role !== 'super' && (
                            <>
                              {user.role === 'admin' && (
                                <button
                                  onClick={() => handleRemoveAdmin(user.uid, user.email)}
                                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove admin privileges"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleBlockUser(user.uid, user.email, user.isBlocked)}
                                className={`inline-flex items-center gap-1 transition-colors ${
                                  user.isBlocked
                                    ? 'text-green-400 hover:text-green-300'
                                    : 'text-yellow-400 hover:text-yellow-300'
                                }`}
                                title={user.isBlocked ? 'Unblock user' : 'Block user'}
                              >
                                <User className="w-4 h-4" />
                                {user.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </>
                          )}
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

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-lg border border-dark-800 p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Admin</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@neu.edu.ph"
                  className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-800 text-white border border-dark-700 rounded-lg focus:outline-none focus:border-neu-blue"
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-neu-blue hover:opacity-90 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
