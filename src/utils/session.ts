import type { SessionInfo } from "@opencode-ai/client"

export interface FamilyNode {
  session: SessionInfo
  prefix: string
  depth: number
}

export function sessionFamily(sessions: readonly SessionInfo[], sessionID: string): FamilyNode[] {
  const byID = new Map(sessions.map((session) => [session.id, session]))
  const current = byID.get(sessionID)
  if (!current) return []

  const children = new Map<string, SessionInfo[]>()
  sessions.forEach((session) => {
    if (!session.parentID) return
    const group = children.get(session.parentID)
    if (group) group.push(session)
    else children.set(session.parentID, [session])
  })

  function root(session: SessionInfo): SessionInfo {
    const parent = session.parentID ? byID.get(session.parentID) : undefined
    return parent ? root(parent) : session
  }

  function walk(parentID: string, depth: number): FamilyNode[] {
    const group = children.get(parentID) ?? []
    return group.flatMap((session, index) => {
      const isLast = index === group.length - 1
      const prefix = `${"  ".repeat(depth)}${isLast ? "└─ " : "├─ "}`
      return [{ session, prefix, depth }, ...walk(session.id, depth + 1)]
    })
  }

  const rootSession = root(current)
  return walk(rootSession.id, 0)
}
