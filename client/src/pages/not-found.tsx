import { NotFoundMetadata } from "@/shared/metadata";
import { Button } from "@/shared/ui-components/button";
import { Card, CardContent } from "@/shared/ui-components/card";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <>
      <NotFoundMetadata />
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.16),_transparent_35%)]"
        />

        <Card className="relative w-full max-w-xl border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-8 sm:p-10">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
                Error 404
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                This page isn&apos;t here.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                The link may be outdated, or the page may have moved. Head back
                to the visualizer or learn more about Schema3D from the about
                page.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link to="/">Go to visualizer</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:ml-auto sm:w-auto"
              >
                <Link to="/about">About Schema3D</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
