import React from "react";

/* Sample cleanup task data */
const cleanupTasks = [
  {
    location: "Coastal Area A",
    severity: "High",
    priority: "Urgent",
    status: "In Progress",
  },
  {
    location: "Harbor B",
    severity: "Medium",
    priority: "High",
    status: "Pending",
  },
  {
    location: "Bay C",
    severity: "Low",
    priority: "Medium",
    status: "Completed",
  },
  {
    location: "River D",
    severity: "High",
    priority: "Critical",
    status: "Delayed",
  },
];

/* Cleanup prioritization dashboard */
function CleanupDashboard() {
  return (
    <div className="cleanup-dashboard">

      {/* Section title */}
      <h2 className="cleanup-title">Cleanup Prioritization</h2>

      <div className="cleanup-table-container">
        <table className="cleanup-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Severity</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {cleanupTasks.map((task, index) => (
              <tr key={index}>
                <td>{task.location}</td>

                <td>
                  <span className={`badge ${task.severity.toLowerCase()}`}>
                    {task.severity}
                  </span>
                </td>

                <td>
                  <span className="badge priority">
                    {task.priority}
                  </span>
                </td>

                <td className="status-text">
                  {task.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default CleanupDashboard;