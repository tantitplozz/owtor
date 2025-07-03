import { GologinApi } from "./gologin/src/gologin-api.js";

// GoLogin Configuration
const GL_API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODAyM2UwNjA4YjU0YmVlNzY1YzI1ZWUiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2ODBjNWVmYjI5MGM5NGM5OGMyNjVjMjIifQ.Gm9-MS-oNv1-lNqbDjM_Af9LrzVld_vFQ6HbKnByJDM";
const PROFILE_ID = "6861912f0737813be6c5fed1";

async function startBrowserMCPWithGoLogin() {
  console.log("Starting Browser MCP with GoLogin (Simple)...");
  console.log(`Profile ID: ${PROFILE_ID}`);
  console.log(`API Token: ${GL_API_TOKEN.substring(0, 20)}...`);

  try {
    // Initialize GoLogin API
    const GL = GologinApi({
      token: GL_API_TOKEN,
    });

    console.log("GoLogin API initialized");

    // Launch browser with GoLogin profile (without proxy for now)
    console.log("Launching browser...");
    const browser = await GL.launch({
      profileId: PROFILE_ID,
    });

    console.log("GoLogin browser launched successfully!");
    console.log("Browser WS Endpoint:", browser.wsEndpoint());

    // Test the browser
    const page = await browser.newPage();
    await page.goto("https://iphey.com/", { waitUntil: "networkidle2" });
    console.log("Test page loaded successfully");

    // Keep browser open for MCP
    console.log("Browser is ready for MCP connection");
    console.log("You can now use Cursor with this browser instance");

    // Handle graceful shutdown
    const cleanup = async () => {
      console.log("Cleaning up...");
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
        if (browser) {
          await browser.close();
        }
        await GL.stop();
        console.log("Cleanup completed");
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };

    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      await cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Terminating...");
      await cleanup();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    console.error("Error starting Browser MCP with GoLogin:", error);
    throw error;
  }
}

// Start the server
startBrowserMCPWithGoLogin().catch(console.error);
