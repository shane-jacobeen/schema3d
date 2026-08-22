import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui-components/card";
import { Button } from "@/shared/ui-components/button";
import { isBraveBrowser } from "@/visualizer/3d/utils/webgl-support";

interface WebGLFallbackProps {
  /** Extra detail about the failure, shown to help the user report it. */
  detail?: string;
}

/**
 * Shown when the browser cannot start the 3D scene. The visualizer is the whole
 * product, so a blank canvas leaves the user with nothing. This names the cause
 * and tells Brave users how to fix it.
 */
export function WebGLFallback({ detail }: WebGLFallbackProps) {
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    let active = true;
    isBraveBrowser().then((result) => {
      if (active) {
        setIsBrave(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      <Card className="relative w-full max-w-xl border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
        <CardContent className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
              3D not available
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your browser could not start the 3D view.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-300">
              Schema3D renders your schema with WebGL. This browser blocked or
              could not create a WebGL context, so the scene cannot load.
            </p>
            {isBrave && (
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Brave shields hide WebGL from this site. Click the Brave shields
                icon in the address bar and lower shields for this site, then
                reload the page.
              </p>
            )}
            <p className="max-w-lg text-base leading-7 text-slate-300">
              You can also try a different browser, or enable hardware
              acceleration in your browser settings.
            </p>
            {detail && (
              <p className="max-w-lg text-sm leading-6 text-slate-500">
                {detail}
              </p>
            )}
          </div>

          <div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
