import { createMemo, For, Show } from "solid-js"
import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import type { PersistentPrefsStore } from "../state/persistent-store.js"
import { formatTimestamp, truncateText } from "../utils/format.js"
import { PluginErrorBoundary } from "./ErrorBoundary.js"

export interface HctLabPageProps {
  readonly context: Plugin.Context
  readonly sessionStore: SessionMemoryStore
  readonly prefsStore: PersistentPrefsStore
  readonly data?: Record<string, unknown>
}

function HctLabPageContent(props: HctLabPageProps) {
  const sessions = createMemo(() => {
    return Object.values(props.sessionStore.store.activeSessions)
  })

  const globalInteractions = createMemo(() => props.sessionStore.store.globalInteractions)
  const theme = createMemo(() => props.context.theme)

  const activeSessionList = createMemo(() => props.context.data.session.list())

  // Subagents list from OpenCode host
  const subagentSessions = createMemo(() => {
    return activeSessionList().filter((s) => Boolean(s.parentID))
  })

  const availableAgentProfiles = createMemo(() => {
    return props.context.data.location.agent.list() ?? []
  })

  const returnTargetSessionID = createMemo(() => {
    const list = activeSessionList()
    return list[0]?.id
  })

  const handleExit = () => {
    const sessionID = returnTargetSessionID()
    if (sessionID) {
      props.context.ui.router.navigate({ type: "session", sessionID })
    } else {
      props.context.ui.router.navigate({ type: "home" })
    }
  }

  // Bind Escape and 'q' to close the dashboard and return to session
  props.context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "hctlab.exit.esc",
        title: "Close HCTLab Dashboard",
        bind: "escape",
        run: () => {
          handleExit()
        },
      },
      {
        id: "hctlab.exit.q",
        title: "Quit Dashboard",
        bind: "q",
        run: () => {
          handleExit()
        },
      },
    ],
  }))

  return (
    <box
      borderStyle="rounded"
      borderColor={theme().text.feedback.info.default}
      padding={1}
      flexDirection="column"
      gap={1}
    >
      {/* Title Bar with Exit Button */}
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <text fg={theme().text.default}>
          <b>🧪 HCTLab - OpenCode V2 TUI Reference Page</b>
        </text>
        <box
          flexDirection="row"
          gap={1}
          paddingX={1}
          onMouseUp={handleExit}
        >
          <text fg={theme().text.feedback.warning.default}>
            <b>[ ⎋ Çıkış: ESC veya Q ]</b>
          </text>
        </box>
      </box>

      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme().text.subdued}>
          OpenCode V2 Subagents, Telemetry and Multi-Agent Orchestration Inspector
        </text>
        <text fg={theme().text.subdued}>
          Global Interactions: <span style={{ fg: theme().text.feedback.info.default }}>{String(globalInteractions())}</span>
        </text>
      </box>

      {/* Subagents Hierarchy Box */}
      <box
        borderStyle="single"
        borderColor={theme().text.feedback.info.default}
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={theme().text.feedback.info.default}>
          <b>🤖 Assigned Subagents ({subagentSessions().length} active subagent executions):</b>
        </text>

        <Show
          when={subagentSessions().length > 0}
          fallback={
            <text fg={theme().text.subdued}>
              No active subagent sessions found. When an agent invokes a subagent, it will appear here live.
            </text>
          }
        >
          <For each={subagentSessions()}>
            {(sub) => {
              const isRunning = () => props.context.data.session.status(sub.id) === "running"
              return (
                <box
                  flexDirection="row"
                  gap={2}
                  alignItems="center"
                  onMouseUp={() => props.context.ui.tabs.open(sub.id)}
                >
                  <text fg={isRunning() ? theme().text.feedback.warning.default : theme().text.feedback.success.default}>
                    •
                  </text>
                  <text fg={theme().text.default}>
                    <b>{sub.agent ?? "Subagent"}</b> ({truncateText(sub.id, 16)})
                  </text>
                  <text fg={theme().text.subdued}>
                    Parent: {truncateText(sub.parentID ?? "root", 12)}
                  </text>
                  <text fg={theme().text.subdued}>
                    Cost: ${sub.cost.toFixed(4)}
                  </text>
                  <text fg={isRunning() ? theme().text.feedback.warning.default : theme().text.feedback.info.default}>
                    [{isRunning() ? "Working" : (sub.outcome ?? "Done")}]
                  </text>
                </box>
              )
            }}
          </For>
        </Show>

        {/* Configured Agent Roles */}
        <box flexDirection="row" gap={1} marginTop={1}>
          <text fg={theme().text.subdued}>Configured Agent Roles: </text>
          <For each={availableAgentProfiles()}>
            {(agent) => (
              <text fg={agent.mode === "subagent" ? theme().text.feedback.info.default : theme().text.default}>
                {agent.name ?? agent.id} ({agent.mode})
              </text>
            )}
          </For>
        </box>
      </box>

      {/* Session Breakdown */}
      <box
        borderStyle="single"
        borderColor={theme().text.subdued}
        padding={1}
        flexDirection="column"
        gap={1}
      >
        <text fg={theme().text.default}>
          <b>All Active Root Sessions ({sessions().length}):</b>
        </text>

        <For
          each={sessions()}
          fallback={
            <text fg={theme().text.subdued}>
              No session activity recorded in memory yet.
            </text>
          }
        >
          {(item) => (
            <box flexDirection="row" gap={2} alignItems="center">
              <text fg={theme().text.default}>
                • {truncateText(item.sessionID, 20)}:
              </text>
              <text fg={theme().text.feedback.info.default}>
                Prompts={item.counter}
              </text>
              <text fg={theme().text.subdued}>
                Events={item.eventCount}
              </text>
              <text fg={theme().text.subdued}>
                Last={item.lastEvent?.type ?? "None"} ({formatTimestamp(item.updatedAt)})
              </text>
            </box>
          )}
        </For>
      </box>

      {/* Footer Navigation Bar */}
      <box
        borderStyle="single"
        borderColor={theme().text.subdued}
        paddingX={1}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <box onMouseUp={handleExit}>
          <text fg={theme().text.feedback.info.default}>
            ← Oturuma / Sohbete Geri Dön <b>(ESC / Q veya Tıkla)</b>
          </text>
        </box>
        <text fg={theme().text.feedback.warning.default}>
          [HCTLab Subagent Inspector Active]
        </text>
      </box>
    </box>
  )
}

export function HctLabPage(props: HctLabPageProps) {
  return (
    <PluginErrorBoundary context={props.context} componentName="HctLabPage">
      <HctLabPageContent {...props} />
    </PluginErrorBoundary>
  )
}
