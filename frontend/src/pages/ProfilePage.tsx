import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import type { AppPage } from "../types/navigation";

type ProfileRecord = {
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

type Props = {
  onNavigate?: (page: AppPage) => void;
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

export const ProfilePage: React.FC<Props> = ({ onNavigate }) => {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await graphqlRequest<{ myProfile: ProfileRecord }>(MY_PROFILE_QUERY, {}, accessToken);
        setProfile(data.myProfile);
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        setError(err?.message || "Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [accessToken]);

  const initials = useMemo(() => {
    const source = profile?.name || user?.email || "U";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [profile?.name, user?.email]);

  if (loading) {
    return <div style={{ padding: "2rem", color: "#475569" }}>Loading profile...</div>;
  }

  if (error || !profile) {
    return <div style={{ padding: "2rem", color: "#991b1b" }}>{error || "Profile not available."}</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "980px", margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f4c81 0%, #1e3a8a 70%)",
          color: "#fff",
          borderRadius: "14px",
          padding: "1.5rem",
          boxShadow: "0 12px 28px rgba(30,58,138,0.28)",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.55)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.2)",
              fontWeight: 800,
              fontSize: "1.4rem",
            }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{profile.name}</h1>
            <p style={{ margin: "0.35rem 0 0 0", opacity: 0.9 }}>
              {profile.role} | {profile.className}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.("profileEdit")}
          style={{
            border: "1px solid rgba(255,255,255,0.45)",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            borderRadius: "10px",
            padding: "0.7rem 1rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.28)";
            event.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.15)";
            event.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Edit Profile
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <InfoCard title="Contact">
          <InfoRow label="Email" value={profile.email || user?.email || "-"} />
          <InfoRow label="Location" value={profile.location} />
          <InfoRow label="User ID" value={String(profile.id)} />
        </InfoCard>

        <InfoCard title="Work Details">
          <InfoRow label="Department" value={profile.className} />
          <InfoRow label="Attendance" value={`${profile.attendance}%`} />
          <InfoRow label="Status" value={profile.status} />
        </InfoCard>
      </div>

      <div
        style={{
          marginTop: "1rem",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1rem",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#0f172a" }}>Recent Access</h3>
        <p style={{ marginBottom: 0, color: "#475569" }}>
          Last login: {new Date(profile.lastLogin).toLocaleString("en-US")}
        </p>
      </div>
    </div>
  );
};

type InfoCardProps = {
  title: string;
  children: React.ReactNode;
};

const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => (
  <section
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "1rem",
      boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
    }}
  >
    <h2 style={{ margin: "0 0 0.8rem", fontSize: "1.1rem", color: "#0f172a" }}>{title}</h2>
    {children}
  </section>
);

type InfoRowProps = {
  label: string;
  value: string;
};

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", padding: "0.55rem 0" }}>
    <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
    <span style={{ color: "#0f172a", fontWeight: 700 }}>{value}</span>
  </div>
);
