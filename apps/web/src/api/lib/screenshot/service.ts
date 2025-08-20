import puppeteer from "@cloudflare/puppeteer";
import { EnvBindings } from "../../../../bindings";
import { supabase } from "../supabase/client";

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
      if (!this.env.BROWSER) {
        throw new Error("BROWSER binding is not available");
      }

      browser = await puppeteer.launch(this.env.BROWSER, {
        keep_alive: 30000,
      });

      page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 800 });

      page.setDefaultNavigationTimeout(30000);

      const response = await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        console.warn(
          `[ScreenshotService] Page load warning for ${url}, status: ${response?.status()}`
        );
        // Continue anyway as we might still get a useful screenshot
      } else {
        console.log(
          `[ScreenshotService] Page loaded successfully, status: ${response.status()}`
        );
      }

      // Wait a bit for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: "png",
        // Remove quality for PNG (only applies to JPEG)
      });

      const fileName = `incident-${incidentId}-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("screenshots")
        .upload(fileName, screenshotBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("screenshots").getPublicUrl(fileName);

      return publicUrl;
    } catch {
      return null;
    } finally {
      // Ensure browser is always closed
      try {
        if (page) {
          console.log(`[ScreenshotService] Closing page...`);
          await page.close();
        }
        if (browser) {
          console.log(`[ScreenshotService] Closing browser...`);
          await browser.close();
        }
      } catch (cleanupError) {
        console.error(
          `[ScreenshotService] Error during browser cleanup:`,
          cleanupError
        );
      }
    }
  }
}
