let allData = {};

// Tab switching
function switchTab(section, index, event) {
  document.querySelectorAll(`#${section}-tab-0, #${section}-tab-1, #${section}-tab-2`).forEach((content, i) => {
    content.classList.remove('active');
    if (i === index) content.classList.add('active');
  });

  event.currentTarget.parentElement.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.remove('active');
    if (i === index) tab.classList.add('active');
  });
}

async function fetchJSON(file) {
  try {
    const res = await fetch(`${window.location.pathname.replace(/\/$/, "")}/data/${file}`);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${file}:`, err);
    return null;
  }
}

// Chart helpers (unchanged)
function createSeverityChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  const filteredData = {};
  Object.keys(data).forEach(k => { if (k !== 'UNKNOWN') filteredData[k] = data[k]; });

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(filteredData),
      datasets: [{
        label,
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
            label: ctx => `${ctx.label}: ${ctx.parsed} vulnerabilities`
          }
        }
      }
    }
  });
}

function createBarChart(canvasId, labels, data, label, bgColor, borderColor) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: bgColor, borderColor, borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });
}

// --- Data processing (unchanged) ---
function processNPMAudit(data) {
  if (!data || !data.vulnerabilities) return null;
  const vulns = Object.values(data.vulnerabilities || {});
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  const packageCounts = {};
  vulns.forEach(v => {
    const severity = (v.severity || 'UNKNOWN').toUpperCase();
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    const pkg = v.name || 'Unknown';
    packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
  });
  return { severityCounts, packageCounts, vulnerabilities: vulns };
}

function processTrivyReport(data) {
  if (!data || !data.Results) return null;
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  const packageCounts = {};
  const vulnerabilities = [];
  data.Results.forEach(result => {
    (result.Vulnerabilities || []).forEach(v => {
      const severity = (v.Severity || 'UNKNOWN').toUpperCase();
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      const pkg = v.PkgName || 'Unknown';
      packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
      vulnerabilities.push({ id: v.VulnerabilityID, severity, package: v.PkgName, version: v.InstalledVersion, fixed: v.FixedVersion, title: v.Title, description: v.Description });
    });
  });
  return { severityCounts, packageCounts, vulnerabilities };
}

function processCodeQL(data) {
  // Minimal placeholder, extend as needed
  if (!data) return null;
  return { vulnerabilities: data.run?.results || [] };
}

// --- Render functions ---
function renderVulnerabilityList(containerId, vulnerabilities, limit = 20) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!vulnerabilities || vulnerabilities.length === 0) {
    container.innerHTML = '<p style="color: #48bb78; padding: 20px;">✓ No vulnerabilities detected</p>';
    return;
  }
  const html = vulnerabilities.slice(0, limit).map(v => `
    <div class="vuln-item ${v.severity?.toLowerCase() || 'unknown'}">
      <div class="vuln-header">
        <span class="vuln-id">${v.id || 'Unknown'}</span>
        <span class="vuln-severity severity-${v.severity?.toLowerCase() || 'unknown'}">${v.severity || 'UNKNOWN'}</span>
      </div>
      <div class="vuln-details">
        ${v.package ? `<strong>Package:</strong> ${v.package}<br>` : ''}
        ${v.version ? `<strong>Version:</strong> ${v.version}<br>` : ''}
        ${v.fixed ? `<strong>Fixed in:</strong> ${v.fixed}<br>` : ''}
        ${v.title || v.description ? `<strong>Description:</strong> ${v.title || v.description}` : ''}
      </div>
    </div>`).join('');
  container.innerHTML = `<div class="vulnerability-list">${html}</div>`;
}

function renderRecommendations(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const recs = type === 'npm' ? [
    { priority: 'HIGH', text: 'Run `npm audit fix`', action: 'npm audit fix' },
    { priority: 'HIGH', text: 'Use `npm audit fix --force` for breaking changes', action: 'npm audit fix --force' }
  ] : [
    { priority: 'HIGH', text: 'Update base image to latest stable version', action: 'docker pull node:latest' },
    { priority: 'HIGH', text: 'Scan images before deployment', action: 'trivy image <image>' }
  ];
  container.innerHTML = `<table><thead><tr><th>Priority</th><th>Recommendation</th><th>Action</th></tr></thead><tbody>${
    recs.map(r => `<tr>
      <td><span class="vuln-severity severity-${r.priority.toLowerCase()}">${r.priority}</span></td>
      <td>${r.text}</td>
      <td>${r.action ? `<code>${r.action}</code>` : '-'}</td>
    </tr>`).join('')
  }</tbody></table>`;
}

function renderComparativeChart() {
  const labels = ['Critical', 'High', 'Medium', 'Low'];

  const npmData = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => allData.npm?.severityCounts[s] || 0);
  const backendData = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => allData.backend?.severityCounts[s] || 0);
  const clientData = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => allData.client?.severityCounts[s] || 0);

  const ctx = document.getElementById('comparisonChart')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'NPM',
          data: npmData,
          backgroundColor: 'rgba(203,56,55,0.4)',
          borderColor: 'rgba(203,56,55,1)',
          borderWidth: 2
        },
        {
          label: 'Backend',
          data: backendData,
          backgroundColor: 'rgba(36,150,237,0.4)',
          borderColor: 'rgba(36,150,237,1)',
          borderWidth: 2
        },
        {
          label: 'Client',
          data: clientData,
          backgroundColor: 'rgba(60,179,113,0.4)',
          borderColor: 'rgba(60,179,113,1)',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}


// --- Main renderer ---
async function renderReports() {
  document.getElementById('timestamp')?.textContent = `Generated: ${new Date().toLocaleString()}`;

  // Fetch all reports
  const npm = await fetchJSON('npm-audit.json');
  const backend = await fetchJSON('trivy-backend.json');
  const client = await fetchJSON('trivy-client.json');
  const codeql = await fetchJSON('codeql-analysis.json');

  allData = {
    npm: processNPMAudit(npm),
    backend: processTrivyReport(backend),
    client: processTrivyReport(client),
    codeql: processCodeQL(codeql)
  };

  // Render each section safely
  if (allData.npm) {
    createSeverityChart('npmSeverityChart', allData.npm.severityCounts, 'NPM Vulnerabilities');
    const topPkgs = Object.entries(allData.npm.packageCounts || {}).slice(0,10);
    createBarChart('npmPackagesChart', topPkgs.map(([p]) => p), topPkgs.map(([ ,c]) => c), 'Top NPM Packages', 'rgba(203,56,55,0.6)', 'rgba(203,56,55,1)');
    renderVulnerabilityList('npmVulnList', allData.npm.vulnerabilities);
    renderRecommendations('npmRecommendations', 'npm');
  }

  if (allData.backend) {
    createSeverityChart('backendSeverityChart', allData.backend.severityCounts, 'Backend Vulnerabilities');
    const topPkgs = Object.entries(allData.backend.packageCounts || {}).slice(0,10);
    createBarChart('backendLayersChart', topPkgs.map(([p]) => p), topPkgs.map(([ ,c]) => c), 'Backend Packages', 'rgba(36,150,237,0.6)', 'rgba(36,150,237,1)');
    renderVulnerabilityList('backendVulnList', allData.backend.vulnerabilities);
    renderRecommendations('backendRecommendations', 'docker');
  }

  if (allData.client) {
    createSeverityChart('clientSeverityChart', allData.client.severityCounts, 'Client Vulnerabilities');
    const topPkgs = Object.entries(allData.client.packageCounts || {}).slice(0,10);
    createBarChart('clientPackagesChart', topPkgs.map(([p]) => p), topPkgs.map(([ ,c]) => c), 'Client Packages', 'rgba(36,150,237,0.6)', 'rgba(36,150,237,1)');
    renderVulnerabilityList('clientVulnList', allData.client.vulnerabilities);
    renderRecommendations('clientRecommendations', 'docker');
  }

  renderComparativeChart();
}

// Initialize
window.onload = renderReports;
