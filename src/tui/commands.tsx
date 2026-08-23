import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import type { PersistentPrefsStore } from "../state/persistent-store.js"
import { navigateToHctLab } from "./router.js"

export interface CommandsProps {
  readonly context: Plugin.Context
  readonly pluginId: string
  readonly sessionStore: SessionMemoryStore
  readonly prefsStore: PersistentPrefsStore
}

export function Commands(props: CommandsProps) {
  // Keymap layers are reactive and owned by the calling Solid component inside <Keymap.Provider>
  props.context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "hctlab.open",
        title: "Open HCTLab Dashboard",
        description: "Navigate to the HCTLab TUI Reference full page view",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hctlab",
        },
        run: () => {
          navigateToHctLab(props.context, props.pluginId)
          props.context.ui.toast.show({
            title: "HCTLab",
            message: "Navigated to HCTLab Reference Page",
            variant: "info",
            duration: 3000,
          })
        },
      },
      {
        id: "hctlab.sidebar.toggle",
        title: "Toggle HCTLab Sidebar Collapse",
        description: "Toggles persistent collapsed state for the HCTLab sidebar panel",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "sidebar-toggle",
        },
        run: async () => {
          const isCollapsed = await props.prefsStore.toggleSidebar()
          props.context.ui.toast.show({
            title: "Sidebar",
            message: isCollapsed ? "HCTLab Sidebar Collapsed" : "HCTLab Sidebar Expanded",
            variant: "info",
            duration: 2500,
          })
        },
      },
      {
        id: "hctlab.session.increment",
        title: "Increment Session Counter",
        description: "Increments the reactive counter for the current session",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hct-increment",
        },
        run: () => {
          const currentRoute = props.context.ui.router.current()
          const activeSessionID = currentRoute.type === "session" ? currentRoute.sessionID : "global"
          props.sessionStore.incrementCounter(activeSessionID)

          const session = props.sessionStore.ensureSession(activeSessionID)
          props.context.ui.toast.show({
            title: "Session Counter",
            message: `Counter updated: ${session.counter} (Session: ${activeSessionID})`,
            variant: "success",
            duration: 2500,
          })
        },
      },
    ],
  }))

  return null
}
