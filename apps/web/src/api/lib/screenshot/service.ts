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
    try {
      // Take screenshot using Puppeteer
      const browser = await puppeteer.launch(this.env.BROWSER, {
        keep_alive: 30000, // Keep browser alive for 30 seconds
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Set a timeout for the page load
      page.setDefaultNavigationTimeout(30000);

      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle0" });

      // Take the screenshot
      const screenshot = await page.screenshot({ fullPage: true });

      await browser.close();

      // Upload to Supabase Storage
      const supabase = createSupabaseClient(this.env);
      const fileName = `incident-${incidentId}-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("screenshots")
        .upload(fileName, screenshot, {
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

      return publicUrl;
    } catch (error) {
      console.error("Error taking screenshot:", error);
      return null;
    }
  }
}
