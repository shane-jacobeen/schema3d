import { MermaidTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Network, FileCode, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function MermaidTopic() {
  return (
    <ContentPageShell
      metadata={<MermaidTopicMetadata />}
      title="Explore Mermaid ER diagrams in 3D"
      subtitle="Parse erDiagram syntax in your browser"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-400" />
          Why Mermaid ER diagrams are hard to explore at scale
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Mermaid ER diagrams are great for documentation. Compact, text-based,
          version-control friendly. But as your data model grows, flat ER
          diagrams become cluttered and hard to navigate. Tracing relationships
          across dozens of entities in a static diagram is difficult. Schema3D
          imports Mermaid ER syntax and transforms it into an interactive 3D
          visualization.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-400" />
          How to import Mermaid ER diagrams
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Paste Mermaid ER syntax directly into Schema3D. The app automatically
          detects the format and parses entities, attributes, and relationship
          cardinality.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          Supported Mermaid ER syntax:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Entity definitions</strong> with
              attributes and types (
              <code className="text-slate-200">
                ENTITY &#123;type attribute&#125;
              </code>
              )
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Relationships</strong> with
              cardinality notation (
              <code className="text-slate-200">||--o&#123;</code>,{" "}
              <code className="text-slate-200">&#125;o--||</code>, etc.)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Primary key indicators</strong> (
              <code className="text-slate-200">PK</code>) and{" "}
              <strong className="text-white">foreign key indicators</strong> (
              <code className="text-slate-200">FK</code>)
            </span>
          </li>
        </ul>
        <p className="text-slate-300 leading-relaxed">
          Schema3D validates your Mermaid syntax and reports errors if the
          format is invalid. Parsing happens locally in your browser. No server
          upload.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          What Schema3D is
        </h2>
        <p className="text-slate-300 leading-relaxed">
          Schema3D explores imported Mermaid ER syntax. It is not a Mermaid
          diagram editor or a replacement for Mermaid renderers (Mermaid Live
          Editor, GitHub, etc.). It complements them with 3D exploration.
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
    </ContentPageShell>
  );
}
