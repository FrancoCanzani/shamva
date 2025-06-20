/* eslint "@typescript-eslint/no-explicit-any": "off" */

const MAX_BODY_SIZE_BYTES = 10000;

export default async function handleBodyParsing(
  response: Response
): Promise<any> {
  let bodyContent: any = null;
  const contentType = response.headers.get("content-type") ?? "";

  try {
    const textContent = await response.text();
    const truncatedContent = textContent.slice(0, MAX_BODY_SIZE_BYTES);

    if (
      contentType.includes("application/json") &&
      truncatedContent.length > 0
    ) {
      try {
        bodyContent = JSON.parse(truncatedContent);
        if (typeof bodyContent === "object" && bodyContent !== null) {
          bodyContent._truncated = true;
        } else {
          bodyContent = {
            _rawContent: truncatedContent,
            _truncated: true,
            _parseError: "Truncated content might be invalid JSON",
          };
        }
      } catch (jsonError) {
        bodyContent = {
          _rawContent: truncatedContent,
          _parseError: String(jsonError),
        };
      }
    } else {
      bodyContent = { _rawContent: truncatedContent };
    }
  } catch (bodyReadError) {
    bodyContent = { _readError: String(bodyReadError) };
  }
  return bodyContent;
}
