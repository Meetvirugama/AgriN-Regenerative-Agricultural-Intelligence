import { GlobalInsight, CrossBorderResponse } from './crossBorder.types';
import { PythonClient } from '../../services/pythonClient';

export class CrossBorderService {
  static async getGlobalInsights(fieldId: string): Promise<CrossBorderResponse> {
    console.log('[CrossBorderService] Delegating to Python AI for global insights mapping...');
    return await PythonClient.getGlobalInsights(fieldId) as CrossBorderResponse;
  }
}
