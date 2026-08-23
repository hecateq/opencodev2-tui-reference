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
        id: "hctlab.hecateq.toggle",
        title: "Toggle Hecateq Lab Accordion",
        description: "Expands or collapses the Hecateq Lab sidebar panel",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hecateq-toggle",
        },
        run: async () => {
          const isOpen = await props.prefsStore.toggleHecateqLab()
          props.context.ui.toast.show({
            title: "Hecateq Lab",
            message: isOpen ? "Hecateq Lab Expanded" : "Hecateq Lab Collapsed",
            variant: "info",
            duration: 2000,
          })
        },
      },
      {
        id: "hctlab.subagents.toggle",
        title: "Toggle Subagents Accordion",
        description: "Expands or collapses the Subagents section under Hecateq Lab",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "subagents-toggle",
        },
        run: async () => {
          const isOpen = await props.prefsStore.toggleSubagents()
          props.context.ui.toast.show({
            title: "Subagents",
            message: isOpen ? "Subagents Expanded" : "Subagents Collapsed",
            variant: "info",
            duration: 2000,
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
