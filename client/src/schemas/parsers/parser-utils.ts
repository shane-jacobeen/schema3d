/**
 * Common utilities shared between SQL and Mermaid parsers
 */

export { COLOR_PALETTE } from "@/shared/constants/colors";
import { COLOR_PALETTE } from "@/shared/constants/colors";

/**
 * Guess category from table name based on keywords
 */
export function guessCategory(tableName: string): string {
  const name = tableName.toLowerCase();

  const categories = [
    {
      name: "Auth",
      keywords: ["user", "auth", "account", "profile"],
    },
    {
      name: "Product",
      keywords: ["product", "item", "inventory", "category"],
    },
    {
      name: "Order",
      keywords: ["order", "purchase", "cart"],
    },
    {
      name: "Customer",
      keywords: ["customer", "client"],
    },
    {
      name: "Content",
      keywords: ["post", "article", "comment", "content"],
    },
    {
      name: "Metadata",
      keywords: ["tag", "category", "meta"],
    },
    {
      name: "Financial",
      keywords: ["payment", "transaction", "invoice", "salary"],
    },
    {
      name: "Schedule",
      keywords: ["schedule", "queue"],
    },
    {
      name: "Media",
      keywords: ["media", "image", "video", "audio"],
    },
    {
      name: "Search",
      keywords: ["search", "index", "full-text"],
    },
    {
      name: "Analytics",
      keywords: ["analytics", "metrics", "reports"],
    },
    {
      name: "Notification",
      keywords: ["notification", "alert", "message"],
    },
    {
      name: "Logs",
      keywords: ["log", "audit", "history"],
    },
    {
      name: "Security",
      keywords: ["security", "authentication", "authorization"],
    },
    {
      name: "System",
      keywords: ["system", "config", "settings"],
    },
    {
      name: "Positions",
      keywords: [
        "position",
        "role",
        "job",
        "faculty",
        "staff",
        "student",
        "employee",
        "advisor",
        "professor",
        "lecturer",
        "instructor",
        "tutor",
        "coach",
        "mentor",
        "consultant",
        "expert",
        "specialist",
        "practitioner",
        "professional",
      ],
    },
  ];

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (name.includes(keyword)) {
        return category.name;
      }
    }
  }

  return "General";
}

/**
 * Calculate table position in 3D space arranged in a circle
 */
export function calculatePosition(
  index: number,
  total: number
): [number, number, number] {
  if (total === 0) return [0, 0, 0];
  if (total === 1) return [0, 0, 0];

  const angle = (index / total) * Math.PI * 2;
  const radius = Math.max(8, Math.sqrt(total) * 2);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return [x, 0, z];
}

/**
 * Create a category-to-color mapping, assigning colors from the palette
 */
export function createCategoryColorMap(
  categories: string[],
  colorPalette: readonly string[] = COLOR_PALETTE
): Map<string, string> {
  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    if (category && !categoryMap.has(category)) {
      const color = colorPalette[categoryMap.size % colorPalette.length];
      if (color) {
        categoryMap.set(category, color);
      }
    }
  }

  return categoryMap;
}
