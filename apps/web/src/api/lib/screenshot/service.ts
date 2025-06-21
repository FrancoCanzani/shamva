import puppeteer from "@cloudflare/puppeteer";
import { EnvBindings } from "../../../../bindings";
import { createSupabaseClient } from "../supabase/client";

export class ScreenshotService {
  private env: EnvBindings;

  constructor(env: EnvBindings) {
    this.env = env;
  }

  async takeAndStoreScreenshot(
    url: string,
    incidentId: string
  ): Promise<string | null> {
    let browser = null;
    let page = null;

    try {
      // Check if we have a cached screenshot first (optional optimization)
      const cacheKey = `screenshot-${Buffer.from(url).toString('base64')}`;
      let screenshotBuffer = await this.env.RATE_LIMITS.get(cacheKey, { type: "arrayBuffer" });
      
      if (!screenshotBuffer) {
        // Take screenshot using Puppeteer with Workers binding
        browser = await puppeteer.launch(this.env.BROWSER, {
          keep_alive: 30000, // Keep browser alive for 30 seconds
        });

        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Set a timeout for the page load
        page.setDefaultNavigationTimeout(30000);

        // Navigate to the URL with better error handling
        const response = await page.goto(url, { 
          waitUntil: "networkidle0",
          timeout: 30000 
        });

        if (!response || !response.ok()) {
          console.warn(`Screenshot: Page load failed for ${url}, status: ${response?.status()}`);
          // Continue anyway as we might still get a useful screenshot
        }

        // Take the screenshot
        screenshotBuffer = await page.screenshot({ 
          fullPage: true,
          type: 'png',
          quality: 80
        });

        // Cache the screenshot for 1 hour (optional)
        await this.env.RATE_LIMITS.put(cacheKey, screenshotBuffer, {
          expirationTtl: 60 * 60, // 1 hour
        });
      }

      // Upload to Supabase Storage
      const supabase = createSupabaseClient(this.env);
      const fileName = `incident-${incidentId}-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("screenshots")
        .upload(fileName, screenshotBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        console.error("Error uploading screenshot:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("screenshots").getPublicUrl(fileName);

      console.log(`Screenshot taken and stored: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error("Error taking screenshot:", error);
      return null;
    } finally {
      // Ensure browser is always closed
      try {
        if (page) await page.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        console.error("Error during browser cleanup:", cleanupError);
      }
    }
  }
}
