import { ErrorBoundary as SolidErrorBoundary, type JSX } from "solid-js"
import type { Plugin } from "@opencode-ai/plugin/tui"

export interface ErrorBoundaryProps {
  readonly context: Plugin.Context
  readonly children: JSX.Element
  readonly componentName?: string
}

export function PluginErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <SolidErrorBoundary
      fallback={(err: Error) => {
        const title = props.componentName ? `Error in ${props.componentName}` : "Component Error"
        return (
          <box
            borderStyle="single"
            borderColor="#e06c75"
            padding={1}
            flexDirection="column"
            gap={1}
          >
            <text fg="#e06c75">
              ⚠ {title}
            </text>
            <text fg="#abb2bf">
              {err.message || String(err)}
            </text>
            <text fg="#5c6370">
              Press hotkey or trigger reload to recover.
            </text>
          </box>
        )
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  )
}
