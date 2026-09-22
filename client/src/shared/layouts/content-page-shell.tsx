import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/shared/ui-components/card";
import { Button } from "@/shared/ui-components/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ContentPageShellProps {
  metadata: ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  backButtonText?: string;
  backButtonHref?: string;
}

export function ContentPageShell({
  metadata,
  logoSrc = "/images/Schema3D Logo.png",
  logoAlt = "Schema3D Logo",
  title,
  subtitle,
  children,
  backButtonText = "Back to Visualizer",
  backButtonHref = "/",
}: ContentPageShellProps) {
  return (
    <>
      {metadata}
      <div className="h-screen w-full overflow-y-auto relative">
        <div className="about-page-background fixed inset-0 z-0" aria-hidden />

        <div className="relative z-10 min-h-full w-full flex items-start justify-center p-4 py-8">
          <Card className="w-full max-w-3xl mx-4 bg-slate-800/95 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={logoSrc}
                  alt={logoAlt}
                  className="h-12 w-12 object-contain"
                />
                <h1 className="text-3xl font-bold text-white">{title}</h1>
              </div>
              <p className="text-slate-300 text-lg">{subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-6">{children}</CardContent>
          </Card>
        </div>

        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Link to={backButtonHref}>
            <Button variant="outline">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{backButtonText}</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
