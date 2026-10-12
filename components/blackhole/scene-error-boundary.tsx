"use client";

import { Component, type ReactNode } from "react";

/** WebGL can fail in many ways (blocked, out of memory, shader errors) → fall back to 2D. */
export class SceneErrorBoundary extends Component<
  { fallback: ReactNode; onError?: () => void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onError?.();
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
