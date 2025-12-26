import { AboutPageMetadata } from "@/shared/metadata";
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
      <AboutPageMetadata />
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
                <p className="text-slate-300 leading-relaxed mb-3">
                  Schema3D is a free, interactive database visualization tool
                  that transforms your database schema into a beautiful 3D
                  representation. Whether you're a developer, database
                  administrator, or data architect, Schema3D helps you explore
                  tables, views, and foreign key relationships in an intuitive
                  spatial environment.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  From importing SQL scripts to organizing tables with custom
                  categories, Schema3D provides everything you need to
                  understand and document complex database structures. Explore
                  the features below to see how Schema3D can enhance your
                  database workflow, learn about the technology that powers it,
                  and discover how to get involved with the project.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  Features
                </h2>

                {/* Visualization Features */}
                <div className="space-y-3 mb-5">
                  <h3 className="text-lg font-semibold text-blue-300">
                    Visualization & Layout
                  </h3>
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
                        tree layouts, or circular/spherical layouts optimized
                        for both 2D and 3D database visualization
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
                  </ul>
                </div>

                {/* Schema Import Features */}
                <div className="space-y-3 mb-5">
                  <h3 className="text-lg font-semibold text-blue-300">
                    Schema Import & Parsing
                  </h3>
                  <ul className="space-y-2 text-slate-300">
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
                  </ul>
                </div>

                {/* Organization & Filtering Features */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-blue-300">
                    Organization & Filtering
                  </h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>
                        <strong className="text-white">
                          Dynamic Category Filtering:
                        </strong>{" "}
                        Organize and filter your database tables by custom
                        categories. Click legend items to show or hide specific
                        categories, making it easy to focus on relevant parts of
                        complex schemas. Categories are automatically assigned
                        based on table naming patterns and can be fully
                        customized to match your database architecture.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>
                        <strong className="text-white">
                          Category Management:
                        </strong>{" "}
                        Create, edit, and customize categories with a powerful
                        category editor. Assign custom colors to each category,
                        rename categories, move tables between categories, and
                        organize your schema exactly how you need it. Changes
                        are instantly reflected in both the 3D visualization and
                        the legend.
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
                        Perfect for database documentation and team
                        collaboration.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-400" />
                  Technology
                </h2>
                <p className="text-slate-300 leading-relaxed mb-3">
                  Built with React, Three.js, and React Three Fiber for powerful
                  3D rendering, combined with custom parsers that support
                  standard SQL, T-SQL syntax, and Mermaid ER diagram format. The
                  database visualization engine uses physics-based layout
                  algorithms and graph theory to create intuitive spatial
                  arrangements of your database structure.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Tables and views are rendered as 3D cylinders with columns
                  represented as segments. Foreign key relationships and
                  database dependencies are visualized as interactive connecting
                  lines with cardinality notation. Schema3D is a modern
                  web-based tool that runs entirely in your browser, requiring
                  no installation or database connections—works seamlessly with
                  MySQL, PostgreSQL, SQL Server, and Mermaid ER diagrams.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-3">
                  Get In Touch
                </h2>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Schema3D is an open-source project! Check out the{" "}
                    <a
                      href="https://github.com/shane-jacobeen/schema3d/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      GitHub repository
                    </a>{" "}
                    to explore the code, report issues, or contribute to the
                    project.
                  </p>
                  <p>
                    Have questions, feature requests, or want to share how
                    you're using Schema3D? Join the conversation in our{" "}
                    <a
                      href="https://github.com/shane-jacobeen/schema3d/discussions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      GitHub Discussions
                    </a>
                    —it's the best place to connect with other users and share
                    ideas!
                  </p>
                  <p>
                    For professional inquiries, connect with me on{" "}
                    <a
                      href="https://www.linkedin.com/in/shane-jacobeen/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      LinkedIn
                    </a>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back to Visualizer</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
