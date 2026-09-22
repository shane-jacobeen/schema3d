import { Helmet } from "react-helmet-async";

const previewImageUrl = "https://schema3d.com/images/preview.png";

/**
 * Home page metadata for the main SchemaVisualizer route
 */
export function SchemaMetadata() {
  return (
    <Helmet>
      <title>Schema3D: Interactive Open-Source Schema Visualizer</title>
      <meta
        name="description"
        content="Explore database schemas in interactive 3D in your browser. Free and open source. Supports SQL, T-SQL, Mermaid ER, and DrawDB JSON. Share a link, no database connection."
      />
      <link rel="canonical" href="https://schema3d.com/" />
      <meta
        property="og:title"
        content="Schema3D: Interactive Open-Source Schema Visualizer"
      />
      <meta
        property="og:description"
        content="Explore database schemas in interactive 3D in your browser. Free and open source. Supports SQL, T-SQL, Mermaid ER, and DrawDB JSON. Share a link, no database connection."
      />
      <meta property="og:image" content={previewImageUrl} />
      <meta
        property="og:image:alt"
        content="Schema3D 3D database schema visualizer preview"
      />
      <meta name="twitter:image" content={previewImageUrl} />
    </Helmet>
  );
}

/**
 * About page metadata
 */
export function AboutPageMetadata() {
  return (
    <Helmet>
      <title>About Schema3D: The Open-Source Schema Visualizer</title>
      <meta
        name="description"
        content="How Schema3D works as a browser-only, interactive 3D schema visualizer. Supports SQL, T-SQL, Mermaid ER, and DrawDB. Built for exploring relationships without a live database."
      />
      <link rel="canonical" href="https://schema3d.com/about" />
      <meta
        property="og:title"
        content="About Schema3D: The Open-Source Schema Visualizer"
      />
      <meta
        property="og:description"
        content="How Schema3D works as a browser-only, interactive 3D schema visualizer. Supports SQL, T-SQL, Mermaid ER, and DrawDB. Built for exploring relationships without a live database."
      />
      <meta property="og:url" content="https://schema3d.com/about" />
      <meta property="og:image" content={previewImageUrl} />
      <meta
        property="og:image:alt"
        content="Schema3D 3D database schema visualizer preview"
      />
      <meta
        name="twitter:title"
        content="About Schema3D: The Open-Source Schema Visualizer"
      />
      <meta
        name="twitter:description"
        content="How Schema3D works as a browser-only, interactive 3D schema visualizer. Supports SQL, T-SQL, Mermaid ER, and DrawDB. Built for exploring relationships without a live database."
      />
      <meta name="twitter:image" content={previewImageUrl} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Schema3D",
          description:
            "Learn how Schema3D visualizes SQL, T-SQL, and Mermaid ER diagrams in 3D, including browser-only parsing, shareable URLs, schema relationship mapping, and export support.",
          url: "https://schema3d.com/about",
          mainEntity: {
            "@type": "WebApplication",
            name: "Schema3D",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web Browser",
          },
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://schema3d.com",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "About",
              item: "https://schema3d.com/about",
            },
          ],
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Can Schema3D visualize SQL database schemas?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Schema3D parses SQL and T-SQL schema definitions, including CREATE TABLE statements and foreign key relationships, then renders tables, columns, primary keys, and foreign keys as an interactive 3D schema view.",
              },
            },
            {
              "@type": "Question",
              name: "Does Schema3D support Mermaid ER diagrams?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. You can import Mermaid ER diagram syntax and inspect the resulting entities and relationships in the same 3D database visualization workspace.",
              },
            },
            {
              "@type": "Question",
              name: "Does schema data leave the browser?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Schema3D runs as a browser-based visualizer. Schema text is parsed locally in the web app and does not require a database connection. Shared links encode schema data in the URL so collaborators can open the same view.",
              },
            },
            {
              "@type": "Question",
              name: "How do shareable schema URLs work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The share button creates a compressed URL that preserves the schema format and view state, including layout, 2D or 3D mode, and selected categories. Very large schemas may exceed browser URL length limits.",
              },
            },
          ],
        })}
      </script>
    </Helmet>
  );
}

/**
 * SQL Topic Page metadata
 */
export function SqlTopicMetadata() {
  return (
    <Helmet>
      <title>
        SQL Schema Visualizer — Explore Tables & FKs in 3D | Schema3D
      </title>
      <meta
        name="description"
        content="Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection."
      />
      <link rel="canonical" href="https://schema3d.com/topics/sql" />
      <meta
        property="og:title"
        content="SQL Schema Visualizer — Explore Tables & FKs in 3D | Schema3D"
      />
      <meta
        property="og:description"
        content="Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection."
      />
      <meta property="og:url" content="https://schema3d.com/topics/sql" />
      <meta property="og:image" content={previewImageUrl} />
      <meta
        property="og:image:alt"
        content="Schema3D SQL schema visualizer preview"
      />
      <meta
        name="twitter:title"
        content="SQL Schema Visualizer — Explore Tables & FKs in 3D | Schema3D"
      />
      <meta
        name="twitter:description"
        content="Paste SQL or T-SQL (CREATE TABLE, foreign keys) and explore tables, columns, and relationships in an interactive browser schema visualizer. No database connection."
      />
      <meta name="twitter:image" content={previewImageUrl} />
    </Helmet>
  );
}

/**
 * Mermaid Topic Page metadata
 */
export function MermaidTopicMetadata() {
  return (
    <Helmet>
      <title>
        Mermaid ER Diagram Visualizer — Interactive 3D View | Schema3D
      </title>
      <meta
        name="description"
        content="Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view."
      />
      <link rel="canonical" href="https://schema3d.com/topics/mermaid" />
      <meta
        property="og:title"
        content="Mermaid ER Diagram Visualizer — Interactive 3D View | Schema3D"
      />
      <meta
        property="og:description"
        content="Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view."
      />
      <meta property="og:url" content="https://schema3d.com/topics/mermaid" />
      <meta property="og:image" content={previewImageUrl} />
      <meta
        property="og:image:alt"
        content="Schema3D Mermaid ER diagram visualizer preview"
      />
      <meta
        name="twitter:title"
        content="Mermaid ER Diagram Visualizer — Interactive 3D View | Schema3D"
      />
      <meta
        name="twitter:description"
        content="Import Mermaid ER diagram syntax and explore entities and relationships in an interactive 3D schema visualizer. Runs in the browser; share a link to the same view."
      />
      <meta name="twitter:image" content={previewImageUrl} />
    </Helmet>
  );
}

/**
 * DrawDB Topic Page metadata
 */
export function DrawDbTopicMetadata() {
  return (
    <Helmet>
      <title>Visualize DrawDB Schemas in 3D | Schema3D</title>
      <meta
        name="description"
        content="Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing."
      />
      <link rel="canonical" href="https://schema3d.com/topics/drawdb" />
      <meta
        property="og:title"
        content="Visualize DrawDB Schemas in 3D | Schema3D"
      />
      <meta
        property="og:description"
        content="Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing."
      />
      <meta property="og:url" content="https://schema3d.com/topics/drawdb" />
      <meta property="og:image" content={previewImageUrl} />
      <meta
        property="og:image:alt"
        content="Schema3D DrawDB schema visualizer preview"
      />
      <meta
        name="twitter:title"
        content="Visualize DrawDB Schemas in 3D | Schema3D"
      />
      <meta
        name="twitter:description"
        content="Import DrawDB JSON or a share/gist link into Schema3D to explore tables and relationships in interactive 3D. Edit in DrawDB when you need 2D diagram editing."
      />
      <meta name="twitter:image" content={previewImageUrl} />
    </Helmet>
  );
}

/**
 * 404 Not Found page metadata
 */
export function NotFoundMetadata() {
  return (
    <Helmet>
      <title>404 - Page Not Found | Schema3D</title>
      <meta
        name="description"
        content="The page you're looking for doesn't exist."
      />
      <meta name="robots" content="noindex, follow" />
      <link rel="canonical" href="https://schema3d.com/404" />
    </Helmet>
  );
}
