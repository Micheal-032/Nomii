/* ================================================================
   Nomii AI Modules — ai_modules.js
   Implements: AI Insights, Crop Oracle, Ecosystem Graph,
               Smart Alerts, LSTM Forecast, Chatbot
   ================================================================ */

// ─── HTML Escape helper ────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ─── Shared Chart refs ────────────────────────────────────────────
let cropChart = null;
let lstmChart = null;

// ═══════════════════════════════════════════════════════════════════
// AI INSIGHTS: Credit Score + Matching Engine + Risk Profile
// ═══════════════════════════════════════════════════════════════════
async function loadAIInsights() {
  try {
    const [creditRes, matchRes, riskRes] = await Promise.all([
      fetch('/api/ai/credit-score').then(r => r.json()),
      fetch('/api/ai/match').then(r => r.json()),
      fetch('/api/ai/risk-profile').then(r => r.json())
    ]);
    if (creditRes.success) renderCreditScore(creditRes);
    if (matchRes.success) renderMatchGrid(matchRes);
    if (riskRes.success) renderRiskProfile(riskRes);
  } catch (e) {
    console.error('AI Insights load error:', e);
    showToast('Failed to load AI Insights', 'error');
  }
}

// ─── Credit Score ─────────────────────────────────────────────────
function renderCreditScore(data) {
  const body = document.getElementById('creditScoreBody');
  if (!body) return;

  const score = data.creditScore;
  const maxScore = 850;
  const minScore = 300;
  const range = maxScore - minScore;
  const pct = ((score - minScore) / range);        // 0–1
  const degrees = Math.round(pct * 270);               // arc out of 270°
  const color = score >= 700 ? '#2de084' : score >= 550 ? '#f8961e' : '#f72585';

  body.innerHTML = `
    <div style="text-align:center;margin-bottom:14px">
      <div class="credit-meter">
        <div class="credit-arc"></div>
        <div class="credit-arc-fill" id="creditArcFill"
          style="--credit-color:${color};--credit-deg:0deg"></div>
      </div>
      <div style="font-size:36px;font-weight:800;color:${color}">${score}</div>
      <div style="font-size:14px;font-weight:700;margin-top:4px">Grade: ${data.grade}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">Scale: 300–850</div>
    </div>

    ${data.loanEligible ? `
      <div class="alert-banner alert-success" style="margin-bottom:14px;font-size:13px">
        <i class="fas fa-check-circle"></i>
        <div>
          <strong>Micro-Loan Eligible!</strong><br>
          Max: ₹${data.maxLoanAmount.toLocaleString()} at ${data.interestRate}% p.a.
        </div>
      </div>` : `
      <div class="alert-banner alert-warning" style="margin-bottom:14px;font-size:13px">
        <i class="fas fa-times-circle"></i>
        <div>Not yet eligible. Score above 600 unlocks micro-loans.</div>
      </div>`}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
      ${[
      ['Completed Sales', data.factors.completedSales],
      ['Total Revenue', `₹${data.factors.totalRevenue}`],
      ['Total Orders', data.factors.totalOrders],
      ['Cancellations', data.factors.cancelCount],
      ['Active Listings', data.factors.listings],
      ['Account Age', `${data.factors.accountAgeDays}d`]
    ].map(([k, v]) => `
        <div style="padding:8px;background:rgba(255,255,255,0.04);border-radius:8px">
          <div style="color:var(--muted)">${k}</div>
          <div style="font-weight:700">${v}</div>
        </div>`).join('')}
    </div>`;

  // Animate the arc
  requestAnimationFrame(() => setTimeout(() => {
    const el = document.getElementById('creditArcFill');
    if (el) el.style.setProperty('--credit-deg', `${degrees}deg`);
  }, 100));
}

// ─── Match Grid ───────────────────────────────────────────────────
function renderMatchGrid(data) {
  const grid = document.getElementById('matchGrid');
  if (!grid) return;
  const roleEmoji = { Farmer: '🌾', Retailer: '🏪', Supplier: '📦', Artisan: '🎨', Delivery: '🚚' };

  if (!data.matches.length) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-user-slash"></i><p>No partner matches found yet</p></div>`;
    return;
  }
  grid.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">` +
    data.matches.slice(0, 5).map(m => `
      <div class="match-card">
        <div class="match-avatar">${roleEmoji[m.role] || '👤'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</div>
          <div style="font-size:11px;color:var(--muted)">${m.role} · ${esc(m.location || 'Unknown')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${m.tags.slice(0, 2).join(' · ')}</div>
          <div class="match-score-bar">
            <div class="match-score-fill" style="width:${m.matchScore}%"></div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:800;color:var(--success);flex-shrink:0">${m.matchScore}%</div>
      </div>`).join('') +
    `</div>`;
}

// ─── Risk Profile (Isolation Forest + XGBoost) ────────────────────
function renderRiskProfile(data) {
  const grid = document.getElementById('riskProfileGrid');
  if (!grid) return;
  const iso = data.isolationScores;

  grid.innerHTML = `
    <!-- Left: Risk gauge + recommendation -->
    <div>
      <div style="text-align:center;margin-bottom:16px">
        <div class="trust-ring" style="--ring-color:${data.color};--ring-pct:${Math.round(data.riskScore / 100 * 360)}deg;margin:0 auto 12px">
          <div class="trust-ring-inner">
            <div class="trust-score-num" style="color:${data.color}">${data.riskScore}%</div>
            <div class="trust-score-label">Risk</div>
          </div>
        </div>
        <div style="font-size:14px;font-weight:700;color:${data.color}">${data.riskTier}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${data.recommendation}</div>
        <div style="font-size:12px;margin-top:8px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px">
          XGBoost Ensemble Vote: <strong>${data.ensembleVote}%</strong> risk
        </div>
      </div>
    </div>

    <!-- Right: Individual scores -->
    <div style="display:flex;flex-direction:column;gap:12px">
      ${[
      ['Order Value Anomaly', iso.orderValueAnomaly, '#4361ee'],
      ['Price Anomaly', iso.priceAnomaly, '#7209b7'],
      ['Velocity Risk', iso.velocityRisk, '#f8961e'],
      ['Cancellation Risk', iso.cancellationRisk, '#f72585'],
    ].map(([label, val, clr]) => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:var(--muted)">${label}</span>
            <strong style="color:${clr}">${val}%</strong>
          </div>
          <div class="risk-bar">
            <div class="risk-fill" style="width:${val}%;background:${clr}"></div>
          </div>
        </div>`).join('')}
    </div>`;
}


// ═══════════════════════════════════════════════════════════════════
// CROP ORACLE
// ═══════════════════════════════════════════════════════════════════
async function runCropOracle() {
  const btn = document.getElementById('oracleBtn');
  const crop = document.getElementById('oracleCrop')?.value || 'tomato';
  const land = parseFloat(document.getElementById('oracleLand')?.value) || 1;

  btn.disabled = true; btn.classList.add('loading');
  try {
    const res = await fetch('/api/ai/crop-oracle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, landSize: land })
    }).then(r => r.json());

    if (!res.success) { showToast('Crop oracle failed', 'error'); return; }

    // Advisory
    document.getElementById('oracleAdvisory').innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;color:${res.isPeakSeason ? 'var(--success)' : 'var(--warning)'}">
        ${res.isPeakSeason ? '☀️ PEAK SEASON' : '🌧 OFF-SEASON'}
      </div>
      ${esc(res.weatherAdvisory)}`;

    // Breakdown
    document.getElementById('oracleBreakdown').innerHTML = [
      ['Advised Price', `₹${res.advisedPrice}/kg`],
      ['Estimated Yield', `${res.estimatedYieldKg} kg`],
      ['Estimated Revenue', `₹${res.estimatedRevenue}`],
      ['Shelf Life', `${res.shelfLifeDays} days`],
    ].map(([k, v]) => `
      <div class="pbr">
        <span class="pbr-key">${k}</span>
        <span class="pbr-val" style="color:var(--success)">${v}</span>
      </div>`).join('');

    document.getElementById('cropOracleResult').classList.add('show');

    // Chart
    renderCropTrendChart(res.priceTrend, crop);

    // Best window
    document.getElementById('bestWindowInfo').innerHTML =
      `🗓 Best sell window: <strong>${res.bestSellWindow.join(', ')}</strong>`;

  } catch (e) { showToast('Network error', 'error'); console.error(e); }
  finally { btn.disabled = false; btn.classList.remove('loading'); }
}

function renderCropTrendChart(trend, crop) {
  const ctx = document.getElementById('cropTrendChart')?.getContext('2d');
  if (!ctx) return;
  if (cropChart) cropChart.destroy();
  cropChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.labels,
      datasets: [{
        label: `${crop} Price (₹/kg)`,
        data: trend.data,
        borderColor: '#2de084',
        backgroundColor: 'rgba(45,224,132,0.15)',
        borderWidth: 2, pointRadius: 4, tension: 0.4, fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8892b0', font: { size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0', callback: v => `₹${v}` } }
      }
    }
  });
}


// ═══════════════════════════════════════════════════════════════════
// ECOSYSTEM GRAPH (Canvas SVG-style renderer)
// ═══════════════════════════════════════════════════════════════════
async function loadEcosystem() {
  try {
    const res = await fetch('/api/ai/ecosystem-graph').then(r => r.json());
    if (!res.success) return;

    // Stats
    const statsEl = document.getElementById('ecosystemStats');
    if (statsEl) {
      statsEl.innerHTML = [
        ['Total Users', res.stats.totalUsers, '#4361ee'],
        ['Total Edges', res.stats.totalEdges, '#7209b7'],
        ['Connected', res.stats.connectedUsers, '#2de084'],
        ['Isolated', res.stats.isolatedUsers, '#f72585'],
      ].map(([k, v, c]) => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);
                    border-radius:10px;padding:10px 16px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:${c}">${v}</div>
          <div style="font-size:11px;color:var(--muted)">${k}</div>
        </div>`).join('');
    }

    // Canvas-based graph  :  force-directed layout (simple)
    const canvas = document.getElementById('ecosystemCanvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 380;
    const ctx = canvas.getContext('2d');
    drawEcosystemGraph(ctx, canvas.width, canvas.height, res.nodes, res.edges);

    // Legend
    const legend = document.getElementById('ecosystemLegend');
    if (legend) {
      const roleColors = { R: '#4361ee', S: '#7209b7', D: '#f72585', F: '#2de084', A: '#f8961e' };
      const roleNames = { R: 'Retailer', S: 'Supplier', D: 'Delivery', F: 'Farmer', A: 'Artisan' };
      legend.innerHTML = Object.entries(roleColors).map(([r, c]) =>
        `<span style="display:flex;align-items:center;gap:4px">
           <span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block"></span>
           ${roleNames[r]}
         </span>`).join('');
    }

    // Insights
    const insights = document.getElementById('ecosystemInsights');
    if (insights) {
      const density = res.stats.totalEdges / Math.max(1, res.stats.totalUsers);
      insights.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px">
            <div style="font-weight:700;margin-bottom:6px">🌐 Network Density</div>
            <div style="font-size:24px;font-weight:800;color:var(--accent2)">${density.toFixed(2)}</div>
            <div style="color:var(--muted)">edges per node</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px">
            <div style="font-weight:700;margin-bottom:6px">🔗 Connectivity</div>
            <div style="font-size:24px;font-weight:800;color:var(--success)">
              ${res.stats.totalUsers > 0 ? Math.round(res.stats.connectedUsers / res.stats.totalUsers * 100) : 0}%
            </div>
            <div style="color:var(--muted)">users actively trading</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;grid-column:1/-1">
            <div style="font-weight:700;margin-bottom:4px">📊 GNN Analysis</div>
            <div style="color:var(--muted)">
              ${res.stats.isolatedUsers > 2 ? '⚠️ ' + res.stats.isolatedUsers + ' isolated users detected. Low engagement may indicate fraud accounts.' :
          '✅ Supply chain network is healthy. No isolated clusters detected.'}
            </div>
          </div>
        </div>`;
    }

  } catch (e) { console.error('Ecosystem graph error:', e); }
}

function drawEcosystemGraph(ctx, W, H, nodes, edges) {
  if (!nodes.length) return;
  ctx.clearRect(0, 0, W, H);

  // Simple circular layout
  const N = nodes.length;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.35;
  const positions = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / N - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / N - Math.PI / 2)
  }));
  const posMap = {};
  nodes.forEach((n, i) => { posMap[n.id] = positions[i]; });

  // Draw edges
  ctx.globalAlpha = 0.4;
  edges.forEach(e => {
    const a = posMap[e.from], b = posMap[e.to];
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = Math.min(e.count * 0.8, 4);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // Draw nodes
  nodes.forEach((n, i) => {
    const pos = positions[i];
    const radius = n.isSelf ? 20 : 14;

    // Glow for self node
    if (n.isSelf) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 6, 0, 2 * Math.PI);
      ctx.fillStyle = n.color + '33';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = n.color;
    ctx.fill();

    // Emoji label
    ctx.font = `${n.isSelf ? 14 : 11}px Inter`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.emoji || '👤', pos.x, pos.y);

    // Name label below
    ctx.font = '10px Inter';
    ctx.fillStyle = '#8892b0';
    ctx.fillText(n.label.slice(0, 12), pos.x, pos.y + radius + 10);
  });
}


// ═══════════════════════════════════════════════════════════════════
// SMART ALERTS
// ═══════════════════════════════════════════════════════════════════
async function loadSmartAlerts() {
  const list = document.getElementById('smartAlertsList');
  if (!list) return;
  list.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>`;

  try {
    const res = await fetch('/api/ai/smart-alerts').then(r => r.json());
    if (!res.success || !res.count) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle" style="color:var(--success)"></i>
          <p>All clear! No active alerts right now.</p>
        </div>`;
      return;
    }

    list.innerHTML = res.alerts.map(a => `
      <div class="alert-item ${a.type}">
        <i class="fas ${a.icon}" style="font-size:20px;margin-top:2px;flex-shrink:0;
           color:${a.type === 'warning' ? 'var(--warning)' : a.type === 'danger' ? 'var(--danger)' : a.type === 'success' ? 'var(--success)' : 'var(--accent)'}"></i>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${esc(a.title)}</div>
          <div style="font-size:13px;color:var(--muted)">${esc(a.body)}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin:0;flex-shrink:0"
                onclick="switchTab('${a.actionTab}')">
          ${esc(a.action)} →
        </button>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>Load failed</p></div>`;
  }
}


// ═══════════════════════════════════════════════════════════════════
// LSTM FORECAST
// ═══════════════════════════════════════════════════════════════════
async function runLSTM() {
  const btn = document.getElementById('lstmBtn');
  const crop = document.getElementById('lstmCrop')?.value || 'tomato';
  const mode = document.getElementById('lstmMode')?.value || 'auto';

  let historicalPrices = [];
  if (mode === 'manual') {
    const raw = document.getElementById('lstmPrices')?.value || '';
    historicalPrices = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (historicalPrices.length < 2) {
      showToast('Enter at least 2 historical prices', 'error');
      return;
    }
  }

  btn.disabled = true; btn.classList.add('loading');
  try {
    const res = await fetch('/api/ai/lstm-forecast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, historicalPrices })
    }).then(r => r.json());

    if (!res.success) { showToast('LSTM failed', 'error'); return; }

    // Summary
    document.getElementById('lstmSummary').style.display = 'block';
    document.getElementById('lstmTrend').textContent = res.trendDirection;
    document.getElementById('lstmTrend').style.color =
      res.trendDirection.includes('Rising') ? 'var(--success)' :
        res.trendDirection.includes('Falling') ? 'var(--danger)' : 'var(--muted)';

    document.getElementById('lstmForecastValues').innerHTML =
      res.forecastLabels.map((label, i) => `
        <div class="pbr">
          <span class="pbr-key">${label} (forecast)</span>
          <span class="pbr-val">₹${res.forecastValues[i]}</span>
        </div>`).join('');

    document.getElementById('lstmModelInfo').textContent =
      `Model: ${res.model} | Confidence: ${res.confidence}`;

    // Chart
    renderLSTMChart(res);

  } catch (e) { showToast('Network error', 'error'); console.error(e); }
  finally { btn.disabled = false; btn.classList.remove('loading'); }
}

function renderLSTMChart(res) {
  const ctx = document.getElementById('lstmChart')?.getContext('2d');
  if (!ctx) return;
  if (lstmChart) lstmChart.destroy();

  const allLabels = [...res.historicalLabels, ...res.forecastLabels];
  const histLen = res.historicalData.length;
  const foreLen = res.forecastValues.length;

  lstmChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Historical',
          data: [...res.historicalData, ...Array(foreLen).fill(null)],
          borderColor: '#4cc9f0',
          backgroundColor: 'rgba(76,201,240,0.1)',
          borderWidth: 2, pointRadius: 3, tension: 0.4, fill: true
        },
        {
          label: 'Smoothed',
          data: [...res.smoothedData, ...Array(foreLen).fill(null)],
          borderColor: '#4361ee',
          backgroundColor: 'transparent',
          borderWidth: 1, pointRadius: 0, borderDash: [4, 4], tension: 0.4
        },
        {
          label: 'Forecast',
          data: [...Array(histLen).fill(null), ...res.forecastValues],
          borderColor: '#f72585',
          backgroundColor: 'rgba(247,37,133,0.1)',
          borderWidth: 2.5, pointRadius: 5, tension: 0.4, fill: true,
          borderDash: [6, 3]
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#8892b0', boxWidth: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.parsed.y !== null ? `${ctx.dataset.label}: ₹${ctx.parsed.y}` : null
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0', callback: v => `₹${v}` } }
      }
    }
  });
}


// ═══════════════════════════════════════════════════════════════════
// FLOATING CHATBOT
// ═══════════════════════════════════════════════════════════════════
function toggleChat() {
  const box = document.getElementById('chatBox');
  const btn = document.getElementById('chatToggle');
  const open = box.style.display === 'none' || box.style.display === '';
  box.style.display = open ? 'block' : 'none';
  btn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-robot"></i>';
  if (open) document.getElementById('chatInput')?.focus();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input?.value.trim();
  if (!msg) return;
  input.value = '';

  // Add user bubble
  appendChatBubble(esc(msg), 'user');

  // Typing indicator
  const typId = appendChatBubble('<i class="fas fa-circle" style="animation:pulse 1s infinite"></i> …', 'ai', true);

  try {
    const res = await fetch('/api/ai/chatbot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    }).then(r => r.json());

    document.getElementById(typId)?.remove();

    if (res.success) {
      appendChatBubble(res.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'), 'ai');
    } else {
      appendChatBubble('Sorry, something went wrong. Please try again.', 'ai');
    }
  } catch {
    document.getElementById(typId)?.remove();
    appendChatBubble('Network error. Please check your connection.', 'ai');
  }
}

function appendChatBubble(html, type, isTemp = false) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return '';
  const id = `chat-msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai';
  div.innerHTML = html;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return id;
}
