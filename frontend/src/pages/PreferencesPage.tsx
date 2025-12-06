import React, { useState, useEffect } from "react";

export const PreferencesPage: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedLanguage = localStorage.getItem("language") || "en";
    const savedTimezone = localStorage.getItem("timezone") || "Asia/Kolkata";
    
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

  const handleSavePreferences = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    localStorage.setItem("timezone", timezone);
    
    // Apply theme
    if (theme === "dark") {
      document.body.style.background = "#1f2937";
      document.body.style.color = "#f9fafb";
    } else if (theme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.style.background = isDark ? "#1f2937" : "#ffffff";
      document.body.style.color = isDark ? "#f9fafb" : "#000000";
    } else {
      document.body.style.background = "#ffffff";
      document.body.style.color = "#000000";
    }
    
    alert("Preferences saved successfully!");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Preferences</h1>
      <p>Customize your application settings and preferences.</p>

      <div style={{ marginTop: "2rem", maxWidth: "600px" }}>
        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Notifications</h3>
          
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

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Appearance</h3>
          
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

        <div style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Language & Region</h3>
          
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
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0.5rem 0 0 0" }}>
              Current time: {new Date().toLocaleString("en-US", { timeZone: timezone })}
            </p>
          </div>
        </div>

        <button 
          style={{ 
            marginTop: "1rem",
            padding: "0.75rem 1.5rem", 
            background: "#3b82f6", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600"
          }}
          onClick={handleSavePreferences}
        >
          💾 Save Preferences
        </button>
      </div>
    </div>
  );
};
