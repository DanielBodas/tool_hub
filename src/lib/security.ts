/**
 * Checks if a tool is accessible based on the current authentication state.
 *
 * @param toolId The kebab-case ID of the tool.
 * @param hasSession Whether there is an active NextAuth session (Google/Admin).
 * @param hasDashboardAccess Whether the user has unlocked the dashboard via PIN.
 * @returns boolean
 */
export function isToolAllowed(
  toolId: string,
  hasSession: boolean,
  hasDashboardAccess: boolean,
): boolean {
  // Session (Google/Admin) always has access to all tools
  if (hasSession) return true;

  // If no dashboard access, and no session, tool is NOT allowed via dashboard
  if (!hasDashboardAccess) return false;

  // For PIN-based dashboard access, check the whitelist
  const allowedToolsString = process.env.ALLOWED_TOOLS_FOR_PIN || "";
  const allowedToolsList = allowedToolsString
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return allowedToolsList.includes(toolId);
}
