import fs from "fs";
import path from "path";
import { LucideIcon } from "lucide-react";

/**
 * ToolMeta is the interface every module must export from its metadata.ts.
 * It contains all the information the hub needs to display and route to a tool.
 */
export interface ToolMeta {
  /** Unique kebab-case identifier (must match the folder name in src/modules/ and src/app/tools/) */
  id: string;
  /** Display name shown in dashboard cards and page titles */
  name: string;
  /** Short description shown in the dashboard card */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Category label shown on the dashboard card badge */
  category: string;
}

/**
 * Tool extends ToolMeta with derived fields computed by the hub.
 * Components should use this type when consuming tools from this registry.
 */
export type Tool = ToolMeta & {
  /** Derived automatically from id: /tools/<id> */
  href: string;
};

/**
 * Automatically discovers tools by scanning the src/modules directory.
 * NOTE: This function can only be called from Server Components!
 */
export async function getTools(): Promise<Tool[]> {
  const modulesDir = path.join(process.cwd(), "src", "modules");
  
  if (!fs.existsSync(modulesDir)) return [];

  const folders = fs.readdirSync(modulesDir).filter(f => {
    return fs.statSync(path.join(modulesDir, f)).isDirectory();
  });

  const tools: Tool[] = [];

  for (const folder of folders) {
    try {
      // Dynamic import
      const { metadata } = await import(`@/modules/${folder}/metadata`);
      if (metadata) {
        tools.push({
          ...metadata,
          href: `/tools/${metadata.id}`,
        });
      }
    } catch (e) {
      console.warn(`Could not load metadata for tool: ${folder}`, e);
    }
  }

  return tools;
}
