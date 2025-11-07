const fs = require('fs');
const path = require('path');

// Paths
const dataSrc = path.join(__dirname, '../security-web/data');
const dataDest = dataSrc; // Keep JSON in the same folder

// Ensure data folder exists
if (!fs.existsSync(dataDest)) {
  fs.mkdirSync(dataDest, { recursive: true });
  console.log('Created data folder');
}

// Verify JSON files exist
const jsonFiles = ['npm-audit.json', 'trivy-backend.json', 'trivy-client.json', 'codeql-analysis.json'];
jsonFiles.forEach(file => {
  const srcPath = path.join(dataSrc, file);
  if (fs.existsSync(srcPath)) {
    console.log(`✓ Found ${file}`);
  } else {
    console.warn(`${file} not found, will be skipped in dashboard`);
  }
});

// Ensure index.html exists
const indexPath = path.join(__dirname, '../security-web/index.html');
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