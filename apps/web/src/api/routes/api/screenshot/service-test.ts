import { Hono } from "hono";
import type { EnvBindings } from "../../../../../bindings";
import { ScreenshotService } from "../../../lib/screenshot/service";

const serviceTest = new Hono<{ Bindings: EnvBindings }>().get(
  "/",
  async (c) => {
    const startTime = Date.now();

    try {
      // Get URL from query params, default to example.com
      const url = c.req.query("url") || "https://example.com";

      console.log(
        `[Service-Test] Starting screenshot service test for URL: ${url}`
      );

      // Create a test incident ID
      const testIncidentId = `test-${Date.now()}`;

      // Create screenshot service instance
      const screenshotService = new ScreenshotService(c.env);

      // Test the screenshot service
      const screenshotUrl = await screenshotService.takeAndStoreScreenshot(
        url,
        testIncidentId
      );

      const duration = Date.now() - startTime;

      if (screenshotUrl) {
        console.log(
          `[Service-Test] Screenshot service test completed successfully in ${duration}ms`
        );
        return c.json({
          success: true,
          screenshotUrl,
          testIncidentId,
          duration,
          originalUrl: url,
          message: "Screenshot service test completed successfully",
        });
      } else {
        console.log(
          `[Service-Test] Screenshot service test failed in ${duration}ms`
        );
        return c.json({
          success: false,
          screenshotUrl: null,
          testIncidentId,
          duration,
          originalUrl: url,
          message: "Screenshot service returned null - check logs for details",
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[Service-Test] Screenshot service test error after ${duration}ms:`,
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          url: c.req.query("url") || "https://example.com",
        }
      );

      return c.json(
        {
          success: false,
          error: "Screenshot service test failed",
          message: error instanceof Error ? error.message : "Unknown error",
          duration,
          originalUrl: c.req.query("url") || "https://example.com",
        },
        500
      );
    }
  }
);

export default serviceTest;
