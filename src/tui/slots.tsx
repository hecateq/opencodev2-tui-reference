import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import type { PersistentPrefsStore } from "../state/persistent-store.js"
import { SidebarPanel } from "../components/SidebarPanel.js"
import { PromptStatusBadge } from "../components/PromptStatusBadge.js"

export function registerSidebarSlot(
  ctx: Plugin.Context,
  sessionStore: SessionMemoryStore,
  prefsStore: PersistentPrefsStore
): () => void {
  // 1. Claim sidebar.content slot (visible when sidebar is open)
  const unmountSidebar = ctx.ui.slot({
    append: "sidebar.content",
    render: (input: { sessionID: string }) => (
      <SidebarPanel
        context={ctx}
        sessionID={input.sessionID}
        sessionStore={sessionStore}
        prefsStore={prefsStore}
      />
    ),
  })

  // 2. Claim prompt.footer.status slot (ALWAYS visible in the active prompt footer)
  const unmountPromptStatus = ctx.ui.slot({
    append: "prompt.footer.status",
    render: (input: { sessionID?: string; mode: "normal" | "shell" }) => (
      <PromptStatusBadge
        context={ctx}
        sessionID={input.sessionID}
        sessionStore={sessionStore}
      />
    ),
  })

  // Composite unmount function
  return () => {
    unmountSidebar()
    unmountPromptStatus()
  }
}
