import { notFound } from "next/navigation";
import { DebugPanel } from "./debug-panel";

// Developer-only page for checking the life math (Phase 2). Not shipped:
// returns 404 in production builds. Copy here is intentionally not translated.
export const metadata = { title: "Debug", robots: { index: false } };

export default function DebugPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DebugPanel />;
}
