import { Context } from "hono";

export default async function postCheck(c: Context) {
  const urlToCheck = c.req.query("url");

  if (!urlToCheck) {
    return c.json({ error: "Provide a url to check" }, 400);
  }

  try {
    const start = performance.now();
    const response = await fetch(urlToCheck, {
      redirect: "manual",
      headers: { "User-Agent": "Shamva-Checker/1.0" },
    });
    const latency = performance.now() - start;

    const status_code = response.status;
    const statusText = response.statusText;
    const ok = response.ok;
    const headers = Object.fromEntries(response.headers.entries());

    let bodyContent = null;

    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        bodyContent = await response.json();
      } else {
        bodyContent = await response.text();
      }
    } catch (bodyError) {
      console.error("Error reading response body:", bodyError);
      bodyContent = null;
    }

    const logData = {
      url: urlToCheck,
      status_code,
      ok,
      latency,
    };

    const responseData = {
      status_code: status_code,
      statusText: statusText,
      ok: ok,
      headers: headers,
      body: bodyContent,
    };

    return c.json({ data: logData, responseDetails: responseData });
  } catch (error) {
    console.error("Error checking URL:", error);
  }
}
