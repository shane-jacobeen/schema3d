import { Github, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui-components/button";
import { Card, CardContent, CardHeader } from "@/shared/ui-components/card";

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  return (
    <section
      aria-labelledby="schema3d-welcome-title"
      aria-describedby="schema3d-welcome-description"
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6 text-white backdrop-blur-[2px]"
      onClick={onDismiss}
    >
      <Card
        className="relative z-10 w-full max-w-3xl border-slate-700 bg-slate-800/95 text-white shadow-2xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <img
                  src="/images/Schema3D Logo.png"
                  alt="Schema3D Logo"
                  className="h-12 w-12 object-contain"
                />
                <h1
                  id="schema3d-welcome-title"
                  className="text-3xl font-bold text-white"
                >
                  Schema3D
                </h1>
              </div>
              <p className="text-lg text-slate-300">
                Open-source database visualization tool for 3D schema
                exploration and relationship mapping
              </p>
            </div>
            <Button
              aria-label="Dismiss welcome message"
              className="-mr-2 -mt-2 h-8 w-8"
              onClick={onDismiss}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p
            id="schema3d-welcome-description"
            className="text-slate-300 leading-relaxed"
          >
            Explore SQL, T-SQL, and Mermaid ER diagrams as an interactive 3D
            database schema. Schema3D runs in your browser, supports shareable
            URL-based views, and helps teams inspect tables, columns, primary
            keys, foreign keys, and relationships without connecting to a
            database.
          </p>

          <p className="text-center text-sm italic text-slate-400">
            SQL schema visualizer <span aria-hidden="true">•</span> Mermaid ER
            diagrams <span aria-hidden="true">•</span> Browser-only
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
              href="https://github.com/shane-jacobeen/schema3d"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
            <Link
              className="text-sm font-medium text-slate-400 transition-colors hover:text-blue-300"
              to="/about"
            >
              Learn more
            </Link>
            <Button
              className="self-start sm:self-auto"
              onClick={onDismiss}
              size="sm"
              type="button"
              variant="primary"
            >
              Explore demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
