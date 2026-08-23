import crypto from "crypto";
import { queryOne, execute } from "../connection.js";

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export class AuthRepository {
  // ─── OTP ───────────────────────────────────────────────────────────────────

  async createOtp(identifier, code) {
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await execute(
      `INSERT INTO otp_codes (identifier, code, expires_at)
       VALUES ($1, $2, $3)`,
      [identifier, code, expiresAt.toISOString()],
    );
  }

  /**
   * Validates an OTP. Returns the OTP row id on success, throws on failure.
   * Side-effects: increments attempt counter, marks as used on success.
   */
  async verifyOtp(identifier, code) {
    const row = await queryOne(
      `SELECT id, attempts, used_at
       FROM otp_codes
       WHERE identifier = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [identifier],
    );

    if (!row)
      throw new Error("OTP expired or not found. Please request a new code.");
    if (row.used_at) throw new Error("This OTP has already been used.");
    if (row.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error(
        "Too many incorrect attempts. Please request a new code.",
      );
    }

    // Look up with actual code match
    const match = await queryOne(
      `SELECT id FROM otp_codes
       WHERE id = $1 AND code = $2`,
      [row.id, code],
    );

    if (!match) {
      // Increment failed attempt counter
      await execute(
        `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
        [row.id],
      );
      throw new Error("Incorrect code. Please try again.");
    }

    // Mark as used
    await execute(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [
      row.id,
    ]);
  }

  // ─── Refresh Tokens ────────────────────────────────────────────────────────

  hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  async saveRefreshToken(farmerId, rawToken, ttlDays = 30, meta = {}) {
    const hash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    await execute(
      `INSERT INTO refresh_tokens (farmer_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5::inet)`,
      [
        farmerId,
        hash,
        expiresAt.toISOString(),
        meta.userAgent ?? null,
        meta.ipAddress ?? null,
      ],
    );
  }

  async validateRefreshToken(rawToken) {
    const hash = this.hashToken(rawToken);
    const row = await queryOne(
      `SELECT farmer_id FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
      [hash],
    );
    if (!row) return null;
    return { farmerId: row.farmer_id };
  }

  async revokeRefreshToken(rawToken) {
    const hash = this.hashToken(rawToken);
    await execute(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [hash],
    );
  }

  async revokeAllFarmerTokens(farmerId) {
    await execute(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE farmer_id = $1 AND revoked_at IS NULL`,
      [farmerId],
    );
  }

  // ─── Audit ─────────────────────────────────────────────────────────────────

  async logEvent(eventType, opts) {
    try {
      await execute(
        `INSERT INTO auth_audit_log (farmer_id, phone_number, event_type, ip_address, user_agent)
         VALUES ($1, $2, $3, $4::inet, $5)`,
        [
          opts.farmerId ?? null,
          opts.phoneNumber ?? opts.email ?? null,
          eventType,
          opts.ipAddress ?? null,
          opts.userAgent ?? null,
        ],
      );
    } catch (err) {
      console.warn(`[AuthAudit] Failed to log event '${eventType}':`, err.message);
    }
  }
}

export const authRepo = new AuthRepository();
