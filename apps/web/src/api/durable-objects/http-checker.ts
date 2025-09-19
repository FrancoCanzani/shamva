import { DurableObject } from "cloudflare:workers";
import { ZodError } from "zod";
import type { EnvBindings } from "../../../bindings";
import { MonitorCheckService } from "../lib/checker/service";
import { logger } from "../lib/logger";
import { MonitorConfigSchema } from "../lib/schemas";
import { MonitorConfig } from "../lib/types";

export class HttpCheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private checkService: MonitorCheckService;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.checkService = new MonitorCheckService();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/check") {
      try {
        const rawConfig = await request.json();

        let config: MonitorConfig;
        try {
          config = MonitorConfigSchema.parse(rawConfig);
        } catch (error) {
          if (error instanceof ZodError) {
            logger.error(
              {
                err: error,
                rawConfig,
                validationErrors: error.issues,
              },
              "HTTP checker received invalid config"
            );
            return new Response(
              JSON.stringify({
                success: false,
                error: "Invalid configuration",
                details: error.issues
                  .map((e) => `${e.path.join(".")}: ${e.message}`)
                  .join(", "),
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          throw error;
        }

        const result = await this.checkService.performHttpCheck(
          config.urlToCheck,
          config.method,
          config.headers,
          config.body,
          config.timeoutThresholdMs
        );

        this.ctx.waitUntil(
          this.checkService.processCheckResult(config, result)
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        return new Response(
          JSON.stringify({
            success: false,
            error: message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
