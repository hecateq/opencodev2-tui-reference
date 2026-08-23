import { describe, expect, it } from "bun:test"
import { createSessionMemoryStore } from "../src/state/session-store.js"
import { createPersistentPrefsStore } from "../src/state/persistent-store.js"

describe("State & Storage Isolation", () => {
  it("maintains strict session isolation in memory store", () => {
    let memoryState: any = {
      globalInteractions: 0,
      activeSessions: {},
    }

    const mockStorage: any = {
      memory: (key: string, options: any) => {
        return [
          memoryState,
          (fn: (draft: any) => void) => {
            fn(memoryState)
          },
        ]
      },
      store: () => [{}, async () => {}],
    }

    const store = createSessionMemoryStore(mockStorage)

    // Session 1
    const s1 = store.ensureSession("session-alpha")
    expect(s1.counter).toBe(0)
    store.incrementCounter("session-alpha")
    expect(store.store.activeSessions["session-alpha"]?.counter).toBe(1)

    // Session 2 - completely isolated
    const s2 = store.ensureSession("session-beta")
    expect(s2.counter).toBe(0)
    expect(store.store.activeSessions["session-beta"]?.counter).toBe(0)
    expect(store.store.activeSessions["session-alpha"]?.counter).toBe(1)

    // Track event
    store.recordEvent("session-alpha", "tool.start", "Executing test")
    expect(store.store.activeSessions["session-alpha"]?.eventCount).toBe(1)
    expect(store.store.activeSessions["session-alpha"]?.lastEvent?.type).toBe("tool.start")
    expect(store.store.activeSessions["session-beta"]?.eventCount).toBe(0)
  })

  it("handles persistent preferences store and toggles", async () => {
    let persistentState: any = {
      sidebarCollapsed: false,
      compactMode: false,
      hecateqLabOpen: true,
      subagentsOpen: true,
    }

    const mockStorage: any = {
      memory: () => [{}, () => {}],
      store: (key: string, options: any) => {
        return [
          persistentState,
          async (fn: (draft: any) => void) => {
            fn(persistentState)
          },
        ]
      },
    }

    const store = createPersistentPrefsStore(mockStorage)
    expect(store.prefs.hecateqLabOpen).toBe(true)
    expect(store.prefs.subagentsOpen).toBe(true)

    // Toggle Hecateq Lab
    const labOpen = await store.toggleHecateqLab()
    expect(labOpen).toBe(false)
    expect(store.prefs.hecateqLabOpen).toBe(false)

    // Toggle Subagents
    const subOpen = await store.toggleSubagents()
    expect(subOpen).toBe(false)
    expect(store.prefs.subagentsOpen).toBe(false)
  })
})
