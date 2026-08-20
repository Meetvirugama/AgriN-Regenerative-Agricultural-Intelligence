import { PythonClient } from "../../services/pythonClient.js";

/**
 * Delegates the multimodal vision AI call to the Python service.
 * Forwards the real MIME type from the uploaded file so Gemini Vision
 * receives the correct content-type (PDF, PNG, JPG, etc.).
 */
export class DocumentParser {
  static async parseSoilReport(fileBuffer, mimeType = "image/jpeg") {
    const result = await PythonClient.parseSoilReport(fileBuffer, mimeType);
    return result;
  }
}
