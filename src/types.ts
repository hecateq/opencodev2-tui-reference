/**
 * Strict TypeScript models for OpenCode V2 TUI Reference Plugin.
 * Contains zero 'any' and provides full session isolation and state contracts.
 */

export interface EventSummary {
  type: string
  timestamp: number
  description?: string
}

export interface SessionMetrics {
  sessionID: string
  counter: number
  eventCount: number
  lastEvent?: EventSummary
  createdAt: number
  updatedAt: number
}

export interface EphemeralMemoryState {
  globalInteractions: number
  activeSessions: Record<string, SessionMetrics>
}

export interface PersistentPreferences {
  sidebarCollapsed: boolean
  compactMode: boolean
  hecateqLabOpen: boolean
  subagentsOpen: boolean
  lastVisitedRoute?: string
}

export interface NavigationTarget {
  routeName: string
  params?: Record<string, string | number | boolean>
}
