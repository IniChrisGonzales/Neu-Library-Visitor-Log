import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
} from 'firebase/firestore';
import { 
  Users, 
  BarChart3, 
  LogOut, 
  TrendingUp,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVisitors: 0,
    studentCount: 0,
    employeeCount: 0,
    topPurpose: 'Loading...',
  });
  const [chartData, setChartData] = useState({
    collegeData: { labels: [], datasets: [] },
    purposeData: { labels: [], datasets: [] },
  });
  const [dateFilter, setDateFilter] = useState('weekly');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole && !['admin', 'super'].includes(userRole)) {
      navigate('/check-in');
      return;
    }
    fetchStats();
  }, [userRole, dateFilter, collegeFilter, purposeFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all logs
      const logsQuery = query(collection(db, 'visitorLogs'));
      const logsSnapshot = await getDocs(logsQuery);
      let logs = logsSnapshot.docs.map(doc => doc.data());

      // Apply date filter client-side
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      logs = logs.filter(log => {
        const logDate = (log.timeIn || log.checkInTime)?.toDate?.() || new Date(log.timeIn || log.checkInTime);
        return logDate >= startDate && logDate <= now;
      });

      // Apply college filter
      if (collegeFilter) {
        logs = logs.filter(log => log.college === collegeFilter);
      }

      // Apply purpose filter
      if (purposeFilter) {
        logs = logs.filter(log => log.purpose === purposeFilter);
      }

      // Calculate stats
      const totalVisitors = logs.length;
      const studentCount = logs.filter(log => log.userType === 'Student').length;
      const employeeCount = logs.filter(log => 
        ['Faculty', 'Staff'].includes(log.userType)
      ).length;

      // Get top purpose
      const purposeCounts = {};
      logs.forEach(log => {
        purposeCounts[log.purpose] = (purposeCounts[log.purpose] || 0) + 1;
      });
      const topPurpose = Object.keys(purposeCounts).length > 0
        ? Object.entries(purposeCounts).sort(([,a], [,b]) => b - a)[0][0]
        : 'N/A';

      setStats({
        totalVisitors,
        studentCount,
        employeeCount,
        topPurpose,
      });

      // Calculate chart data
      const collegeCounts = {};
      const purposeCountsForChart = {};

      logs.forEach(log => {
        // College data
        collegeCounts[log.college] = (collegeCounts[log.college] || 0) + 1;
        
        // Purpose data
        purposeCountsForChart[log.purpose] = (purposeCountsForChart[log.purpose] || 0) + 1;
      });

      // Prepare college chart data
      const collegeLabels = Object.keys(collegeCounts);
      const collegeValues = Object.values(collegeCounts);

      const collegeChartData = {
        labels: collegeLabels,
        datasets: [
          {
            label: 'Visitors',
            data: collegeValues,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)', // blue
              'rgba(16, 185, 129, 0.8)', // emerald
              'rgba(245, 158, 11, 0.8)', // amber
              'rgba(239, 68, 68, 0.8)',  // red
              'rgba(139, 92, 246, 0.8)', // violet
              'rgba(236, 72, 153, 0.8)', // pink
              'rgba(6, 182, 212, 0.8)',  // cyan
              'rgba(34, 197, 94, 0.8)',  // green
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(6, 182, 212, 1)',
              'rgba(34, 197, 94, 1)',
            ],
            borderWidth: 1,
            borderRadius: 6, // Added rounded corners to bars
          },
        ],
      };

      // Prepare purpose chart data
      const purposeLabels = Object.keys(purposeCountsForChart);
      const purposeValues = Object.values(purposeCountsForChart);

      const purposeChartData = {
        labels: purposeLabels.map(label => 
          label.charAt(0).toUpperCase() + label.slice(1)
        ),
        datasets: [
          {
            data: purposeValues,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)', // blue
              'rgba(16, 185, 129, 0.8)', // emerald
              'rgba(245, 158, 11, 0.8)', // amber
              'rgba(239, 68, 68, 0.8)',  // red
              'rgba(139, 92, 246, 0.8)', // violet
            ],
            borderColor: [
              'rgba(255, 255, 255, 1)', // Clean white borders for doughnut
              'rgba(255, 255, 255, 1)',
              'rgba(255, 255, 255, 1)',
              'rgba(255, 255, 255, 1)',
              'rgba(255, 255, 255, 1)',
            ],
            borderWidth: 2,
          },
        ],
      };

      setChartData({
        collegeData: collegeChartData,
        purposeData: purposeChartData,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
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

  // Shared tooltip configuration for light mode
  const tooltipOptions = {
    backgroundColor: '#ffffff',
    titleColor: '#0f172a',
    bodyColor: '#334155',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 12,
    boxPadding: 6,
    usePointStyle: true,
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-4 sm:px-8 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                    College
                  </label>
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium truncate"
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
                    <option value="GRADUATE — Graduate School">Graduate School</option>
                    <option value="STAFF — Faculty / Staff">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Purpose
                  </label>
                  <select
                    value={purposeFilter}
                    onChange={(e) => setPurposeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="">All Purposes</option>
                    <option value="reading">Reading</option>
                    <option value="studying">Studying</option>
                    <option value="computer">Computer Use</option>
                    <option value="research">Research</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Visitors"
                value={stats.totalVisitors}
                icon={Users}
                color="blue"
                loading={loading}
              />
              <StatCard
                title="Students"
                value={stats.studentCount}
                icon={TrendingUp}
                color="cyan"
                loading={loading}
              />
              <StatCard
                title="Staff & Faculty"
                value={stats.employeeCount}
                icon={Users}
                color="purple"
                loading={loading}
              />
              <StatCard
                title="Top Purpose"
                value={stats.topPurpose}
                icon={BarChart3}
                color="pink"
                loading={loading}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Visitors by College Bar Chart */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 tracking-tight">Visitors by College</h3>
                <div className="h-72">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      Loading chart...
                    </div>
                  ) : chartData.collegeData.labels.length > 0 ? (
                    <Bar
                      data={chartData.collegeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: tooltipOptions,
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                              drawBorder: false,
                            },
                            ticks: {
                              color: '#64748b', // slate-500
                              font: { family: 'inherit' }
                            },
                            border: { display: false }
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: '#64748b', // slate-500
                              maxRotation: 45,
                              minRotation: 45,
                              font: { family: 'inherit', size: 11 }
                            },
                            border: { display: false }
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      No data available for this range
                    </div>
                  )}
                </div>
              </div>

              {/* Visitors by Purpose Doughnut Chart */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 tracking-tight">Visitors by Purpose</h3>
                <div className="h-72">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      Loading chart...
                    </div>
                  ) : chartData.purposeData.labels.length > 0 ? (
                    <Doughnut
                      data={chartData.purposeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%', // Makes the doughnut thinner/more modern
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: '#475569', // slate-600
                              padding: 20,
                              usePointStyle: true,
                              pointStyle: 'circle',
                              font: { family: 'inherit', size: 12, weight: '500' }
                            },
                          },
                          tooltip: tooltipOptions,
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      No data available for this range
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}