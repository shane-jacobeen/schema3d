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
