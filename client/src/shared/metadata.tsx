import { Helmet } from "react-helmet-async";

/**
 * Home page metadata for the main SchemaVisualizer route
 */
export function SchemaMetadata() {
  return (
    <Helmet>
      <title>
        Schema3D: Interactive Database Schema Visualization Tool (SQL, T-SQL, &
        Mermaid)
      </title>
      <meta
        name="description"
        content="Visualize your database schemas in stunning 3D. Interactive schema visualizer tool supporting SQL/T-SQL & Mermaid Markdown. Explore database relationships, tables, and foreign keys with full cardinality notation. Perfect for database design and documentation."
      />
      <link rel="canonical" href="https://schema3d.com" />
    </Helmet>
  );
}

/**
 * About page metadata
 */
export function AboutPageMetadata() {
  return (
    <Helmet>
      <title>About Schema3D - Database Visualization Tool | Schema3D</title>
      <meta
        name="description"
        content="Learn about Schema3D, a free interactive database visualization tool for 3D schema exploration. Features SQL/T-SQL & Mermaid Markdown support, and database relationship mapping."
      />
      <link rel="canonical" href="https://schema3d.com/about" />
      <meta
        property="og:title"
        content="About Schema3D - Database Visualization Tool"
      />
      <meta
        property="og:description"
        content="Learn about Schema3D, a free interactive database visualization tool for 3D schema exploration. Supports SQL/T-SQL & Mermaid Markdown for comprehensive database relationship mapping."
      />
      <meta property="og:url" content="https://schema3d.com/about" />
      <meta
        name="twitter:title"
        content="About Schema3D - Database Visualization Tool"
      />
      <meta
        name="twitter:description"
        content="Learn about Schema3D, a free interactive database visualization tool for 3D schema exploration. Supports SQL/T-SQL & Mermaid Markdown."
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Schema3D",
          description:
            "Learn about Schema3D, a free interactive database visualization tool for 3D schema exploration. Supports SQL/T-SQL & Mermaid Markdown for comprehensive database relationship mapping",
          url: "https://schema3d.com/about",
          mainEntity: {
            "@type": "WebApplication",
            name: "Schema3D",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web Browser",
          },
        })}
      </script>
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
      <link rel="canonical" href="https://schema3d.com/404" />
    </Helmet>
  );
}
