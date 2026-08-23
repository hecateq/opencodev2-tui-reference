/**
 * Formatting utilities for TUI presentation.
 */

export function formatCost(cost?: number | null): string | undefined {
  if (cost === undefined || cost === null || cost <= 0) return undefined
  return `$${cost.toFixed(4)}`
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "Never"
  const date = new Date(timestamp)
  return date.toTimeString().split(" ")[0] ?? "Unknown"
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`
}
