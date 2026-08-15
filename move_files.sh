#!/bin/bash
cd server/src

# Move Services
mv services/Layer1Service.ts modules/field/field.service.ts
mv services/Layer2Service.ts modules/crop/crop.service.ts
mv services/Layer3Service.ts modules/weather/weather.service.ts
mv services/Layer4Service.ts modules/soil/soil.service.ts
mv services/Layer6Service.ts modules/health-score/health-score.service.ts
mv services/Layer7Service.ts modules/disease/disease.service.ts
mv services/Layer10Service.ts modules/regen/regen.service.ts

# Move Routes
mv routes/cropRoutes.ts modules/crop/crop.routes.ts
mv routes/weatherRoutes.ts modules/weather/weather.routes.ts
mv routes/soilRoutes.ts modules/soil/soil.routes.ts
mv routes/diagnosisRoutes.ts modules/disease/disease.routes.ts
mv routes/regenRoutes.ts modules/regen/regen.routes.ts
mv routes/climateRisk.ts modules/climate-risk/climate-risk.routes.ts
mv routes/advisory.ts modules/advisory/advisory.routes.ts
mv routes/voice.ts modules/voice/voice.routes.ts
mv routes/feedback.ts modules/feedback/feedback.routes.ts

# Move Domains
mv satellite/* modules/satellite/
mv escalation/* modules/escalation/
mv cross-border/* modules/cross-border/
mv health-score/* modules/health-score/

# Move Service sub-folders
mv services/disease/* modules/disease/
mv services/regen/* modules/regen/
mv services/soil/* modules/soil/
mv services/weather/* modules/weather/

# Move Voice adapter
mv adapters/voice/* modules/voice/

# Clean up empty dirs
rm -rf services/disease services/regen services/soil services/weather
rm -rf services routes satellite escalation cross-border health-score adapters
