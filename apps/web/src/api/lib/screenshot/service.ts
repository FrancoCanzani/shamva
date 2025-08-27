import puppeteer from "@cloudflare/puppeteer";
import type { Browser, Page } from "@cloudflare/puppeteer";
import { EnvBindings } from "../../../../bindings";
import { supabase } from "../supabase/client";

export class ScreenshotService {
  private env: EnvBindings;
  private readonly maxRetries = 2;
  private readonly screenshotTimeout = 45000;
  private readonly navigationTimeout = 30000;

  constructor(env: EnvBindings) {
    this.env = env;
  }

  async takeAndStoreScreenshot(
    url: string,
    incidentId: string
  ): Promise<string | null> {
    let browser = null;
    let page = null;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        if (!this.env.BROWSER) {
          console.error("[ScreenshotService] BROWSER binding is not available");
          throw new Error("Browser service unavailable");
        }

        console.log(
          `[ScreenshotService] Attempt ${retryCount + 1}/${this.maxRetries + 1} for ${url}`
        );

        browser = await puppeteer.launch(this.env.BROWSER, {
          keep_alive: 30000,
        });

        page = await browser.newPage();

        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        );

        await page.setViewport({ width: 1280, height: 800 });
        page.setDefaultNavigationTimeout(this.navigationTimeout);
        const screenshotBuffer = await Promise.race([
          this.performScreenshot(page, url),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Screenshot timeout")),
              this.screenshotTimeout
            )
          ),
        ]);

        const fileName = `incident-${incidentId}-${Date.now()}.png`;

        console.log(
          `[ScreenshotService] Uploading screenshot for incident ${incidentId}`
        );
        const { error } = await supabase.storage
          .from("screenshots")
          .upload(fileName, screenshotBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (error) {
          console.error(`[ScreenshotService] Storage upload failed:`, error);
          throw new Error(`Storage upload failed: ${error.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("screenshots").getPublicUrl(fileName);

        console.log(
          `[ScreenshotService] Screenshot uploaded successfully: ${publicUrl}`
        );
        return publicUrl;
      } catch (error) {
        retryCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `[ScreenshotService] Attempt ${retryCount} failed for ${url}:`,
          {
            error: errorMessage,
            incidentId,
            retryCount,
            maxRetries: this.maxRetries,
          }
        );

        if (retryCount > this.maxRetries) {
          console.error(
            `[ScreenshotService] All ${this.maxRetries + 1} attempts failed for ${url}`
          );
          return null;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
      } finally {
        await this.cleanupBrowser(browser, page);
        browser = null;
        page = null;
      }
    }

    return null;
  }

  private async performScreenshot(page: Page, url: string): Promise<Buffer> {
    const response = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: this.navigationTimeout,
    });

    if (!response) {
      throw new Error("No response received from page");
    }

    const status = response.status();
    console.log(
      `[ScreenshotService] Page response status: ${status} for ${url}`
    );

    if (status >= 400 && status < 500) {
      console.warn(
        `[ScreenshotService] Client error ${status} for ${url}, taking screenshot anyway`
      );
    } else if (status >= 500) {
      throw new Error(`Server error ${status} for ${url}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
      captureBeyondViewport: true,
    });

    if (!screenshotBuffer || screenshotBuffer.length === 0) {
      throw new Error("Screenshot buffer is empty");
    }

    console.log(
      `[ScreenshotService] Screenshot captured: ${screenshotBuffer.length} bytes`
    );
    return screenshotBuffer;
  }

  private async cleanupBrowser(
    browser: Browser | null,
    page: Page | null
  ): Promise<void> {
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
      const errorMessage =
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError);
      console.warn(`[ScreenshotService] Error during cleanup: ${errorMessage}`);
    }
  }
}
