import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { LogOut, Download, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function VisitorLogsPage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

  useEffect(() => {
    if (userRole && !['admin', 'super'].includes(userRole)) {
      navigate('/check-in');
      return;
    }
    fetchLogs();
  }, [userRole]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, dateFilter, collegeFilter, purposeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsQuery = query(collection(db, 'visitorLogs'));
      const snapshot = await getDocs(logsQuery);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logsData.sort((a, b) => 
        new Date((b.timeIn || b.checkInTime)?.toDate?.() || 0) - new Date((a.timeIn || a.checkInTime)?.toDate?.() || 0)
      ));
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          return;
      }

      filtered = filtered.filter(log => {
        const logDate = (log.timeIn || log.checkInTime)?.toDate?.() || new Date(log.timeIn || log.checkInTime);
        return logDate >= startDate && logDate <= now;
      });
    }

    // College filter
    if (collegeFilter) {
      filtered = filtered.filter(log => log.college === collegeFilter);
    }

    // Purpose filter
    if (purposeFilter) {
      filtered = filtered.filter(log => log.purpose === purposeFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'College', 'Purpose', 'User Type', 'Time In', 'Time Out', 'Duration'];
    const rows = filteredLogs.map(log => [
      log.name,
      log.email,
      log.college,
      log.purpose,
      log.userType,
      (log.timeIn || log.checkInTime)?.toDate?.()?.toLocaleString() || '',
      log.timeOut?.toDate?.()?.toLocaleString() || '',
      log.duration || 'N/A',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const inputClasses = "px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 hover:border-slate-300 transition-all text-sm";

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 sm:px-8 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Visitor Logs</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          
          {/* Controls Container */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-3 flex-col lg:flex-row">
              
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 ${inputClasses}`}
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`lg:w-40 ${inputClasses} cursor-pointer`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* College Filter */}
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className={`lg:w-48 ${inputClasses} cursor-pointer truncate`}
              >
                <option value="">All Colleges</option>
                <option value="CICS — College of Information and Computing Sciences">CICS</option>
                <option value="CAS — College of Arts and Sciences">CAS</option>
                <option value="CBE — College of Business and Economics">CBE</option>
                <option value="COE — College of Engineering">COE</option>
                <option value="CON — College of Nursing">CON</option>
                <option value="COE-Ed — College of Education">COE-Ed</option>
                <option value="CTHM — College of Tourism and Hospitality Management">CTHM</option>
                <option value="CCJE — College of Criminal Justice Education">CCJE</option>
                <option value="GRADUATE — Graduate School">GRADUATE</option>
                <option value="STAFF — Faculty / Staff">STAFF</option>
              </select>

              {/* Purpose Filter */}
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className={`lg:w-40 ${inputClasses} cursor-pointer`}
              >
                <option value="">All Purposes</option>
                <option value="reading">Reading</option>
                <option value="studying">Studying</option>
                <option value="computer">Computer Use</option>
                <option value="research">Research</option>
                <option value="meeting">Meeting</option>
              </select>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm font-medium whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Results Counter */}
            <p className="text-slate-500 text-sm font-medium">
              Showing {filteredLogs.length} of {logs.length} records
            </p>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                No logs found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">College</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Purpose</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Time In</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Time Out</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log, idx) => (
                      <tr
                        key={log.id || idx}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                          {log.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate" title={log.college}>
                          {log.college}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <span className="capitalize bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium inline-block">
                            {log.purpose}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {log.userType}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {(log.timeIn || log.checkInTime)?.toDate?.()?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {log.timeOut ? (
                            log.timeOut.toDate?.()?.toLocaleString()
                          ) : (
                            <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {log.duration || '-'}
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
  );
}