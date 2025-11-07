const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../security-web/data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const sources = [
  { name: 'npm-audit', path: '../reports/npm-audit.json' },
  { name: 'docker-backend', path: '../trivy-reports/backend/trivy-backend.json' },
  { name: 'docker-client', path: '../trivy-reports/client/trivy-client.json' }
];

// Copy all JSON reports into /security-web/data
sources.forEach(src => {
  if (fs.existsSync(path.join(__dirname, src.path))) {
    const content = fs.readFileSync(path.join(__dirname, src.path), 'utf8');
    fs.writeFileSync(path.join(outputDir, src.name + '.json'), content);
    console.log(`Copied ${src.name}`);
  }
});
