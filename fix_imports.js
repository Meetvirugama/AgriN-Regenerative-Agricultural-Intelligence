const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const importMap = {
  // src/index.ts fixes
  "'./routes/cropRoutes'": "'./modules/crop/crop.routes'",
  "'./routes/weatherRoutes'": "'./modules/weather/weather.routes'",
  "'./routes/soilRoutes'": "'./modules/soil/soil.routes'",
  "'./routes/diagnosisRoutes'": "'./modules/disease/disease.routes'",
  "'./routes/regenRoutes'": "'./modules/regen/regen.routes'",
  "'./routes/climateRisk'": "'./modules/climate-risk/climate-risk.routes'",
  "'./routes/advisory'": "'./modules/advisory/advisory.routes'",
  "'./routes/voice'": "'./modules/voice/voice.routes'",
  "'./routes/feedback'": "'./modules/feedback/feedback.routes'",
  "'./satellite/satellite.routes'": "'./modules/satellite/satellite.routes'",
  "'./health-score/health-score.routes'": "'./modules/health-score/health-score.routes'",
  "'./escalation/escalation.routes'": "'./modules/escalation/escalation.routes'",
  "'./cross-border/crossBorder.routes'": "'./modules/cross-border/crossBorder.routes'",

  // services to domain services (from routes)
  "'../services/Layer1Service'": "'../field/field.service'",
  "'../services/Layer2Service'": "'../crop/crop.service'",
  "'../services/Layer3Service'": "'../weather/weather.service'",
  "'../services/Layer4Service'": "'../soil/soil.service'",
  "'../services/Layer6Service'": "'../health-score/health-score.service'",
  "'../services/Layer7Service'": "'../disease/disease.service'",
  "'../services/Layer10Service'": "'../regen/regen.service'",
  
  // same-dir LayerService references
  "'./Layer1Service'": "'../field/field.service'",
  "'./Layer2Service'": "'../crop/crop.service'",
  "'./Layer3Service'": "'../weather/weather.service'",
  "'./Layer4Service'": "'../soil/soil.service'",
  "'./Layer6Service'": "'../health-score/health-score.service'",

  // Models fixes (from inside modules/xxx/ -> ../../models)
  "'../models/Database'": "'../../models/Database'",
  "'../models/Feedback'": "'../../models/Feedback'",
  
  // Sub-folder fixes inside modules (e.g. weather/weather.service.ts -> weather/WeatherProvider)
  "'./weather/WeatherProvider'": "'./WeatherProvider'",
  "'./weather/WeatherRuleEngine'": "'./WeatherRuleEngine'",
  "'./soil/DocumentParser'": "'./DocumentParser'",
  "'./disease/DiseaseDiagnosticAI'": "'./DiseaseDiagnosticAI'",
  "'./regen/RegenAI'": "'./RegenAI'",

  // adapters
  "'../adapters/voice/VoiceAdapter'": "'./VoiceAdapter'"
};

walkDir('./server/src', function(filePath) {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Manual replacement for jobs (which is in src/jobs/)
  if (filePath.includes('jobs/ingestWeather.ts')) {
    newContent = newContent.replace("'../services/Layer3Service'", "'../modules/weather/weather.service'");
  }
  else if (filePath.includes('jobs/recomputeStages.ts')) {
    newContent = newContent.replace("'../services/Layer2Service'", "'../modules/crop/crop.service'");
  }
  else {
    for (const [oldImport, newImport] of Object.entries(importMap)) {
      newContent = newContent.split(oldImport).join(newImport);
    }
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
});
