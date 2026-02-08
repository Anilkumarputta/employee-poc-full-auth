import React, { useState } from "react";
import { getCurrentFestivalTheme, FESTIVAL_THEMES, setFestivalDemoOverride } from "../festivalThemes";

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [demoFestival, setDemoFestival] = useState<string>("");
  const festival = getCurrentFestivalTheme();

  // Demo dropdown handler
  const handleDemoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setDemoFestival(name);
    setFestivalDemoOverride(name ? { name } : null);
  };

  // EMPLOYEE DASHBOARD
  return (
    <div style={{
      padding: '40px',
      background: festival
        ? `linear-gradient(135deg, ${festival.colors[0]} 0%, ${festival.colors[1]} 100%)`
        : 'linear-gradient(135deg, #f5f7fa 0%, #e0e7ff 50%, #f5f7fa 100%)',
      minHeight: '100vh',
      transition: 'background 0.5s',
    }}>
      {/* DEMO: Festival Theme Selector */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <label style={{ fontSize: 14, color: '#888' }}>
          Demo Festival Theme:
          <select value={demoFestival} onChange={handleDemoChange} style={{ marginLeft: 8, padding: 4 }}>
            <option value="">(Auto)</option>
            {FESTIVAL_THEMES.map(f => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </label>
      </div>
      {/* ...existing code... */}
    </div>
  );
};