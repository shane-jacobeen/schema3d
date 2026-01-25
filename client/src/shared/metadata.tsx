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
        content="Free open-source database schema visualizer in stunning 3D. Share schemas via URL for seamless collaboration. Interactive tool supporting SQL/T-SQL & Mermaid Markdown. Explore database relationships, tables, and foreign keys with full cardinality notation. Perfect for database design and documentation."
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
        content="Learn about Schema3D, a free open-source database visualization tool for 3D schema exploration. Share schemas via URL for team collaboration. Features SQL/T-SQL & Mermaid Markdown support, and database relationship mapping."
      />
      <link rel="canonical" href="https://schema3d.com/about" />
      <meta
        property="og:title"
        content="About Schema3D - Database Visualization Tool"
      />
      <meta
        property="og:description"
        content="Learn about Schema3D, a free open-source database visualization tool for 3D schema exploration. Share schemas via URL for team collaboration. Supports SQL/T-SQL & Mermaid Markdown for comprehensive database relationship mapping."
      />
      <meta property="og:url" content="https://schema3d.com/about" />
      <meta
        name="twitter:title"
        content="About Schema3D - Database Visualization Tool"
      />
      <meta
        name="twitter:description"
        content="Learn about Schema3D, a free open-source database visualization tool for 3D schema exploration. Share schemas via URL for team collaboration. Supports SQL/T-SQL & Mermaid Markdown."
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Schema3D",
          description:
            "Learn about Schema3D, a free open-source database visualization tool for 3D schema exploration. Share schemas via URL for team collaboration. Supports SQL/T-SQL & Mermaid Markdown for comprehensive database relationship mapping",
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
