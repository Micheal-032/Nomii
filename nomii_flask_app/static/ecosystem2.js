/* ================================================================
   Nomii AI Ecosystem v2 — Weather + NDVI, Market Prices,
   Supply Chain Tracker, API Integration Hub
   IMPORTANT: All 4 public functions are explicitly set on window.
   ================================================================ */

/* === Shared Utilities === */
function esc2(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmt(n, d) { return Number(n).toFixed(d == null ? 2 : d); }
function fmtCur(n) { return '\u20b9' + fmt(n, 2); }

/* ================================================================
   MODULE 1: WEATHER + NDVI
   ================================================================ */
var weatherChart = null;

function loadWeather(city) {
  var body = document.getElementById('weatherBody');
  if (!body) return;
  city = city || '';
  body.innerHTML = '<div class="eco-spinner"><i class="fas fa-spinner fa-spin"></i> Fetching weather...</div>';
  var url = '/api/weather' + (city ? '?city=' + encodeURIComponent(city) : '');
  fetch(url, { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      try { renderWeather(data, body); }
      catch (e) {
        body.innerHTML = '<div class="eco-err">Render error: ' + e.message + '</div>';
        console.error('renderWeather error:', e);
      }
    })
    .catch(function (e) {
      body.innerHTML = '<div class="eco-err">Weather unavailable: ' + e.message + '</div>';
      console.error('loadWeather error:', e);
    });
}

function renderWeather(d, body) {
  var ndviColor = d.ndvi > 0.5 ? '#2de084' : (d.ndvi > 0.35 ? '#f8961e' : '#e74c3c');
  var live = d.live ? 'live' : 'sim';
  var liveText = d.live ? 'Live API' : 'Simulated';

  body.innerHTML =
    '<div class="w-grid">' +
    '<div class="w-main-card">' +
    '<div class="w-city-row">' +
    '<span class="w-city">' + esc2(d.city) + '</span>' +
    '<span class="w-live-badge ' + live + '">' + liveText + '</span>' +
    '</div>' +
    '<div class="w-temp-row">' +
    '<span class="w-big-icon">' + (d.icon || '') + '</span>' +
    '<span class="w-temp">' + fmt(d.temp, 1) + '&deg;C</span>' +
    '<div class="w-sub-stats">' +
    '<span>Humidity: ' + fmt(d.humidity, 0) + '%</span>' +
    '<span>Wind: ' + fmt(d.wind_kph, 1) + ' km/h</span>' +
    '<span>Feels: ' + fmt(d.feels_like, 1) + '&deg;C</span>' +
    '<span>UV: ' + fmt(d.uv_index, 1) + '</span>' +
    '<span>Rain: ' + fmt(d.rain_chance, 0) + '%</span>' +
    '</div>' +
    '</div>' +
    '<div class="w-desc">' + esc2(d.desc) + '</div>' +
    '<div class="w-advisory">' +
    '<i class="fas fa-leaf" style="color:var(--success)"></i>' +
    ' <strong>Crop Advisory:</strong> ' + esc2(d.crop_advisory) +
    '</div>' +
    '</div>' +
    '<div class="w-ndvi-card">' +
    '<div class="card-title" style="margin-bottom:10px">Satellite NDVI</div>' +
    '<div class="ndvi-gauge-wrap">' +
    '<svg viewBox="0 0 120 70" width="160">' +
    '<path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>' +
    '<path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="' + ndviColor + '"' +
    ' stroke-width="10" stroke-dasharray="' + (d.ndvi * 157) + ' 157"/>' +
    '</svg>' +
    '<div class="ndvi-num" style="color:' + ndviColor + '">' + fmt(d.ndvi, 3) + '</div>' +
    '<div class="ndvi-label">' + esc2(d.ndvi_label) + '</div>' +
    '</div>' +
    '<canvas id="ndviChart" height="90"></canvas>' +
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px">7-Day NDVI Trend</div>' +
    '</div>' +
    '</div>' +
    '<div class="w-search-row" style="margin-top:14px">' +
    '<input id="weatherCityInput" class="form-input" placeholder="Search city..." value="' + esc2(d.city) + '" style="max-width:220px;padding:8px 12px;font-size:13px">' +
    '<button class="btn btn-sm btn-primary" onclick="loadWeather(document.getElementById(\'weatherCityInput\').value)">' +
    '<i class="fas fa-search"></i> Update' +
    '</button>' +
    '</div>';

  // Draw NDVI sparkline
  setTimeout(function () {
    var ctx = document.getElementById('ndviChart');
    if (!ctx || !window.Chart) return;
    if (weatherChart) { weatherChart.destroy(); weatherChart = null; }
    weatherChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Today'],
        datasets: [{
          data: d.ndvi_7day,
          borderColor: ndviColor,
          backgroundColor: ndviColor + '22',
          fill: true, tension: 0.4, pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { display: true, ticks: { color: '#888', font: { size: 10 } } },
          y: { display: true, min: 0, max: 1, ticks: { color: '#888', font: { size: 10 } } }
        }
      }
    });
  }, 150);
}

/* ================================================================
   MODULE 2: MARKET PRICES
   ================================================================ */
var sparkCharts = {};

function loadMarketPrices(mandi) {
  var body = document.getElementById('marketBody');
  if (!body) return;
  mandi = mandi || 'Mumbai';
  body.innerHTML = '<div class="eco-spinner"><i class="fas fa-spinner fa-spin"></i> Loading market prices...</div>';
  fetch('/api/market-prices?mandi=' + encodeURIComponent(mandi), { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      try { renderMarketPrices(data, body); }
      catch (e) {
        body.innerHTML = '<div class="eco-err">Render error: ' + e.message + '</div>';
        console.error('renderMarketPrices error:', e);
      }
    })
    .catch(function (e) {
      body.innerHTML = '<div class="eco-err">Market data unavailable: ' + e.message + '</div>';
      console.error('loadMarketPrices error:', e);
    });
}

function renderMarketPrices(d, body) {
  Object.values(sparkCharts).forEach(function (c) { c.destroy(); });
  sparkCharts = {};

  var mandiOpts = d.mandis.map(function (m) {
    return '<option value="' + m + '"' + (m === d.mandi ? ' selected' : '') + '>' + m + '</option>';
  }).join('');

  var cards = d.prices.map(function (p) {
    var up = p.change >= 0;
    var clr = up ? '#2de084' : '#e74c3c';
    var cid = 'spark_' + p.key;
    return '<div class="mkt-card">' +
      '<div class="mkt-crop">' + esc2(p.crop) + '</div>' +
      '<div class="mkt-price">' + fmtCur(p.price) + '<span class="mkt-unit">/' + esc2(p.unit) + '</span></div>' +
      '<div class="mkt-change" style="color:' + clr + '">' + esc2(p.direction) + ' ' + fmtCur(Math.abs(p.change)) + ' (' + p.change_pct + '%)</div>' +
      '<canvas id="' + cid + '" height="45" style="margin-top:6px"></canvas>' +
      '<div class="mkt-meta">' +
      '<span>MSP: ' + fmtCur(p.msp) + '</span>' +
      '<span>7d ago: ' + fmtCur(p.week_ago) + '</span>' +
      '</div>' +
      '</div>';
  }).join('');

  body.innerHTML =
    '<div class="mkt-header">' +
    '<div><span class="card-title">Mandi Market Prices</span>' +
    '<span style="font-size:11px;color:var(--muted);margin-left:8px">Last updated: ' + esc2(d.last_updated) + '</span></div>' +
    '<select id="mandiSelect" class="form-input" style="padding:6px 10px;font-size:13px" onchange="loadMarketPrices(this.value)">' + mandiOpts + '</select>' +
    '</div>' +
    '<div class="mkt-grid">' + cards + '</div>';

  setTimeout(function () {
    d.prices.forEach(function (p) {
      var cid = 'spark_' + p.key;
      var ctx = document.getElementById(cid);
      if (!ctx || !window.Chart) return;
      var up = p.change >= 0;
      sparkCharts[cid] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['', '', '', '', '', '', ''],
          datasets: [{
            data: p.trend_7d,
            borderColor: up ? '#2de084' : '#e74c3c',
            backgroundColor: (up ? '#2de084' : '#e74c3c') + '22',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.5
          }]
        },
        options: {
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: false
        }
      });
    });
  }, 150);
}

/* ================================================================
   MODULE 3: SUPPLY CHAIN
   ================================================================ */
function loadSupplyChain() {
  var body = document.getElementById('supplyBody');
  if (!body) return;
  body.innerHTML = '<div class="eco-spinner"><i class="fas fa-spinner fa-spin"></i> Loading supply chain...</div>';
  fetch('/api/supply-chain', { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      try { renderSupplyChain(data, body); }
      catch (e) {
        body.innerHTML = '<div class="eco-err">Render error: ' + e.message + '</div>';
        console.error('renderSupplyChain error:', e);
      }
    })
    .catch(function (e) {
      body.innerHTML = '<div class="eco-err">Supply chain data unavailable: ' + e.message + '</div>';
      console.error('loadSupplyChain error:', e);
    });
}

function renderSupplyChain(d, body) {
  var s = d.stats;
  var statsHtml =
    '<div class="sc-stats-row">' +
    '<div class="sc-stat"><span class="sc-stat-n">' + s.total + '</span><span>Total Orders</span></div>' +
    '<div class="sc-stat"><span class="sc-stat-n" style="color:var(--success)">' + s.delivered + '</span><span>Delivered</span></div>' +
    '<div class="sc-stat"><span class="sc-stat-n" style="color:#f8961e">' + s.in_transit + '</span><span>In Transit</span></div>' +
    '<div class="sc-stat"><span class="sc-stat-n" style="color:var(--muted)">' + s.pending + '</span><span>Pending</span></div>' +
    '<div class="sc-stat"><span class="sc-stat-n" style="color:var(--accent)">' + s.success_rate + '%</span><span>Success</span></div>' +
    '</div>';

  var ordersHtml = d.orders.length === 0
    ? '<div class="eco-empty"><i class="fas fa-truck" style="font-size:36px;color:var(--muted)"></i><p>No orders yet.</p></div>'
    : d.orders.map(function (o) {
      var pipeline = o.pipeline.map(function (step, i) {
        return '<div class="sc-step ' + (step.done ? 'done' : '') + '">' +
          '<div class="sc-step-icon">' + step.icon + '</div>' +
          '<div class="sc-step-label">' + esc2(step.step) + '</div>' +
          (i < o.pipeline.length - 1 ? '<div class="sc-arrow ' + (step.done ? 'done' : '') + '">&rarr;</div>' : '') +
          '</div>';
      }).join('');
      return '<div class="sc-order-card">' +
        '<div class="sc-order-hdr">' +
        '<span class="sc-order-id">#' + esc2(o.order_id) + '</span>' +
        '<strong>' + esc2(o.product) + '</strong>' +
        '<span class="sc-order-meta">' + fmt(o.quantity, 1) + ' units &middot; ' + fmtCur(o.value) + '</span>' +
        '<span class="sc-badge sc-badge-' + (o.status || '').toLowerCase() + '">' + esc2(o.status) + '</span>' +
        '</div>' +
        '<div class="sc-pipeline">' + pipeline + '</div>' +
        '</div>';
    }).join('');

  body.innerHTML = statsHtml + ordersHtml;
}

/* ================================================================
   MODULE 4: API HUB
   ================================================================ */
function loadApiHub() {
  var body = document.getElementById('apiHubBody');
  if (!body) return;
  body.innerHTML = '<div class="eco-spinner"><i class="fas fa-spinner fa-spin"></i> Loading integrations...</div>';
  fetch('/api/integrations', { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      try { renderApiHub(data, body); }
      catch (e) {
        body.innerHTML = '<div class="eco-err">Render error: ' + e.message + '</div>';
        console.error('renderApiHub error:', e);
      }
    })
    .catch(function (e) {
      body.innerHTML = '<div class="eco-err">Integration data unavailable: ' + e.message + '</div>';
      console.error('loadApiHub error:', e);
    });
}

function renderApiHub(d, body) {
  var s = d.summary;
  var statusColor = { connected: '#2de084', simulated: '#f8961e', available: '#888' };
  var statusLabel = { connected: 'Connected', simulated: 'Simulated', available: 'Available' };

  var statsHtml =
    '<div class="hub-stats-row">' +
    '<div class="hub-stat"><span class="hub-n" style="color:var(--success)">' + s.connected + '</span><span>Connected</span></div>' +
    '<div class="hub-stat"><span class="hub-n" style="color:#f8961e">' + s.simulated + '</span><span>Simulated</span></div>' +
    '<div class="hub-stat"><span class="hub-n" style="color:var(--muted)">' + s.available + '</span><span>Available</span></div>' +
    '<div class="hub-stat"><span class="hub-n" style="color:var(--accent)">' + s.free_apis + '</span><span>Free APIs</span></div>' +
    '<div class="hub-stat"><span class="hub-n">' + s.total + '</span><span>Total</span></div>' +
    '</div>';

  var catHtml = Object.keys(d.categories).map(function (cat) {
    var apis = d.categories[cat];
    var apiCards = apis.map(function (api) {
      var sc = statusColor[api.status] || '#888';
      var sl = statusLabel[api.status] || api.status;
      return '<div class="hub-api-card">' +
        '<div class="hub-api-top">' +
        '<span class="hub-api-icon">' + api.icon + '</span>' +
        '<div>' +
        '<div class="hub-api-name"><a href="' + esc2(api.url) + '" target="_blank" rel="noopener">' + esc2(api.name) + '</a></div>' +
        '<div class="hub-api-status" style="color:' + sc + '">' + sl + '</div>' +
        '</div>' +
        (api.free ? '<span class="hub-free-badge">FREE</span>' : '') +
        '</div>' +
        '<div class="hub-api-desc">' + esc2(api.desc) + '</div>' +
        '</div>';
    }).join('');
    return '<div class="hub-category">' +
      '<div class="hub-cat-title">' + esc2(cat) + '</div>' +
      '<div class="hub-api-grid">' + apiCards + '</div>' +
      '</div>';
  }).join('');

  body.innerHTML = statsHtml + catHtml;
}

/* ================================================================
   Expose public functions on window so dashboard.js can call them
   ================================================================ */
window.loadWeather = loadWeather;
window.loadMarketPrices = loadMarketPrices;
window.loadSupplyChain = loadSupplyChain;
window.loadApiHub = loadApiHub;

/* MutationObserver fallback - also triggers on tab class change */
document.addEventListener('DOMContentLoaded', function () {
  var tabObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        var el = m.target;
        if (el.classList.contains('active')) {
          var id = el.id;
          if (id === 'tab-weather') loadWeather();
          if (id === 'tab-market-prices') loadMarketPrices();
          if (id === 'tab-supply-chain') loadSupplyChain();
          if (id === 'tab-api-hub') loadApiHub();
        }
      }
    });
  });
  ['tab-weather', 'tab-market-prices', 'tab-supply-chain', 'tab-api-hub'].forEach(function (tid) {
    var el = document.getElementById(tid);
    if (el) tabObserver.observe(el, { attributes: true });
  });
});
