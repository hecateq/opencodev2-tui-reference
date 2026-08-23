// src/index.ts
import { Plugin } from "@opencode-ai/plugin";
import os from "node:os";
var PLUGIN_ID = "opencodev2-tui-reference";
var src_default = Plugin.define({
  id: PLUGIN_ID,
  tui: true,
  setup: async (ctx) => {
    await ctx.command.transform((commands) => {
      commands.update("hctlab-info", (command) => {
        command.description = "Displays HCTLab TUI reference plugin diagnostics";
        command.template = "Provide runtime diagnostics for HCTLab TUI reference plugin.";
      });
    });
    await ctx.tool.transform((tools) => {
      tools.add({
        name: "hctlab_diagnostics",
        description: "Returns host metrics and environment diagnostics for the TUI plugin",
        input: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        output: {
          type: "object",
          properties: {
            platform: { type: "string" },
            arch: { type: "string" },
            uptimeSeconds: { type: "number" },
            memoryFreeMB: { type: "number" },
            memoryTotalMB: { type: "number" }
          },
          required: ["platform", "arch", "uptimeSeconds", "memoryFreeMB", "memoryTotalMB"],
          additionalProperties: false
        },
        execute: async () => {
          const free = Math.round(os.freemem() / (1024 * 1024));
          const total = Math.round(os.totalmem() / (1024 * 1024));
          const uptime = Math.round(os.uptime());
          return {
            output: {
              platform: os.platform(),
              arch: os.arch(),
              uptimeSeconds: uptime,
              memoryFreeMB: free,
              memoryTotalMB: total
            },
            content: `Host: ${os.platform()} (${os.arch()}) | RAM: ${free}MB / ${total}MB | Uptime: ${uptime}s`
          };
        }
      });
    });
    return () => {};
  }
});
export {
  src_default as default,
  PLUGIN_ID
};
