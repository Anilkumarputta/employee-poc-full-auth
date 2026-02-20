import React, { useEffect, useMemo, useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";
import { useAuth } from "../auth/authContext";

type EmployeeProfile = {
  id: number;
  name: string;
  email: string | null;
  age: number;
  className: string;
  attendance: number;
  role: string;
  status: string;
  location: string;
  lastLogin: string;
  avatar?: string | null;
};

const MY_PROFILE_QUERY = `
  query MyProfile {
    myProfile {
      id
      name
      email
      age
      className
      attendance
      role
      status
      location
      lastLogin
      avatar
    }
  }
`;

const UPDATE_MY_PROFILE_MUTATION = `
  mutation UpdateMyProfile($input: ProfileUpdateInput!) {
    updateMyProfile(input: $input) {
      id
      name
      email
      age
      location
      avatar
    }
  }
`;

export default function ProfileEditPage() {
  const { user, accessToken, refreshToken, setAuth } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: 25,
    location: "",
    avatar: "",
  });

  useEffect(() => {
    void fetchProfile();
  }, [accessToken]);

  const previewAvatar = useMemo(() => {
    const value = formData.avatar.trim();
    return value.length > 0 ? value : null;
  }, [formData.avatar]);

  const fetchProfile = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await graphqlRequest<{ myProfile: EmployeeProfile }>(MY_PROFILE_QUERY, {}, accessToken);
      setProfile(data.myProfile);
      setFormData({
        name: data.myProfile.name,
        email: data.myProfile.email || "",
        age: data.myProfile.age,
        location: data.myProfile.location,
        avatar: data.myProfile.avatar || "",
      });
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      setMessage({ type: "error", text: error?.message || "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken || !user) {
      setMessage({ type: "error", text: "Session expired. Please sign in again." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: Number(formData.age),
        location: formData.location.trim(),
        avatar: formData.avatar.trim() || null,
      };

      const response = await graphqlRequest<{ updateMyProfile: EmployeeProfile }>(
        UPDATE_MY_PROFILE_MUTATION,
        { input: payload },
        accessToken,
      );

      const updatedProfile = response.updateMyProfile;
      setProfile((previous) => (previous ? { ...previous, ...updatedProfile } : updatedProfile));

      if (updatedProfile.email && updatedProfile.email !== user.email) {
        setAuth({
          user: { ...user, email: updatedProfile.email },
          accessToken,
          refreshToken,
        });
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
      window.dispatchEvent(new Event("profile-updated"));
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setMessage({ type: "error", text: error?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#475569" }}>
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#991b1b" }}>
        Unable to load your profile.
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "980px", margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f4c81 0%, #1e3a8a 70%)",
          borderRadius: "14px",
          color: "#ffffff",
          padding: "1.5rem",
          marginBottom: "1.3rem",
          boxShadow: "0 12px 28px rgba(30,58,138,0.28)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.9rem" }}>Edit Profile</h1>
        <p style={{ margin: "0.4rem 0 0 0", opacity: 0.92 }}>Update your personal details and profile photo.</p>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "1rem",
            borderRadius: "10px",
            padding: "0.75rem 0.95rem",
            border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1rem" }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 0.8rem", fontSize: "1.1rem", color: "#0f172a" }}>Profile Photo</h2>

          <div
            style={{
              width: "128px",
              height: "128px",
              borderRadius: "50%",
              margin: "0 auto 0.9rem",
              border: "3px solid #dbeafe",
              background: "#eef2ff",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              color: "#1e3a8a",
              fontWeight: 800,
              fontSize: "2rem",
            }}
          >
            {previewAvatar ? (
              <img src={previewAvatar} alt="Profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              profile.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("")
                .slice(0, 2)
            )}
          </div>

          <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.35rem", color: "#334155" }}>
            Photo URL
          </label>
          <input
            type="url"
            value={formData.avatar}
            onChange={(event) => updateField("avatar", event.target.value)}
            placeholder="https://example.com/photo.jpg"
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0.65rem",
              marginBottom: "0.7rem",
            }}
          />

          <button
            type="button"
            onClick={() => updateField("avatar", "")}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              borderRadius: "8px",
              padding: "0.55rem 0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Remove photo
          </button>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1rem",
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 0.8rem", fontSize: "1.1rem", color: "#0f172a" }}>Personal Information</h2>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem" }}>
            <Field label="Full Name">
              <input
                type="text"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Age">
              <input
                type="number"
                min={18}
                max={100}
                value={formData.age}
                onChange={(event) => updateField("age", Number(event.target.value))}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Location">
              <input
                type="text"
                value={formData.location}
                onChange={(event) => updateField("location", event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.8rem", marginTop: "0.2rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: "none",
                  background: saving ? "#94a3b8" : "#1d4ed8",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(event) => {
                  if (!saving) {
                    event.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

const Field: React.FC<FieldProps> = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <span style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>
      {label}
    </span>
    {children}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "0.65rem",
  fontSize: "0.94rem",
};
