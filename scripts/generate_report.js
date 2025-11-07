const fs = require('fs');
const path = require('path');

const dataSrc = path.join(__dirname, '../security-web/data');
const dataDest = path.join(__dirname, '../security-web/data');

// Ensure data folder exists
if (!fs.existsSync(dataDest)) fs.mkdirSync(dataDest, { recursive: true });

// Copy JSON files
['npm-audit.json','docker-backend.json','docker-client.json','codeql-analysis.json'].forEach(file => {
  const srcPath = path.join(dataSrc, file);
  const destPath = path.join(dataDest, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to data folder`);
  } else {
    console.warn(`${file} not found, skipping`);
  }
});

// Optionally, generate a placeholder index.html if it doesn't exist
const indexPath = path.join(__dirname, '../security-web/index.html');
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
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
  console.log('Generated placeholder index.html');
}
