// =============================================================================
// Encryption Utilities (AES-256-GCM) for LeetCode Session Credentials
// =============================================================================

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Derives a 32-byte encryption key from the environment secret
 */
function getKey(secretOverride?: string): Buffer {
  const secret =
    secretOverride ||
    process.env.LEETCODE_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "levelup-default-dev-encryption-key-min-32-chars!";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive credential string using AES-256-GCM
 * Output format: hex(iv):hex(authTag):hex(encryptedData)
 */
export function encryptCredential(
  plainText: string,
  secretOverride?: string
): string {
  if (!plainText) return "";

  const key = getKey(secretOverride);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt cipher string using AES-256-GCM
 */
export function decryptCredential(
  cipherText: string,
  secretOverride?: string
): string {
  if (!cipherText) return "";

  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:tag:data");
  }

  const [ivHex, tagHex, dataHex] = parts;
  const key = getKey(secretOverride);
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");

  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error("Invalid cipher metadata length.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
