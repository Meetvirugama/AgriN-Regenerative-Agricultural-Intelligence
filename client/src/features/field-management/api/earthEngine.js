import ee from '@google/earthengine';

/**
 * Given a GeoJSON geometry, return an ee.Geometry
 */
export const geoJsonToEeGeometry = (geojson) => {
  if (!geojson || !geojson.geometry) return null;
  // Earth Engine expects coordinates in a specific format for Polygon
  return ee.Geometry.Polygon(geojson.geometry.coordinates);
};

/**
 * Fetch Sentinel-2 Surface Reflectance (Harmonized) for a given geometry
 * Returns an ee.Image with the least cloud cover over the last 30 days
 */
export const getSentinel2Image = (eeGeometry) => {
  const endDate = ee.Date(Date.now());
  const startDate = endDate.advance(-30, 'day');

  const collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(eeGeometry)
    .filterDate(startDate, endDate)
    // Filter for images with less than 20% cloud cover
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

  // Sort by least cloud cover and get the first one
  const image = collection.sort('CLOUDY_PIXEL_PERCENTAGE').first();
  return image.clip(eeGeometry);
};

/**
 * Get map ID for True Color visualization (B4, B3, B2)
 */
export const getTrueColorMapId = async (eeImage) => {
  return new Promise((resolve, reject) => {
    const visParams = {
      bands: ['B4', 'B3', 'B2'],
      min: 0,
      max: 3000,
      gamma: 1.4,
    };
    eeImage.getMap(visParams, (mapId, err) => {
      if (err) {
        reject(err);
      } else {
        resolve(mapId.urlFormat);
      }
    });
  });
};

/**
 * Get map ID for NDVI visualization (Normalized Difference Vegetation Index)
 */
export const getNdviMapId = async (eeImage) => {
  return new Promise((resolve, reject) => {
    const ndvi = eeImage.normalizedDifference(['B8', 'B4']).rename('NDVI');
    const visParams = {
      min: -0.2,
      max: 0.8,
      palette: ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850']
    };
    ndvi.getMap(visParams, (mapId, err) => {
      if (err) {
        reject(err);
      } else {
        resolve(mapId.urlFormat);
      }
    });
  });
};
