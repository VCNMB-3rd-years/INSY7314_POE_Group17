let allData = {};

// Tab switching
function switchTab(section, index, event) {
  // Hide all tab contents
  document.querySelectorAll(`#${section}-tab-0, #${section}-tab-1, #${section}-tab-2`).forEach((content, i) => {
    content.classList.remove('active');
    if (i === index) content.classList.add('active');
  });

  // Toggle active tab class
  event.currentTarget.parentElement.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.remove('active');
    if (i === index) tab.classList.add('active');
  });
}

// Fetch JSON from data folder
async function fetchJSON(file) {
  try {
    const res = await fetch(`data/${file}`);
    if (!res.ok) throw new Error(`Failed to fetch ${file}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${file}:`, err);
    return null;
  }
}

// Chart helpers
function createSeverityChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  // Filter out UNKNOWN
  const filteredData = {};
  Object.keys(data).forEach(k => { if (k !== 'UNKNOWN') filteredData[k] = data[k]; });

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(filteredData),
      datasets: [{
        label: label,
        data: Object.values(filteredData),
        backgroundColor: [
          'rgba(229, 62, 62, 0.8)',
          'rgba(221, 107, 32, 0.8)',
          'rgba(214, 158, 46, 0.8)',
          'rgba(56, 161, 105, 0.8)',
          'rgba(160, 174, 192, 0.8)'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed} vulnerabilities`
          }
        }
      }
    }
  });
}

function createBarChart(canvasId, labels, data, label, bgColor, borderColor) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });
}

function createLineChart(canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Data processing
function processNPMAudit(data) {
  if (!data || !data.vulnerabilities) return null;
  
  const vulns = Object.values(data.vulnerabilities);
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  const packageCounts = {};
  const typeCount = {};
  
  vulns.forEach(v => {
    const severity = (v.severity || 'UNKNOWN').toUpperCase();
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;

    if (v.via && Array.isArray(v.via)) {
      v.via.forEach(via => {
        if (typeof via === 'object' && via.title) {
          typeCount[via.title] = (typeCount[via.title] || 0) + 1;
        }
      });
    }

    const pkg = v.name || 'Unknown';
    packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
  });

  return { severityCounts, packageCounts, typeCount, vulnerabilities: vulns };
}

function processTrivyReport(data) {
  if (!data || !data.Results) return null;

  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  const packageCounts = {};
  const allVulns = [];

  data.Results.forEach(result => {
    if (result.Vulnerabilities) {
      result.Vulnerabilities.forEach(v => {
        const severity = (v.Severity || 'UNKNOWN').toUpperCase();
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;

        const pkg = v.PkgName || 'Unknown';
        packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;

        allVulns.push({
          id: v.VulnerabilityID,
          severity: severity,
          package: v.PkgName,
          version: v.InstalledVersion,
          fixed: v.FixedVersion,
          title: v.Title,
          description: v.Description
        });
      });
    }
  });

  return { severityCounts, packageCounts, vulnerabilities: allVulns };
}

// Render lists and recommendations
function renderVulnerabilityList(containerId, vulnerabilities, limit = 20) {
  const container = document.getElementById(containerId);
  if (!vulnerabilities || vulnerabilities.length === 0) {
    container.innerHTML = '<p style="color: #48bb78; padding: 20px;">✓ No vulnerabilities detected</p>';
    return;
  }

  const sorted = vulnerabilities.slice(0, limit);
  let html = '<div class="vulnerability-list">';
  sorted.forEach(v => {
    const severity = (v.severity || 'UNKNOWN').toLowerCase();
    html += `
      <div class="vuln-item ${severity}">
        <div class="vuln-header">
          <span class="vuln-id">${v.id || v.name || 'Unknown'}</span>
          <span class="vuln-severity severity-${severity}">${severity}</span>
        </div>
        <div class="vuln-details">
          <strong>Package:</strong> <span class="vuln-package">${v.package || v.name || 'N/A'}</span><br>
          ${v.version ? `<strong>Version:</strong> ${v.version}<br>` : ''}
          ${v.fixed ? `<strong>Fixed in:</strong> ${v.fixed}<br>` : ''}
          ${v.title || v.description ? `<strong>Description:</strong> ${v.title || v.description}` : ''}
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderRecommendations(containerId, data, type) {
  const container = document.getElementById(containerId);
  let recommendations = [];

  if (type === 'npm') {
    recommendations = [
      { priority: 'HIGH', text: 'Run `npm audit fix` to automatically patch vulnerabilities', action: 'npm audit fix' },
      { priority: 'HIGH', text: 'For breaking changes, use `npm audit fix --force`', action: 'npm audit fix --force' },
      { priority: 'MEDIUM', text: 'Review and update dependencies in package.json', action: 'npm outdated' },
      { priority: 'MEDIUM', text: 'Consider using Snyk or Dependabot for continuous monitoring', action: null },
      { priority: 'LOW', text: 'Enable automated security updates in repository settings', action: null }
    ];
  } else if (type === 'docker') {
    recommendations = [
      { priority: 'HIGH', text: 'Update base image to latest stable version', action: 'docker pull node:latest' },
      { priority: 'HIGH', text: 'Scan images before deployment to production', action: 'trivy image <image-name>' },
      { priority: 'MEDIUM', text: 'Use multi-stage builds to reduce attack surface', action: null },
      { priority: 'MEDIUM', text: 'Implement image signing and verification', action: null },
      { priority: 'LOW', text: 'Regular scheduled scans in CI/CD pipeline', action: null }
    ];
  }

  let html = '<table><thead><tr><th>Priority</th><th>Recommendation</th><th>Action</th></tr></thead><tbody>';
  recommendations.forEach(rec => {
    const priorityClass = rec.priority.toLowerCase();
    html += `
      <tr>
        <td><span class="vuln-severity severity-${priorityClass}">${rec.priority}</span></td>
        <td>${rec.text}</td>
        <td>${rec.action ? `<code style="background:#edf2f7;padding:4px 8px;border-radius:4px;">${rec.action}</code>` : '-'}</td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderComparativeChart() {
  const labels = ['Critical', 'High', 'Medium', 'Low'];
  const datasets = [
    {
      label: 'NPM Audit',
      data: ['CRITICAL','HIGH','MEDIUM','LOW'].map(s => allData.npm?.severityCounts[s] || 0),
      borderColor: 'rgba(203,56,55,1)',
      backgroundColor: 'rgba(203,56,55,0.4)'
    },
    {
      label: 'Docker Backend',
      data: ['CRITICAL','HIGH','MEDIUM','LOW'].map(s => allData.backend?.severityCounts[s] || 0),
      borderColor: 'rgba(36,150,237,1)',
      backgroundColor: 'rgba(36,150,237,0.4)'
    },
    {
      label: 'Docker Client',
      data: ['CRITICAL','HIGH','MEDIUM','LOW'].map(s => allData.client?.severityCounts[s] || 0),
      borderColor: 'rgba(60,179,113,1)',
      backgroundColor: 'rgba(60,179,113,0.4)'
    }
  ];

  createBarChart('comparisonChart', labels, datasets.map(d => d.data), 'Vulnerability Comparison', datasets.map(d=>d.backgroundColor), datasets.map(d=>d.borderColor));
}


// Render all reports
async function renderReports() {
  document.getElementById('timestamp').textContent = `Generated: ${new Date().toLocaleString()}`;
  
  try {
    // Fetch JSON reports
    const npm = await fetchJSON('npm-audit.json');
    const dockerBackend = await fetchJSON('docker-backend.json');
    const dockerClient = await fetchJSON('docker-client.json');

    // Process data
    const npmData = processNPMAudit(npm);
    const backendData = processTrivyReport(dockerBackend);
    const clientData = processTrivyReport(dockerClient);

    allData = { npm: npmData, backend: backendData, client: clientData };

    // Compute totals
    const totalCritical = (npmData?.severityCounts.CRITICAL || 0) + 
                         (backendData?.severityCounts.CRITICAL || 0) + 
                         (clientData?.severityCounts.CRITICAL || 0);
    const totalHigh = (npmData?.severityCounts.HIGH || 0) + 
                      (backendData?.severityCounts.HIGH || 0) + 
                      (clientData?.severityCounts.HIGH || 0);
    const totalVulns = Object.values(npmData?.severityCounts || {}).reduce((a,b)=>a+b,0) +
                       Object.values(backendData?.severityCounts || {}).reduce((a,b)=>a+b,0) +
                       Object.values(clientData?.severityCounts || {}).reduce((a,b)=>a+b,0);

    document.getElementById('totalVulns').textContent = totalVulns;
    document.getElementById('criticalCount').textContent = totalCritical;
    document.getElementById('highCount').textContent = totalHigh;

    // --- Render charts and lists ---
    if (npmData) {
      createSeverityChart('npmSeverityChart', npmData.severityCounts, 'NPM Vulnerabilities');

      const topPackages = Object.entries(npmData.packageCounts).slice(0,10);
      createBarChart(
        'npmPackagesChart',
        topPackages.map(([pkg]) => pkg),
        topPackages.map(([,count]) => count),
        'Affected Packages',
        'rgba(203,56,55,0.6)',
        'rgba(203,56,55,1)'
      );

      renderVulnerabilityList('npmVulnList', npmData.vulnerabilities);
      renderRecommendations('npmRecommendations', npmData, 'npm');
    }

    if (backendData) {
      createSeverityChart('backendSeverityChart', backendData.severityCounts, 'Backend Vulnerabilities');

      const backendPackages = Object.entries(backendData.packageCounts).slice(0,10);
      createBarChart(
        'backendLayersChart',
        backendPackages.map(([pkg]) => pkg),
        backendPackages.map(([,count]) => count),
        'Vulnerabilities by Package',
        'rgba(36,150,237,0.6)',
        'rgba(36,150,237,1)'
      );

      renderVulnerabilityList('backendVulnList', backendData.vulnerabilities);
      renderRecommendations('backendRecommendations', backendData, 'docker');
    }

    if (clientData) {
      createSeverityChart('clientSeverityChart', clientData.severityCounts, 'Client Vulnerabilities');

      const clientPackages = Object.entries(clientData.packageCounts).slice(0,10);
      createBarChart(
        'clientPackagesChart',
        clientPackages.map(([pkg]) => pkg),
        clientPackages.map(([,count]) => count),
        'Vulnerabilities by Package',
        'rgba(36,150,237,0.6)',
        'rgba(36,150,237,1)'
      );

      renderVulnerabilityList('clientVulnList', clientData.vulnerabilities);
      renderRecommendations('clientRecommendations', clientData, 'docker');
    }

  } catch (error) {
    console.error('Error rendering reports:', error);
    document.querySelector('.container').innerHTML += `
      <div class="error">
        <strong>⚠ Error Loading Reports</strong><br>
        ${error.message}<br>
        Please ensure all JSON files are present in the data/ directory.
      </div>
    `;
  }
  renderComparativeChart()
}

// Initialize
window.onload = renderReports;
