import { spawn } from "child_process";

async function startSimpleBrowserMCP() {
  console.log("Starting Simple Browser MCP...");

  try {
    // เริ่ม Browser MCP server แบบปกติ
    const mcpServer = spawn("npx", ["@browsermcp/mcp@latest"], {
      stdio: "inherit",
      detached: false,
    });

    console.log("MCP Server started with PID:", mcpServer.pid);
    console.log("Browser MCP is ready!");
    console.log("You can now use Cursor to control browsers");
    console.log("GoLogin browser should be available at: ws://localhost:34299");

    mcpServer.on("error", (error) => {
      console.error("MCP Server error:", error);
    });

    mcpServer.on("exit", (code) => {
      console.log(`MCP Server exited with code: ${code}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("Shutting down...");
      mcpServer.kill("SIGTERM");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("Terminating...");
      mcpServer.kill("SIGTERM");
      process.exit(0);
    });

    // Keep process alive
    setInterval(() => {
      console.log("Browser MCP is running... (Press Ctrl+C to stop)");
    }, 30000);
  } catch (error) {
    console.error("Error starting Browser MCP:", error);
    throw error;
  }
}

// Start the server
startSimpleBrowserMCP().catch(console.error);
