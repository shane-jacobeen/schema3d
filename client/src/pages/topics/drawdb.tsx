import { DrawDbTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Button } from "@/shared/ui-components/button";
import { Box, FileJson, Share2, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

export default function DrawDbTopic() {
  return (
    <ContentPageShell
      metadata={<DrawDbTopicMetadata />}
      title="Visualize a DrawDB schema in 3D"
      subtitle="Explore DrawDB diagrams in interactive 3D"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Box className="h-5 w-5 text-blue-400" />
          Why visualize DrawDB schemas in 3D?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          DrawDB is a great 2D diagram editor for designing database schemas
          with a clean, drag-and-drop interface. But as schemas grow, 2D canvas
          layouts can become crowded, and navigating complex relationships
          requires scrolling and zooming.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Schema3D imports DrawDB diagrams and renders them in interactive 3D,
          letting you explore tables and relationships with spatial layout
          algorithms. When you need 2D editing, use the "Edit in DrawDB" button
          to open the schema in DrawDB—full round-trip support.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <FileJson className="h-5 w-5 text-blue-400" />
          How to import DrawDB schemas
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D accepts DrawDB diagrams in three ways:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Paste DrawDB JSON</strong> directly
              into the editor (exported from DrawDB)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">
                Upload a <code className="text-slate-200">.ddb</code> file
              </strong>{" "}
              from your filesystem
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">
                Paste a DrawDB share link or gist ID
              </strong>{" "}
              (Schema3D fetches the diagram from GitHub Gists)
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed mb-3">
          The parser extracts:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Tables</strong> with fields, data
              types, and constraints
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Relationships</strong> with
              cardinality (one-to-one, one-to-many, many-to-many)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Primary keys</strong> and{" "}
              <strong className="text-white">foreign keys</strong>
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed">
          Parsing happens locally in your browser (except when fetching a gist
          URL). No database connection required.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-400" />
          What you can explore
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D renders DrawDB tables as interactive 3D objects:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Tables</strong> appear as 3D
              cylinders with field segments
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Relationships</strong> are drawn as
              connecting lines with cardinality labels
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Categories</strong> group related
              tables and can be toggled in the legend
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Layout algorithms</strong>{" "}
              (force-directed, hierarchical, circular, spherical) work in 2D or
              3D mode
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed">
          Click a table to inspect its fields and relationships. The visualizer
          highlights connected tables and relationship lines as you explore.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-400" />
          Sharing and round-trip editing
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D generates shareable URLs that encode the DrawDB schema and
          view state (layout, 2D/3D mode, selected categories) in compressed
          form. Share the link to let teammates explore the same visualization.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          When you need to edit the schema in 2D, click "Edit in DrawDB" to open
          the current schema in DrawDB. Make your changes there, then re-import
          the updated schema into Schema3D for 3D exploration.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          <strong className="text-white">What Schema3D is not:</strong>
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Schema3D is not a DrawDB replacement—use DrawDB for 2D editing and
              Schema3D for 3D exploration
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              It does not sync changes back to DrawDB automatically—use Edit in
              DrawDB for round-trip workflows
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
          Ready to visualize your DrawDB schema?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Open Schema3D, import your DrawDB JSON or share link, and start
          exploring tables and relationships in interactive 3D.
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
              to="/topics/sql"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              SQL Schema Visualizer
            </Link>{" "}
            — Import SQL or T-SQL schemas and explore in 3D
          </p>
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
