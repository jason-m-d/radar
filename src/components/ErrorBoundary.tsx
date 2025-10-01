"use client";

import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error("[ui] error boundary", { message: error.message });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-md border border-rose-500/40 bg-rose-900/30 p-4 text-sm text-rose-200">
          Something went wrong. Please refresh or try again.
        </div>
      );
    }

    return this.props.children;
  }
}
