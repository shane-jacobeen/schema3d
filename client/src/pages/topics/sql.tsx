import { SqlTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Button } from "@/shared/ui-components/button";
import { Database, FileCode, Share2, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

export default function SqlTopic() {
  return (
    <ContentPageShell
      metadata={<SqlTopicMetadata />}
      title="SQL schema visualizer (interactive, open-source)"
      subtitle="Explore SQL and T-SQL database schemas in interactive 3D"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Why visualize SQL schemas in 3D?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          SQL schema definitions—even well-structured ones—become hard to
          explore at scale. Scanning hundreds of lines of CREATE TABLE
          statements to trace foreign keys and understand table relationships is
          tedious and error-prone.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Schema3D parses SQL and T-SQL schema definitions and renders tables,
          columns, primary keys, and foreign key relationships as an interactive
          3D visualization, making it easy to explore the structure and
          relationships without a live database connection.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-400" />
          How to import SQL schemas
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D supports standard SQL and T-SQL (Microsoft SQL Server)
          syntax. Paste SQL text directly into the editor or upload a{" "}
          <code className="text-slate-200">.sql</code> file.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          The parser extracts:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">CREATE TABLE</strong> statements
              with column definitions, data types, and constraints
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">PRIMARY KEY</strong> and{" "}
              <strong className="text-white">FOREIGN KEY</strong> constraints
              (inline or in ALTER TABLE statements)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">CREATE VIEW</strong> statements and
              dependencies
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Schema-qualified names (
              <code className="text-slate-200">dbo.users</code>) and bracketed
              identifiers for T-SQL
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed">
          Schema3D parses locally in your browser—no database connection or
          server upload required.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-400" />
          What you can explore
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Once imported, Schema3D renders your schema as interactive 3D objects:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Tables and views</strong> appear as
              3D cylinders with column segments
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Foreign key relationships</strong>{" "}
              are drawn as connecting lines with cardinality notation
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Categories</strong> group related
              tables and can be toggled on or off in the legend
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Layout algorithms</strong> include
              force-directed, hierarchical, circular, and spherical views (2D or
              3D)
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed">
          Click a table to inspect its columns, primary keys, and foreign key
          references. The visualizer highlights connected tables and
          relationships as you explore.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-400" />
          Sharing and limits
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D generates shareable URLs that encode the schema and view
          state (layout, 2D/3D mode, selected categories) in compressed form.
          Copy the link to share the exact visualization with your team.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          <strong className="text-white">What Schema3D is not:</strong>
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Schema3D does not connect to live databases or execute queries
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              It is not a SQL editor—use it to explore parsed schema structure,
              not to write or test SQL
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Very large schemas may hit browser URL length limits when sharing
            </span>
          </li>
        </ul>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Ready to visualize your SQL schema?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Open Schema3D, paste your SQL or T-SQL schema, and start exploring
          tables and relationships in interactive 3D.
        </p>
        <Link to="/">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Open Schema3D
          </Button>
        </Link>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Explore other formats
        </h2>
        <div className="space-y-2 text-slate-300">
          <p>
            <Link
              to="/topics/mermaid"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Mermaid ER Diagram Visualizer
            </Link>{" "}
            — Import Mermaid ER syntax and explore entities in 3D
          </p>
          <p>
            <Link
              to="/topics/drawdb"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              DrawDB Schema Visualizer
            </Link>{" "}
            — Import DrawDB JSON or share links and explore in 3D
          </p>
          <p>
            <Link
              to="/about"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              About Schema3D
            </Link>{" "}
            — Learn how Schema3D works and explore all features
          </p>
          <p>
            <a
              href="https://github.com/shane-jacobeen/schema3d/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              GitHub Repository
            </a>{" "}
            — View source code, report issues, or contribute
          </p>
        </div>
      </div>
    </ContentPageShell>
  );
}
