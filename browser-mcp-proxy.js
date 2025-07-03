const { spawn } = require("child_process");
const puppeteer = require("puppeteer");

// GoLogin และ Proxy Configuration
const GOLOGIN_PROFILE_ID = "6861912f0737813be6c5fed1";
const PROXY_HOST = "192.168.1.100";
const PROXY_PORT = "1888";

async function startBrowserWithProxy() {
  console.log("Starting Browser MCP with GoLogin and Socks5 proxy...");

  // Launch browser with proxy settings
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--proxy-server=socks5://${PROXY_HOST}:${PROXY_PORT}`,
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  console.log(`Browser launched with proxy: ${PROXY_HOST}:${PROXY_PORT}`);
  console.log(`GoLogin Profile ID: ${GOLOGIN_PROFILE_ID}`);

  // Start MCP server
  const mcpServer = spawn("npx", ["@browsermcp/mcp@latest"], {
    env: {
      ...process.env,
      BROWSER_WS_ENDPOINT: browser.wsEndpoint(),
      GOLOGIN_PROFILE_ID: GOLOGIN_PROFILE_ID,
      PROXY_HOST: PROXY_HOST,
      PROXY_PORT: PROXY_PORT,
    },
    stdio: "inherit",
  });

  mcpServer.on("error", (error) => {
    console.error("MCP Server error:", error);
  });

  mcpServer.on("exit", (code) => {
    console.log(`MCP Server exited with code: ${code}`);
    browser.close();
  });

  return { browser, mcpServer };
}

// Start the server
startBrowserWithProxy().catch(console.error);
