import { Plugin } from "@opencode-ai/plugin/tui"
import { createSessionMemoryStore } from "./state/session-store.js"
import { createPersistentPrefsStore } from "./state/persistent-store.js"
import { registerSidebarSlot } from "./tui/slots.js"
import { registerRoutes } from "./tui/router.js"
import { Commands } from "./tui/commands.js"
import { setupEventSubscriptions } from "./tui/events.js"

export const PLUGIN_ID = "opencodev2-tui-reference"

export default Plugin.define({
  id: PLUGIN_ID,
  setup: (ctx) => {
    // 1. Initialize isolated stores (Memory & Persistent)
    const sessionStore = createSessionMemoryStore(ctx.storage)
    const prefsStore = createPersistentPrefsStore(ctx.storage)

    // 2. Register UI slot contributions (Sidebar & Prompt Footer)
    const unmountSlots = registerSidebarSlot(ctx, sessionStore, prefsStore)

    // 3. Register global Keymap layer & Slash Commands via "app" slot
    const unmountCommands = ctx.ui.slot({
      append: "app",
      render: () => (
        <Commands
          context={ctx}
          pluginId={PLUGIN_ID}
          sessionStore={sessionStore}
          prefsStore={prefsStore}
        />
      ),
    })

    // 4. Register custom router pages (/hctlab)
    const unregisterRoutes = registerRoutes(ctx, PLUGIN_ID, sessionStore, prefsStore)

    // 5. Setup event subscriptions
    const teardownEvents = setupEventSubscriptions(ctx, sessionStore)

    // 6. Return comprehensive cleanup function for hot-reload and plugin unload safety
    return () => {
      teardownEvents()
      unmountSlots()
      unmountCommands()
      unregisterRoutes()
    }
  },
})
