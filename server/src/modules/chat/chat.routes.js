import { Router } from "express";

const router = Router();

// Endpoint to handle AI chat
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Mock AI delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple mock logic for different queries
    let reply = "";
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes("aphid") || lowerMsg.includes("moong")) {
      reply = "For aphids in moong, applying Neem oil (10,000 ppm) at 3ml/liter is highly effective. If the infestation is severe, consider Imidacloprid 17.8 SL at 0.5 ml/liter. Ensure you spray during the evening to avoid harming beneficial insects.";
    } else if (lowerMsg.includes("wheat") || lowerMsg.includes("irrigate")) {
      reply = "Wheat typically needs irrigation at the CRI (Crown Root Initiation) stage, which is 20-25 days after sowing. Since your soil moisture is low, an immediate light irrigation is recommended.";
    } else if (lowerMsg.includes("fertilizer") || lowerMsg.includes("rice")) {
      reply = "For nitrogen deficiency in rice, a split application of Urea is best. Apply 1/3 at basal, 1/3 at maximum tillering, and 1/3 at panicle initiation. Make sure your field has a thin layer of standing water.";
    } else {
      reply = "That's an excellent question. Based on regional data and typical agronomic practices, ensuring proper soil health and timely intervention is key. Could you provide a bit more detail or a photo of the affected area?";
    }

    res.json({
      id: `msg-${Date.now()}`,
      role: "ai",
      content: reply,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch recent conversations
router.get("/recent", async (req, res) => {
  res.json([
    { id: "conv-1", title: "How to improve wheat yield?", snippet: "AI: To improve wheat yield, ensure...", time: "2h ago" },
    { id: "conv-2", title: "Rice yellow leaf problem", snippet: "AI: Yellow leaves in rice can be...", time: "1d ago" },
    { id: "conv-3", title: "Best time to sow moong?", snippet: "AI: Moong is best sown between...", time: "2d ago" }
  ]);
});

export default router;
