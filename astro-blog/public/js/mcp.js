/* MCP session simulator — vanilla JS, self-contained.
   Walks the reader through one real MCP session: initialize handshake,
   capability exchange, tool discovery, a user question, a tool call, and
   the model's final answer. Each step shows the JSON-RPC message on the
   wire and highlights which actor (host / client / server) is acting.
   DOM IDs are defined in src/content/posts/mcp.md and must match exactly. */
(function () {
  "use strict";

  function init() {
    var root = document.getElementById("mcp-sim");
    if (!root) return; // interactive not on this page

    var elCaption = document.getElementById("mcp-sim-caption");
    var elJson = document.getElementById("mcp-sim-json");
    var elStepLabel = document.getElementById("mcp-sim-steplabel");
    var elMethod = document.getElementById("mcp-sim-method");
    var elArrow = document.getElementById("mcp-flow-arrow");
    var elProgress = document.getElementById("mcp-sim-progress");
    var btnPrev = document.getElementById("mcp-sim-prev");
    var btnNext = document.getElementById("mcp-sim-next");
    var btnReset = document.getElementById("mcp-sim-reset");
    var boxes = {
      host: document.getElementById("mcp-actor-host"),
      client: document.getElementById("mcp-actor-client"),
      server: document.getElementById("mcp-actor-server")
    };

    // Bail out safely if the markup is incomplete.
    if (!elCaption || !elJson || !elStepLabel || !elArrow || !btnNext) return;

    var steps = [
      {
        label: "1. initialize (request)",
        from: "client", to: "server", send: "client",
        arrow: "client → server",
        method: "initialize",
        caption: "The client opens the connection and offers its protocol version and the client-side capabilities it can honor (roots, sampling).",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 1,',
          '  "method": "initialize",',
          '  "params": {',
          '    "protocolVersion": "2025-11-25",',
          '    "capabilities": {',
          '      "roots": { "listChanged": true },',
          '      "sampling": {}',
          "    },",
          '    "clientInfo": { "name": "example-ide", "version": "1.2.0" }',
          "  }",
          "}"
        ].join("\n")
      },
      {
        label: "2. initialize (result)",
        from: "server", to: "client", send: "server",
        arrow: "server → client",
        method: "initialize",
        caption: "The server replies with the version it agrees to speak and the capabilities it exposes. Here it advertises tools and resources.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 1,',
          '  "result": {',
          '    "protocolVersion": "2025-11-25",',
          '    "capabilities": {',
          '      "tools": { "listChanged": true },',
          '      "resources": {}',
          "    },",
          '    "serverInfo": { "name": "weather-server", "version": "0.1.0" }',
          "  }",
          "}"
        ].join("\n")
      },
      {
        label: "3. initialized (notification)",
        from: "client", to: "server", send: "client",
        arrow: "client → server",
        method: "notifications/initialized",
        caption: "The client confirms the handshake is complete. Notifications carry no id and get no reply. The session is now live.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "method": "notifications/initialized"',
          "}"
        ].join("\n")
      },
      {
        label: "4. tools/list (request)",
        from: "client", to: "server", send: "client",
        arrow: "client → server",
        method: "tools/list",
        caption: "The client asks what the server can do. Discovery is dynamic: tools are learned at runtime, not hard-coded into the app.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 2,',
          '  "method": "tools/list"',
          "}"
        ].join("\n")
      },
      {
        label: "5. tools/list (result)",
        from: "server", to: "client", send: "server",
        arrow: "server → client",
        method: "tools/list",
        caption: "The server returns each tool with a name, a human description, and a JSON Schema for its arguments. The model reads this to decide how to call it.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 2,',
          '  "result": {',
          '    "tools": [{',
          '      "name": "get_forecast",',
          '      "description": "Get the weather forecast for a city.",',
          '      "inputSchema": {',
          '        "type": "object",',
          '        "properties": { "city": { "type": "string" } },',
          '        "required": ["city"]',
          "      }",
          "    }]",
          "  }",
          "}"
        ].join("\n")
      },
      {
        label: "6. User asks a question",
        from: "host", to: "host", send: "host",
        arrow: "inside the host",
        method: "(no MCP message)",
        caption: "This happens entirely inside the host. The host hands the model the user's text plus the tool schemas from step 5. The model decides it wants to call get_forecast.",
        json: [
          "// Not an MCP message — this is the host's own LLM call.",
          "// The host sends the model:",
          '//   user: "What is the weather in Tokyo?"',
          "//   tools: [ get_forecast(city) ]   (from tools/list)",
          "//",
          "// The model responds that it wants to invoke get_forecast",
          '// with { "city": "Tokyo" }.'
        ].join("\n")
      },
      {
        label: "7. tools/call (request)",
        from: "client", to: "server", send: "client",
        arrow: "client → server",
        method: "tools/call",
        caption: "The host asks the client to execute the tool the model chose. The user typically approves this step before it runs.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 3,',
          '  "method": "tools/call",',
          '  "params": {',
          '    "name": "get_forecast",',
          '    "arguments": { "city": "Tokyo" }',
          "  }",
          "}"
        ].join("\n")
      },
      {
        label: "8. tools/call (result)",
        from: "server", to: "client", send: "server",
        arrow: "server → client",
        method: "tools/call",
        caption: "The server runs the real work and returns content blocks. The isError flag lets the model see failures as data instead of a broken connection.",
        json: [
          "{",
          '  "jsonrpc": "2.0",',
          '  "id": 3,',
          '  "result": {',
          '    "content": [',
          '      { "type": "text",',
          '        "text": "Tokyo: 24C, light rain, humidity 78%." }',
          "    ],",
          '    "isError": false',
          "  }",
          "}"
        ].join("\n")
      },
      {
        label: "9. Model writes the answer",
        from: "host", to: "host", send: "host",
        arrow: "inside the host",
        method: "(no MCP message)",
        caption: "Back inside the host. The tool result is appended to the model's context, and the model composes the final reply for the user.",
        json: [
          "// Not an MCP message — back in the host's LLM loop.",
          "// The tool result is added to the conversation, then the",
          "// model produces the user-facing answer:",
          "//",
          '// "It is 24C in Tokyo right now with light rain and',
          '//  78% humidity."'
        ].join("\n")
      }
    ];

    var idx = 0;

    function render() {
      var s = steps[idx];
      if (!s) return;

      elStepLabel.textContent = s.label + "  ·  step " + (idx + 1) + " of " + steps.length;
      elCaption.textContent = s.caption;
      elJson.textContent = s.json;
      if (elMethod) elMethod.textContent = s.method;
      elArrow.textContent = s.arrow;

      // Highlight actors: sender strong, receiver soft, others neutral.
      Object.keys(boxes).forEach(function (k) {
        var box = boxes[k];
        if (!box) return;
        box.classList.remove("mcp-actor-active", "mcp-actor-recv");
        if (k === s.send) box.classList.add("mcp-actor-active");
        else if (k === s.to || k === s.from) box.classList.add("mcp-actor-recv");
      });

      if (elProgress) {
        var pct = ((idx + 1) / steps.length) * 100;
        elProgress.style.width = pct.toFixed(1) + "%";
      }

      if (btnPrev) btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === steps.length - 1;
    }

    function go(delta) {
      idx = Math.max(0, Math.min(steps.length - 1, idx + delta));
      render();
    }

    if (btnPrev) btnPrev.addEventListener("click", function () { go(-1); });
    btnNext.addEventListener("click", function () { go(1); });
    if (btnReset) btnReset.addEventListener("click", function () { idx = 0; render(); });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
