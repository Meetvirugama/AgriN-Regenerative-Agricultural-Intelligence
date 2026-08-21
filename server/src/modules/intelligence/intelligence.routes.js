import { Router } from "express";
import { intelligenceService } from "./intelligence.service.js";

const router = Router();

/**
 * GET /api/v1/intelligence
 *
 * Returns real, field-grounded intelligence for the
 * authenticated farmer.
 *
 * Important:
 * - No simulated data
 * - No fake health scores
 * - No hardcoded weather
 * - AI receives actual available context
 */
router.get("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub;
    
    if (!farmerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }
    
    const intelligence = await intelligenceService.getFarmerIntelligence(
      farmerId
    );
    
    return res.status(200).json(intelligence);
  } catch (error) {
    console.error("[Intelligence] Request failed:", error);
    next(error);
  }
});

export default router;
