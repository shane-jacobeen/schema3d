import { Helmet } from "react-helmet-async";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/card";
import { Button } from "@/shared/ui-components/button";
import { Info, Eye, Network, Code2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Suspense } from "react";

export default function About() {
  return (
    <>
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
      <div className="h-screen w-full overflow-y-auto relative">
        {/* Starry sky background */}
        <div className="fixed inset-0 z-0">
          <Canvas>
            <Suspense fallback={null}>
              <color attach="background" args={["#0f172a"]} />
              <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-full w-full flex items-start justify-center p-4 py-8">
          <Card className="w-full max-w-3xl mx-4 bg-slate-800/95 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/images/Schema3D Logo.png"
                  alt="Schema3D Logo"
                  className="h-12 w-12 object-contain"
                />
                <CardTitle className="text-3xl font-bold text-white">
                  Schema3D
                </CardTitle>
              </div>
              <p className="text-slate-300 text-lg">
                Free online database visualization tool for 3D schema
                exploration and SQL relationship mapping
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  About
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Schema3D is a free, interactive database visualization tool
                  and 3D schema viewer that transforms your database schema into
                  a beautiful 3D representation. This database relationship
                  mapper and ER diagram tool helps developers, database
                  administrators, and data architects explore tables, views, and
                  foreign key relationships in an intuitive spatial environment.
                  Whether you're designing a new database, documenting existing
                  schemas, or analyzing complex database structures, Schema3D
                  makes understanding database relationships and dependencies
                  effortless. Schema3D supports multiple input formats including
                  SQL CREATE TABLE statements, Mermaid Markdown, and T-SQL
                  syntax, making it versatile for any database workflow.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  Features
                </h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        3D Database Schema Visualization:
                      </strong>{" "}
                      View your database schema in immersive 3D space with
                      multiple layout algorithms. Perfect for visualizing
                      complex database structures and ER diagrams.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        Multiple Layout Algorithms:
                      </strong>{" "}
                      Choose from force-directed graph layouts, hierarchical
                      tree layouts, or circular/spherical layouts optimized for
                      both 2D and 3D database visualization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        Database Relationship Mapping:
                      </strong>{" "}
                      Visualize foreign key relationships, primary keys, and
                      view dependencies with interactive connection lines.
                      Essential for database design and schema documentation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        SQL Parser & Schema Import:
                      </strong>{" "}
                      Upload SQL files or paste SQL scripts to automatically
                      parse CREATE TABLE, CREATE VIEW, and ALTER TABLE
                      statements. Supports standard SQL and database schema
                      visualization.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        Mermaid ER Diagram Support:
                      </strong>{" "}
                      Import schemas using Mermaid ER diagram syntax with full
                      support for entity definitions, relationships, and
                      cardinality notation. Perfect for teams already using
                      Mermaid for documentation. Features automatic format
                      detection and live syntax validation.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        T-SQL & SQL Server Support:
                      </strong>{" "}
                      Full support for T-SQL syntax including bracketed
                      identifiers, schema-qualified names, and ALTER TABLE
                      FOREIGN KEY constraints. Ideal for Microsoft SQL Server
                      database visualization.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>
                      <strong className="text-white">
                        Interactive Database Explorer:
                      </strong>{" "}
                      Click tables to view column details, search and filter
                      database objects, and export your schema visualizations.
                      Perfect for database documentation and team collaboration.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Network className="h-5 w-5 text-blue-400" />
                  How It Works
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Schema3D uses advanced parsers to analyze your database schema
                  in multiple formats. The SQL parser handles CREATE TABLE,
                  CREATE VIEW, and ALTER TABLE statements, while the Mermaid
                  parser supports ER diagram syntax with entity definitions and
                  relationship notation. This database visualization tool
                  renders tables and views as 3D cylinders, with columns
                  represented as segments. Foreign key relationships and
                  database dependencies are visualized as interactive connecting
                  lines with cardinality notation, making it easy to understand
                  complex database schemas, identify relationship patterns, and
                  document database architecture at a glance. Whether you're
                  working with MySQL, PostgreSQL, SQL Server, or using Mermaid
                  ER diagrams, Schema3D provides an intuitive way to visualize
                  and explore your database schema.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-400" />
                  Technology
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  Built with React, Three.js, and React Three Fiber for powerful
                  3D rendering, combined with custom parsers that support
                  standard SQL, T-SQL syntax, and Mermaid ER diagram format. The
                  database visualization engine uses physics-based layout
                  algorithms and graph theory to create intuitive spatial
                  arrangements of your database structure. Schema3D is a modern
                  web-based tool that runs entirely in your browser, requiring
                  no installation or database connections.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-3">
                  Contact
                </h2>
                <p className="text-slate-300 leading-relaxed mb-3">
                  Have questions or enhancement suggestions? Let's connect:{" "}
                  <a
                    href="https://www.linkedin.com/in/shane-jacobeen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Shane Jacobeen</span>
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Link to="/">
            <Button
              variant="outline"
              className="rounded-full bg-slate-900/95 border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600 backdrop-blur-sm shadow-lg flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back to Visualizer</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
