import { loadAllToolEnvs } from "@/lib/env";

/**
 * Determines whether an authenticated user is allowed direct access to a specific tool
 * based on the tool's ALLOWED_USERS environment variable.
 *
 * Rules:
 *  - Admin users (role === "admin") always have direct access.
 *  - If <TOOL_ID_UPPER>_ALLOWED_USERS is empty or not set, NO standard Google user has direct access.
 *    (They must be explicitly listed or use the tool PIN).
 *  - If <TOOL_ID_UPPER>_ALLOWED_USERS contains a comma-separated list of emails,
 *    only those exact emails (case-insensitive) have direct access.
 *
 * @param toolId    - The kebab-case tool ID (e.g. "finance-tracker")
 * @param userEmail - The email from the Google/NextAuth session
 * @param userRole  - The role from the session token (e.g. "admin" | "user")
 * @returns true if the user is allowed direct access, false if blocked / must use PIN
 */
export function isUserAllowedForTool(
  toolId: string,
  userEmail: string | null | undefined,
  userRole: string | null | undefined,
): boolean {
  // Admins always have unrestricted access
  if (userRole === "admin") return true;

  // No email → no access
  if (!userEmail) return false;

  loadAllToolEnvs();

  const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_ALLOWED_USERS`;
  const allowedUsersRaw = process.env[envVarName];

  // If the variable is not set or empty, nobody from Google has direct access
  if (!allowedUsersRaw || allowedUsersRaw.trim() === "") {
    return false;
  }

  // Parse and compare emails (case-insensitive, trimmed)
  const allowedEmails = allowedUsersRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(userEmail.toLowerCase());
}
