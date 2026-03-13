import { Secret, TOTP } from "otpauth";

export const TOTP_CONFIG = {
  issuer: "Claim Sage",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
} as const;

export function createTOTP(secret: string | Secret, accountName: string = "") {
  return new TOTP({
    ...TOTP_CONFIG,
    secret,
    label: accountName,
  });
}
