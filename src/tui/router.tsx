import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import type { PersistentPrefsStore } from "../state/persistent-store.js"
import { HctLabPage } from "../components/HctLabPage.js"

export const HCTLAB_ROUTE_NAME = "hctlab"

export function registerRoutes(
  ctx: Plugin.Context,
  pluginId: string,
  sessionStore: SessionMemoryStore,
  prefsStore: PersistentPrefsStore
): () => void {
  // Register custom page under plugin router
  const unregister = ctx.ui.router.register({
    name: HCTLAB_ROUTE_NAME,
    render: (input: { data?: Record<string, unknown> }) => (
      <HctLabPage
        context={ctx}
        sessionStore={sessionStore}
        prefsStore={prefsStore}
        data={input.data}
      />
    ),
  })

  return unregister
}

export function navigateToHctLab(ctx: Plugin.Context, pluginId: string): void {
  ctx.ui.router.navigate({
    type: "plugin",
    id: pluginId,
    name: HCTLAB_ROUTE_NAME,
    data: {
      openedAt: Date.now(),
    },
  })
}
