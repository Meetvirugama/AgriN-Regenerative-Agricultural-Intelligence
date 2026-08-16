import { PythonClient } from "../../services/pythonClient.js";

export class CrossBorderService {
  static async getGlobalInsights(fieldId) {
    console.log(
      "[CrossBorderService] Delegating to Python AI for global insights mapping...",
    );
    return await PythonClient.getGlobalInsights(fieldId);
  }
}
