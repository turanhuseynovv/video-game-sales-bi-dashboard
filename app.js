/* ============================================================
   VIDEO GAME SALES BI DASHBOARD — Application Logic
   Features: ETL, Filtering, Chart.js Integration, Dynamic Insights
   ============================================================ */

// --- Global State ---
const state = {
  rawData: [],
  cleanData: [],
  filteredData: [],
  filters: {
    year: 'all',
    platform: 'all',
    genre: 'all',
    publisher: 'all'
  },
  charts: {},
  tableState: {
    topGames: { sortCol: 'Global_Sales', sortDesc: true },
    detail: { sortCol: 'Global_Sales', sortDesc: true, page: 1, limit: 100, search: '' }
  }
};

// --- DOM Elements ---
const DOM = {
  overlay: document.getElementById('loadingOverlay'),
  tabs: document.querySelectorAll('.nav-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  // Filters
  filterYear: document.getElementById('filterYear'),
  filterPlatform: document.getElementById('filterPlatform'),
  filterGenre: document.getElementById('filterGenre'),
  filterPublisher: document.getElementById('filterPublisher'),
  filterReset: document.getElementById('filterReset'),
  // KPIs
  kpiGlobalValue: document.getElementById('kpiGlobalValue'),
  kpiGlobalTrend: document.getElementById('kpiGlobalTrend'),
  kpiGlobalSub: document.getElementById('kpiGlobalSub'),
  kpiGamesValue: document.getElementById('kpiGamesValue'),
  kpiGamesTrend: document.getElementById('kpiGamesTrend'),
  kpiGamesSub: document.getElementById('kpiGamesSub'),
  kpiPlatformValue: document.getElementById('kpiPlatformValue'),
  kpiPlatformTrend: document.getElementById('kpiPlatformTrend'),
  kpiPlatformSub: document.getElementById('kpiPlatformSub'),
  kpiGenreValue: document.getElementById('kpiGenreValue'),
  kpiGenreTrend: document.getElementById('kpiGenreTrend'),
  kpiGenreSub: document.getElementById('kpiGenreSub'),
  kpiAvgValue: document.getElementById('kpiAvgValue'),
  kpiAvgTrend: document.getElementById('kpiAvgTrend'),
  kpiAvgSub: document.getElementById('kpiAvgSub'),
  // Insights
  insightOverviewList: document.getElementById('insightOverviewList'),
  insightRegionalList: document.getElementById('insightRegionalList'),
  insightPublisherList: document.getElementById('insightPublisherList'),
  // Tables
  tbodyTopGames: document.getElementById('tbodyTopGames'),
  searchTopGames: document.getElementById('searchTopGames'),
  tbodyDetail: document.getElementById('tbodyDetail'),
  searchDetail: document.getElementById('searchDetail'),
  paginationInfo: document.getElementById('paginationInfo'),
  paginationBtns: document.getElementById('paginationBtns'),
  // Heatmap & Treemap
  heatmapContainer: document.getElementById('heatmapContainer'),
  treemapContainer: document.getElementById('treemapContainer'),
  // Footer
  footerRaw: document.getElementById('footerRaw'),
  footerClean: document.getElementById('footerClean'),
  footerFiltered: document.getElementById('footerFiltered')
};

// --- Utilities ---
const formatCurrency = (val) => {
  if (val === 0) return "0";
  if (val >= 1000) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val / 1000) + ' Milyar';
  } else if (val >= 1) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' Milyon';
  } else {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val * 1000) + ' Bin';
  }
};
const formatNumber = (val) => new Intl.NumberFormat('tr-TR').format(val);
const getTrendClass = (val) => val > 0 ? 'up' : val < 0 ? 'down' : 'neutral';
const getTrendIcon = (val) => val > 0 ? '↑' : val < 0 ? '↓' : '−';

// --- Chart Color Palette ---
function getChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    accent: '#6366f1',
    na: '#3b82f6',
    eu: '#10b981',
    jp: '#f59e0b',
    other: '#8b5cf6',
    text: isLight ? '#0f172a' : '#e2e8f0',
    grid: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)'
  };
}

Chart.defaults.font.family = 'Inter';

// --- 1. ETL Process (Extract, Transform, Load) ---
function runETL(csvString) {
  Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      state.rawData = results.data;
      DOM.footerRaw.textContent = formatNumber(state.rawData.length);
      
      state.cleanData = state.rawData.map(row => {
        // Handle missing Year
        let year = row.Year;
        if (!year || isNaN(year) || year === 'N/A') {
          year = 'Bilinmiyor';
        }
        
        // Handle missing Publisher
        let publisher = row.Publisher;
        if (!publisher || publisher === 'N/A' || publisher.trim() === '') {
          publisher = 'Bilinmiyor';
        }

        return {
          ...row,
          Year: year,
          Publisher: publisher,
          Global_Sales: parseFloat(row.Global_Sales) || 0,
          NA_Sales: parseFloat(row.NA_Sales) || 0,
          EU_Sales: parseFloat(row.EU_Sales) || 0,
          JP_Sales: parseFloat(row.JP_Sales) || 0,
          Other_Sales: parseFloat(row.Other_Sales) || 0
        };
      });

      // Validations: Remove items without Rank or Name
      state.cleanData = state.cleanData.filter(d => d.Rank && d.Name);
      
      DOM.footerClean.textContent = formatNumber(state.cleanData.length);
      state.filteredData = [...state.cleanData];
      
      initApp();
    }
  });
}

function loadData() {
  fetch('vgsales.csv')
    .then(response => {
      if(!response.ok) throw new Error("CSV bulunamadı");
      return response.text();
    })
    .then(csv => runETL(csv))
    .catch(err => {
      console.error('Veri yükleme hatası:', err);
      DOM.loadingOverlay.innerHTML = '<div style="color:#ef4444">Veri yüklenemedi. Kaggle vgsales.csv dosyasının proje dizininde olduğundan emin olun.</div>';
    });
}

// --- 2. Filters ---
function initFilters() {
  const years = [...new Set(state.cleanData.map(d => d.Year))].filter(y => y !== 'Bilinmiyor').sort((a,b)=>b-a);
  const platforms = [...new Set(state.cleanData.map(d => d.Platform))].sort();
  const genres = [...new Set(state.cleanData.map(d => d.Genre))].sort();
  const publishers = [...new Set(state.cleanData.map(d => d.Publisher))].sort();

  years.forEach(y => DOM.filterYear.add(new Option(y, y)));
  DOM.filterYear.add(new Option('Bilinmeyen Yıl', 'Bilinmiyor'));
  platforms.forEach(p => DOM.filterPlatform.add(new Option(p, p)));
  genres.forEach(g => DOM.filterGenre.add(new Option(g, g)));
  publishers.forEach(p => DOM.filterPublisher.add(new Option(p, p)));

  // Event Listeners
  [DOM.filterYear, DOM.filterPlatform, DOM.filterGenre, DOM.filterPublisher].forEach(el => {
    el.addEventListener('change', applyFilters);
  });
  
  DOM.filterReset.addEventListener('click', () => {
    DOM.filterYear.value = 'all';
    DOM.filterPlatform.value = 'all';
    DOM.filterGenre.value = 'all';
    DOM.filterPublisher.value = 'all';
    applyFilters();
  });
}

function applyFilters() {
  state.filters.year = DOM.filterYear.value;
  state.filters.platform = DOM.filterPlatform.value;
  state.filters.genre = DOM.filterGenre.value;
  state.filters.publisher = DOM.filterPublisher.value;

  state.filteredData = state.cleanData.filter(d => {
    return (state.filters.year === 'all' || String(d.Year) === state.filters.year) &&
           (state.filters.platform === 'all' || d.Platform === state.filters.platform) &&
           (state.filters.genre === 'all' || d.Genre === state.filters.genre) &&
           (state.filters.publisher === 'all' || d.Publisher === state.filters.publisher);
  });

  DOM.footerFiltered.textContent = formatNumber(state.filteredData.length);
  
  // Reset pagination
  state.tableState.detail.page = 1;
  
  updateDashboard();
}

// --- 3. YoY Calculations ---
function calculateYoY(metric, isCount = false) {
  let currentYear, prevYear;
  
  if (state.filters.year !== 'all' && state.filters.year !== 'Bilinmiyor') {
    currentYear = parseInt(state.filters.year);
    prevYear = currentYear - 1;
  } else {
    // If no year selected, base it on the latest valid year in filtered data
    const validYears = state.filteredData.map(d => d.Year).filter(y => y !== 'Bilinmiyor');
    if (validYears.length === 0) return { val: 0, str: 'N/A', cls: 'neutral' };
    currentYear = Math.max(...validYears);
    prevYear = currentYear - 1;
  }

  const currentData = state.filteredData.filter(d => d.Year === currentYear);
  // Need to look at cleanData for prevYear so filters (like platform) still apply but we get the real prev year
  const basePrevData = state.cleanData.filter(d => {
    return d.Year === prevYear &&
           (state.filters.platform === 'all' || d.Platform === state.filters.platform) &&
           (state.filters.genre === 'all' || d.Genre === state.filters.genre) &&
           (state.filters.publisher === 'all' || d.Publisher === state.filters.publisher);
  });

  let currentVal = 0, prevVal = 0;
  
  if (isCount) {
    currentVal = currentData.length;
    prevVal = basePrevData.length;
  } else if (metric === 'Global_Sales') {
    currentVal = currentData.reduce((sum, d) => sum + d.Global_Sales, 0);
    prevVal = basePrevData.reduce((sum, d) => sum + d.Global_Sales, 0);
  } else if (metric === 'Avg_Sales') {
    currentVal = currentData.length ? currentData.reduce((sum, d) => sum + d.Global_Sales, 0) / currentData.length : 0;
    prevVal = basePrevData.length ? basePrevData.reduce((sum, d) => sum + d.Global_Sales, 0) / basePrevData.length : 0;
  }

  if (prevVal === 0) {
    if(currentVal > 0) return { val: 100, str: '↑ 100% YoY', cls: 'up' };
    return { val: 0, str: '− YoY', cls: 'neutral' };
  }

  const pctChange = ((currentVal - prevVal) / prevVal) * 100;
  const cls = getTrendClass(pctChange);
  const icon = getTrendIcon(pctChange);
  
  return { 
    val: pctChange, 
    str: `${icon} ${Math.abs(pctChange).toFixed(1)}% YoY`, 
    cls: cls 
  };
}

// --- 4. Render KPIs ---
function updateKPIs() {
  const data = state.filteredData;
  if(data.length === 0) {
    ['GlobalValue','GamesValue','PlatformValue','GenreValue','AvgValue'].forEach(id => DOM[`kpi${id}`].textContent = '0');
    return;
  }

  // 1. Toplam Global Satış
  const totalSales = data.reduce((sum, d) => sum + d.Global_Sales, 0);
  DOM.kpiGlobalValue.textContent = formatCurrency(totalSales);
  const yoySales = calculateYoY('Global_Sales');
  DOM.kpiGlobalTrend.textContent = yoySales.str;
  DOM.kpiGlobalTrend.className = `kpi-trend ${yoySales.cls}`;
  DOM.kpiGlobalSub.textContent = state.filters.year === 'all' ? 'Son yıla göre değişim' : `${state.filters.year} YoY`;

  // 2. Toplam Oyun
  DOM.kpiGamesValue.textContent = formatNumber(data.length);
  const yoyGames = calculateYoY('Count', true);
  DOM.kpiGamesTrend.textContent = yoyGames.str;
  DOM.kpiGamesTrend.className = `kpi-trend ${yoyGames.cls}`;
  DOM.kpiGamesSub.textContent = 'Veri setindeki kayıt sayısı';

  // 3. En Çok Satan Platform
  const platforms = {};
  data.forEach(d => { platforms[d.Platform] = (platforms[d.Platform] || 0) + d.Global_Sales; });
  const topPlatform = Object.entries(platforms).sort((a,b)=>b[1]-a[1])[0];
  DOM.kpiPlatformValue.textContent = topPlatform ? topPlatform[0] : '-';
  DOM.kpiPlatformTrend.textContent = topPlatform ? formatCurrency(topPlatform[1]) + ' Adet' : '0 Adet';
  DOM.kpiPlatformTrend.className = `kpi-trend neutral`;
  DOM.kpiPlatformSub.textContent = 'Toplam satış lideri';

  // 4. En Popüler Tür
  const genres = {};
  data.forEach(d => { genres[d.Genre] = (genres[d.Genre] || 0) + d.Global_Sales; });
  const topGenre = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0];
  DOM.kpiGenreValue.textContent = topGenre ? topGenre[0] : '-';
  const genrePct = topGenre && totalSales > 0 ? (topGenre[1]/totalSales)*100 : 0;
  DOM.kpiGenreTrend.textContent = `${genrePct.toFixed(1)}%`;
  DOM.kpiGenreTrend.className = `kpi-trend neutral`;
  DOM.kpiGenreSub.textContent = 'Toplam satıştaki payı';

  // 5. Ortalama Satış / Oyun
  const avgSales = totalSales / data.length;
  DOM.kpiAvgValue.textContent = formatCurrency(avgSales) + ' Adet';
  const yoyAvg = calculateYoY('Avg_Sales');
  DOM.kpiAvgTrend.textContent = yoyAvg.str;
  DOM.kpiAvgTrend.className = `kpi-trend ${yoyAvg.cls}`;
  DOM.kpiAvgSub.textContent = 'Oyun başına ortalama satış miktarı';
}

// --- 5. Chart Generators ---
function generateColors(count, startColor = chartColors.accent) {
  // Simple opacity steps for bar charts
  const colors = [];
  for(let i=0; i<count; i++) {
    const alpha = 1 - (i * (0.8 / count));
    colors.push(startColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`).replace('#6366f1', `rgba(99, 102, 241, ${alpha})`));
  }
  return colors;
}

function updateCharts() {
  const chartColors = getChartColors();
  Chart.defaults.color = chartColors.text;

  const data = state.filteredData;
  const validYearData = data.filter(d => d.Year !== 'Bilinmiyor');

  // --- 1. Yıllara Göre Satış Trendi (Line) ---
  // Trend grafikleri için "Yıl" filtresini Yoksay (Tarihsel bağlamı kaybetmemek için)
  const trendData = state.cleanData.filter(d => {
    return d.Year !== 'Bilinmiyor' &&
           (state.filters.platform === 'all' || d.Platform === state.filters.platform) &&
           (state.filters.genre === 'all' || d.Genre === state.filters.genre) &&
           (state.filters.publisher === 'all' || d.Publisher === state.filters.publisher);
  });

  const yearsObj = {};
  trendData.forEach(d => {
    if(!yearsObj[d.Year]) yearsObj[d.Year] = { na: 0, eu: 0, jp: 0, other: 0 };
    yearsObj[d.Year].na += d.NA_Sales;
    yearsObj[d.Year].eu += d.EU_Sales;
    yearsObj[d.Year].jp += d.JP_Sales;
    yearsObj[d.Year].other += d.Other_Sales;
  });
  const trendYears = Object.keys(yearsObj).sort();
  
  if(state.charts.trend) state.charts.trend.destroy();
  state.charts.trend = new Chart(document.getElementById('chartTrend'), {
    type: 'line',
    data: {
      labels: trendYears,
      datasets: [
        { label: 'Kuzey Amerika', data: trendYears.map(y => yearsObj[y].na), borderColor: chartColors.na, tension: 0.4, borderDash: [] },
        { label: 'Avrupa', data: trendYears.map(y => yearsObj[y].eu), borderColor: chartColors.eu, tension: 0.4, borderDash: [5, 5] },
        { label: 'Japonya', data: trendYears.map(y => yearsObj[y].jp), borderColor: chartColors.jp, tension: 0.4, borderDash: [2, 2] },
        { label: 'Diğer', data: trendYears.map(y => yearsObj[y].other), borderColor: chartColors.other, tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        tooltip: { 
          mode: 'index', 
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw) + ' Adet';
            }
          }
        } 
      },
      scales: {
        x: { grid: { color: chartColors.grid } },
        y: { grid: { color: chartColors.grid }, beginAtZero: true }
      }
    }
  });

  // --- 2. Türlere Göre Satış Dağılımı (Bar) ---
  const genreSales = {};
  data.forEach(d => { genreSales[d.Genre] = (genreSales[d.Genre] || 0) + d.Global_Sales; });
  const sortedGenres = Object.entries(genreSales).sort((a,b)=>b[1]-a[1]);
  
  if(state.charts.genre) state.charts.genre.destroy();
  state.charts.genre = new Chart(document.getElementById('chartGenre'), {
    type: 'bar',
    data: {
      labels: sortedGenres.map(g => g[0]),
      datasets: [{
        label: 'Satış Miktarı',
        data: sortedGenres.map(g => g[1]),
        backgroundColor: generateColors(sortedGenres.length, '#6366f1'),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw) + ' Adet';
            }
          }
        }
      },
      scales: { x: { grid: { color: chartColors.grid } }, y: { grid: { display: false } } }
    }
  });

  // --- 3. Platformlara Göre Karşılaştırma (Top 10 Bar) ---
  const platformSales = {};
  data.forEach(d => { platformSales[d.Platform] = (platformSales[d.Platform] || 0) + d.Global_Sales; });
  const top10Platforms = Object.entries(platformSales).sort((a,b)=>b[1]-a[1]).slice(0, 10);
  
  if(state.charts.platform) state.charts.platform.destroy();
  state.charts.platform = new Chart(document.getElementById('chartPlatform'), {
    type: 'bar',
    data: {
      labels: top10Platforms.map(p => p[0]),
      datasets: [{
        label: 'Satış Miktarı',
        data: top10Platforms.map(p => p[1]),
        backgroundColor: chartColors.accent,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw) + ' Adet';
            }
          }
        }
      },
      scales: { x: { grid: { color: chartColors.grid } }, y: { grid: { display: false } } }
    }
  });

  // --- 4. Bölgesel Pazar Payı (Donut) ---
  const regionTotals = data.reduce((acc, d) => {
    acc.na += d.NA_Sales; acc.eu += d.EU_Sales; acc.jp += d.JP_Sales; acc.other += d.Other_Sales;
    return acc;
  }, { na: 0, eu: 0, jp: 0, other: 0 });
  
  if(state.charts.regionDonut) state.charts.regionDonut.destroy();
  state.charts.regionDonut = new Chart(document.getElementById('chartRegionDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Kuzey Amerika', 'Avrupa', 'Japonya', 'Diğer'],
      datasets: [{
        data: [regionTotals.na, regionTotals.eu, regionTotals.jp, regionTotals.other],
        backgroundColor: [chartColors.na, chartColors.eu, chartColors.jp, chartColors.other],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: chartColors.text } },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) label += ': ';
              return label + formatCurrency(context.raw) + ' Adet';
            }
          }
        }
      },
      cutout: '70%'
    }
  });

  // --- 5. Yıllara Göre Bölgesel Stacked Bar ---
  if(state.charts.regionStacked) state.charts.regionStacked.destroy();
  state.charts.regionStacked = new Chart(document.getElementById('chartRegionStacked'), {
    type: 'bar',
    data: {
      labels: trendYears,
      datasets: [
        { label: 'Kuzey Amerika', data: trendYears.map(y => yearsObj[y].na), backgroundColor: chartColors.na },
        { label: 'Avrupa', data: trendYears.map(y => yearsObj[y].eu), backgroundColor: chartColors.eu },
        { label: 'Japonya', data: trendYears.map(y => yearsObj[y].jp), backgroundColor: chartColors.jp },
        { label: 'Diğer', data: trendYears.map(y => yearsObj[y].other), backgroundColor: chartColors.other }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { color: chartColors.grid } }
      },
      plugins: { 
        legend: { position: 'top', labels: { color: chartColors.text } },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw) + ' Adet';
            }
          }
        }
      }
    }
  });

  // --- 6. Top 15 Publisher (Bar) ---
  const pubSales = {};
  data.forEach(d => { pubSales[d.Publisher] = (pubSales[d.Publisher] || 0) + d.Global_Sales; });
  const top15Pubs = Object.entries(pubSales).sort((a,b)=>b[1]-a[1]).slice(0, 15);
  
  if(state.charts.publisher) state.charts.publisher.destroy();
  state.charts.publisher = new Chart(document.getElementById('chartPublisher'), {
    type: 'bar',
    data: {
      labels: top15Pubs.map(p => p[0].substring(0,20) + (p[0].length>20?'...':'')),
      datasets: [{
        label: 'Satış Miktarı',
        data: top15Pubs.map(p => p[1]),
        backgroundColor: chartColors.accent,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.raw) + ' Adet';
            }
          }
        }
      },
      scales: { x: { grid: { color: chartColors.grid } }, y: { grid: { display: false } } }
    }
  });

  // --- 7. Platform x Region Heatmap ---
  renderHeatmap(platformSales, data);

  // --- 8. Publisher x Genre Treemap ---
  renderTreemap(top15Pubs, data);
}

function renderHeatmap(platformSales, data) {
  const top12Plats = Object.entries(platformSales).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(p=>p[0]);
  const regions = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales'];
  
  let html = '<table class="heatmap-table"><thead><tr><th>Platform</th><th>Kuzey Amerika</th><th>Avrupa</th><th>Japonya</th><th>Diğer</th></tr></thead><tbody>';
  
  // Find max value for color scaling
  let maxVal = 0;
  const platRegSales = {};
  top12Plats.forEach(p => {
    platRegSales[p] = { NA_Sales:0, EU_Sales:0, JP_Sales:0, Other_Sales:0 };
    data.filter(d => d.Platform === p).forEach(d => {
      regions.forEach(r => { platRegSales[p][r] += d[r]; });
    });
    regions.forEach(r => { if(platRegSales[p][r] > maxVal) maxVal = platRegSales[p][r]; });
  });

  top12Plats.forEach(p => {
    html += `<tr><td>${p}</td>`;
    regions.forEach(r => {
      const val = platRegSales[p][r];
      const intensity = maxVal > 0 ? (val / maxVal) : 0;
      // Using accent color for heatmap
      const bg = `rgba(99, 102, 241, ${Math.max(0.1, intensity)})`;
      const textColor = intensity > 0.5 ? '#fff' : 'var(--text-primary)';
      html += `<td><span class="heatmap-cell" style="background:${bg}; color:${textColor}">${formatCurrency(val)}</span></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  DOM.heatmapContainer.innerHTML = html;
}

function renderTreemap(topPubs, data) {
  const container = DOM.treemapContainer;
  container.innerHTML = '';
  if(topPubs.length === 0) return;

  const topPubNames = topPubs.map(p => p[0]);
  const pubGenreData = {};
  
  data.filter(d => topPubNames.includes(d.Publisher)).forEach(d => {
    if(!pubGenreData[d.Publisher]) pubGenreData[d.Publisher] = {};
    pubGenreData[d.Publisher][d.Genre] = (pubGenreData[d.Publisher][d.Genre] || 0) + d.Global_Sales;
  });

  // Flatten for treemap
  const items = [];
  Object.keys(pubGenreData).forEach(pub => {
    Object.keys(pubGenreData[pub]).forEach(genre => {
      items.push({ pub, genre, val: pubGenreData[pub][genre] });
    });
  });
  
  // Sort and take top 25 blocks
  items.sort((a,b)=>b.val - a.val);
  const topItems = items.slice(0, 25);
  const totalTopVal = topItems.reduce((sum, item) => sum + item.val, 0);

  let html = '<div class="treemap-grid">';
  topItems.forEach((item, i) => {
    const pct = (item.val / totalTopVal) * 100;
    // Base size mapping: 
    // Very rough heuristic for CSS flex box to act like a treemap
    const flexGrow = Math.max(1, Math.round(pct));
    const flexBasis = Math.max(10, pct) + '%';
    
    // Assign color based on Genre (simple hash)
    const hue = (item.genre.length * 25) % 360;
    const bg = `hsl(${hue}, 70%, 40%)`;

    html += `
      <div class="treemap-item" style="flex: ${flexGrow} 1 ${flexBasis}; background: ${bg};" title="${item.pub} - ${item.genre}: ${formatCurrency(item.val)} Adet">
        <div class="treemap-item-label">${item.pub}<br><span style="opacity:0.8; font-weight:400">${item.genre}</span></div>
        <div class="treemap-item-value">${formatCurrency(item.val)} Adet</div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// --- 6. Dynamic Insights ---
function updateInsights() {
  const data = state.filteredData;
  const totalGlobal = data.reduce((sum, d) => sum + d.Global_Sales, 0);
  
  // Overview Insights
  let oHtml = '';
  if (data.length > 0) {
    const topGame = [...data].sort((a,b)=>b.Global_Sales - a.Global_Sales)[0];
    oHtml += `<li><strong>${topGame.Name}</strong>, ${formatCurrency(topGame.Global_Sales)} Adet satışla mevcut filtredeki en çok satan oyundur.</li>`;
    
    const platforms = {}; data.forEach(d => { platforms[d.Platform] = (platforms[d.Platform]||0)+d.Global_Sales; });
    const topPlat = Object.entries(platforms).sort((a,b)=>b[1]-a[1])[0];
    const platPct = ((topPlat[1]/totalGlobal)*100).toFixed(1);
    oHtml += `<li><strong>${topPlat[0]}</strong> platformu, toplam satışın <strong>%${platPct}</strong>'sini oluşturarak pazar lideridir.</li>`;
    
    const genres = {}; data.forEach(d => { genres[d.Genre] = (genres[d.Genre]||0)+d.Global_Sales; });
    const topGen = Object.entries(genres).sort((a,b)=>b[1]-a[1])[0];
    oHtml += `<li>Tüketiciler en çok <strong>${topGen[0]}</strong> türüne ilgi göstermiştir (${formatCurrency(topGen[1])} Adet toplam hacim).</li>`;
  } else {
    oHtml = '<li>Seçili filtreler için veri bulunamadı.</li>';
  }
  DOM.insightOverviewList.innerHTML = oHtml;

  // Regional Insights
  let rHtml = '';
  if (data.length > 0) {
    const rTotals = {
      na: data.reduce((sum, d) => sum + d.NA_Sales, 0),
      eu: data.reduce((sum, d) => sum + d.EU_Sales, 0),
      jp: data.reduce((sum, d) => sum + d.JP_Sales, 0)
    };
    const maxReg = Object.keys(rTotals).reduce((a, b) => rTotals[a] > rTotals[b] ? a : b);
    const regNames = { na: 'Kuzey Amerika', eu: 'Avrupa', jp: 'Japonya' };
    const maxRegPct = ((rTotals[maxReg]/totalGlobal)*100).toFixed(1);
    
    rHtml += `<li><strong>${regNames[maxReg]}</strong>, global satışın <strong>%${maxRegPct}</strong>'sini oluşturarak en büyük pazar konumundadır.</li>`;
    
    // Japan specificity
    const jpGenres = {}; data.forEach(d => { jpGenres[d.Genre] = (jpGenres[d.Genre]||0)+d.JP_Sales; });
    const topJpGen = Object.entries(jpGenres).sort((a,b)=>b[1]-a[1])[0];
    if(topJpGen && topJpGen[1] > 0) {
      rHtml += `<li>Japonya pazarında <strong>${topJpGen[0]}</strong> türü ${formatCurrency(topJpGen[1])} satışla net bir dominasyona sahiptir.</li>`;
    }
  } else {
    rHtml = '<li>Veri bulunamadı.</li>';
  }
  DOM.insightRegionalList.innerHTML = rHtml;

  // Publisher Insights
  let pHtml = '';
  if (data.length > 0) {
    const pubs = {}; data.forEach(d => { pubs[d.Publisher] = (pubs[d.Publisher]||0)+d.Global_Sales; });
    const sortedPubs = Object.entries(pubs).sort((a,b)=>b[1]-a[1]);
    const pubTotal = data.reduce((sum, d) => sum + d.Global_Sales, 0);
    const topPub = sortedPubs[0];
    
    pHtml += `<li><strong>${topPub[0]}</strong>, toplam ${formatCurrency(topPub[1])} Adet satışla en başarılı yayıncıdır.</li>`;
    
    let top5Sales = 0;
    for(let i=0; i<Math.min(5, sortedPubs.length); i++) top5Sales += sortedPubs[i][1];
    const top5Pct = pubTotal > 0 ? ((top5Sales/pubTotal)*100).toFixed(1) : 0;
    pHtml += `<li>Pazar oldukça konsantredir. En büyük 5 yayıncı toplam pazarın <strong>%${top5Pct}</strong>'sini kontrol etmektedir.</li>`;
  } else {
    pHtml = '<li>Veri bulunamadı.</li>';
  }
  DOM.insightPublisherList.innerHTML = pHtml;
}

// --- 7. Tables ---
function renderTableTr(d) {
  return `<tr>
    <td class="rank-cell">#${d.Rank}</td>
    <td><strong>${d.Name}</strong></td>
    <td><span class="chart-badge" style="background:var(--bg-tertiary); color:var(--text-primary)">${d.Platform}</span></td>
    <td>${d.Year}</td>
    <td>${d.Genre}</td>
    <td>${d.Publisher}</td>
    <td class="sales-cell">${formatCurrency(d.Global_Sales)}</td>
    <td class="sales-cell sales-na">${formatCurrency(d.NA_Sales)}</td>
    <td class="sales-cell sales-eu">${formatCurrency(d.EU_Sales)}</td>
    <td class="sales-cell sales-jp">${formatCurrency(d.JP_Sales)}</td>
  </tr>`;
}

function updateTables() {
  let data = [...state.filteredData];
  
  // -- Top 20 Table --
  const searchTop = DOM.searchTopGames.value.toLowerCase();
  let topData = data.filter(d => String(d.Name).toLowerCase().includes(searchTop));
  
  // Sort Top 20
  const tState = state.tableState.topGames;
  topData.sort((a,b) => {
    let valA = a[tState.sortCol], valB = b[tState.sortCol];
    if(typeof valA === 'string') valA = valA.toLowerCase();
    if(typeof valB === 'string') valB = valB.toLowerCase();
    if(valA < valB) return tState.sortDesc ? 1 : -1;
    if(valA > valB) return tState.sortDesc ? -1 : 1;
    return 0;
  });
  
  DOM.tbodyTopGames.innerHTML = topData.slice(0, 20).map(renderTableTr).join('');

  // -- Detail Table (Tab 3) --
  const searchDet = state.tableState.detail.search.toLowerCase();
  let detData = data.filter(d => 
    String(d.Name).toLowerCase().includes(searchDet) || 
    String(d.Publisher).toLowerCase().includes(searchDet) ||
    String(d.Platform).toLowerCase().includes(searchDet)
  );

  // Sort Detail
  const dState = state.tableState.detail;
  detData.sort((a,b) => {
    let valA = a[dState.sortCol], valB = b[dState.sortCol];
    if(typeof valA === 'string') valA = valA.toLowerCase();
    if(typeof valB === 'string') valB = valB.toLowerCase();
    if(valA < valB) return dState.sortDesc ? 1 : -1;
    if(valA > valB) return dState.sortDesc ? -1 : 1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(detData.length / dState.limit);
  if(dState.page > totalPages) dState.page = Math.max(1, totalPages);
  
  const startIdx = (dState.page - 1) * dState.limit;
  const paginatedData = detData.slice(startIdx, startIdx + dState.limit);
  
  DOM.tbodyDetail.innerHTML = paginatedData.map(d => {
    return renderTableTr(d).replace('</tr>', `<td class="sales-cell sales-other">${formatCurrency(d.Other_Sales)}</td></tr>`);
  }).join('');

  // Pagination UI
  DOM.paginationInfo.textContent = `Toplam ${formatNumber(detData.length)} kayıt, Sayfa ${dState.page} / ${totalPages}`;
  
  let pBtns = `<button class="pagination-btn" ${dState.page===1?'disabled':''} onclick="changePage(1)">İlk</button>`;
  pBtns += `<button class="pagination-btn" ${dState.page===1?'disabled':''} onclick="changePage(${dState.page-1})">Önceki</button>`;
  pBtns += `<button class="pagination-btn" ${dState.page===totalPages||totalPages===0?'disabled':''} onclick="changePage(${dState.page+1})">Sonraki</button>`;
  DOM.paginationBtns.innerHTML = pBtns;

  updateTableHeaders();
}

window.changePage = function(page) {
  state.tableState.detail.page = page;
  updateTables();
};

function updateTableHeaders() {
  // Update Top Games Headers
  document.querySelectorAll('#tableTopGames th').forEach(th => {
    th.classList.remove('sorted');
    th.querySelector('.sort-icon').textContent = '▼';
    if(th.dataset.sort === state.tableState.topGames.sortCol) {
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = state.tableState.topGames.sortDesc ? '▼' : '▲';
    }
  });
  // Update Detail Headers
  document.querySelectorAll('#tableDetail th').forEach(th => {
    th.classList.remove('sorted');
    th.querySelector('.sort-icon').textContent = '▼';
    if(th.dataset.sort === state.tableState.detail.sortCol) {
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = state.tableState.detail.sortDesc ? '▼' : '▲';
    }
  });
}

// Table Sort Listeners
document.querySelectorAll('#tableTopGames th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if(state.tableState.topGames.sortCol === col) {
      state.tableState.topGames.sortDesc = !state.tableState.topGames.sortDesc;
    } else {
      state.tableState.topGames.sortCol = col;
      state.tableState.topGames.sortDesc = true;
    }
    updateTables();
  });
});

document.querySelectorAll('#tableDetail th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if(state.tableState.detail.sortCol === col) {
      state.tableState.detail.sortDesc = !state.tableState.detail.sortDesc;
    } else {
      state.tableState.detail.sortCol = col;
      state.tableState.detail.sortDesc = true;
    }
    state.tableState.detail.page = 1;
    updateTables();
  });
});

// Table Search Listeners
DOM.searchTopGames.addEventListener('input', () => updateTables());
DOM.searchDetail.addEventListener('input', (e) => {
  state.tableState.detail.search = e.target.value;
  state.tableState.detail.page = 1;
  updateTables();
});

// --- Master Update ---
function updateDashboard() {
  updateKPIs();
  updateCharts();
  updateInsights();
  updateTables();
}

// --- Navigation Logic ---
DOM.tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.tabs.forEach(t => t.classList.remove('active'));
    DOM.tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`content${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`).classList.add('active');
    
    // Trigger Chart.js resize since display:none messes up canvas sizing
    setTimeout(() => {
      Object.values(state.charts).forEach(chart => {
        if(chart) chart.resize();
      });
    }, 50);
  });
});

// --- Initialization ---
function initApp() {
  initFilters();
  applyFilters(); // This calls updateDashboard()
  
  // Hide Loader
  setTimeout(() => {
    DOM.overlay.classList.add('hidden');
  }, 500);
}

// --- Export Functions ---
window.exportData = function(tableType, format) {
  let dataToExport = [];
  
  if (tableType === 'topGames') {
    // We export the first 20 rows of sorted data
    const tState = state.tableState.topGames;
    let topData = [...state.filteredData];
    topData.sort((a,b) => {
      let valA = a[tState.sortCol], valB = b[tState.sortCol];
      if(valA < valB) return tState.sortDesc ? 1 : -1;
      if(valA > valB) return tState.sortDesc ? -1 : 1;
      return 0;
    });
    dataToExport = topData.slice(0, 20);
  } else {
    // Export all filtered data for 'detail'
    const searchDet = state.tableState.detail.search.toLowerCase();
    let detData = state.filteredData.filter(d => 
      String(d.Name).toLowerCase().includes(searchDet) || 
      String(d.Publisher).toLowerCase().includes(searchDet) ||
      String(d.Platform).toLowerCase().includes(searchDet)
    );
    const dState = state.tableState.detail;
    detData.sort((a,b) => {
      let valA = a[dState.sortCol], valB = b[dState.sortCol];
      if(valA < valB) return dState.sortDesc ? 1 : -1;
      if(valA > valB) return dState.sortDesc ? -1 : 1;
      return 0;
    });
    dataToExport = detData;
  }

  // Format data for export
  const exportArray = dataToExport.map(d => ({
    "Sıra": d.Rank,
    "Oyun Adı": d.Name,
    "Platform": d.Platform,
    "Yıl": d.Year,
    "Tür": d.Genre,
    "Yayıncı": d.Publisher,
    "Global Satış (Adet)": formatCurrency(d.Global_Sales) + ' Adet',
    "Kuzey Amerika": formatCurrency(d.NA_Sales) + ' Adet',
    "Avrupa": formatCurrency(d.EU_Sales) + ' Adet',
    "Japonya": formatCurrency(d.JP_Sales) + ' Adet',
    "Diğer": formatCurrency(d.Other_Sales) + ' Adet'
  }));

  if (format === 'csv') {
    const csv = Papa.unparse(exportArray);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `video_game_sales_${tableType}.csv`;
    link.click();
  } else if (format === 'excel') {
    const worksheet = XLSX.utils.json_to_sheet(exportArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");
    XLSX.writeFile(workbook, `video_game_sales_${tableType}.xlsx`);
  } else if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    doc.text(`Video Game Sales - ${tableType === 'topGames' ? 'Top 20 Oyun' : 'Detaylı Veri'}`, 14, 15);
    
    doc.autoTable({
      head: [Object.keys(exportArray[0])],
      body: exportArray.map(Object.values),
      startY: 20,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [99, 102, 241] }
    });
    
    doc.save(`video_game_sales_${tableType}.pdf`);
  }
};

// --- Theme Logic ---
const themeToggleBtn = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

if (currentTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
  themeToggleBtn.textContent = '🌙';
  Chart.defaults.color = '#0f172a'; // update chart default color for light theme
}

themeToggleBtn.addEventListener('click', () => {
  let theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
    themeToggleBtn.textContent = '☀️';
    Chart.defaults.color = '#e2e8f0';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    themeToggleBtn.textContent = '🌙';
    Chart.defaults.color = '#0f172a';
  }
  updateCharts();
});

// Boot
document.addEventListener('DOMContentLoaded', loadData);
