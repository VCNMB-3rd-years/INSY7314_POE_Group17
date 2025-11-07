let allData = {};

// Tab switching - updated to work with event listeners
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

// Initialize tab event listeners
function initializeTabs() {
  document.querySelectorAll('.tabs').forEach(tabContainer => {
    const section = tabContainer.getAttribute('data-section');
    tabContainer.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (event) => {
        const index = parseInt(tab.getAttribute('data-index'));
        switchTab(section, index, event);
      });
    });
  });
}

async function fetchJSON(file) {
  try {
    const res = await fetch('./data/' + file);
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

function renderScanTile(id, badge, badgeClass, title, data, vulnerabilities) {
    const canvasId = 'chart-' + id;
    return `
    <div class="scan-tile">
        <div class="scan-header">
            <span class="scan-badge ${badgeClass}">${badge}</span>
            <span class="scan-title">${title}</span>
        </div>
        <div class="scan-content">
            <canvas id="${canvasId}" class="chart-mini"></canvas>
            <div class="severity-list">
                <div class="severity-item critical"><span class="severity-name">Critical</span><span class="severity-count critical">${data.CRITICAL || 0}</span></div>
                <div class="severity-item high"><span class="severity-name">High</span><span class="severity-count high">${data.HIGH || 0}</span></div>
                <div class="severity-item medium"><span class="severity-name">Medium</span><span class="severity-count medium">${data.MEDIUM || 0}</span></div>
                <div class="severity-item low"><span class="severity-name">Low</span><span class="severity-count low">${data.LOW || 0}</span></div>
            </div>
            <div class="vuln-full-list">
                ${renderVulnerabilityListHTML(vulnerabilities)}
            </div>
        </div>
        <div class="scan-insight">
            <strong>Insight:</strong> ${generateInsight(id)}
        </div>
    </div>`;
}

// Helper that returns HTML string without inserting into DOM
function renderVulnerabilityListHTML(vulnerabilities) {
    const grouped = groupVulnerabilitiesBySeverity(vulnerabilities);
    let html = '';
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(sev => {
        const list = grouped[sev];
        if (list.length === 0) return;
        html += `<h4 class="severity-header severity-${sev.toLowerCase()}">${sev} (${list.length})</h4>`;
        html += list.map(v => `
            <div class="vuln-item ${sev.toLowerCase()}">
                <div class="vuln-header">
                    <span class="vuln-id">${v.id || 'Unknown'}</span>
                    <span class="vuln-severity severity-${sev.toLowerCase()}">${sev}</span>
                </div>
                <div class="vuln-details">
                    ${v.package ? `<strong>Package:</strong> ${v.package}<br>` : ''}
                    ${v.version ? `<strong>Version:</strong> ${v.version}<br>` : ''}
                    ${v.fixed ? `<strong>Fixed in:</strong> ${v.fixed}<br>` : ''}
                    ${v.title || v.description ? `<strong>Description:</strong> ${v.title || v.description}` : ''}
                </div>
            </div>
        `).join('');
    });
    return html;
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
function renderVulnerabilityList(containerId, vulnerabilities) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const grouped = groupVulnerabilitiesBySeverity(vulnerabilities);
    let html = '';

    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(sev => {
        const list = grouped[sev];
        if (list.length === 0) return;
        html += `<h4 class="severity-header severity-${sev.toLowerCase()}">${sev} (${list.length})</h4>`;
        html += list.map(v => `
            <div class="vuln-item ${sev.toLowerCase()}">
                <div class="vuln-header">
                    <span class="vuln-id">${v.id || 'Unknown'}</span>
                    <span class="vuln-severity severity-${sev.toLowerCase()}">${sev}</span>
                </div>
                <div class="vuln-details">
                    ${v.package ? `<strong>Package:</strong> ${v.package}<br>` : ''}
                    ${v.version ? `<strong>Version:</strong> ${v.version}<br>` : ''}
                    ${v.fixed ? `<strong>Fixed in:</strong> ${v.fixed}<br>` : ''}
                    ${v.title || v.description ? `<strong>Description:</strong> ${v.title || v.description}` : ''}
                </div>
            </div>
        `).join('');
    });

    container.innerHTML = html || '<p style="color: #48bb78; padding: 20px;">✓ No vulnerabilities detected</p>';
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
  container.innerHTML = `
  <table>
    <thead>
      <tr><th>Priority</th><th>Recommendation</th><th>Action</th></tr>
    </thead>
    <tbody>
      ${recs.map(r => `
        <tr>
          <td><span class="vuln-severity severity-${r.priority.toLowerCase()}">${r.priority}</span></td>
          <td>${r.text}</td>
          <td>${r.action ? `<code>${r.action}</code>` : '-'}</td>
        </tr>`).join('')}
    </tbody>
  </table>`;

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

function groupVulnerabilitiesBySeverity(vulnerabilities) {
    const groups = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
    if (!vulnerabilities) return groups;
    vulnerabilities.forEach(v => {
        const sev = v.severity || 'LOW';
        if (!groups[sev]) groups[sev] = [];
        groups[sev].push(v);
    });
    return groups;
}


// --- Main renderer ---
async function renderReports() {
    document.getElementById('timestamp').textContent = `Generated: ${new Date().toLocaleString()}`;
    allData = {
        npm: processNPMAudit(await fetchJSON('npm-audit.json')),
        backend: processTrivyReport(await fetchJSON('trivy-backend.json')),
        client: processTrivyReport(await fetchJSON('trivy-client.json')),
        codeql: processCodeQL(await fetchJSON('codeql-analysis.json'))
    };

    let html = '';
    if (allData.npm) html += renderScanTile('npm', 'NPM', 'badge-npm', 'Dependency Vulnerabilities', allData.npm.severityCounts, allData.npm.vulnerabilities);
    if (allData.backend) html += renderScanTile('backend', 'Docker', 'badge-docker', 'Backend Container Security', allData.backend.severityCounts, allData.backend.vulnerabilities);
    if (allData.client) html += renderScanTile('client', 'Docker', 'Frontend Container Security', allData.client.severityCounts, allData.client.vulnerabilities);
    if (allData.codeql) html += renderScanTile('codeql', 'CodeQL', 'badge-codeql', 'Code Security Analysis', allData.codeql.severityCounts, allData.codeql.vulnerabilities);

    if (!html) html = '<div class="error">No scan data found. Ensure JSON files exist in ./data/</div>';
    document.getElementById('scanGrid').innerHTML = html;

    ['npm', 'backend', 'client', 'codeql'].forEach(src => {
        if (allData[src]) createMiniChart('chart-' + src, allData[src].severityCounts);
    });

    updateMetrics();
    renderTopVulnerabilities();
    renderComparativeChart();
}

// Initialize - now includes tab event listeners
window.onload = function() {
  initializeTabs();
  renderReports();
};