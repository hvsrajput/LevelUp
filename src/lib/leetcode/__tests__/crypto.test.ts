import { describe, it, expect } from "vitest";
import { encryptCredential, decryptCredential } from "../crypto";

describe("LeetCode Crypto Utilities (AES-256-GCM)", () => {
  it("encrypts and decrypts a sensitive string successfully", () => {
    const plainText = "session_cookie_12345_secret_token";
    const encrypted = encryptCredential(plainText);

    expect(encrypted).not.toBe(plainText);
    expect(encrypted.split(":")).toHaveLength(3); // iv:tag:data

    const decrypted = decryptCredential(encrypted);
    expect(decrypted).toBe(plainText);
  });

  it("supports custom encryption secrets", () => {
    const plainText = "custom_secret_payload";
    const customKey = "my-ultra-secure-key-32-chars-long!!";

    const encrypted = encryptCredential(plainText, customKey);
    const decrypted = decryptCredential(encrypted, customKey);

    expect(decrypted).toBe(plainText);
  });

  it("handles empty strings gracefully", () => {
    expect(encryptCredential("")).toBe("");
    expect(decryptCredential("")).toBe("");
  });

  it("throws an error when decrypting malformed ciphertext", () => {
    expect(() => decryptCredential("invalid-string")).toThrow(
      "Invalid encrypted format"
    );

    expect(() => decryptCredential("a:b:c:d")).toThrow(
      "Invalid encrypted format"
    );
  });

  it("throws an error when ciphertext has been tampered with", () => {
    const plainText = "tamper-proof-string";
    const encrypted = encryptCredential(plainText);
    const [iv, tag, data] = encrypted.split(":");

    // Flip a character in data
    const tamperedData = data.slice(0, -2) + (data.slice(-2) === "00" ? "ff" : "00");
    const tamperedCipher = `${iv}:${tag}:${tamperedData}`;

    expect(() => decryptCredential(tamperedCipher)).toThrow();
  });
});
