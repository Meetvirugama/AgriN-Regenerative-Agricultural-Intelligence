export type OnboardingStep =
  | 'WELCOME'
  | 'FARMER_PROFILE'
  | 'LOCATION_PERMISSION'
  | 'FIELD_DISCOVERY'
  | 'BOUNDARY_CONFIRMATION'
  | 'FIELD_DETAILS'
  | 'CROP_DETAILS'
  | 'IRRIGATION_DETAILS'
  | 'REVIEW'
  | 'SUCCESS';

export type FieldDiscoveryState =
  | 'IDLE'
  | 'LOCATING'
  | 'LOCATION_FOUND'
  | 'LOCATION_DENIED'
  | 'LOCATION_ERROR'
  | 'FIELD_DETECTING'
  | 'FIELD_FOUND'
  | 'FIELD_NOT_FOUND'
  | 'MANUAL_DRAWING'
  | 'BOUNDARY_CONFIRMED';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FarmerProfile {
  name: string;
  phone: string;
  language: string;
}

export interface FieldData {
  id?: string;
  name: string;
  areaHa?: number;
  location?: string;
  boundary: LatLng[];
  crop: string;
  variety?: string;
  sowingDate?: string;
  irrigation: string;
}

export interface OnboardingState {
  step: OnboardingStep;
  discoveryState: FieldDiscoveryState;
  farmer: Partial<FarmerProfile>;
  field: Partial<FieldData>;
}
