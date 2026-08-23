import { describe, expect, it } from "bun:test"
import serverPlugin from "../src/index.js"
import tuiPlugin from "../src/tui.js"

describe("OpenCode V2 Plugin Lifecycle Contracts", () => {
  it("server plugin registers commands and tools with clean lifecycle", async () => {
    expect(serverPlugin.id).toBe("opencodev2-tui-reference")
    expect(serverPlugin.tui).toBe(true)

    const commands: Record<string, any> = {}
    const tools: Record<string, any> = {}

    const mockServerContext: any = {
      command: {
        transform: async (fn: (cmds: any) => void) => {
          fn({
            update: (name: string, mutate: (c: any) => void) => {
              commands[name] = {}
              mutate(commands[name])
            },
          })
        },
      },
      tool: {
        transform: async (fn: (t: any) => void) => {
          fn({
            add: (toolDef: any) => {
              tools[toolDef.name] = toolDef
            },
          })
        },
      },
    }

    const cleanup = await serverPlugin.setup(mockServerContext)
    expect(commands["hctlab-info"]).toBeDefined()
    expect(tools["hctlab_diagnostics"]).toBeDefined()

    // Test tool execution
    const result = await tools["hctlab_diagnostics"].execute()
    expect(result.output).toBeDefined()
    expect(typeof result.output.memoryFreeMB).toBe("number")
    expect(typeof result.content).toBe("string")

    if (typeof cleanup === "function") {
      cleanup()
    }
  })

  it("TUI plugin registers slots, routes, commands and cleans up completely", async () => {
    expect(tuiPlugin.id).toBe("opencodev2-tui-reference")

    const slotsRegistered: string[] = []
    let unmountCount = 0
    let routeUnregistered = false
    let listenerStopped = false

    const memoryMap = new Map<string, any>()
    const storeMap = new Map<string, any>()

    const mockTuiContext: any = {
      theme: {
        text: {
          default: { r: 1, g: 1, b: 1, a: 1 },
          subdued: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          feedback: {
            info: { default: { r: 0, g: 0.5, b: 1, a: 1 } },
            success: { default: { r: 0, g: 1, b: 0, a: 1 } },
            warning: { default: { r: 1, g: 0.8, b: 0, a: 1 } },
          },
        },
      },
      storage: {
        memory(key: string, options: any) {
          if (!memoryMap.has(key)) memoryMap.set(key, options.initial)
          return [memoryMap.get(key), (fn: any) => fn(memoryMap.get(key))]
        },
        store(key: string, options: any) {
          if (!storeMap.has(key)) storeMap.set(key, options.initial)
          return [storeMap.get(key), async (fn: any) => fn(storeMap.get(key))]
        },
      },
      ui: {
        slot(claim: any) {
          slotsRegistered.push(claim.append)
          expect(typeof claim.render).toBe("function")
          return () => {
            unmountCount += 1
          }
        },
        router: {
          register(page: any) {
            expect(page.name).toBe("hctlab")
            expect(typeof page.render).toBe("function")
            return () => {
              routeUnregistered = true
            }
          },
          navigate: () => {},
          current: () => ({ type: "home" }),
        },
        toast: {
          show: () => {},
        },
      },
      data: {
        listen(fn: any) {
          return () => {
            listenerStopped = true
          }
        },
        on(event: string, fn: any) {
          return () => {}
        },
        session: {
          list: () => [],
          status: () => "idle",
          cost: () => 0,
        },
        location: {
          vcs: {
            info: () => ({ branch: "main" }),
          },
        },
      },
    }

    const cleanup = tuiPlugin.setup(mockTuiContext)
    expect(typeof cleanup).toBe("function")

    expect(slotsRegistered).toContain("sidebar.content")
    expect(slotsRegistered).toContain("prompt.footer.status")
    expect(slotsRegistered).toContain("app")

    // Execute complete cleanup
    if (typeof cleanup === "function") {
      cleanup()
    }

    expect(unmountCount).toBe(3)
    expect(routeUnregistered).toBe(true)
    expect(listenerStopped).toBe(true)
  })
})
