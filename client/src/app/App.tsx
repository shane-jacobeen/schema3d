import "@fontsource/inter";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ToastProvider } from "@/shared/ui-components/toast";

// Lazy load components
const SchemaVisualizer = lazy(() =>
  import("../visualizer/3d/components/schema-visualizer").then((m) => ({
    default: m.SchemaVisualizer,
  }))
);
const About = lazy(() => import("../pages/about"));
const NotFound = lazy(() => import("../pages/not-found"));

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          /* Use full viewport including safe areas - app extends to edges */
          minHeight: "-webkit-fill-available",
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "#0f172a",
                color: "#fff",
              }}
            >
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<SchemaVisualizer />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Analytics />
        <SpeedInsights />
        <ToastProvider />
      </div>
    </BrowserRouter>
  );
}

export default App;
