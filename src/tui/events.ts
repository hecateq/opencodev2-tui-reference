import type { Plugin } from "@opencode-ai/plugin/tui"
import type { OpenCodeEvent } from "@opencode-ai/client"
import type { SessionMemoryStore } from "../state/session-store.js"

export function setupEventSubscriptions(
  ctx: Plugin.Context,
  sessionStore: SessionMemoryStore
): () => void {
  // 1. Generic event listener for live activity tracking
  const stopListening = ctx.data.listen((event: { details: OpenCodeEvent }) => {
    const eventType = event.details.type
    const currentRoute = ctx.ui.router.current()
    const activeSessionID = currentRoute.type === "session" ? currentRoute.sessionID : "global"

    sessionStore.recordEvent(activeSessionID, eventType)
  })

  // 2. Specific event listener for session status updates
  const stopSessionListen = ctx.data.on("session.status", (event: Extract<OpenCodeEvent, { type: "session.status" }>) => {
    const sessionID = "sessionID" in event && typeof event.sessionID === "string" ? event.sessionID : "global"
    const status = "status" in event && typeof event.status === "string" ? event.status : undefined
    sessionStore.recordEvent(sessionID, "session.status", status)
  })

  // Composite cleanup function
  return () => {
    stopListening()
    stopSessionListen()
  }
}
