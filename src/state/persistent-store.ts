import type { Plugin } from "@opencode-ai/plugin/tui"
import type { PersistentPreferences } from "../types.js"

const PERSISTENT_STORAGE_KEY = "hctlab_tui_persistent_prefs"

const DEFAULT_PREFERENCES: PersistentPreferences = {
  sidebarCollapsed: false,
  compactMode: false,
  hecateqLabOpen: true,
  subagentsOpen: true,
}

export function createPersistentPrefsStore(storage: Plugin.Context["storage"]) {
  const [prefs, mutatePrefs] = storage.store<PersistentPreferences>(PERSISTENT_STORAGE_KEY, {
    initial: DEFAULT_PREFERENCES,
  })

  async function toggleSidebar(): Promise<boolean> {
    let nextState = false
    await mutatePrefs((draft: PersistentPreferences) => {
      draft.sidebarCollapsed = !draft.sidebarCollapsed
      nextState = draft.sidebarCollapsed
    })
    return nextState
  }

  async function toggleHecateqLab(): Promise<boolean> {
    let nextState = true
    await mutatePrefs((draft: PersistentPreferences) => {
      draft.hecateqLabOpen = draft.hecateqLabOpen !== undefined ? !draft.hecateqLabOpen : false
      nextState = draft.hecateqLabOpen
    })
    return nextState
  }

  async function toggleSubagents(): Promise<boolean> {
    let nextState = true
    await mutatePrefs((draft: PersistentPreferences) => {
      draft.subagentsOpen = draft.subagentsOpen !== undefined ? !draft.subagentsOpen : false
      nextState = draft.subagentsOpen
    })
    return nextState
  }

  async function toggleCompactMode(): Promise<boolean> {
    let nextState = false
    await mutatePrefs((draft: PersistentPreferences) => {
      draft.compactMode = !draft.compactMode
      nextState = draft.compactMode
    })
    return nextState
  }

  async function setLastVisitedRoute(route: string): Promise<void> {
    await mutatePrefs((draft: PersistentPreferences) => {
      draft.lastVisitedRoute = route
    })
  }

  return {
    prefs,
    toggleSidebar,
    toggleHecateqLab,
    toggleSubagents,
    toggleCompactMode,
    setLastVisitedRoute,
  }
}

export type PersistentPrefsStore = ReturnType<typeof createPersistentPrefsStore>
