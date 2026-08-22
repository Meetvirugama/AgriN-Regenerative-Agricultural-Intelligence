import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authRepo } from "../../db/repositories/authRepository.js";
import { farmerRepo } from "../../db/repositories/farmerRepository.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "insecure-dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    // Fail hard — a missing JWT_SECRET in production is a critical security misconfiguration
    throw new Error(
      "[Auth] FATAL: JWT_SECRET is not set in production. " +
      "Set it via environment variable (generate: openssl rand -hex 64)."
    );
  } else {
    console.warn(
      "[Auth] WARNING: JWT_SECRET is not set. Using insecure dev default. " +
      "This will throw in production."
    );
  }
}

export class AuthService {
  // ─── OTP ─────────────────────────────────────────────────────────────────

  /**
   * Generates a 6-digit OTP and stores it in the database.
   * In production, sends via SMS (Twilio, AWS SNS, etc.).
   * In development, logs it to the console.
   */
  static async requestOtp(phoneNumber) {
    const code = crypto.randomInt(100_000, 999_999).toString();

    await authRepo.createOtp(phoneNumber, code);
    await authRepo.logEvent("otp_requested", { phoneNumber });

    if (process.env.NODE_ENV === "production") {
      // TODO Phase 5: integrate Twilio / AWS SNS
      // await smsService.send(phoneNumber, `Your AgriMesh code is: ${code}. Valid for 10 minutes.`);
      console.log(
        `[Auth] OTP for ${phoneNumber}: [SMS would be sent in production]`,
      );
    } else {
      // Development — log plaintext so developers can test without SMS
      console.log(`[Auth] DEV OTP for ${phoneNumber}: ${code}`);
    }
  }

  /**
   * Verifies the OTP, upserts the farmer record (auto-registration),
   * and returns a signed access token + refresh token pair.
   */
  static async verifyOtpAndLogin(phoneNumber, code, meta = {}) {
    // Validate OTP (throws on failure)
    await authRepo.verifyOtp(phoneNumber, code);

    const existing = await farmerRepo.findFarmerByPhone(phoneNumber);
    const farmerId = existing?.id || crypto.randomUUID();

    // Upsert farmer — this creates the account on first login
    const farmer = await farmerRepo.upsertFarmer({
      id: farmerId,
      phone_number: phoneNumber,
      name: existing?.name || phoneNumber,
      preferred_language: existing?.preferred_language || "en",
    });

    // Issue tokens
    const tokens = await AuthService.issueTokens(farmer, meta);

    await authRepo.logEvent("otp_verified", {
      farmerId: farmer.id,
      phoneNumber,
      ...meta,
    });

    return tokens;
  }

  // ─── Email / Password ────────────────────────────────────────────────────

  static async loginWithPassword(email, password, meta = {}) {
    const farmer = await farmerRepo.findFarmerByEmail(email);
    if (!farmer) {
      throw new Error("Invalid email or password");
    }

    if (!farmer.password_hash) {
      throw new Error("Account does not have a password set. Please use OTP.");
    }

    const isValid = await bcrypt.compare(password, farmer.password_hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Issue tokens
    const tokens = await AuthService.issueTokens(farmer, meta);

    // Using otp_verified as a generic login success event for now
    await authRepo.logEvent("otp_verified", {
      farmerId: farmer.id,
      email,
      loginMethod: "password",
      ...meta,
    });

    return tokens;
  }


  // ─── Google OAuth ────────────────────────────────────────────────────────

  static async loginWithGoogle(accessToken, meta = {}) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      throw new Error("Invalid Google access token");
    }
    const userInfo = await response.json();
    
    // Generate deterministic UUID from Google sub
    const hash = crypto.createHash('md5').update(userInfo.sub).digest('hex');
    const deterministicUuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16),
      '8' + hash.substring(17, 20),
      hash.substring(20, 32)
    ].join('-');

    let existingFarmer = userInfo.email ? await farmerRepo.findFarmerByEmail(userInfo.email) : null;
    if (!existingFarmer) {
      existingFarmer = await farmerRepo.findFarmerById(deterministicUuid);
    }
    const isNewUser = !existingFarmer || (!existingFarmer.location && !existingFarmer.farming_experience_years);
    const farmerId = existingFarmer?.id || deterministicUuid;

    const farmer = await farmerRepo.upsertFarmer({
      id: farmerId,
      email: userInfo.email,
      phone_number: existingFarmer?.phone_number || null,
      name: existingFarmer?.name || userInfo.name || "Google User",
      profile_image_url: existingFarmer?.profile_image_url || userInfo.picture || null,
      preferred_language: existingFarmer?.preferred_language || "en",
    });

    const tokens = await AuthService.issueTokens(farmer, meta);
    tokens.is_new_user = isNewUser;
    tokens.farmer.is_new_user = isNewUser;
    
    await authRepo.logEvent("otp_verified", {
      farmerId: farmer.id,
      email: userInfo.email,
      loginMethod: "google",
      ...meta,
    });
    
    return tokens;
  }

  // ─── JWT ─────────────────────────────────────────────────────────────────

  static signAccessToken(farmer) {
    const payload = {
      sub: farmer.id,
      phone: farmer.phone_number || farmer.email || farmer.id,
      name: farmer.name,
      email: farmer.email,
    };
    const options = { expiresIn: JWT_EXPIRES_IN };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  static async issueTokens(farmer, meta = {}) {
    const accessToken = AuthService.signAccessToken(farmer);

    // Refresh token is a cryptographically random 256-bit hex string
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await authRepo.saveRefreshToken(farmer.id, refreshToken, 30, meta);

    await authRepo.logEvent("token_issued", { farmerId: farmer.id, ...meta });

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

  static async refreshAccessToken(rawRefreshToken) {
    const result = await authRepo.validateRefreshToken(rawRefreshToken);
    if (!result)
      throw new Error("Refresh token invalid or expired. Please log in again.");

    const farmer = await farmerRepo.findFarmerById(result.farmerId);
    if (!farmer) throw new Error("Farmer account not found.");

    // Rotate refresh token — revoke old, issue new
    await authRepo.revokeRefreshToken(rawRefreshToken);
    const tokens = await AuthService.issueTokens(farmer);

    await authRepo.logEvent("token_refreshed", { farmerId: farmer.id });
    return tokens;
  }

  static async logout(farmerId, rawRefreshToken) {
    if (rawRefreshToken) {
      await authRepo.revokeRefreshToken(rawRefreshToken);
    } else {
      // If no specific token provided, revoke ALL sessions for the farmer
      await authRepo.revokeAllFarmerTokens(farmerId);
    }
    await authRepo.logEvent("logout", { farmerId });
  }
}
