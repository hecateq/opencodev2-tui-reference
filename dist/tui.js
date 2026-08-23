// src/tui.tsx
import { Plugin } from "@opencode-ai/plugin/tui";

// src/state/session-store.ts
var MEMORY_STORAGE_KEY = "hctlab_tui_memory_store";
var DEFAULT_INITIAL_STATE = {
  globalInteractions: 0,
  activeSessions: {}
};
function createSessionMemoryStore(storage) {
  const [store, mutate] = storage.memory(MEMORY_STORAGE_KEY, {
    initial: DEFAULT_INITIAL_STATE
  });
  function ensureSession(sessionID) {
    const existing = store.activeSessions[sessionID];
    if (existing)
      return existing;
    const now = Date.now();
    const newSession = {
      sessionID,
      counter: 0,
      eventCount: 0,
      createdAt: now,
      updatedAt: now
    };
    mutate((draft) => {
      draft.activeSessions[sessionID] = newSession;
    });
    return newSession;
  }
  function incrementCounter(sessionID) {
    ensureSession(sessionID);
    const now = Date.now();
    mutate((draft) => {
      draft.globalInteractions += 1;
      const session = draft.activeSessions[sessionID];
      if (session) {
        session.counter += 1;
        session.updatedAt = now;
      }
    });
  }
  function recordEvent(sessionID, eventType, description) {
    ensureSession(sessionID);
    const now = Date.now();
    mutate((draft) => {
      const session = draft.activeSessions[sessionID];
      if (session) {
        session.eventCount += 1;
        session.lastEvent = {
          type: eventType,
          timestamp: now,
          description
        };
        session.updatedAt = now;
      }
    });
  }
  function resetSession(sessionID) {
    const now = Date.now();
    mutate((draft) => {
      draft.activeSessions[sessionID] = {
        sessionID,
        counter: 0,
        eventCount: 0,
        createdAt: now,
        updatedAt: now
      };
    });
  }
  return {
    store,
    ensureSession,
    incrementCounter,
    recordEvent,
    resetSession
  };
}

// src/state/persistent-store.ts
import { createSignal } from "solid-js";
function createPersistentPrefsStore(_storage) {
  const [hecateqLabOpen, setHecateqLabOpen] = createSignal(true);
  const [subagentsOpen, setSubagentsOpen] = createSignal(true);
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  const [compactMode, setCompactMode] = createSignal(false);
  function toggleHecateqLab() {
    const next = !hecateqLabOpen();
    setHecateqLabOpen(next);
    return next;
  }
  function toggleSubagents() {
    const next = !subagentsOpen();
    setSubagentsOpen(next);
    return next;
  }
  function toggleSidebar() {
    const next = !sidebarCollapsed();
    setSidebarCollapsed(next);
    return next;
  }
  function toggleCompactMode() {
    const next = !compactMode();
    setCompactMode(next);
    return next;
  }
  return {
    hecateqLabOpen,
    subagentsOpen,
    sidebarCollapsed,
    compactMode,
    toggleSidebar,
    toggleHecateqLab,
    toggleSubagents,
    toggleCompactMode
  };
}

// src/components/SidebarPanel.tsx
import { createMemo as createMemo2, For as For2, Show as Show2 } from "solid-js";

// src/utils/format.ts
function formatCost(cost) {
  if (cost === undefined || cost === null || cost <= 0)
    return;
  return `$${cost.toFixed(4)}`;
}
function formatTimestamp(timestamp) {
  if (!timestamp)
    return "Never";
  const date = new Date(timestamp);
  return date.toTimeString().split(" ")[0] ?? "Unknown";
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength)
    return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

// src/utils/session.ts
function sessionFamily(sessions, sessionID) {
  const byID = new Map(sessions.map((session) => [session.id, session]));
  const current = byID.get(sessionID);
  if (!current)
    return [];
  const children = new Map;
  sessions.forEach((session) => {
    if (!session.parentID)
      return;
    const group = children.get(session.parentID);
    if (group)
      group.push(session);
    else
      children.set(session.parentID, [session]);
  });
  function root(session) {
    const parent = session.parentID ? byID.get(session.parentID) : undefined;
    return parent ? root(parent) : session;
  }
  function walk(parentID, depth) {
    const group = children.get(parentID) ?? [];
    return group.flatMap((session, index) => {
      const isLast = index === group.length - 1;
      const prefix = `${"  ".repeat(depth)}${isLast ? "└─ " : "├─ "}`;
      return [{ session, prefix, depth }, ...walk(session.id, depth + 1)];
    });
  }
  const rootSession = root(current);
  return walk(rootSession.id, 0);
}

// src/components/ErrorBoundary.tsx
import { ErrorBoundary as SolidErrorBoundary } from "solid-js";
import { jsxDEV } from "@opentui/solid/jsx-dev-runtime";
function PluginErrorBoundary(props) {
  return /* @__PURE__ */ jsxDEV(SolidErrorBoundary, {
    fallback: (err) => {
      const title = props.componentName ? `Error in ${props.componentName}` : "Component Error";
      return /* @__PURE__ */ jsxDEV("box", {
        borderStyle: "single",
        borderColor: "#e06c75",
        padding: 1,
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsxDEV("text", {
            fg: "#e06c75",
            children: [
              "⚠ ",
              title
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: "#abb2bf",
            children: err.message || String(err)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: "#5c6370",
            children: "Press hotkey or trigger reload to recover."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
    },
    children: props.children
  }, undefined, false, undefined, this);
}

// src/components/HctLabPage.tsx
import { createMemo, For, Show } from "solid-js";
import { jsxDEV as jsxDEV2 } from "@opentui/solid/jsx-dev-runtime";
function HctLabPageContent(props) {
  const sessions = createMemo(() => {
    return Object.values(props.sessionStore.store.activeSessions);
  });
  const globalInteractions = createMemo(() => props.sessionStore.store.globalInteractions);
  const theme = createMemo(() => props.context.theme);
  const activeSessionList = createMemo(() => props.context.data.session.list());
  const subagentSessions = createMemo(() => {
    return activeSessionList().filter((s) => Boolean(s.parentID));
  });
  const availableAgentProfiles = createMemo(() => {
    return props.context.data.location.agent.list() ?? [];
  });
  const returnTargetSessionID = createMemo(() => {
    const list = activeSessionList();
    return list[0]?.id;
  });
  const handleExit = () => {
    const sessionID = returnTargetSessionID();
    if (sessionID) {
      props.context.ui.router.navigate({ type: "session", sessionID });
    } else {
      props.context.ui.router.navigate({ type: "home" });
    }
  };
  props.context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "hctlab.exit.esc",
        title: "Close HCTLab Dashboard",
        bind: "escape",
        run: () => {
          handleExit();
        }
      },
      {
        id: "hctlab.exit.q",
        title: "Quit Dashboard",
        bind: "q",
        run: () => {
          handleExit();
        }
      }
    ]
  }));
  return /* @__PURE__ */ jsxDEV2("box", {
    borderStyle: "rounded",
    borderColor: theme().text.feedback.info.default,
    padding: 1,
    flexDirection: "column",
    gap: 1,
    children: [
      /* @__PURE__ */ jsxDEV2("box", {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        children: [
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.default,
            children: /* @__PURE__ */ jsxDEV2("b", {
              children: "\uD83E\uDDEA HCTLab - OpenCode V2 TUI Reference Page"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("box", {
            flexDirection: "row",
            gap: 1,
            paddingX: 1,
            onMouseUp: handleExit,
            children: /* @__PURE__ */ jsxDEV2("text", {
              fg: theme().text.feedback.warning.default,
              children: /* @__PURE__ */ jsxDEV2("b", {
                children: "[ ⎋ Çıkış: ESC veya Q ]"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("box", {
        flexDirection: "row",
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.subdued,
            children: "OpenCode V2 Subagents, Telemetry and Multi-Agent Orchestration Inspector"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.subdued,
            children: [
              "Global Interactions: ",
              /* @__PURE__ */ jsxDEV2("span", {
                style: { fg: theme().text.feedback.info.default },
                children: String(globalInteractions())
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("box", {
        borderStyle: "single",
        borderColor: theme().text.feedback.info.default,
        padding: 1,
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.feedback.info.default,
            children: /* @__PURE__ */ jsxDEV2("b", {
              children: [
                "\uD83E\uDD16 Assigned Subagents (",
                subagentSessions().length,
                " active subagent executions):"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2(Show, {
            when: subagentSessions().length > 0,
            fallback: /* @__PURE__ */ jsxDEV2("text", {
              fg: theme().text.subdued,
              children: "No active subagent sessions found. When an agent invokes a subagent, it will appear here live."
            }, undefined, false, undefined, this),
            children: /* @__PURE__ */ jsxDEV2(For, {
              each: subagentSessions(),
              children: (sub) => {
                const isRunning = () => props.context.data.session.status(sub.id) === "running";
                return /* @__PURE__ */ jsxDEV2("box", {
                  flexDirection: "row",
                  gap: 2,
                  alignItems: "center",
                  onMouseUp: () => props.context.ui.tabs.open(sub.id),
                  children: [
                    /* @__PURE__ */ jsxDEV2("text", {
                      fg: isRunning() ? theme().text.feedback.warning.default : theme().text.feedback.success.default,
                      children: "•"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV2("text", {
                      fg: theme().text.default,
                      children: [
                        /* @__PURE__ */ jsxDEV2("b", {
                          children: sub.agent ?? "Subagent"
                        }, undefined, false, undefined, this),
                        " (",
                        truncateText(sub.id, 16),
                        ")"
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ jsxDEV2("text", {
                      fg: theme().text.subdued,
                      children: [
                        "Parent: ",
                        truncateText(sub.parentID ?? "root", 12)
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ jsxDEV2("text", {
                      fg: theme().text.subdued,
                      children: [
                        "Cost: $",
                        sub.cost.toFixed(4)
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ jsxDEV2("text", {
                      fg: isRunning() ? theme().text.feedback.warning.default : theme().text.feedback.info.default,
                      children: [
                        "[",
                        isRunning() ? "Working" : sub.outcome ?? "Done",
                        "]"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this);
              }
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("box", {
            flexDirection: "row",
            gap: 1,
            marginTop: 1,
            children: [
              /* @__PURE__ */ jsxDEV2("text", {
                fg: theme().text.subdued,
                children: "Configured Agent Roles: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2(For, {
                each: availableAgentProfiles(),
                children: (agent) => /* @__PURE__ */ jsxDEV2("text", {
                  fg: agent.mode === "subagent" ? theme().text.feedback.info.default : theme().text.default,
                  children: [
                    agent.name ?? agent.id,
                    " (",
                    agent.mode,
                    ")"
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("box", {
        borderStyle: "single",
        borderColor: theme().text.subdued,
        padding: 1,
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.default,
            children: /* @__PURE__ */ jsxDEV2("b", {
              children: [
                "All Active Root Sessions (",
                sessions().length,
                "):"
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2(For, {
            each: sessions(),
            fallback: /* @__PURE__ */ jsxDEV2("text", {
              fg: theme().text.subdued,
              children: "No session activity recorded in memory yet."
            }, undefined, false, undefined, this),
            children: (item) => /* @__PURE__ */ jsxDEV2("box", {
              flexDirection: "row",
              gap: 2,
              alignItems: "center",
              children: [
                /* @__PURE__ */ jsxDEV2("text", {
                  fg: theme().text.default,
                  children: [
                    "• ",
                    truncateText(item.sessionID, 20),
                    ":"
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV2("text", {
                  fg: theme().text.feedback.info.default,
                  children: [
                    "Prompts=",
                    item.counter
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV2("text", {
                  fg: theme().text.subdued,
                  children: [
                    "Events=",
                    item.eventCount
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV2("text", {
                  fg: theme().text.subdued,
                  children: [
                    "Last=",
                    item.lastEvent?.type ?? "None",
                    " (",
                    formatTimestamp(item.updatedAt),
                    ")"
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("box", {
        borderStyle: "single",
        borderColor: theme().text.subdued,
        paddingX: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        children: [
          /* @__PURE__ */ jsxDEV2("box", {
            onMouseUp: handleExit,
            children: /* @__PURE__ */ jsxDEV2("text", {
              fg: theme().text.feedback.info.default,
              children: [
                "← Oturuma / Sohbete Geri Dön ",
                /* @__PURE__ */ jsxDEV2("b", {
                  children: "(ESC / Q veya Tıkla)"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("text", {
            fg: theme().text.feedback.warning.default,
            children: "[HCTLab Subagent Inspector Active]"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function HctLabPage(props) {
  return /* @__PURE__ */ jsxDEV2(PluginErrorBoundary, {
    context: props.context,
    componentName: "HctLabPage",
    children: /* @__PURE__ */ jsxDEV2(HctLabPageContent, {
      ...props
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/tui/router.tsx
import { jsxDEV as jsxDEV3 } from "@opentui/solid/jsx-dev-runtime";
var HCTLAB_ROUTE_NAME = "hctlab";
function registerRoutes(ctx, pluginId, sessionStore, prefsStore) {
  const unregister = ctx.ui.router.register({
    name: HCTLAB_ROUTE_NAME,
    render: (input) => /* @__PURE__ */ jsxDEV3(HctLabPage, {
      context: ctx,
      sessionStore,
      prefsStore,
      data: input.data
    }, undefined, false, undefined, this)
  });
  return unregister;
}
function navigateToHctLab(ctx, pluginId) {
  ctx.ui.router.navigate({
    type: "plugin",
    id: pluginId,
    name: HCTLAB_ROUTE_NAME,
    data: {
      openedAt: Date.now()
    }
  });
}

// src/components/SidebarPanel.tsx
import { jsxDEV as jsxDEV4 } from "@opentui/solid/jsx-dev-runtime";
function SidebarPanelContent(props) {
  const theme = props.context.theme;
  const isHecateqOpen = props.prefsStore.hecateqLabOpen;
  const isSubagentsOpen = props.prefsStore.subagentsOpen;
  const session = createMemo2(() => {
    return props.sessionStore.store.activeSessions[props.sessionID] ?? props.sessionStore.ensureSession(props.sessionID);
  });
  const rawSession = createMemo2(() => props.context.data.session.get(props.sessionID));
  const allSessions = createMemo2(() => props.context.data.session.list());
  const subagentNodes = createMemo2(() => {
    if (!props.sessionID)
      return [];
    return sessionFamily(allSessions(), props.sessionID);
  });
  const activeSubagents = createMemo2(() => {
    return subagentNodes().filter((node) => {
      const status = props.context.data.session.status(node.session.id);
      return status === "running";
    });
  });
  const availableSubagents = createMemo2(() => {
    const list = props.context.data.location.agent.list(rawSession()?.location) ?? [];
    return list.filter((a) => a.mode === "subagent" || a.mode === "all");
  });
  const sessionStatus = createMemo2(() => {
    if (!props.sessionID)
      return "idle";
    return props.context.data.session.status(props.sessionID);
  });
  const isRunning = createMemo2(() => sessionStatus() === "running");
  const sessionMessages = createMemo2(() => {
    if (!props.sessionID)
      return [];
    return props.context.data.session.message.list(props.sessionID) ?? [];
  });
  const promptCount = createMemo2(() => {
    const msgs = sessionMessages();
    const userMsgs = msgs.filter((m) => m.type === "user" || m.type === "shell");
    return userMsgs.length;
  });
  const sessionCost = createMemo2(() => {
    if (!props.sessionID)
      return;
    const rawCost = props.context.data.session.cost(props.sessionID);
    return formatCost(rawCost);
  });
  const dot = (running) => {
    return running ? theme.text.feedback.warning.default : theme.text.feedback.success.default;
  };
  return /* @__PURE__ */ jsxDEV4("box", {
    marginTop: 1,
    children: [
      /* @__PURE__ */ jsxDEV4("box", {
        flexDirection: "row",
        gap: 1,
        minWidth: 0,
        onMouseUp: () => props.prefsStore.toggleHecateqLab(),
        children: [
          /* @__PURE__ */ jsxDEV4("text", {
            fg: theme.text.default,
            children: isHecateqOpen() ? "▼" : "▶"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4("text", {
            fg: theme.text.default,
            children: [
              /* @__PURE__ */ jsxDEV4("b", {
                children: "Hecateq Lab"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV4(Show2, {
                when: !isHecateqOpen(),
                children: /* @__PURE__ */ jsxDEV4("span", {
                  style: { fg: theme.text.subdued },
                  children: [
                    " ",
                    "(",
                    isRunning() ? "Working" : "Idle",
                    ", ",
                    subagentNodes().length,
                    " subagents)"
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV4(Show2, {
        when: isHecateqOpen(),
        children: /* @__PURE__ */ jsxDEV4("box", {
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsxDEV4("box", {
              flexDirection: "row",
              gap: 1,
              minWidth: 0,
              children: [
                /* @__PURE__ */ jsxDEV4("text", {
                  flexShrink: 0,
                  style: { fg: dot(isRunning()) },
                  children: "•"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV4("text", {
                  fg: theme.text.default,
                  wrapMode: "none",
                  truncate: true,
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  children: /* @__PURE__ */ jsxDEV4("b", {
                    children: "Status"
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV4("text", {
                  fg: isRunning() ? theme.text.feedback.warning.default : theme.text.feedback.success.default,
                  wrapMode: "none",
                  flexShrink: 0,
                  children: isRunning() ? "Working" : "Idle"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV4("box", {
              flexDirection: "row",
              gap: 1,
              minWidth: 0,
              onMouseUp: () => {
                props.context.ui.toast.show({
                  title: "Session Prompts",
                  message: `Total Prompts in Session: ${promptCount()}`,
                  variant: "info",
                  duration: 2000
                });
              },
              children: [
                /* @__PURE__ */ jsxDEV4("text", {
                  flexShrink: 0,
                  style: { fg: theme.text.feedback.info.default },
                  children: "•"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV4("text", {
                  fg: theme.text.default,
                  wrapMode: "none",
                  truncate: true,
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  children: /* @__PURE__ */ jsxDEV4("b", {
                    children: "Prompts"
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV4("text", {
                  fg: theme.text.feedback.info.default,
                  wrapMode: "none",
                  flexShrink: 0,
                  children: promptCount()
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV4(Show2, {
              when: sessionCost(),
              children: (cost) => /* @__PURE__ */ jsxDEV4("box", {
                flexDirection: "row",
                gap: 1,
                minWidth: 0,
                children: [
                  /* @__PURE__ */ jsxDEV4("text", {
                    flexShrink: 0,
                    style: { fg: theme.text.feedback.success.default },
                    children: "•"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV4("text", {
                    fg: theme.text.default,
                    wrapMode: "none",
                    truncate: true,
                    flexGrow: 1,
                    flexShrink: 1,
                    minWidth: 0,
                    children: /* @__PURE__ */ jsxDEV4("b", {
                      children: "Cost"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV4("text", {
                    fg: theme.text.feedback.success.default,
                    wrapMode: "none",
                    flexShrink: 0,
                    children: cost()
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV4("box", {
              flexDirection: "row",
              gap: 1,
              minWidth: 0,
              onMouseUp: () => navigateToHctLab(props.context, "opencodev2-tui-reference"),
              children: [
                /* @__PURE__ */ jsxDEV4("text", {
                  flexShrink: 0,
                  style: { fg: theme.text.feedback.info.default },
                  children: "•"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV4("text", {
                  fg: theme.text.feedback.info.default,
                  wrapMode: "none",
                  truncate: true,
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  children: /* @__PURE__ */ jsxDEV4("i", {
                    children: "Open Dashboard..."
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV4("box", {
              marginTop: 1,
              paddingLeft: 1,
              children: [
                /* @__PURE__ */ jsxDEV4("box", {
                  flexDirection: "row",
                  gap: 1,
                  minWidth: 0,
                  onMouseUp: () => props.prefsStore.toggleSubagents(),
                  children: [
                    /* @__PURE__ */ jsxDEV4("text", {
                      fg: theme.text.default,
                      children: isSubagentsOpen() ? "▼" : "▶"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV4("text", {
                      fg: theme.text.default,
                      children: [
                        /* @__PURE__ */ jsxDEV4("b", {
                          children: "Subagents"
                        }, undefined, false, undefined, this),
                        /* @__PURE__ */ jsxDEV4("span", {
                          style: { fg: theme.text.subdued },
                          children: [
                            " ",
                            "(",
                            activeSubagents().length,
                            " running",
                            subagentNodes().length > 0 ? `, ${subagentNodes().length} total` : "",
                            ")"
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV4(Show2, {
                  when: isSubagentsOpen(),
                  children: /* @__PURE__ */ jsxDEV4("box", {
                    flexDirection: "column",
                    children: [
                      /* @__PURE__ */ jsxDEV4(Show2, {
                        when: subagentNodes().length > 0,
                        fallback: /* @__PURE__ */ jsxDEV4("box", {
                          paddingLeft: 1,
                          children: /* @__PURE__ */ jsxDEV4("text", {
                            fg: theme.text.subdued,
                            children: /* @__PURE__ */ jsxDEV4("i", {
                              children: "No subagents spawned yet"
                            }, undefined, false, undefined, this)
                          }, undefined, false, undefined, this)
                        }, undefined, false, undefined, this),
                        children: /* @__PURE__ */ jsxDEV4(For2, {
                          each: subagentNodes(),
                          children: (node) => {
                            const subStatus = () => props.context.data.session.status(node.session.id);
                            const isSubRunning = () => subStatus() === "running";
                            const title = () => {
                              const agentName = node.session.agent ?? node.session.title ?? node.session.id.slice(0, 8);
                              return `${node.prefix}${agentName}`;
                            };
                            return /* @__PURE__ */ jsxDEV4("box", {
                              flexDirection: "row",
                              gap: 1,
                              minWidth: 0,
                              onMouseUp: () => {
                                props.context.ui.router.navigate({ type: "session", sessionID: node.session.id });
                              },
                              children: [
                                /* @__PURE__ */ jsxDEV4("text", {
                                  flexShrink: 0,
                                  style: {
                                    fg: isSubRunning() ? theme.text.feedback.warning.default : theme.text.feedback.success.default
                                  },
                                  children: "•"
                                }, undefined, false, undefined, this),
                                /* @__PURE__ */ jsxDEV4("text", {
                                  fg: theme.text.default,
                                  wrapMode: "none",
                                  truncate: true,
                                  flexGrow: 1,
                                  flexShrink: 1,
                                  minWidth: 0,
                                  children: /* @__PURE__ */ jsxDEV4("b", {
                                    children: title()
                                  }, undefined, false, undefined, this)
                                }, undefined, false, undefined, this),
                                /* @__PURE__ */ jsxDEV4("text", {
                                  fg: isSubRunning() ? theme.text.feedback.warning.default : theme.text.subdued,
                                  wrapMode: "none",
                                  flexShrink: 0,
                                  children: isSubRunning() ? "Working" : node.session.outcome ?? "Done"
                                }, undefined, false, undefined, this)
                              ]
                            }, undefined, true, undefined, this);
                          }
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV4(Show2, {
                        when: availableSubagents().length > 0,
                        children: /* @__PURE__ */ jsxDEV4("box", {
                          flexDirection: "row",
                          gap: 1,
                          paddingLeft: 1,
                          marginTop: 1,
                          children: /* @__PURE__ */ jsxDEV4("text", {
                            fg: theme.text.subdued,
                            children: [
                              "Catalog: ",
                              /* @__PURE__ */ jsxDEV4("span", {
                                style: { fg: theme.text.feedback.info.default },
                                children: [
                                  availableSubagents().length,
                                  " roles available"
                                ]
                              }, undefined, true, undefined, this)
                            ]
                          }, undefined, true, undefined, this)
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function SidebarPanel(props) {
  return /* @__PURE__ */ jsxDEV4(PluginErrorBoundary, {
    context: props.context,
    componentName: "SidebarPanel",
    children: /* @__PURE__ */ jsxDEV4(SidebarPanelContent, {
      ...props
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/components/PromptStatusBadge.tsx
import { createMemo as createMemo3, Show as Show3 } from "solid-js";
import { jsxDEV as jsxDEV5, Fragment } from "@opentui/solid/jsx-dev-runtime";
function PromptStatusBadgeContent(props) {
  const sessionID = () => props.sessionID ?? "global";
  const session = createMemo3(() => {
    return props.sessionStore.store.activeSessions[sessionID()] ?? props.sessionStore.ensureSession(sessionID());
  });
  const sessionStatus = createMemo3(() => {
    if (!props.sessionID)
      return "idle";
    return props.context.data.session.status(props.sessionID);
  });
  const isRunning = createMemo3(() => sessionStatus() === "running");
  const sessionMessages = createMemo3(() => {
    if (!props.sessionID)
      return [];
    return props.context.data.session.message.list(props.sessionID) ?? [];
  });
  const promptCount = createMemo3(() => {
    const msgs = sessionMessages();
    const userMsgs = msgs.filter((m) => m.type === "user" || m.type === "shell");
    return userMsgs.length;
  });
  const sessionCost = createMemo3(() => {
    if (!props.sessionID)
      return;
    const rawCost = props.context.data.session.cost(props.sessionID);
    return formatCost(rawCost);
  });
  const vcs = createMemo3(() => props.context.data.location.vcs.info());
  const branchName = createMemo3(() => {
    const info = vcs();
    if (!info)
      return "main";
    if (typeof info === "string")
      return info;
    if (typeof info.branch === "string")
      return info.branch;
    return "main";
  });
  const theme = createMemo3(() => props.context.theme);
  return /* @__PURE__ */ jsxDEV5("box", {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV5(Show3, {
        when: isRunning(),
        fallback: /* @__PURE__ */ jsxDEV5("text", {
          fg: theme().text.feedback.info.default,
          children: /* @__PURE__ */ jsxDEV5("b", {
            children: "\uD83E\uDDEA HCTLab"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        children: /* @__PURE__ */ jsxDEV5("text", {
          fg: theme().text.feedback.warning.default,
          children: /* @__PURE__ */ jsxDEV5("b", {
            children: "⚡ HCTLab (Working)"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("text", {
        fg: theme().text.subdued,
        children: "│"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("text", {
        fg: theme().text.feedback.info.default,
        children: [
          " ",
          branchName()
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5("text", {
        fg: theme().text.subdued,
        children: "│"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("text", {
        fg: theme().text.subdued,
        children: [
          "Prompts: ",
          /* @__PURE__ */ jsxDEV5("span", {
            style: { fg: theme().text.feedback.success.default },
            children: String(promptCount())
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5(Show3, {
        when: sessionCost(),
        children: (cost) => /* @__PURE__ */ jsxDEV5(Fragment, {
          children: [
            /* @__PURE__ */ jsxDEV5("text", {
              fg: theme().text.subdued,
              children: "│"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV5("text", {
              fg: theme().text.subdued,
              children: [
                "Cost: ",
                /* @__PURE__ */ jsxDEV5("span", {
                  style: { fg: theme().text.feedback.success.default },
                  children: cost()
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function PromptStatusBadge(props) {
  return /* @__PURE__ */ jsxDEV5(PluginErrorBoundary, {
    context: props.context,
    componentName: "PromptStatusBadge",
    children: /* @__PURE__ */ jsxDEV5(PromptStatusBadgeContent, {
      ...props
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/tui/slots.tsx
import { jsxDEV as jsxDEV6 } from "@opentui/solid/jsx-dev-runtime";
function registerSidebarSlot(ctx, sessionStore, prefsStore) {
  const unmountSidebar = ctx.ui.slot({
    append: "sidebar.content",
    render: (input) => /* @__PURE__ */ jsxDEV6(SidebarPanel, {
      context: ctx,
      sessionID: input.sessionID,
      sessionStore,
      prefsStore
    }, undefined, false, undefined, this)
  });
  const unmountPromptStatus = ctx.ui.slot({
    append: "prompt.footer.status",
    render: (input) => /* @__PURE__ */ jsxDEV6(PromptStatusBadge, {
      context: ctx,
      sessionID: input.sessionID,
      sessionStore
    }, undefined, false, undefined, this)
  });
  return () => {
    unmountSidebar();
    unmountPromptStatus();
  };
}

// src/tui/commands.tsx
function Commands(props) {
  props.context.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "hctlab.open",
        title: "Open HCTLab Dashboard",
        description: "Navigate to the HCTLab TUI Reference full page view",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hctlab"
        },
        run: () => {
          navigateToHctLab(props.context, props.pluginId);
          props.context.ui.toast.show({
            title: "HCTLab",
            message: "Navigated to HCTLab Reference Page",
            variant: "info",
            duration: 3000
          });
        }
      },
      {
        id: "hctlab.hecateq.toggle",
        title: "Toggle Hecateq Lab Accordion",
        description: "Expands or collapses the Hecateq Lab sidebar panel",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hecateq-toggle"
        },
        run: async () => {
          const isOpen = await props.prefsStore.toggleHecateqLab();
          props.context.ui.toast.show({
            title: "Hecateq Lab",
            message: isOpen ? "Hecateq Lab Expanded" : "Hecateq Lab Collapsed",
            variant: "info",
            duration: 2000
          });
        }
      },
      {
        id: "hctlab.subagents.toggle",
        title: "Toggle Subagents Accordion",
        description: "Expands or collapses the Subagents section under Hecateq Lab",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "subagents-toggle"
        },
        run: async () => {
          const isOpen = await props.prefsStore.toggleSubagents();
          props.context.ui.toast.show({
            title: "Subagents",
            message: isOpen ? "Subagents Expanded" : "Subagents Collapsed",
            variant: "info",
            duration: 2000
          });
        }
      },
      {
        id: "hctlab.session.increment",
        title: "Increment Session Prompts",
        description: "Increments the reactive prompt counter for the current session",
        group: "HCTLab",
        palette: true,
        slash: {
          name: "hct-increment"
        },
        run: () => {
          const currentRoute = props.context.ui.router.current();
          const activeSessionID = currentRoute.type === "session" ? currentRoute.sessionID : "global";
          props.sessionStore.incrementCounter(activeSessionID);
          const session = props.sessionStore.ensureSession(activeSessionID);
          props.context.ui.toast.show({
            title: "Session Prompts",
            message: `Prompts updated: ${session.counter} (Session: ${activeSessionID})`,
            variant: "success",
            duration: 2500
          });
        }
      }
    ]
  }));
  return null;
}

// src/tui/events.ts
function setupEventSubscriptions(ctx, sessionStore) {
  const stopListening = ctx.data.listen((event) => {
    const eventType = event.details.type;
    const currentRoute = ctx.ui.router.current();
    const activeSessionID = currentRoute.type === "session" ? currentRoute.sessionID : "global";
    sessionStore.recordEvent(activeSessionID, eventType);
  });
  const stopSessionListen = ctx.data.on("session.status", (event) => {
    const sessionID = "sessionID" in event && typeof event.sessionID === "string" ? event.sessionID : "global";
    const status = "status" in event && typeof event.status === "string" ? event.status : undefined;
    sessionStore.recordEvent(sessionID, "session.status", status);
  });
  return () => {
    stopListening();
    stopSessionListen();
  };
}

// src/tui.tsx
import { jsxDEV as jsxDEV7 } from "@opentui/solid/jsx-dev-runtime";
var PLUGIN_ID = "opencodev2-tui-reference";
var tui_default = Plugin.define({
  id: PLUGIN_ID,
  setup: (ctx) => {
    const sessionStore = createSessionMemoryStore(ctx.storage);
    const prefsStore = createPersistentPrefsStore(ctx.storage);
    const unmountSlots = registerSidebarSlot(ctx, sessionStore, prefsStore);
    const unmountCommands = ctx.ui.slot({
      append: "app",
      render: () => /* @__PURE__ */ jsxDEV7(Commands, {
        context: ctx,
        pluginId: PLUGIN_ID,
        sessionStore,
        prefsStore
      }, undefined, false, undefined, this)
    });
    const unregisterRoutes = registerRoutes(ctx, PLUGIN_ID, sessionStore, prefsStore);
    const teardownEvents = setupEventSubscriptions(ctx, sessionStore);
    return () => {
      teardownEvents();
      unmountSlots();
      unmountCommands();
      unregisterRoutes();
    };
  }
});
export {
  tui_default as default,
  PLUGIN_ID
};
