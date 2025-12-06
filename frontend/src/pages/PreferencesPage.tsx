import React, { useState, useEffect } from "react";

type Props = {
  onBack?: () => void;
};

export const PreferencesPage: React.FC<Props> = ({ onBack }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("auto");
  const [detectedTimezone, setDetectedTimezone] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Auto-detect system timezone
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(systemTimezone);

    // Load saved preferences
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedLanguage = localStorage.getItem("language") || "en";
    const savedTimezone = localStorage.getItem("timezone") || "auto";
    
    setTheme(savedTheme);
    setLanguage(savedLanguage);
    setTimezone(savedTimezone);
    
    // Apply theme
    if (savedTheme === "dark") {
      document.body.style.background = "#1f2937";
      document.body.style.color = "#f9fafb";
    } else if (savedTheme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.style.background = isDark ? "#1f2937" : "#ffffff";
      document.body.style.color = isDark ? "#f9fafb" : "#000000";
    } else {
      document.body.style.background = "#ffffff";
      document.body.style.color = "#000000";
    }
  }, []);

  useEffect(() => {
    // Update current time every second
    const updateTime = () => {
      const tz = timezone === "auto" ? detectedTimezone : timezone;
      const time = new Date().toLocaleString("en-US", { 
        timeZone: tz,
        dateStyle: "full",
        timeStyle: "long"
      });
      setCurrentTime(time);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone, detectedTimezone]);

  const handleSavePreferences = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    localStorage.setItem("timezone", timezone);
    
    alert("Preferences saved successfully!");
  };

  return (
    <div style={{ 
      padding: "2rem", 
      minHeight: "100vh",
      background: "#f5f7fa"
    }}>
      {/* Header with Back Button */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "1rem",
        marginBottom: "2rem" 
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#374151",
              fontWeight: "500",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            ← Back
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>⚙️ Preferences</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280", fontSize: "1rem" }}>
            Customize your application settings and preferences
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "800px" }}>
        <div style={{ 
          padding: "2rem", 
          background: "white", 
          borderRadius: "12px", 
          border: "1px solid #e5e7eb", 
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            margin: "0 0 1.5rem 0", 
            color: "#111827", 
            fontSize: "1.25rem",
            fontWeight: "600",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "0.75rem"
          }}>
            🔔 Notifications
          </h3>
          
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontWeight: "500", color: "#374151" }}>Email Notifications</label>
            <input 
              type="checkbox" 
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontWeight: "500", color: "#374151" }}>Push Notifications</label>
            <input 
              type="checkbox" 
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
          </div>
        </div>

        <div style={{ 
          padding: "2rem", 
          background: "white", 
          borderRadius: "12px", 
          border: "1px solid #e5e7eb", 
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            margin: "0 0 1.5rem 0", 
            color: "#111827", 
            fontSize: "1.25rem",
            fontWeight: "600",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "0.75rem"
          }}>
            🎨 Appearance
          </h3>
          
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Theme Mode
            </label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem" }}
            >
              <option value="light">☀️ Light Mode</option>
              <option value="dark">🌙 Dark Mode</option>
              <option value="auto">🔄 Auto (System)</option>
            </select>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.5rem 0 0 0" }}>
              {theme === "auto" ? "Follows your system theme preference" : `Using ${theme} theme`}
            </p>
          </div>
        </div>

        <div style={{ 
          padding: "2rem", 
          background: "white", 
          borderRadius: "12px", 
          border: "1px solid #e5e7eb", 
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            margin: "0 0 1.5rem 0", 
            color: "#111827", 
            fontSize: "1.25rem",
            fontWeight: "600",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "0.75rem"
          }}>
            🌍 Language & Region
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Language
            </label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem" }}
            >
              <optgroup label="Indian Languages">
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
                <option value="ur">اردو (Urdu)</option>
              </optgroup>
              <optgroup label="International Languages">
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="it">Italiano (Italian)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#374151" }}>
              Timezone
            </label>
            <select 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem" }}
            >
              <option value="auto">🔄 Auto-detect ({detectedTimezone})</option>
              <optgroup label="India">
                <option value="Asia/Kolkata">India Standard Time (IST) - Kolkata, Mumbai, Delhi</option>
              </optgroup>
              <optgroup label="North America">
                <option value="America/New_York">Eastern Time (ET) - New York</option>
                <option value="America/Chicago">Central Time (CT) - Chicago</option>
                <option value="America/Denver">Mountain Time (MT) - Denver</option>
                <option value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</option>
                <option value="America/Anchorage">Alaska Time (AKT) - Anchorage</option>
                <option value="Pacific/Honolulu">Hawaii Time (HST) - Honolulu</option>
                <option value="America/Toronto">Toronto, Canada</option>
                <option value="America/Vancouver">Vancouver, Canada</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Paris, Berlin, Rome (CET)</option>
                <option value="Europe/Athens">Athens, Helsinki (EET)</option>
                <option value="Europe/Moscow">Moscow (MSK)</option>
                <option value="Europe/Istanbul">Istanbul</option>
              </optgroup>
              <optgroup label="Asia Pacific">
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Seoul">Seoul (KST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
                <option value="Asia/Bangkok">Bangkok (ICT)</option>
                <option value="Australia/Sydney">Sydney (AEDT)</option>
                <option value="Australia/Melbourne">Melbourne (AEDT)</option>
                <option value="Pacific/Auckland">Auckland (NZDT)</option>
              </optgroup>
              <optgroup label="Middle East & Africa">
                <option value="Africa/Cairo">Cairo (EET)</option>
                <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                <option value="Africa/Lagos">Lagos (WAT)</option>
                <option value="Africa/Nairobi">Nairobi (EAT)</option>
              </optgroup>
              <optgroup label="South America">
                <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                <option value="America/Lima">Lima (PET)</option>
                <option value="America/Bogota">Bogotá (COT)</option>
              </optgroup>
              <optgroup label="Other">
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </optgroup>
            </select>
            <div style={{ 
              marginTop: "0.75rem", 
              padding: "0.75rem", 
              background: "#f0f9ff", 
              border: "1px solid #bae6fd",
              borderRadius: "6px"
            }}>
              <div style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: "600", marginBottom: "0.25rem" }}>
                🕐 Live Time Preview
              </div>
              <div style={{ fontSize: "0.9rem", color: "#0c4a6e", fontFamily: "monospace" }}>
                {currentTime}
              </div>
            </div>
          </div>
        </div>

        <button 
          style={{ 
            padding: "0.875rem 2rem", 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white", 
            border: "none", 
            borderRadius: "8px", 
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            transition: "all 0.3s"
          }}
          onClick={handleSavePreferences}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
        >
          💾 Save Preferences
        </button>
      </div>
    </div>
  );
};
