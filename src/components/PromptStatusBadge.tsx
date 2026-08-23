import { createMemo, Show } from "solid-js"
import type { Plugin } from "@opencode-ai/plugin/tui"
import type { SessionMemoryStore } from "../state/session-store.js"
import { formatCost } from "../utils/format.js"
import { PluginErrorBoundary } from "./ErrorBoundary.js"

export interface PromptStatusBadgeProps {
  readonly context: Plugin.Context
  readonly sessionID?: string
  readonly sessionStore: SessionMemoryStore
}

function PromptStatusBadgeContent(props: PromptStatusBadgeProps) {
  const sessionID = () => props.sessionID ?? "global"

  const session = createMemo(() => {
    return (
      props.sessionStore.store.activeSessions[sessionID()] ??
      props.sessionStore.ensureSession(sessionID())
    )
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

  const vcs = createMemo(() => props.context.data.location.vcs.info())
  const branchName = createMemo(() => {
    const info = vcs()
    if (!info) return "main"
    if (typeof info === "string") return info
    if (typeof info.branch === "string") return info.branch
    return "main"
  })

  const theme = createMemo(() => props.context.theme)

  return (
    <box flexDirection="row" alignItems="center" gap={1} paddingX={1}>
      {/* Plugin Brand & Status */}
      <Show
        when={isRunning()}
        fallback={
          <text fg={theme().text.feedback.info.default}>
            <b>🧪 HCTLab</b>
          </text>
        }
      >
        <text fg={theme().text.feedback.warning.default}>
          <b>⚡ HCTLab (Working)</b>
        </text>
      </Show>

      <text fg={theme().text.subdued}>│</text>

      {/* VCS Branch */}
      <text fg={theme().text.feedback.info.default}>
         {branchName()}
      </text>

      <text fg={theme().text.subdued}>│</text>

      {/* Reactive Prompts Count */}
      <text fg={theme().text.subdued}>
        Prompts: <span style={{ fg: theme().text.feedback.success.default }}>{String(session().counter)}</span>
      </text>

      {/* Cost Badge - Only rendered if a non-zero cost is present in context */}
      <Show when={sessionCost()}>
        {(cost) => (
          <>
            <text fg={theme().text.subdued}>│</text>
            <text fg={theme().text.subdued}>
              Cost: <span style={{ fg: theme().text.feedback.success.default }}>{cost()}</span>
            </text>
          </>
        )}
      </Show>
    </box>
  )
}

export function PromptStatusBadge(props: PromptStatusBadgeProps) {
  return (
    <PluginErrorBoundary context={props.context} componentName="PromptStatusBadge">
      <PromptStatusBadgeContent {...props} />
    </PluginErrorBoundary>
  )
}
