import { AboutPageMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui-components/tabs";
import { Separator } from "@/shared/ui-components/separator";
import { Info, Eye, Code2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <ContentPageShell
      metadata={<AboutPageMetadata />}
      title="Schema3D"
      subtitle="Experimental database visualization tool for 3D schema exploration and relationship mapping"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          About
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D is a free, interactive database visualization tool that
          transforms your database schema into a beautiful 3D representation.
          Whether you're a developer, database administrator, or data architect,
          Schema3D helps you explore tables, views, and foreign key
          relationships in an intuitive spatial environment.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Import schemas from{" "}
          <Link
            to="/topics/sql"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            SQL scripts
          </Link>
          ,{" "}
          <Link
            to="/topics/mermaid"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Mermaid ER diagrams
          </Link>
          , or{" "}
          <Link
            to="/topics/drawdb"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            DrawDB JSON
          </Link>
          , organize tables with custom categories, and share visualizations
          with your team. Schema3D provides everything you need to understand
          and document complex database structures. Explore the features below
          to see how Schema3D can enhance your workflow, learn about the
          technology that powers it, and discover how to get involved with the
          project.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-400" />
          Features
        </h2>

        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger
              value="visualization"
              className="w-full px-2 text-xs sm:px-3 sm:text-sm"
            >
              Visualization
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="w-full px-2 text-xs sm:px-3 sm:text-sm"
            >
              Import
            </TabsTrigger>
            <TabsTrigger
              value="sharing"
              className="w-full px-2 text-xs sm:px-3 sm:text-sm"
            >
              Sharing
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="w-full px-2 text-xs sm:px-3 sm:text-sm"
            >
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-2">
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    3D Database Schema Visualization:
                  </strong>{" "}
                  View your database schema in immersive 3D space with multiple
                  layout algorithms. Perfect for visualizing complex database
                  structures and ER diagrams.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    Multiple Layout Algorithms:
                  </strong>{" "}
                  Choose from force-directed graph layouts, hierarchical tree
                  layouts, or circular/spherical layouts optimized for both 2D
                  and 3D database visualization
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    Database Relationship Mapping:
                  </strong>{" "}
                  Visualize foreign key relationships, primary keys, and view
                  dependencies with interactive connection lines. Essential for
                  database design and schema documentation.
                </span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="import" className="space-y-2">
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    SQL Parser & Schema Import:
                  </strong>{" "}
                  Upload SQL files or paste SQL scripts to automatically parse
                  CREATE TABLE, CREATE VIEW, and ALTER TABLE statements.
                  Supports standard SQL and database schema visualization.{" "}
                  <Link
                    to="/topics/sql"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Learn more about SQL visualization →
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    Mermaid ER Diagram Support:
                  </strong>{" "}
                  Import schemas using Mermaid ER diagram syntax with full
                  support for entity definitions, relationships, and cardinality
                  notation. Perfect for teams already using Mermaid for
                  documentation. Features automatic format detection and live
                  syntax validation.{" "}
                  <Link
                    to="/topics/mermaid"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Learn more about Mermaid visualization →
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    T-SQL & SQL Server Support:
                  </strong>{" "}
                  Full support for T-SQL syntax including bracketed identifiers,
                  schema-qualified names, and ALTER TABLE FOREIGN KEY
                  constraints. Ideal for Microsoft SQL Server database
                  visualization.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    DrawDB JSON Import & Edit:
                  </strong>{" "}
                  Import DrawDB diagrams as JSON (or{" "}
                  <code className="text-slate-200">.ddb</code>), paste a DrawDB
                  share link or gist ID, and open the current schema in DrawDB
                  with one click for 2D editing.{" "}
                  <Link
                    to="/topics/drawdb"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Learn more about DrawDB visualization →
                  </Link>
                </span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-2">
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    Shareable URLs with View State:
                  </strong>{" "}
                  Generate shareable links that preserve your entire
                  visualization state including selected categories, layout
                  algorithm, and view mode. URLs use efficient compression to
                  encode both schema and view state, making it easy to
                  collaborate with your team or save different views of the same
                  schema.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    One-Click Schema Sharing:
                  </strong>{" "}
                  Share your database visualizations instantly with a single
                  click. The share button copies a compressed URL to your
                  clipboard that anyone can use to view the exact same schema —
                  including your in-editor edits — with your customizations
                  applied.
                </span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="organization" className="space-y-2">
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">
                    Dynamic Category Filtering:
                  </strong>{" "}
                  Organize and filter your database tables by custom categories.
                  Click legend items to show or hide specific categories, making
                  it easy to focus on relevant parts of complex schemas.
                  Categories are automatically assigned based on table naming
                  patterns and can be fully customized to match your database
                  architecture.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  <strong className="text-white">Category Management:</strong>{" "}
                  Create, edit, and customize categories with a powerful
                  category editor. Assign custom colors to each category, rename
                  categories, move tables between categories, and organize your
                  schema exactly how you need it. Changes are instantly
                  reflected in both the 3D visualization and the legend.
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
          </TabsContent>
        </Tabs>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-blue-400" />
          Technology
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Built with React, Three.js, and React Three Fiber for powerful 3D
          rendering, combined with custom parsers that support standard SQL,
          T-SQL syntax, Mermaid ER diagrams, and DrawDB JSON. The database
          visualization engine uses physics-based layout algorithms and graph
          theory to create intuitive spatial arrangements of your database
          structure.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Tables and views are rendered as 3D cylinders with columns represented
          as segments. Foreign key relationships and database dependencies are
          visualized as interactive connecting lines with cardinality notation.
          Schema3D is a modern web-based tool that runs entirely in your
          browser, requiring no installation or database connections. It works
          with MySQL, PostgreSQL, SQL Server, Mermaid ER diagrams, and DrawDB
          JSON.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          Common Questions
        </h2>
        <div className="space-y-4 text-slate-300 leading-relaxed">
          <section id="sql-schema-visualizer">
            <h3 className="text-base font-semibold text-white mb-1">
              Can Schema3D visualize SQL database schemas?
            </h3>
            <p>
              Yes. Schema3D parses SQL and T-SQL schema definitions, including
              CREATE TABLE statements and foreign key relationships, then
              renders tables, columns, primary keys, and foreign keys as an
              interactive 3D schema view.
            </p>
          </section>

          <section id="mermaid-er-diagrams">
            <h3 className="text-base font-semibold text-white mb-1">
              Does Schema3D support Mermaid ER diagrams?
            </h3>
            <p>
              Yes. You can import Mermaid ER diagram syntax and inspect the
              resulting entities and relationships in the same 3D database
              visualization workspace.
            </p>
          </section>

          <section id="drawdb-json">
            <h3 className="text-base font-semibold text-white mb-1">
              Does Schema3D support DrawDB JSON?
            </h3>
            <p>
              Yes. Import DrawDB diagram JSON (or{" "}
              <code className="text-slate-200">.ddb</code> files), paste a
              DrawDB share link or gist ID, and use Edit in DrawDB to open the
              current schema in DrawDB for 2D editing.
            </p>
          </section>

          <section id="privacy">
            <h3 className="text-base font-semibold text-white mb-1">
              Does schema data leave the browser?
            </h3>
            <p>
              Schema3D runs as a browser-based visualizer. Schema text is parsed
              locally in the web app and does not require a database connection.
              Shared links encode schema data in the URL so collaborators can
              open the same view. Loading a DrawDB share link fetches the
              diagram from GitHub Gists.
            </p>
          </section>

          <section id="sharing">
            <h3 className="text-base font-semibold text-white mb-1">
              How do shareable schema URLs work?
            </h3>
            <p>
              The share button creates a compressed URL that preserves the
              schema format and view state, including layout, 2D or 3D mode, and
              selected categories. Very large schemas may exceed browser URL
              length limits.
            </p>
          </section>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-400" />
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
            to explore the code, report issues, or contribute to the project.
          </p>
          <p>
            Have questions, feature requests, or want to share how you're using
            Schema3D? Join the conversation in our{" "}
            <a
              href="https://github.com/shane-jacobeen/schema3d/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              GitHub Discussions
            </a>
            ; it's the best place to connect with other users and share ideas!
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
    </ContentPageShell>
  );
}
