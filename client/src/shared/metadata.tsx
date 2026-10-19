import { Helmet } from "react-helmet-async";
import { METADATA } from "./metadata-data";

/**
 * Metadata components use react-helmet-async to manage tags at runtime.
 *
 * For SEO and social media previews:
 * - Build script prerenderes static HTML files with meta tags for each route
 * - When the React app hydrates, Helmet replaces prerendered tags with runtime-managed versions
 * - This ensures non-JS crawlers see correct tags while maintaining single-source-of-truth
 * - Helmet automatically prevents duplicate tags by replacing existing ones
 */

/**
 * Home page metadata for the main SchemaVisualizer route
 */
export function SchemaMetadata() {
  const meta = METADATA.home;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:url" content={meta.ogUrl} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:image" content={meta.ogImage} />
      <meta property="og:image:width" content={meta.ogImageWidth} />
      <meta property="og:image:height" content={meta.ogImageHeight} />
      <meta property="og:image:alt" content={meta.ogImageAlt} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      <meta name="twitter:image" content={meta.twitterImage} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: meta.breadcrumbs.map((crumb) => ({
            "@type": "ListItem",
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          })),
        })}
      </script>
    </Helmet>
  );
}

/**
 * About page metadata
 */
export function AboutPageMetadata() {
  const meta = METADATA.about;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:url" content={meta.ogUrl} />
      <meta property="og:image" content={meta.ogImage} />
      <meta property="og:image:width" content={meta.ogImageWidth} />
      <meta property="og:image:height" content={meta.ogImageHeight} />
      <meta property="og:image:alt" content={meta.ogImageAlt} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      <meta name="twitter:image" content={meta.twitterImage} />
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
          itemListElement: meta.breadcrumbs.map((crumb) => ({
            "@type": "ListItem",
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          })),
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
  const meta = METADATA.sql;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:url" content={meta.ogUrl} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:image" content={meta.ogImage} />
      <meta property="og:image:width" content={meta.ogImageWidth} />
      <meta property="og:image:height" content={meta.ogImageHeight} />
      <meta property="og:image:alt" content={meta.ogImageAlt} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      <meta name="twitter:image" content={meta.twitterImage} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: meta.breadcrumbs.map((crumb) => ({
            "@type": "ListItem",
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          })),
        })}
      </script>
    </Helmet>
  );
}

/**
 * Mermaid Topic Page metadata
 */
export function MermaidTopicMetadata() {
  const meta = METADATA.mermaid;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:url" content={meta.ogUrl} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:image" content={meta.ogImage} />
      <meta property="og:image:width" content={meta.ogImageWidth} />
      <meta property="og:image:height" content={meta.ogImageHeight} />
      <meta property="og:image:alt" content={meta.ogImageAlt} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      <meta name="twitter:image" content={meta.twitterImage} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: meta.breadcrumbs.map((crumb) => ({
            "@type": "ListItem",
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          })),
        })}
      </script>
    </Helmet>
  );
}

/**
 * DrawDB Topic Page metadata
 */
export function DrawDbTopicMetadata() {
  const meta = METADATA.drawdb;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:url" content={meta.ogUrl} />
      <meta property="og:title" content={meta.ogTitle} />
      <meta property="og:description" content={meta.ogDescription} />
      <meta property="og:image" content={meta.ogImage} />
      <meta property="og:image:width" content={meta.ogImageWidth} />
      <meta property="og:image:height" content={meta.ogImageHeight} />
      <meta property="og:image:alt" content={meta.ogImageAlt} />
      <meta name="twitter:title" content={meta.twitterTitle} />
      <meta name="twitter:description" content={meta.twitterDescription} />
      <meta name="twitter:image" content={meta.twitterImage} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: meta.breadcrumbs.map((crumb) => ({
            "@type": "ListItem",
            position: crumb.position,
            name: crumb.name,
            item: crumb.item,
          })),
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
