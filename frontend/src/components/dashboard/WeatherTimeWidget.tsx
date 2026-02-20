import React from "react";

export type WeatherWidgetData = {
  temp: number;
  unit: "\u00B0C" | "\u00B0F";
  condition: string;
  icon: string;
  location: string;
};

type WeatherTimeWidgetProps = {
  currentTime: Date;
  weather: WeatherWidgetData;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export const WeatherTimeWidget: React.FC<WeatherTimeWidgetProps> = ({
  currentTime,
  weather,
  lastUpdated,
  isRefreshing,
  onRefresh,
}) => {
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "Not updated";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "25px 30px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
        color: "white",
        minWidth: "320px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "-40px",
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(10px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              border: "1px solid rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: "999px",
              padding: "0.4rem 0.75rem",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isRefreshing ? "wait" : "pointer",
            }}
          >
            {isRefreshing ? "Updating..." : "Refresh"}
          </button>
        </div>

        <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "6px", fontWeight: "500" }}>
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "12px" }}>Updated: {updatedLabel}</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            paddingTop: "15px",
            borderTop: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <div style={{ fontSize: "48px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>{weather.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", lineHeight: "1", marginBottom: "5px" }}>
              {weather.temp}
              {weather.unit}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "500" }}>{weather.condition}</div>
            <div
              style={{
                fontSize: "12px",
                opacity: 0.8,
                marginTop: "3px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>Location:</span>
              {weather.location}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
