export function generateRandomSlug(length: number = 8): string {
  if (length <= 0) {
    return "";
  }

  const characterSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const characterSetLength = characterSet.length;

  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % characterSetLength;
    result += characterSet[randomIndex];
  }

  return result;
}
