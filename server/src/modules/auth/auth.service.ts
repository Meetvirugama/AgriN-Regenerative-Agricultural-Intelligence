import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { authRepo } from '../../db/repositories/authRepository';
import { farmerRepo } from '../../db/repositories/farmerRepository';
import { Farmer } from '../../models/Database';

const JWT_SECRET = process.env.JWT_SECRET ?? 'insecure-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

if (!process.env.JWT_SECRET) {
  console.warn('[Auth] WARNING: JWT_SECRET is not set. Using insecure dev default.');
}

export interface JwtPayload {
  sub: string;        // farmer UUID
  phone: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;   // seconds
  farmer: Pick<Farmer, 'id' | 'name' | 'phone_number' | 'preferred_language'>;
}

export class AuthService {
  // ─── OTP ─────────────────────────────────────────────────────────────────

  /**
   * Generates a 6-digit OTP and stores it in the database.
   * In production, sends via SMS (Twilio, AWS SNS, etc.).
   * In development, logs it to the console.
   */
  static async requestOtp(phoneNumber: string): Promise<void> {
    const code = crypto.randomInt(100_000, 999_999).toString();

    await authRepo.createOtp(phoneNumber, code);
    await authRepo.logEvent('otp_requested', { phoneNumber });

    if (process.env.NODE_ENV === 'production') {
      // TODO Phase 5: integrate Twilio / AWS SNS
      // await smsService.send(phoneNumber, `Your AgriMesh code is: ${code}. Valid for 10 minutes.`);
      console.log(`[Auth] OTP for ${phoneNumber}: [SMS would be sent in production]`);
    } else {
      // Development — log plaintext so developers can test without SMS
      console.log(`[Auth] DEV OTP for ${phoneNumber}: ${code}`);
    }
  }

  /**
   * Verifies the OTP, upserts the farmer record (auto-registration),
   * and returns a signed access token + refresh token pair.
   */
  static async verifyOtpAndLogin(
    phoneNumber: string,
    code: string,
    meta: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthTokens> {
    // Validate OTP (throws on failure)
    await authRepo.verifyOtp(phoneNumber, code);

    // Upsert farmer — this creates the account on first login
    const farmer = await farmerRepo.upsertFarmer({
      id: crypto.randomUUID(),   // ignored if farmer already exists (upsert by phone)
      phone_number: phoneNumber,
      name: phoneNumber,          // Farmer can set their name later (Phase 5 profile endpoint)
      preferred_language: 'en',
    });

    // Issue tokens
    const tokens = await AuthService.issueTokens(farmer, meta);

    await authRepo.logEvent('otp_verified', {
      farmerId: farmer.id,
      phoneNumber,
      ...meta,
    });

    return tokens;
  }

  // ─── JWT ─────────────────────────────────────────────────────────────────

  static signAccessToken(farmer: Pick<Farmer, 'id' | 'name' | 'phone_number'>): string {
    const payload: JwtPayload = {
      sub: farmer.id,
      phone: farmer.phone_number,
      name: farmer.name,
    };
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }

  static async issueTokens(
    farmer: Farmer,
    meta: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthTokens> {
    const accessToken = AuthService.signAccessToken(farmer);

    // Refresh token is a cryptographically random 256-bit hex string
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await authRepo.saveRefreshToken(farmer.id, refreshToken, 30, meta);

    await authRepo.logEvent('token_issued', { farmerId: farmer.id, ...meta });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      farmer: {
        id: farmer.id,
        name: farmer.name,
        phone_number: farmer.phone_number,
        preferred_language: farmer.preferred_language,
      },
    };
  }

  static async refreshAccessToken(rawRefreshToken: string): Promise<AuthTokens> {
    const result = await authRepo.validateRefreshToken(rawRefreshToken);
    if (!result) throw new Error('Refresh token invalid or expired. Please log in again.');

    const farmer = await farmerRepo.findFarmerById(result.farmerId);
    if (!farmer) throw new Error('Farmer account not found.');

    // Rotate refresh token — revoke old, issue new
    await authRepo.revokeRefreshToken(rawRefreshToken);
    const tokens = await AuthService.issueTokens(farmer);

    await authRepo.logEvent('token_refreshed', { farmerId: farmer.id });
    return tokens;
  }

  static async logout(farmerId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      await authRepo.revokeRefreshToken(rawRefreshToken);
    } else {
      // If no specific token provided, revoke ALL sessions for the farmer
      await authRepo.revokeAllFarmerTokens(farmerId);
    }
    await authRepo.logEvent('logout', { farmerId });
  }
}
