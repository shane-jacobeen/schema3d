import { Component, type ErrorInfo, type ReactNode } from "react";
import posthog from "posthog-js";
import { WebGLFallback } from "./webgl-fallback";

interface WebGLErrorBoundaryProps {
  children: ReactNode;
}

interface WebGLErrorBoundaryState {
  error: Error | null;
}

/**
 * Catch errors thrown while the 3D scene renders. Some browsers create a WebGL
 * context but fail later when three.js asks for a hidden extension (for example
 * Brave with shields up throws `ANGLE_instanced_arrays not supported`). Without
 * this boundary the throw escapes to the app root and the user sees a blank
 * dark page.
 */
export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  state: WebGLErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    posthog.captureException(error, {
      source: "webgl-error-boundary",
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return <WebGLFallback detail={this.state.error.message} />;
    }
    return this.props.children;
  }
}
