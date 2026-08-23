import type { Plugin } from "@opencode-ai/plugin/tui"
import type { EphemeralMemoryState, SessionMetrics } from "../types.js"

const MEMORY_STORAGE_KEY = "hctlab_tui_memory_store"

const DEFAULT_INITIAL_STATE: EphemeralMemoryState = {
  globalInteractions: 0,
  activeSessions: {},
}

export function createSessionMemoryStore(storage: Plugin.Context["storage"]) {
  const [store, mutate] = storage.memory<EphemeralMemoryState>(MEMORY_STORAGE_KEY, {
    initial: DEFAULT_INITIAL_STATE,
  })

  function ensureSession(sessionID: string): SessionMetrics {
    const existing = store.activeSessions[sessionID]
    if (existing) return existing

    const now = Date.now()
    const newSession: SessionMetrics = {
      sessionID,
      counter: 0,
      eventCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    mutate((draft: EphemeralMemoryState) => {
      draft.activeSessions[sessionID] = newSession
    })

    return newSession
  }

  function incrementCounter(sessionID: string): void {
    ensureSession(sessionID)
    const now = Date.now()

    mutate((draft: EphemeralMemoryState) => {
      draft.globalInteractions += 1
      const session = draft.activeSessions[sessionID]
      if (session) {
        session.counter += 1
        session.updatedAt = now
      }
    })
  }

  function recordEvent(sessionID: string, eventType: string, description?: string): void {
    ensureSession(sessionID)
    const now = Date.now()

    mutate((draft: EphemeralMemoryState) => {
      const session = draft.activeSessions[sessionID]
      if (session) {
        session.eventCount += 1
        session.lastEvent = {
          type: eventType,
          timestamp: now,
          description,
        }
        session.updatedAt = now
      }
    })
  }

  function resetSession(sessionID: string): void {
    const now = Date.now()
    mutate((draft: EphemeralMemoryState) => {
      draft.activeSessions[sessionID] = {
        sessionID,
        counter: 0,
        eventCount: 0,
        createdAt: now,
        updatedAt: now,
      }
    })
  }

  return {
    store,
    ensureSession,
    incrementCounter,
    recordEvent,
    resetSession,
  }
}

export type SessionMemoryStore = ReturnType<typeof createSessionMemoryStore>
