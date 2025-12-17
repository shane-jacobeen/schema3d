/**
 * Common utilities shared between SQL and Mermaid parsers
 */

/**
 * Color palette with 15 high-contrast colors for dark blue backgrounds
 */
export const COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#22d3ee", // Sky
  "#34d399", // Green
  "#fbbf24", // Yellow
];

/**
 * Guess category from table name based on keywords
 */
export function guessCategory(tableName: string): string {
  const name = tableName.toLowerCase();

  const categories = [
    {
      name: "auth",
      keywords: ["user", "auth", "account", "profile"],
    },
    {
      name: "product",
      keywords: ["product", "item", "inventory", "category"],
    },
    {
      name: "order",
      keywords: ["order", "purchase", "cart"],
    },
    {
      name: "customer",
      keywords: ["customer", "client"],
    },
    {
      name: "content",
      keywords: ["post", "article", "comment", "content"],
    },
    {
      name: "metadata",
      keywords: ["tag", "category", "meta"],
    },
    {
      name: "financial",
      keywords: ["payment", "transaction", "invoice", "salary"],
    },
    {
      name: "schedule",
      keywords: ["schedule", "queue"],
    },
    {
      name: "media",
      keywords: ["media", "image", "video", "audio"],
    },
    {
      name: "search",
      keywords: ["search", "index", "full-text"],
    },
    {
      name: "analytics",
      keywords: ["analytics", "metrics", "reports"],
    },
    {
      name: "notification",
      keywords: ["notification", "alert", "message"],
    },
    {
      name: "logs",
      keywords: ["log", "audit", "history"],
    },
    {
      name: "security",
      keywords: ["security", "authentication", "authorization"],
    },
    {
      name: "system",
      keywords: ["system", "config", "settings"],
    },
    {
      name: "positions",
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

  return "general";
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
  colorPalette: string[] = COLOR_PALETTE
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
