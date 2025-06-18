// src/components/admin/AnalyticsDashboard.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlatformAnalyticsData, ServiceType } from '../../types.js'; // Assuming PlatformAnalyticsData structure is defined

// Generate mock data for charts
const generateMockAnalyticsData = (): PlatformAnalyticsData => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const serviceTypes = Object.values(ServiceType).filter(st => st !== ServiceType.UNKNOWN && st !== ServiceType.TASKS && st !== ServiceType.LOGISTICS && st !== ServiceType.EVENT_PLANNING);
  
  return {
    dailyNewUsers: days.map((day, i) => ({ date: day, count: Math.floor(Math.random() * 20) + 5 + i * 2 })),
    requestsByServiceType: serviceTypes.map(type => ({ type, count: Math.floor(Math.random() * 50) + 10 })),
    platformRevenue: days.map((day, i) => ({
      date: day,
      revenue: Math.floor(Math.random() * 500) + 200 + i * 50,
      commission: Math.floor(Math.random() * 50) + 10 + i * 5,
    })),
    apiHealth: {
        timestamp: new Date().toISOString(),
        avgResponseTimeMs: Math.floor(Math.random() * 100) + 50,
        errorRatePercent: parseFloat((Math.random() * 2).toFixed(2)),
    }
  };
};


const AnalyticsDashboard: React.FC = () => {
  const data = useMemo(() => generateMockAnalyticsData(), []);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A52A2A'];


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">New User Registrations (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyNewUsers}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'currentColor' }} />
            <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} />
            <Tooltip wrapperStyle={{ fontSize: '12px', backgroundColor: 'var(--background-color, #fff)', color: 'var(--text-color, #333)', border: '1px solid #ccc' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="count" name="New Users" stroke="#8884d8" activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Requests by Service Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.requestsByServiceType} layout="vertical" barSize={15}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
            <XAxis type="number" tick={{ fontSize: 10, fill: 'currentColor' }} />
            <YAxis type="category" dataKey="type" width={100} tickFormatter={(value) => (value as string).replace(/_/g, ' ').replace(/\b\w/g, (l:string) => l.toUpperCase()).substring(0,15)} tick={{ fontSize: 9, fill: 'currentColor' }} interval={0} />
            <Tooltip wrapperStyle={{ fontSize: '12px', backgroundColor: 'var(--background-color, #fff)', color: 'var(--text-color, #333)', border: '1px solid #ccc' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }}/>
            <Bar dataKey="count" name="Requests" >
                {data.requestsByServiceType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 md:col-span-2">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Platform Revenue & Commission (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.platformRevenue}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'currentColor' }} />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{ fontSize: 10, fill: 'currentColor' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fontSize: 10, fill: 'currentColor' }} />
            <Tooltip wrapperStyle={{ fontSize: '12px', backgroundColor: 'var(--background-color, #fff)', color: 'var(--text-color, #333)', border: '1px solid #ccc' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Total Revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            <Area yAxisId="right" type="monotone" dataKey="commission" name="Platform Commission" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">API Health</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Response: <span className="font-semibold text-blue-600 dark:text-blue-400">{data.apiHealth.avgResponseTimeMs} ms</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Error Rate: <span className={`font-semibold ${data.apiHealth.errorRatePercent > 1 ? 'text-red-500' : 'text-green-500'}`}>{data.apiHealth.errorRatePercent}%</span></p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last check: {new Date(data.apiHealth.timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;