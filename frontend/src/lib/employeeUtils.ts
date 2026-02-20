type EmployeeLike = {
  id: number;
  name?: string | null;
  email?: string | null;
};

function formatLocalPartAsName(localPart: string): string {
  const cleaned = localPart.replace(/[^a-zA-Z0-9._-]/g, "");
  const parts = cleaned
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeEmployeeName(
  name?: string | null,
  email?: string | null,
  fallbackId?: number
): string {
  const cleanedName = (name || "").replace(/\s+/g, " ").trim();
  const hasLetters = /[a-zA-Z]/.test(cleanedName);

  if (cleanedName.length >= 2 && hasLetters) {
    return cleanedName;
  }

  if (email) {
    const localPart = email.split("@")[0] || "";
    const emailName = formatLocalPartAsName(localPart);
    if (emailName.length >= 2) {
      return emailName;
    }
  }

  if (cleanedName.length === 1) {
    return cleanedName.toUpperCase();
  }

  if (typeof fallbackId === "number") {
    return `Employee ${fallbackId}`;
  }

  return "Employee";
}

export function dedupeEmployeesById<T extends EmployeeLike>(employees: T[]): T[] {
  const seen = new Set<number>();
  const deduped: T[] = [];

  for (const employee of employees) {
    if (!employee || typeof employee.id !== "number" || seen.has(employee.id)) {
      continue;
    }
    seen.add(employee.id);
    deduped.push(employee);
  }

  return deduped;
}

export function sanitizeAndDedupeEmployees<T extends EmployeeLike>(employees: T[]): T[] {
  return dedupeEmployeesById(employees).map((employee) => ({
    ...employee,
    name: normalizeEmployeeName(employee.name, employee.email, employee.id),
  }));
}
