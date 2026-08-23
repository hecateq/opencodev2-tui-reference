import { createMemo, createSignal, For, Show } from "solid-js"
import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import type { PersistentPrefsStore } from "../state/persistent-store.js"
import { formatCost } from "../utils/format.js"
import { sessionFamily } from "../utils/session.js"
import { PluginErrorBoundary } from "./ErrorBoundary.js"
import { navigateToHctLab } from "../tui/router.js"

export interface SidebarPanelProps {
  readonly context: Plugin.Context
  readonly sessionID: string
  readonly sessionStore: SessionMemoryStore
  readonly prefsStore: PersistentPrefsStore
}

function SidebarPanelContent(props: SidebarPanelProps) {
  const theme = props.context.theme

  // Reactive collapsible state
  const [isHecateqOpen, setHecateqOpen] = createSignal(props.prefsStore.prefs.hecateqLabOpen ?? true)
  const [isSubagentsOpen, setSubagentsOpen] = createSignal(props.prefsStore.prefs.subagentsOpen ?? true)

  const toggleHecateq = (e?: any) => {
    e?.stopPropagation?.()
    const next = !isHecateqOpen()
    setHecateqOpen(next)
    void props.prefsStore.toggleHecateqLab()
  }

  const toggleSubagents = (e?: any) => {
    e?.stopPropagation?.()
    const next = !isSubagentsOpen()
    setSubagentsOpen(next)
    void props.prefsStore.toggleSubagents()
  }

  // Active Session metrics
  const session = createMemo(() => {
    return (
      props.sessionStore.store.activeSessions[props.sessionID] ??
      props.sessionStore.ensureSession(props.sessionID)
    )
  })

  const rawSession = createMemo(() => props.context.data.session.get(props.sessionID))
  const allSessions = createMemo(() => props.context.data.session.list())

  // Discovers all child subagent sessions in the active family tree
  const subagentNodes = createMemo(() => {
    if (!props.sessionID) return []
    return sessionFamily(allSessions(), props.sessionID)
  })

  const activeSubagents = createMemo(() => {
    return subagentNodes().filter((node) => {
      const status = props.context.data.session.status(node.session.id)
      return status === "running"
    })
  })

  // Available Subagent profiles in the workspace
  const availableSubagents = createMemo(() => {
    const list = props.context.data.location.agent.list(rawSession()?.location) ?? []
    return list.filter((a) => a.mode === "subagent" || a.mode === "all")
  })

  const sessionStatus = createMemo(() => {
    if (!props.sessionID) return "idle"
    return props.context.data.session.status(props.sessionID)
  })

  const isRunning = createMemo(() => sessionStatus() === "running")

  // Pulls cost from context; undefined if not entered / zero
  const sessionCost = createMemo(() => {
    if (!props.sessionID) return undefined
    const rawCost = props.context.data.session.cost(props.sessionID)
    return formatCost(rawCost)
  })

  const dot = (running: boolean) => {
    return running ? theme.text.feedback.warning.default : theme.text.feedback.success.default
  }

  return (
    <box marginTop={1} flexDirection="column">
      {/* Top-Level Header: Hecateq Lab */}
      <box
        flexDirection="row"
        gap={1}
        minWidth={0}
        flexGrow={1}
        onMouseDown={toggleHecateq}
        onMouseUp={toggleHecateq}
      >
        <text fg={theme.text.default}>
          {isHecateqOpen() ? "▼" : "▶"}
        </text>
        <text fg={theme.text.default}>
          <b>Hecateq Lab</b>
          <Show when={!isHecateqOpen()}>
            <span style={{ fg: theme.text.subdued }}>
              {" "}
              ({isRunning() ? "Working" : "Idle"}, {subagentNodes().length} subagents)
            </span>
          </Show>
        </text>
      </box>

      {/* Expanded Hecateq Lab Content */}
      <Show when={isHecateqOpen()}>
        <box flexDirection="column" marginTop={0}>
          {/* Status Row */}
          <box flexDirection="row" gap={1} minWidth={0}>
            <text flexShrink={0} style={{ fg: dot(isRunning()) }}>
              •
            </text>
            <text fg={theme.text.default} wrapMode="none" truncate flexGrow={1} flexShrink={1} minWidth={0}>
              <b>Status</b>
            </text>
            <text
              fg={isRunning() ? theme.text.feedback.warning.default : theme.text.feedback.success.default}
              wrapMode="none"
              flexShrink={0}
            >
              {isRunning() ? "Working" : "Idle"}
            </text>
          </box>

          {/* Session Counter Row */}
          <box
            flexDirection="row"
            gap={1}
            minWidth={0}
            onMouseDown={() => {
              props.sessionStore.incrementCounter(props.sessionID)
              props.context.ui.toast.show({
                title: "Session Counter",
                message: `Counter: ${session().counter}`,
                variant: "info",
                duration: 2000,
              })
            }}
          >
            <text flexShrink={0} style={{ fg: theme.text.feedback.info.default }}>
              •
            </text>
            <text fg={theme.text.default} wrapMode="none" truncate flexGrow={1} flexShrink={1} minWidth={0}>
              <b>Counter</b>
            </text>
            <text fg={theme.text.feedback.info.default} wrapMode="none" flexShrink={0}>
              {session().counter}
            </text>
          </box>

          {/* Cost Row - Rendered only when cost is present in context */}
          <Show when={sessionCost()}>
            {(cost) => (
              <box flexDirection="row" gap={1} minWidth={0}>
                <text flexShrink={0} style={{ fg: theme.text.feedback.success.default }}>
                  •
                </text>
                <text fg={theme.text.default} wrapMode="none" truncate flexGrow={1} flexShrink={1} minWidth={0}>
                  <b>Cost</b>
                </text>
                <text fg={theme.text.feedback.success.default} wrapMode="none" flexShrink={0}>
                  {cost()}
                </text>
              </box>
            )}
          </Show>

          {/* Open Full Dashboard Action */}
          <box
            flexDirection="row"
            gap={1}
            minWidth={0}
            onMouseDown={() => navigateToHctLab(props.context, "opencodev2-tui-reference")}
          >
            <text flexShrink={0} style={{ fg: theme.text.feedback.info.default }}>
              •
            </text>
            <text fg={theme.text.feedback.info.default} wrapMode="none" truncate flexGrow={1} flexShrink={1} minWidth={0}>
              <i>Open Dashboard...</i>
            </text>
          </box>

          {/* Nested Subagents Section (Directly under Hecateq Lab) */}
          <box marginTop={1} paddingLeft={1} flexDirection="column">
            <box
              flexDirection="row"
              gap={1}
              minWidth={0}
              flexGrow={1}
              onMouseDown={toggleSubagents}
              onMouseUp={toggleSubagents}
            >
              <text fg={theme.text.default}>
                {isSubagentsOpen() ? "▼" : "▶"}
              </text>
              <text fg={theme.text.default}>
                <b>Subagents</b>
                <span style={{ fg: theme.text.subdued }}>
                  {" "}
                  ({activeSubagents().length} running{subagentNodes().length > 0 ? `, ${subagentNodes().length} total` : ""})
                </span>
              </text>
            </box>

            {/* Expanded Subagents Content */}
            <Show when={isSubagentsOpen()}>
              <box flexDirection="column">
                <Show
                  when={subagentNodes().length > 0}
                  fallback={
                    <box paddingLeft={1}>
                      <text fg={theme.text.subdued}>
                        <i>No subagents spawned yet</i>
                      </text>
                    </box>
                  }
                >
                  <For each={subagentNodes()}>
                    {(node) => {
                      const subStatus = () => props.context.data.session.status(node.session.id)
                      const isSubRunning = () => subStatus() === "running"
                      const title = () => {
                        const agentName = node.session.agent ?? node.session.title ?? node.session.id.slice(0, 8)
                        return `${node.prefix}${agentName}`
                      }

                      return (
                        <box
                          flexDirection="row"
                          gap={1}
                          minWidth={0}
                          onMouseDown={() => {
                            props.context.ui.router.navigate({ type: "session", sessionID: node.session.id })
                          }}
                        >
                          <text
                            flexShrink={0}
                            style={{
                              fg: isSubRunning() ? theme.text.feedback.warning.default : theme.text.feedback.success.default,
                            }}
                          >
                            •
                          </text>
                          <text fg={theme.text.default} wrapMode="none" truncate flexGrow={1} flexShrink={1} minWidth={0}>
                            <b>{title()}</b>
                          </text>
                          <text
                            fg={isSubRunning() ? theme.text.feedback.warning.default : theme.text.subdued}
                            wrapMode="none"
                            flexShrink={0}
                          >
                            {isSubRunning() ? "Working" : (node.session.outcome ?? "Done")}
                          </text>
                        </box>
                      )
                    }}
                  </For>
                </Show>

                {/* Compact Available Roles Summary */}
                <Show when={availableSubagents().length > 0}>
                  <box flexDirection="row" gap={1} paddingLeft={1} marginTop={1}>
                    <text fg={theme.text.subdued}>
                      Catalog: <span style={{ fg: theme.text.feedback.info.default }}>{availableSubagents().length} roles available</span>
                    </text>
                  </box>
                </Show>
              </box>
            </Show>
          </box>
        </box>
      </Show>
    </box>
  )
}

export function SidebarPanel(props: SidebarPanelProps) {
  return (
    <PluginErrorBoundary context={props.context} componentName="SidebarPanel">
      <SidebarPanelContent {...props} />
    </PluginErrorBoundary>
  )
}
