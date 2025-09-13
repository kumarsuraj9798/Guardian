import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('responseTime');

  // Sample data - in real app, this would come from API
  const [analyticsData, setAnalyticsData] = useState({
    responseTimeData: [
      { hour: '00:00', responseTime: 2.1, incidents: 3 },
      { hour: '04:00', responseTime: 1.8, incidents: 1 },
      { hour: '08:00', responseTime: 3.2, incidents: 8 },
      { hour: '12:00', responseTime: 2.9, incidents: 12 },
      { hour: '16:00', responseTime: 3.5, incidents: 15 },
      { hour: '20:00', responseTime: 2.7, incidents: 9 }
    ],
    incidentTypes: [
      { name: 'Medical', value: 45, color: '#ff6b6b' },
      { name: 'Fire', value: 25, color: '#ffa726' },
      { name: 'Accident', value: 20, color: '#42a5f5' },
      { name: 'Security', value: 10, color: '#66bb6a' }
    ],
    unitPerformance: [
      { unit: 'Unit-001', responseTime: 2.1, incidents: 15, successRate: 98 },
      { unit: 'Unit-002', responseTime: 2.8, incidents: 12, successRate: 95 },
      { unit: 'Unit-003', responseTime: 1.9, incidents: 18, successRate: 100 },
      { unit: 'Unit-004', responseTime: 3.2, incidents: 10, successRate: 92 },
      { unit: 'Unit-005', responseTime: 2.5, incidents: 14, successRate: 96 }
    ],
    heatmapData: [
      { x: 40.7128, y: -74.0060, value: 15, type: 'Medical' },
      { x: 40.7589, y: -73.9851, value: 8, type: 'Fire' },
      { x: 40.7505, y: -73.9934, value: 12, type: 'Accident' },
      { x: 40.7614, y: -73.9776, value: 6, type: 'Security' },
      { x: 40.7282, y: -74.0776, value: 9, type: 'Medical' }
    ],
    trendsData: [
      { month: 'Jan', incidents: 120, responseTime: 3.2 },
      { month: 'Feb', incidents: 135, responseTime: 2.9 },
      { month: 'Mar', incidents: 148, responseTime: 2.7 },
      { month: 'Apr', incidents: 142, responseTime: 2.8 },
      { month: 'May', incidents: 156, responseTime: 2.6 },
      { month: 'Jun', incidents: 163, responseTime: 2.5 }
    ]
  });

  const [realTimeStats, setRealTimeStats] = useState({
    activeIncidents: 7,
    responseUnits: 12,
    avgResponseTime: 2.8,
    successRate: 97.2
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        activeIncidents: Math.max(0, prev.activeIncidents + Math.floor(Math.random() * 3) - 1),
        avgResponseTime: Math.max(1.5, prev.avgResponseTime + (Math.random() - 0.5) * 0.2),
        successRate: Math.min(100, Math.max(90, prev.successRate + (Math.random() - 0.5) * 0.5))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey === 'responseTime' ? ' min' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <div className="dashboard-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-number">{realTimeStats.activeIncidents}</div>
            <div className="stat-label">Active Incidents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚑</div>
          <div className="stat-content">
            <div className="stat-number">{realTimeStats.responseUnits}</div>
            <div className="stat-label">Response Units</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-number">{realTimeStats.avgResponseTime.toFixed(1)}m</div>
            <div className="stat-label">Avg Response Time</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{realTimeStats.successRate.toFixed(1)}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Response Time Trend */}
        <div className="chart-container">
          <h3>Response Time Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#4CAF50" 
                fill="#4CAF50" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Types Distribution */}
        <div className="chart-container">
          <h3>Incident Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.incidentTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.incidentTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Unit Performance */}
        <div className="chart-container">
          <h3>Unit Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.unitPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="unit" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="responseTime" fill="#42a5f5" name="Response Time (min)" />
              <Bar yAxisId="right" dataKey="successRate" fill="#66bb6a" name="Success Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="chart-container">
          <h3>Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="incidents" 
                stroke="#ff6b6b" 
                name="Incidents"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#4CAF50" 
                name="Response Time (min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap Visualization */}
        <div className="chart-container heatmap-container">
          <h3>Incident Density Heatmap</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={analyticsData.heatmapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Latitude" />
              <YAxis dataKey="y" name="Longitude" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <p>{`Type: ${data.type}`}</p>
                        <p>{`Incidents: ${data.value}`}</p>
                        <p>{`Location: ${data.x.toFixed(4)}, ${data.y.toFixed(4)}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                dataKey="value" 
                fill="#ff6b6b" 
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Real-time Activity */}
        <div className="chart-container">
          <h3>Real-time Activity</h3>
          <div className="activity-feed">
            {[
              { time: '14:32', event: 'Medical emergency reported', type: 'medical' },
              { time: '14:28', event: 'Fire unit dispatched', type: 'fire' },
              { time: '14:25', event: 'Accident cleared', type: 'accident' },
              { time: '14:22', event: 'Security alert resolved', type: 'security' },
              { time: '14:18', event: 'New incident assigned', type: 'medical' }
            ].map((activity, index) => (
              <div key={index} className={`activity-item ${activity.type}`}>
                <span className="activity-time">{activity.time}</span>
                <span className="activity-event">{activity.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
