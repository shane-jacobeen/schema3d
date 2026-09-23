import { DrawDbTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Button } from "@/shared/ui-components/button";
import { Box, FileJson, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function DrawDbTopic() {
  return (
    <ContentPageShell
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
      </div>
    </ContentPageShell>
  );
}
