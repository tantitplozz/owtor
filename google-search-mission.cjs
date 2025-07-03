#!/usr/bin/env node

/**
 * Google Search Mission - iPhone 16 Pro Max 512GB
 * Real browser automation with GoLogin integration
 */

const { OmniAutoWebAI } = require("./omniauto-web-ai.cjs");
const http = require("http");

class GoogleSearchMission {
  constructor() {
    this.omniAI = new OmniAutoWebAI();
    this.searchQuery = "iPhone 16 Pro Max 512GB";
    this.targetUrl = "https://www.google.com";
    this.logger = this.omniAI.logger;
  }

  async execute() {
    this.logger.info("🎯 Starting Google Search Mission...");
    this.logger.info(`🔍 Search Query: "${this.searchQuery}"`);

    try {
      // Initialize OmniAI system
      const initialized = await this.omniAI.initialize();
      if (!initialized) {
        throw new Error("OmniAI initialization failed");
      }

      // Create mission config for Google search
      const missionConfig = {
        type: "google_search",
        url: this.targetUrl,
        objective: `Search for "${this.searchQuery}" on Google`,
        searchQuery: this.searchQuery,
        config: {
          waitForResults: true,
          extractTopResults: 10,
          includeImages: true,
          includeShopping: true,
        },
      };

      // Execute the mission
      const result = await this.omniAI.executeMission(missionConfig);

      // If simulation successful, perform real browser automation
      if (result.success) {
        this.logger.info("🌐 Executing real browser automation...");
        await this.performRealSearch();
      }

      return result;
    } catch (error) {
      this.logger.error("❌ Mission failed:", error);
      return { success: false, error: error.message };
    }
  }

  async performRealSearch() {
    try {
      // Get browser WebSocket endpoint
      const tabs = await this.getBrowserTabs();
      if (!tabs || tabs.length === 0) {
        throw new Error("No browser tabs available");
      }

      const wsUrl = tabs[0].webSocketDebuggerUrl;
      this.logger.info(`🔗 Connecting to browser: ${wsUrl}`);

      // Use Chrome DevTools Protocol for real automation
      const WebSocket = require("ws");
      const ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        let messageId = 1;

        ws.on("open", async () => {
          this.logger.success("✅ Connected to browser!");

          try {
            // Enable necessary domains
            await this.sendCommand(ws, messageId++, "Runtime.enable");
            await this.sendCommand(ws, messageId++, "Page.enable");
            await this.sendCommand(ws, messageId++, "DOM.enable");

            // Navigate to Google
            this.logger.info("🌐 Navigating to Google...");
            await this.sendCommand(ws, messageId++, "Page.navigate", {
              url: "https://www.google.com",
            });

            // Wait for page load
            await this.delay(3000);

            // Find and click search box
            this.logger.info("🔍 Finding search box...");
            const searchBoxResult = await this.sendCommand(
              ws,
              messageId++,
              "Runtime.evaluate",
              {
                expression: `
                                const searchBox = document.querySelector('input[name="q"]') ||
                                                document.querySelector('textarea[name="q"]') ||
                                                document.querySelector('#APjFqb');
                                if (searchBox) {
                                    searchBox.focus();
                                    'found';
                                } else {
                                    'not_found';
                                }
                            `,
              }
            );

            if (searchBoxResult.result.value === "found") {
              this.logger.success("✅ Search box found and focused!");

              // Type search query with human-like timing
              this.logger.info(`⌨️ Typing: "${this.searchQuery}"`);
              await this.typeWithHumanTiming(ws, messageId, this.searchQuery);

              // Wait a moment then press Enter
              await this.delay(1000);

              this.logger.info("⏎ Pressing Enter to search...");
              await this.sendCommand(
                ws,
                messageId++,
                "Input.dispatchKeyEvent",
                {
                  type: "keyDown",
                  key: "Enter",
                }
              );
              await this.sendCommand(
                ws,
                messageId++,
                "Input.dispatchKeyEvent",
                {
                  type: "keyUp",
                  key: "Enter",
                }
              );

              // Wait for search results
              await this.delay(3000);

              // Extract search results
              this.logger.info("📊 Extracting search results...");
              const resultsData = await this.extractSearchResults(
                ws,
                messageId++
              );

              this.logger.success("🎉 Google search completed successfully!");
              this.logger.info("📋 Results extracted:", resultsData);

              ws.close();
              resolve(resultsData);
            } else {
              throw new Error("Search box not found");
            }
          } catch (error) {
            this.logger.error("❌ Browser automation error:", error);
            ws.close();
            reject(error);
          }
        });

        ws.on("error", (error) => {
          this.logger.error("❌ WebSocket error:", error);
          reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          ws.close();
          reject(new Error("Browser automation timeout"));
        }, 30000);
      });
    } catch (error) {
      this.logger.error("❌ Real browser automation failed:", error);
      throw error;
    }
  }

  async getBrowserTabs() {
    return new Promise((resolve, reject) => {
      const req = http.get("http://localhost:34299/json", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("Browser tabs request timeout"));
      });
    });
  }

  async sendCommand(ws, id, method, params = {}) {
    return new Promise((resolve, reject) => {
      const command = {
        id,
        method,
        params,
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Command timeout: ${method}`));
      }, 10000);

      const handler = (data) => {
        const response = JSON.parse(data.toString());
        if (response.id === id) {
          clearTimeout(timeout);
          ws.removeListener("message", handler);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        }
      };

      ws.on("message", handler);
      ws.send(JSON.stringify(command));
    });
  }

  async typeWithHumanTiming(ws, messageId, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Type character
      await this.sendCommand(ws, messageId++, "Runtime.evaluate", {
        expression: `
                    const searchBox = document.querySelector('input[name="q"]') ||
                                    document.querySelector('textarea[name="q"]') ||
                                    document.querySelector('#APjFqb');
                    if (searchBox) {
                        searchBox.value += '${char}';
                        searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                `,
      });

      // Human-like typing delay (50-150ms)
      const delay = Math.random() * 100 + 50;
      await this.delay(delay);
    }
  }

  async extractSearchResults(ws, messageId) {
    const extractResult = await this.sendCommand(
      ws,
      messageId,
      "Runtime.evaluate",
      {
        expression: `
                (() => {
                    const results = [];

                    // Extract regular search results
                    const searchResults = document.querySelectorAll('div[data-ved] h3');
                    searchResults.forEach((result, index) => {
                        if (index < 10) {
                            const link = result.closest('a');
                            results.push({
                                type: 'search',
                                title: result.textContent,
                                url: link ? link.href : null,
                                position: index + 1
                            });
                        }
                    });

                    // Extract shopping results if available
                    const shoppingResults = document.querySelectorAll('[data-ved] [role="listitem"]');
                    shoppingResults.forEach((item, index) => {
                        const title = item.querySelector('h3, h4');
                        const price = item.querySelector('[data-currency-code]');
                        const link = item.querySelector('a');

                        if (title && index < 5) {
                            results.push({
                                type: 'shopping',
                                title: title.textContent,
                                price: price ? price.textContent : null,
                                url: link ? link.href : null,
                                position: index + 1
                            });
                        }
                    });

                    // Extract images if available
                    const imageResults = document.querySelectorAll('img[data-ved]');
                    const images = [];
                    imageResults.forEach((img, index) => {
                        if (index < 5) {
                            images.push({
                                type: 'image',
                                src: img.src,
                                alt: img.alt,
                                position: index + 1
                            });
                        }
                    });

                    return {
                        searchResults: results.filter(r => r.type === 'search'),
                        shoppingResults: results.filter(r => r.type === 'shopping'),
                        imageResults: images,
                        totalResults: results.length,
                        searchQuery: '${this.searchQuery}',
                        timestamp: new Date().toISOString()
                    };
                })()
            `,
      }
    );

    return extractResult.result.value;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Execute the mission
async function main() {
  console.log(`
🚀 Google Search Mission - iPhone 16 Pro Max 512GB
=================================================
Target: Google.com
Query: "iPhone 16 Pro Max 512GB"
Mode: Real Browser Automation with GoLogin
`);

  const mission = new GoogleSearchMission();
  const result = await mission.execute();

  if (result.success) {
    console.log("\n🎉 Mission Completed Successfully!");
    console.log("📊 Performance:", result.evaluation?.performance);
    console.log("📈 Success Rate:", result.evaluation?.successRate + "%");
  } else {
    console.log("\n❌ Mission Failed:", result.error);
  }
}

// Export for module usage
module.exports = { GoogleSearchMission };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
