import { MermaidTopicMetadata } from "@/shared/metadata";
import { ContentPageShell } from "@/shared/layouts/content-page-shell";
import { Separator } from "@/shared/ui-components/separator";
import { Button } from "@/shared/ui-components/button";
import { Network, FileCode, Share2, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

export default function MermaidTopic() {
  return (
    <ContentPageShell
      metadata={<MermaidTopicMetadata />}
      title="Mermaid ER diagram visualizer"
      subtitle="Explore Mermaid ER diagrams in interactive 3D"
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-400" />
          Why visualize Mermaid ER diagrams in 3D?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Mermaid ER diagrams are great for documentation—compact, text-based,
          version-control friendly. But as your data model grows, flat ER
          diagrams become cluttered and hard to navigate. Tracing relationships
          across dozens of entities in a static diagram is difficult.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Schema3D imports Mermaid ER syntax and transforms it into an
          interactive 3D visualization. Explore entities, attributes, and
          relationships with spatial layout algorithms that make complex models
          easier to understand.
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
          format is invalid. Parsing happens locally in your browser—no server
          upload.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-400" />
          What you can explore
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D renders Mermaid entities as interactive 3D objects:
        </p>
        <ul className="space-y-2 text-slate-300 mb-3">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong className="text-white">Entities</strong> appear as 3D
              cylinders with attribute segments (similar to SQL tables)
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
              entities and can be toggled in the legend
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
          Click an entity to inspect its attributes and relationships. The
          visualizer highlights connected entities and relationship lines as you
          explore.
        </p>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-400" />
          Sharing and limits
        </h2>
        <p className="text-slate-300 leading-relaxed mb-3">
          Schema3D generates shareable URLs that encode the Mermaid diagram and
          view state (layout, 2D/3D mode, selected categories) in compressed
          form. Share the link with teammates to let them explore the same
          visualization.
        </p>
        <p className="text-slate-300 leading-relaxed mb-3">
          <strong className="text-white">What Schema3D is not:</strong>
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Schema3D is not a Mermaid editor—use it to explore existing
              Mermaid ER diagrams, not to author or edit Mermaid syntax
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              It does not replace Mermaid renderers (Mermaid Live Editor,
              GitHub, etc.)—it complements them with 3D exploration
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              Very large diagrams may hit browser URL length limits when sharing
            </span>
          </li>
        </ul>
      </div>

      <Separator className="bg-slate-700" />

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Ready to visualize your Mermaid ER diagram?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Open Schema3D, paste your Mermaid ER syntax, and start exploring
          entities and relationships in interactive 3D.
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
