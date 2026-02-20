import type { AppPage } from "../types/navigation";

export const ROUTE_TO_PAGE_MAP: Record<string, AppPage> = {
  dashboard: "dashboard",
  employees: "employees",
  notifications: "notifications",
  reports: "reports",
  profile: "profile",
  preferences: "preferences",
  settings: "settings",
  admins: "admins",
  accessLogs: "accessLogs",
  sendNote: "sendNote",
  leaveRequests: "leaveRequests",
  profileEdit: "profileEdit",
  employeeLogins: "employeeLogins",
  messages: "messages",
  "review-requests": "review-requests",
  bulkActions: "bulkActions",
  auditLogs: "auditLogs",
  analyticsDashboard: "analyticsDashboard",
  employeeSelfServicePortal: "employeeSelfServicePortal",
  slackIntegration: "slackIntegration",
  notificationInbox: "notificationInbox",
  messagingInbox: "messages",
};

export function resolveAppPageFromLink(link: string | null | undefined): AppPage | null {
  if (!link) {
    return null;
  }

  const route = String(link).split("?")[0].replace(/^\/+/, "");
  const rootRoute = route.split("/")[0];
  return ROUTE_TO_PAGE_MAP[rootRoute] || null;
}
