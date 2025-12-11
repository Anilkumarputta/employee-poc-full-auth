import React, { useEffect, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";

interface PerformanceStats {
  attendance: number;
  notesCount: number;
  reviewCount: number;
  status: string;
  flagged: boolean;
}

interface AttendanceTrend {
  date: string;
  attendance: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [trends, setTrends] = useState<AttendanceTrend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    graphqlRequest(
      `query($employeeId: Int!) { employeePerformanceStats(employeeId: $employeeId) { attendance notesCount reviewCount status flagged } attendanceTrends(employeeId: $employeeId) { date attendance } }`,
      { employeeId: Number(employeeId) }
    ).then((data) => {
      setStats(data.employeePerformanceStats);
      setTrends(data.attendanceTrends);
    }).finally(() => setLoading(false));
  }, [employeeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Performance & Attendance Analytics</h1>
      <div style={{ marginBottom: "2rem" }}>
        <input
          type="number"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", minWidth: "200px" }}
        />
      </div>
      {loading && <div>Loading analytics...</div>}
      {stats && (
        <div style={{ marginBottom: "2rem" }}>
          <h2>Employee Stats</h2>
          <ul>
            <li>Attendance: {stats.attendance}%</li>
            <li>Notes Received: {stats.notesCount}</li>
            <li>Review Requests: {stats.reviewCount}</li>
            <li>Status: {stats.status}</li>
            <li>Flagged: {stats.flagged ? "Yes" : "No"}</li>
          </ul>
        </div>
      )}
      {trends.length > 0 && (
        <div>
          <h2>Attendance Trends</h2>
          <Line
            data={{
              labels: trends.map(t => t.date),
              datasets: [{
                label: "Attendance %",
                data: trends.map(t => t.attendance),
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
                fill: false,
              }],
            }}
            options={{ responsive: true, plugins: { legend: { display: true } } }}
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
