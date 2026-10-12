import { DrawDbTopicMetadata } from "@/shared/metadata";
import { InfoPageShell } from "@/shared/layouts/info-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Box, FileJson, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function DrawDbTopic() {
  return (
    <InfoPageShell
      metadata={<DrawDbTopicMetadata />}
      title="Explore DrawDB schemas in 3D"
      subtitle="Parse DrawDB JSON, .ddb files, and share links"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Box className="h-5 w-5 text-blue-400" />
          Why DrawDB schemas are hard to explore at scale
        </h2>
        <p className="text-slate-300 leading-relaxed">
          DrawDB is a great 2D diagram editor for designing database schemas
          with a clean, drag-and-drop interface. But as schemas grow, 2D canvas
          layouts can become crowded, and navigating complex relationships
          requires scrolling and zooming. Schema3D imports DrawDB diagrams and
          renders them in interactive 3D.
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
          <FileJson className="h-5 w-5 text-blue-400" />
          How to import a DrawDB export into Schema3D
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Follow these steps to import your DrawDB diagram:
        </p>
        <ol className="space-y-3 text-slate-300 mb-3">
          <li className="flex items-start gap-3">
            <span className="text-blue-400 font-semibold mt-0.5 flex-shrink-0">
              1.
            </span>
            <span>
              <strong className="text-white">Export from DrawDB:</strong> In
              DrawDB, click the menu icon, select "Export", and choose "JSON"
              format. Copy the exported JSON to your clipboard or save it as a
              file.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-400 font-semibold mt-0.5 flex-shrink-0">
              2.
            </span>
            <span>
              <strong className="text-white">Open Schema3D:</strong>{" "}
              <Link
                to="/"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Go to the visualizer
              </Link>{" "}
              and paste the DrawDB JSON directly into the text editor, or click
              "Upload File" and select your{" "}
              <code className="text-slate-200">.json</code> or{" "}
              <code className="text-slate-200">.ddb</code> file.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-400 font-semibold mt-0.5 flex-shrink-0">
              3.
            </span>
            <span>
              <strong className="text-white">Explore in 3D:</strong> Schema3D
              automatically detects the DrawDB JSON format, parses tables and
              relationships, and renders them in the 3D visualizer. Use the
              layout controls to adjust the view.
            </span>
          </li>
        </ol>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-white">Tip:</strong> You can also paste a
          DrawDB share link or GitHub Gist ID directly into the editor. Schema3D
          will fetch the diagram from GitHub Gists and parse it automatically.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          What Schema3D is
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Schema3D is explore-first. Use the "Edit in DrawDB" button to open the
          current schema in DrawDB for 2D editing, then re-import the updated
          schema into Schema3D for 3D exploration.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p>
          Other formats:{" "}
          <Link
            to="/topics/sql"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            SQL
          </Link>
          {" • "}
          <Link
            to="/topics/mermaid"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Mermaid
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
    </InfoPageShell>
  );
}
