import React, { useEffect, useMemo, useState } from "react";
import { getStorageItem, setStorageItem } from "../lib/safeStorage";

type Props = {
  onBack?: () => void;
};

const STORAGE_KEYS = {
  theme: "theme",
  language: "language",
  timezone: "timezone",
  emailNotifications: "pref_email_notifications",
  pushNotifications: "pref_push_notifications",
};
const APP_PREFERENCES_UPDATED_EVENT = "app-preferences-updated";

const TIMEZONE_OPTIONS = [
  { value: "auto", label: "Auto-detect (recommended)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "UTC", label: "UTC" },
];

const parseBoolean = (value: string | null, fallback: boolean) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const resolveSystemTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const PreferencesPage: React.FC<Props> = ({ onBack }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("auto");
  const [detectedTimezone, setDetectedTimezone] = useState("UTC");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const systemTimezone = resolveSystemTimezone();
    setDetectedTimezone(systemTimezone);

    setTheme(getStorageItem(STORAGE_KEYS.theme) || "light");
    setLanguage(getStorageItem(STORAGE_KEYS.language) || "en-US");
    setTimezone(getStorageItem(STORAGE_KEYS.timezone) || "auto");

    setEmailNotifications(parseBoolean(getStorageItem(STORAGE_KEYS.emailNotifications), true));
    setPushNotifications(parseBoolean(getStorageItem(STORAGE_KEYS.pushNotifications), false));
  }, []);

  const activeTimezone = useMemo(() => {
    if (timezone === "auto") {
      return detectedTimezone || "UTC";
    }
    return timezone;
  }, [timezone, detectedTimezone]);

  const currentTime = useMemo(() => {
    try {
      return new Date().toLocaleString("en-US", {
        timeZone: activeTimezone,
        dateStyle: "full",
        timeStyle: "long",
      });
    } catch {
      return new Date().toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "long",
      });
    }
  }, [activeTimezone]);

  const handleSavePreferences = () => {
    setStorageItem(STORAGE_KEYS.theme, theme);
    setStorageItem(STORAGE_KEYS.language, language);
    setStorageItem(STORAGE_KEYS.timezone, timezone);
    setStorageItem(STORAGE_KEYS.emailNotifications, String(emailNotifications));
    setStorageItem(STORAGE_KEYS.pushNotifications, String(pushNotifications));
    window.dispatchEvent(new Event(APP_PREFERENCES_UPDATED_EVENT));

    setSaveMessage("Preferences saved successfully.");
    window.setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "1.8rem" }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#1f2937",
              fontWeight: 700,
              padding: "0.55rem 0.95rem",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: "1.9rem" }}>Preferences</h1>
          <p style={{ margin: "0.35rem 0 0 0", color: "#64748b", fontSize: "0.98rem" }}>
            Update your personal app settings.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            marginBottom: "1rem",
            maxWidth: "880px",
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1e3a8a",
            padding: "0.75rem 0.9rem",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          {saveMessage}
        </div>
      )}

      <div style={{ maxWidth: "880px", display: "grid", gap: "1rem" }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>Notifications</h2>

          <PreferenceToggle
            label="Email notifications"
            description="Receive updates about messages and approvals in email."
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />

          <PreferenceToggle
            label="In-app push notifications"
            description="Show instant alerts inside the app while you are signed in."
            checked={pushNotifications}
            onChange={setPushNotifications}
          />
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>Appearance</h2>

          <label style={{ display: "block", marginBottom: "0.55rem", fontWeight: 700, color: "#334155" }}>Theme</label>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.7rem",
              marginBottom: "0.7rem",
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>

          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Current selection: <strong>{theme}</strong>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#0f172a" }}>Language and Time</h2>

          <label style={{ display: "block", marginBottom: "0.55rem", fontWeight: 700, color: "#334155" }}>Language</label>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.7rem",
              marginBottom: "1rem",
            }}
          >
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="en-CA">English (Canada)</option>
          </select>

          <label style={{ display: "block", marginBottom: "0.55rem", fontWeight: 700, color: "#334155" }}>Timezone</label>
          <select
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.7rem",
            }}
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "auto" ? `${option.label} (${detectedTimezone})` : option.label}
              </option>
            ))}
          </select>

          <div
            style={{
              marginTop: "0.85rem",
              border: "1px solid #dbeafe",
              background: "#f8fbff",
              borderRadius: "8px",
              padding: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "#1e3a8a", fontWeight: 700, marginBottom: "0.3rem" }}>
              Time preview
            </div>
            <div style={{ fontSize: "0.92rem", color: "#334155", fontFamily: "monospace" }}>{currentTime}</div>
          </div>
        </section>

        <div>
          <button
            type="button"
            onClick={handleSavePreferences}
            style={{
              border: "none",
              borderRadius: "9px",
              background: "#1d4ed8",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              padding: "0.8rem 1.4rem",
              cursor: "pointer",
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

type PreferenceToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const PreferenceToggle: React.FC<PreferenceToggleProps> = ({ label, description, checked, onChange }) => {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "0.95rem",
      }}
    >
      <span>
        <span style={{ display: "block", color: "#0f172a", fontWeight: 700 }}>{label}</span>
        <span style={{ display: "block", color: "#64748b", fontSize: "0.9rem", marginTop: "0.2rem" }}>
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: "18px", height: "18px", marginTop: "3px", cursor: "pointer" }}
      />
    </label>
  );
};
