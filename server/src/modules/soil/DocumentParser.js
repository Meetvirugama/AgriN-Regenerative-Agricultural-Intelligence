import { PythonClient } from "../../services/pythonClient.js";

/**
 * Delegates the multimodal vision AI call to the Python service.
 */
export class DocumentParser {
  static async parseSoilReport(fileBuffer) {
    console.log("[DocumentParser] Delegating OCR/Vision to Python service...");
    // Assuming image/jpeg for the mock, but in production this would be passed down
    const result = await PythonClient.parseSoilReport(fileBuffer, "image/jpeg");
    return result;
  }
}
