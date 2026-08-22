#!/bin/bash
# 1. Get Token
echo "Fetching Token..."
TOKEN=$(curl -s -X POST "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "grant_type=client_credentials" \
-d "client_id=sh-32f2c088-268d-4923-acd7-8a6e8c0f62a9" \
-d "client_secret=HFNxdT5qje5THuiOyz4UVIohwbFL799B" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

echo "Token fetched. Requesting Sentinel-2 True Color image..."

# 2. Make Process API Request
curl -s -X POST "https://sh.dataspace.copernicus.eu/api/v1/process" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-H "Accept: image/jpeg" \
-d '{
  "input": {
    "bounds": {
      "properties": {
        "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
      },
      "bbox": [
        12.44693,
        41.870128,
        12.541008,
        41.917096
      ]
    },
    "data": [
      {
        "type": "sentinel-2-l2a",
        "dataFilter": {
          "timeRange": {
            "from": "2024-05-01T00:00:00Z",
            "to": "2024-05-30T23:59:59Z"
          }
        }
      }
    ]
  },
  "output": {
    "width": 512,
    "height": 512,
    "responses": [
      {
        "identifier": "default",
        "format": {
          "type": "image/jpeg"
        }
      }
    ]
  },
  "evalscript": "//VERSION=3\nfunction setup() {\n  return {\n    input: [\"B04\", \"B03\", \"B02\", \"dataMask\"],\n    output: { bands: 3 }\n  };\n}\n\nfunction evaluatePixel(sample) {\n  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];\n}"
}' -o rome_sentinel.jpg

echo "Saved image to rome_sentinel.jpg"
