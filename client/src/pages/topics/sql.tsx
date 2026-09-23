import { SqlTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Button } from "@/shared/ui-components/button";
import { Database, FileCode, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function SqlTopic() {
  return (
    <ContentPageShell
      metadata={<SqlTopicMetadata />}
      title="Explore SQL and T-SQL schemas in 3D"
      subtitle="Parse CREATE TABLE, foreign keys, and views in your browser"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Why SQL schemas are hard to explore at scale
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Scanning hundreds of lines of CREATE TABLE statements to trace foreign
          keys and understand table relationships is tedious and error-prone.
          Schema3D parses SQL and T-SQL schema definitions and renders tables,
          columns, primary keys, and foreign key relationships as an interactive
          3D visualization.
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
          Parsing happens locally in your browser. No database connection or
          server upload required.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          What Schema3D is
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Schema3D visualizes schema DDL text only. It does not connect to live
          databases, execute queries, or function as a SQL editor or IDE. Use it
          to explore parsed schema structure and relationships.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div className="space-y-4">
        <div>
          <Link to="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Open Schema3D
            </Button>
          </Link>
        </div>
        <div className="text-sm text-slate-400">
          <p className="mb-2">
            Other formats:{" "}
            <Link
              to="/topics/mermaid"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mermaid
            </Link>
            {" • "}
            <Link
              to="/topics/drawdb"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              DrawDB
            </Link>
          </p>
          <p>
            <Link
              to="/about"
              className="text-slate-400 hover:text-blue-300 transition-colors"
            >
              About
            </Link>
            {" • "}
            <a
              href="https://github.com/shane-jacobeen/schema3d/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-300 transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </ContentPageShell>
  );
}
