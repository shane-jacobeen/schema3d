/**
 * Generate static HTML files for each route with prerendered meta tags
 * This ensures social media crawlers and non-JS bots see correct metadata
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl: string;
  ogImage: string;
  ogImageWidth: string;
  ogImageHeight: string;
  ogImageAlt: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage: string;
  breadcrumbs: Array<{ position: number; name: string; item: string }>;
}

const SITE_URL = "https://schema3d.com";
const PREVIEW_IMAGE = `${SITE_URL}/images/preview.png`;

const METADATA: Record<string, PageMetadata> = {
  home: {
    title: "Schema3D: Interactive Open-Source Schema Visualizer",
    description:
      "Explore database schemas in interactive 3D in your browser. Free and open source. Supports SQL, T-SQL, Mermaid ER, and DrawDB JSON. Share a link, no database connection.",
    canonicalUrl: `${SITE_URL}/`,
    ogTitle: "Schema3D: Interactive Open-Source Schema Visualizer",
    ogDescription:
      "Explore database schemas in interactive 3D in your browser. Free and open source. Supports SQL, T-SQL, Mermaid ER, and DrawDB JSON. Share a link, no database connection.",
    ogUrl: `${SITE_URL}/`,
    ogImage: PREVIEW_IMAGE,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: "Schema3D 3D database schema visualizer preview",
    twitterTitle: "Schema3D: Interactive Open-Source Schema Visualizer",
    twitterDescription:
      "Explore database schemas in interactive 3D in your browser. Free and open source. Supports SQL, T-SQL, Mermaid ER, and DrawDB JSON. Share a link, no database connection.",
    twitterImage: PREVIEW_IMAGE,
    breadcrumbs: [
      {
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
    ],
  },
  about: {
    title: "About Schema3D: Interactive 3D Database Schema Visualizer",
    description:
      "Schema3D is an interactive 3D database schema visualizer for SQL, Mermaid ER diagrams, and DrawDB JSON. Explore tables, relationships, and foreign keys in your browser without a database connection.",
    canonicalUrl: `${SITE_URL}/about`,
    ogTitle: "About Schema3D: Interactive 3D Database Schema Visualizer",
    ogDescription:
      "Schema3D is an interactive 3D database schema visualizer for SQL, Mermaid ER diagrams, and DrawDB JSON. Explore tables, relationships, and foreign keys in your browser without a database connection.",
    ogUrl: `${SITE_URL}/about`,
    ogImage: PREVIEW_IMAGE,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: "Schema3D 3D database schema visualizer preview",
    twitterTitle: "About Schema3D: Interactive 3D Database Schema Visualizer",
    twitterDescription:
      "Schema3D is an interactive 3D database schema visualizer for SQL, Mermaid ER diagrams, and DrawDB JSON. Explore tables, relationships, and foreign keys in your browser without a database connection.",
    twitterImage: PREVIEW_IMAGE,
    breadcrumbs: [
      {
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        position: 2,
        name: "About",
        item: `${SITE_URL}/about`,
      },
    ],
  },
  sql: {
    title: "SQL Schema Visualizer - Explore Tables & FKs in 3D | Schema3D",
    description:
      "Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection.",
    canonicalUrl: `${SITE_URL}/topics/sql`,
    ogTitle: "SQL Schema Visualizer - Explore Tables & FKs in 3D | Schema3D",
    ogDescription:
      "Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection.",
    ogUrl: `${SITE_URL}/topics/sql`,
    ogImage: PREVIEW_IMAGE,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: "Schema3D SQL schema visualizer preview",
    twitterTitle:
      "SQL Schema Visualizer - Explore Tables & FKs in 3D | Schema3D",
    twitterDescription:
      "Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection.",
    twitterImage: PREVIEW_IMAGE,
    breadcrumbs: [
      {
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        position: 2,
        name: "SQL",
        item: `${SITE_URL}/topics/sql`,
      },
    ],
  },
  mermaid: {
    title: "Mermaid ER Diagram Visualizer - Interactive 3D View | Schema3D",
    description:
      "Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view.",
    canonicalUrl: `${SITE_URL}/topics/mermaid`,
    ogTitle: "Mermaid ER Diagram Visualizer - Interactive 3D View | Schema3D",
    ogDescription:
      "Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view.",
    ogUrl: `${SITE_URL}/topics/mermaid`,
    ogImage: PREVIEW_IMAGE,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: "Schema3D Mermaid ER diagram visualizer preview",
    twitterTitle:
      "Mermaid ER Diagram Visualizer - Interactive 3D View | Schema3D",
    twitterDescription:
      "Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view.",
    twitterImage: PREVIEW_IMAGE,
    breadcrumbs: [
      {
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        position: 2,
        name: "Mermaid",
        item: `${SITE_URL}/topics/mermaid`,
      },
    ],
  },
  drawdb: {
    title: "Visualize DrawDB Schemas in 3D | Schema3D",
    description:
      "Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing.",
    canonicalUrl: `${SITE_URL}/topics/drawdb`,
    ogTitle: "Visualize DrawDB Schemas in 3D | Schema3D",
    ogDescription:
      "Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing.",
    ogUrl: `${SITE_URL}/topics/drawdb`,
    ogImage: PREVIEW_IMAGE,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageAlt: "Schema3D DrawDB schema visualizer preview",
    twitterTitle: "Visualize DrawDB Schemas in 3D | Schema3D",
    twitterDescription:
      "Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing.",
    twitterImage: PREVIEW_IMAGE,
    breadcrumbs: [
      {
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        position: 2,
        name: "DrawDB",
        item: `${SITE_URL}/topics/drawdb`,
      },
    ],
  },
};

function generateMetaTags(meta: PageMetadata): string {
  const breadcrumbsJson = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: meta.breadcrumbs.map((crumb) => ({
        "@type": "ListItem",
        position: crumb.position,
        name: crumb.name,
        item: crumb.item,
      })),
    },
    null,
    2
  );

  return `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <link rel="canonical" href="${meta.canonicalUrl}" />
    <meta property="og:url" content="${meta.ogUrl}" />
    <meta property="og:title" content="${meta.ogTitle || meta.title}" />
    <meta property="og:description" content="${meta.ogDescription || meta.description}" />
    <meta property="og:image" content="${meta.ogImage}" />
    <meta property="og:image:width" content="${meta.ogImageWidth}" />
    <meta property="og:image:height" content="${meta.ogImageHeight}" />
    <meta property="og:image:alt" content="${meta.ogImageAlt}" />
    <meta name="twitter:title" content="${meta.twitterTitle || meta.title}" />
    <meta name="twitter:description" content="${meta.twitterDescription || meta.description}" />
    <meta name="twitter:image" content="${meta.twitterImage}" />
    <script type="application/ld+json">${breadcrumbsJson}</script>`;
}

function generateHtml(baseHtml: string, meta: PageMetadata): string {
  const metaTags = generateMetaTags(meta);

  const insertPoint = baseHtml.indexOf("</head>");
  if (insertPoint === -1) {
    throw new Error("Could not find </head> tag in base HTML");
  }

  return (
    baseHtml.slice(0, insertPoint) +
    "    <!-- Route-specific prerendered meta tags -->" +
    metaTags +
    "\n  " +
    baseHtml.slice(insertPoint)
  );
}

const routes = [
  { key: "home", path: "" },
  { key: "about", path: "about" },
  { key: "sql", path: "topics/sql" },
  { key: "mermaid", path: "topics/mermaid" },
  { key: "drawdb", path: "topics/drawdb" },
];

const distPublicDir = join(__dirname, "..", "dist", "public");
const baseHtmlPath = join(distPublicDir, "index.html");

const baseHtml = readFileSync(baseHtmlPath, "utf-8");

for (const route of routes) {
  const meta = METADATA[route.key];
  const html = generateHtml(baseHtml, meta);

  const targetDir = route.path
    ? join(distPublicDir, route.path)
    : distPublicDir;
  const targetPath = join(targetDir, "index.html");

  if (route.path) {
    mkdirSync(targetDir, { recursive: true });
  }

  writeFileSync(targetPath, html, "utf-8");
  console.error(`Generated: ${targetPath}`);
}

console.error("Static HTML generation complete!");
