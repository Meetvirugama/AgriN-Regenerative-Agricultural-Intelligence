import { db, SoilProfile, RegionalSoilBaseline } from '../models/Database';
import { layer1Service } from './Layer1Service';
import { v4 as uuidv4 } from 'uuid';
import { DocumentParser, ParsedSoilData } from './soil/DocumentParser';

class Layer4Service {
  
  public getActiveSoilProfile(fieldId: string): SoilProfile | null {
    const profiles = db.soilProfiles.get(fieldId);
    if (profiles && profiles.length > 0) {
      // Return the most recent lab report
      return profiles[profiles.length - 1];
    }
    
    // Fallback to Regional Inference
    const field = layer1Service.getField(fieldId);
    if (!field) return null;
    
    // For MVP, we assume the field is in the "US-MW" region if not specified, 
    // but typically we'd look up the region based on coordinates.
    const regionId = "US-MW"; 
    const baseline = db.regionalSoilBaselines.get(regionId);
    
    if (baseline) {
      return this.mapBaselineToProfile(fieldId, baseline);
    }
    
    return null;
  }

  public async parseLabReport(fieldId: string, fileBuffer: Buffer): Promise<ParsedSoilData> {
    return await DocumentParser.parseSoilReport(fileBuffer);
  }

  public saveSoilProfile(fieldId: string, data: Partial<SoilProfile>): SoilProfile {
    const newProfile: SoilProfile = {
      id: uuidv4(),
      field_id: fieldId,
      source: 'lab_report', // Hardcode since it's saved from the UI review screen
      texture: data.texture as any,
      organic_matter_pct: data.organic_matter_pct || 0,
      nitrogen_level: data.nitrogen_level as any,
      phosphorus_level: data.phosphorus_level as any,
      potassium_level: data.potassium_level as any,
      water_holding_capacity: data.water_holding_capacity as any,
      ph: data.ph || 7.0,
      report_date: data.report_date || new Date().toISOString().split('T')[0],
      raw_document_url: null, // Would be a cloud storage URL
      summary_text: null, // Layer 09 will populate this
    };

    const existing = db.soilProfiles.get(fieldId) || [];
    existing.push(newProfile);
    db.soilProfiles.set(fieldId, existing);

    return newProfile;
  }

  private mapBaselineToProfile(fieldId: string, baseline: RegionalSoilBaseline): SoilProfile {
    return {
      id: `regional_${baseline.region_id}`,
      field_id: fieldId,
      source: 'regional_inference', // STRICT BADGING
      texture: baseline.texture,
      organic_matter_pct: baseline.avg_organic_matter,
      nitrogen_level: baseline.avg_npk.n,
      phosphorus_level: baseline.avg_npk.p,
      potassium_level: baseline.avg_npk.k,
      water_holding_capacity: baseline.water_holding_capacity,
      ph: baseline.avg_ph,
      report_date: new Date().toISOString().split('T')[0],
      raw_document_url: null,
      summary_text: null, 
    };
  }
}

export const layer4Service = new Layer4Service();
