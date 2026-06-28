import { Session } from "next-auth";

/**
 * Checks if a tool is accessible based on the current session.
 *
 * @param toolId The kebab-case ID of the tool.
 * @param session The NextAuth session object.
 * @returns boolean
 */
export function isToolAllowed(
  toolId: string,
  session: Session | null,
): boolean {
  if (!session) return false;

  // Google users have full access (or we could filter them too)
  // Assuming 'role' is only set for CredentialsProvider (Admin)
  if (session.user?.role !== "admin") {
    return true;
  }

  // Admin (PIN login) is restricted by ALLOWED_TOOLS_FOR_PIN
  const allowedToolsString = process.env.ALLOWED_TOOLS_FOR_PIN || "";
  const allowedToolsList = allowedToolsString
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // If the list is empty, maybe allow all or none?
  // User said "Haz que ningún usuario pueda entrar en herramientas que no está permitido"
  // So if not in list, no entry.
  return allowedToolsList.includes(toolId);
}
