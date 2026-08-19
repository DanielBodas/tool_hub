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

/**
 * Determines whether a tool should be visible on the dashboard for users without direct access,
 * based on the tool's environment variables (e.g. <TOOL_ID_UPPER>_VISIBLE_WITHOUT_ACCESS).
 *
 * Defaults to false if not configured or set to false/0.
 */
export function isToolVisibleWithoutAccess(toolId: string): boolean {
  loadAllToolEnvs();

  const toolKey = toolId.replace(/-/g, "_").toUpperCase();
  const envVarNames = [
    `${toolKey}_VISIBLE_WITHOUT_ACCESS`,
    `${toolKey}_PUBLIC_VISIBLE`,
    `${toolKey}_VISIBLE_UNAUTHORIZED`,
    `${toolKey}_VISIBLE_TO_ALL`,
  ];

  for (const varName of envVarNames) {
    const rawVal = process.env[varName];
    if (rawVal !== undefined) {
      const val = rawVal.trim().toLowerCase();
      if (val === "true" || val === "1" || val === "yes") {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines whether a tool card should be displayed on the dashboard for a user.
 *
 * Rules:
 *  1. Admin users (role === "admin") see all tools.
 *  2. Users with the auth_dashboard cookie see all tools.
 *  3. Users with the auth_tool_<toolId> cookie see this tool.
 *  4. Whitelisted users (isUserAllowedForTool === true) see this tool.
 *  5. Otherwise, the tool is visible ONLY if <TOOL_ID_UPPER>_VISIBLE_WITHOUT_ACCESS is true.
 */
export function isToolVisibleForUser(
  toolId: string,
  userEmail: string | null | undefined,
  userRole: string | null | undefined,
  cookieStore?: { get: (name: string) => { value: string } | undefined } | null,
): boolean {
  // Admins see all tools
  if (userRole === "admin") return true;

  // Unlocked dashboard cookie grants access to all tools
  if (cookieStore?.get("auth_dashboard")?.value === "true") return true;

  // Specific tool cookie grants access to this tool
  if (cookieStore?.get(`auth_tool_${toolId}`)?.value === "true") return true;

  // Whitelisted user email grants access
  if (isUserAllowedForTool(toolId, userEmail, userRole)) return true;

  // User has no direct access: fallback to tool's visibility environment variable
  return isToolVisibleWithoutAccess(toolId);
}
