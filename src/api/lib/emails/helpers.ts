import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendServiceRecoveryEmail(
  to: string[],
  monitorName: string,
) {
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: to,
    subject: `Your service ${monitorName} has recovered`,
    html: "<strong>It works again!</strong>",
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
}

export async function sendServiceErrorEmail(to: string[], monitorName: string) {
  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: to,
    subject: `Your service ${monitorName} is down`,
    html: "<strong>It works again!</strong>",
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
}
