import crypto from "crypto";
import { getPrivateKeyPem, KALSHI_API_KEY_ID } from "./config";

interface SignatureInput {
  timestamp: string; // unix millis as string
  method: string;    // GET, POST, etc.
  path: string;      // path without query string
  privateKeyPem: string;
}

/**
 * Create a Kalshi RSA-PSS SHA-256 signature.
 * Concatenate: timestamp + HTTP_METHOD + path_without_query
 * Sign using RSA-PSS with SHA-256, then base64-encode.
 */
export function createKalshiSignature({
  timestamp,
  method,
  path,
  privateKeyPem,
}: SignatureInput): string {
  const message = `${timestamp}${method.toUpperCase()}${path}`;
  const signature = crypto.sign("sha256", Buffer.from(message), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return signature.toString("base64");
}

/**
 * Build auth headers for a Kalshi authenticated request.
 */
export function buildAuthHeaders(
  method: string,
  urlPath: string
): Record<string, string> {
  const pem = getPrivateKeyPem();
  if (!pem || !KALSHI_API_KEY_ID) {
    throw new Error("Kalshi credentials not configured");
  }

  const timestamp = Date.now().toString();
  const signature = createKalshiSignature({
    timestamp,
    method,
    path: urlPath,
    privateKeyPem: pem,
  });

  return {
    "KALSHI-ACCESS-KEY": KALSHI_API_KEY_ID,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "Content-Type": "application/json",
  };
}
