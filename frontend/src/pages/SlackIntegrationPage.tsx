import React, { useState } from "react";
import { graphqlRequest } from "../lib/graphqlClient";

const SLACK_MUTATION = `
  mutation SendSlackNotification($webhookUrl: String!, $text: String!) {
    sendSlackNotification(webhookUrl: $webhookUrl, text: $text) { success }
  }
`;

const SlackIntegrationPage: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      await graphqlRequest(SLACK_MUTATION, { webhookUrl, text });
      setResult("Message sent to Slack!");
    } catch (err: any) {
      setResult("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1>Slack Integration</h1>
      <div style={{ marginBottom: "2rem" }}>
        <label>Slack Webhook URL</label>
        <input
          type="text"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", marginBottom: "1rem" }}
        />
        <label>Message Text</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", marginBottom: "1rem" }}
        />
        <button onClick={handleSend} disabled={loading || !webhookUrl || !text} style={{ padding: "0.75rem 1.5rem", background: "#4A154B", color: "white", border: "none", borderRadius: "6px", fontWeight: 600 }}>
          Send to Slack
        </button>
        {result && <div style={{ marginTop: "1rem", color: result.startsWith("Failed") ? "#ef4444" : "#10b981" }}>{result}</div>}
      </div>
      <p>Admins can configure Slack webhooks and send test messages. Integrate with notifications/messages for automated Slack alerts.</p>
    </div>
  );
};

export default SlackIntegrationPage;
