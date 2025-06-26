import { Resend } from "resend";
import { EnvBindings } from "../../../../bindings";

export function createResendClient(env: EnvBindings) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(env.RESEND_API_KEY);
}
