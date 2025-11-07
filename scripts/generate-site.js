const fs = require('fs');
const path = require('path');

// Paths
const webDir = path.join(__dirname, '../security-web');
const dataDir = path.join(webDir, 'data');

// Ensure web/data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data folder at', dataDir);
}

// List of JSON files to include
const jsonFiles = [
  'npm-audit.json',
  'trivy-backend.json',
  'trivy-client.json',
  'codeql-analysis.json'
];

// Verify JSON files exist
jsonFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ Found ${file}`);
  } else {
    console.warn(`⚠ ${file} not found in ${dataDir}, dashboard will skip this file`);
  }
});

// Ensure index.html exists
const indexPath = path.join(webDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="report.css">
</head>
<body>
  <h1>Security Dashboard</h1>
  <div id="content"></div>
  <script src="app.js"></script>
</body>
</html>`);
  console.log('✓ Generated index.html');
} else {
  console.log('✓ index.html already exists');
}

console.log('\n✓ Site generation complete! Data is available at ./security-web/data/');
