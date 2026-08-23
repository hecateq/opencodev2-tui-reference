import { createSignal } from "solid-js"
import type { Plugin } from "@opencode-ai/plugin/tui"
import type { PersistentPreferences } from "../types.js"

export function createPersistentPrefsStore(_storage: Plugin.Context["storage"]) {
  // Singleton in-memory reactive signals for rock-solid zero-jitter UI accordions
  const [hecateqLabOpen, setHecateqLabOpen] = createSignal(true)
  const [subagentsOpen, setSubagentsOpen] = createSignal(true)
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false)
  const [compactMode, setCompactMode] = createSignal(false)

  function toggleHecateqLab(): boolean {
    const next = !hecateqLabOpen()
    setHecateqLabOpen(next)
    return next
  }

  function toggleSubagents(): boolean {
    const next = !subagentsOpen()
    setSubagentsOpen(next)
    return next
  }

  function toggleSidebar(): boolean {
    const next = !sidebarCollapsed()
    setSidebarCollapsed(next)
    return next
  }

  function toggleCompactMode(): boolean {
    const next = !compactMode()
    setCompactMode(next)
    return next
  }

  return {
    hecateqLabOpen,
    subagentsOpen,
    sidebarCollapsed,
    compactMode,
    toggleSidebar,
    toggleHecateqLab,
    toggleSubagents,
    toggleCompactMode,
  }
}

export type PersistentPrefsStore = ReturnType<typeof createPersistentPrefsStore>
