import React from "react";

export const NotificationsPage: React.FC = () => {
  const notifications = [
    { id: 1, title: "New employee added", message: "John Smith has been added to the system", time: "2 hours ago", unread: true },
    { id: 2, title: "Attendance alert", message: "Robert Wilson's attendance dropped below 90%", time: "5 hours ago", unread: true },
    { id: 3, title: "System update", message: "Employee management system updated to v2.1", time: "1 day ago", unread: false },
    { id: 4, title: "Leave request", message: "Sarah Johnson requested leave for next week", time: "2 days ago", unread: false },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Notifications</h1>
      <p>Stay updated with the latest activities and alerts.</p>

      <div style={{ marginTop: "2rem" }}>
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            style={{ 
              padding: "1rem", 
              marginBottom: "1rem", 
              background: notif.unread ? "#eff6ff" : "#f9fafb", 
              borderRadius: "8px",
              borderLeft: notif.unread ? "4px solid #3b82f6" : "4px solid transparent"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                  {notif.title}
                  {notif.unread && (
                    <span style={{ 
                      marginLeft: "0.5rem", 
                      background: "#3b82f6", 
                      color: "white", 
                      fontSize: "0.7rem", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "12px" 
                    }}>
                      NEW
                    </span>
                  )}
                </h3>
                <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>{notif.message}</p>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af" }}>{notif.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
