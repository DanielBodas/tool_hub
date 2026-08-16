import fs from "fs";
import path from "path";

/**
 * Automatically discovers all subdirectories under src/modules and loads
 * their individual .env files into process.env if they exist.
 */
export function loadAllToolEnvs() {
  const modulesDir = path.join(process.cwd(), "src", "modules");
  if (!fs.existsSync(modulesDir)) return;

  try {
    const folders = fs.readdirSync(modulesDir).filter((f) => {
      try {
        return fs.statSync(path.join(modulesDir, f)).isDirectory();
      } catch {
        return false;
      }
    });

    for (const folder of folders) {
      const envPath = path.join(modulesDir, folder, ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const equalIndex = trimmed.indexOf("=");
          if (equalIndex === -1) continue;
          const key = trimmed.slice(0, equalIndex).trim();
          let value = trimmed.slice(equalIndex + 1).trim();

          // Remove surrounding single/double quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          if (key) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to load tool-specific environment variables:", error);
  }
}
