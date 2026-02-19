// ============================================================
// MCP Server: Stopwatch Timer
// ============================================================
// This file creates an MCP (Model Context Protocol) server that
// exposes one tool — a stopwatch — to any MCP client (like Claude Code).
//
// How it works:
//   - The first call STARTS the timer and records the current time.
//   - The second call STOPS the timer and returns the elapsed time.
//   - Each subsequent call toggles start/stop again.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// ── State ────────────────────────────────────────────────────
// We store the start time here. null means the stopwatch is stopped.
let startTime = null;

// ── Create the MCP server ────────────────────────────────────
// Give it a name and version — these show up in the client.
const server = new McpServer({
  name: "stopwatch-server",
  version: "1.0.0",
});

// ── Register the "stopwatch_timer" tool ─────────────────────
// This is the tool Claude Code (or any MCP client) will call.
server.tool(
  "stopwatch_timer",           // Tool name (used to call it)
  "Start or stop a stopwatch. First press starts it, second press stops it and returns the elapsed time.", // Description shown to the AI
  {},                          // No input parameters needed — the button press itself is the action
  async () => {
    // ── STOP: timer is running → calculate elapsed time ──
    if (startTime !== null) {
      const elapsed = Date.now() - startTime; // milliseconds
      startTime = null;                        // reset for next use

      // Format elapsed time into a human-readable string
      const ms   = elapsed % 1000;
      const secs = Math.floor(elapsed / 1000) % 60;
      const mins = Math.floor(elapsed / 60_000);

      const display =
        mins > 0
          ? `${mins}m ${secs}s ${ms}ms`
          : secs > 0
          ? `${secs}s ${ms}ms`
          : `${ms}ms`;

      return {
        content: [
          {
            type: "text",
            text: `Stopwatch stopped.\nElapsed time: ${display} (${elapsed} ms total)`,
          },
        ],
      };
    }

    // ── START: timer is not running → record start time ──
    startTime = Date.now();

    return {
      content: [
        {
          type: "text",
          text: "Stopwatch started. Call this tool again to stop it and see the elapsed time.",
        },
      ],
    };
  }
);

// ── Connect via stdio transport ──────────────────────────────
// Claude Code communicates with MCP servers over stdin/stdout.
// StdioServerTransport handles that pipe for us.
const transport = new StdioServerTransport();
await server.connect(transport);
