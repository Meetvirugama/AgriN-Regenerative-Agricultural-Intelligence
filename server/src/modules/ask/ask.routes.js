import express from "express";
import { askService } from "./ask.service.js";
// We don't have requireAuth in the same path, it's in middleware/auth.js
// Wait, the project uses requireAuth from `../../middleware/auth.js`
import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/context", requireAuth, async (req, res, next) => {
  try {
    const context = await askService.getContext({
      farmerId: req.farmer.sub,
    });
    res.json(context);
  } catch (error) {
    next(error);
  }
});

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const result = await askService.getHistory({
      farmerId: req.farmer.sub,
      limit,
      cursor: req.query.cursor || null,
    });
    // Format appropriately if needed, or just return messages
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/message", requireAuth, async (req, res, next) => {
  try {
    const { message, clientMessageId } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: "Message cannot exceed 2000 characters.",
      });
    }

    const result = await askService.answer({
      farmerId: req.farmer.sub,
      message: message.trim(),
      clientMessageId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/history", requireAuth, async (req, res, next) => {
  try {
    await askService.clearHistory({
      farmerId: req.farmer.sub,
    });
    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
