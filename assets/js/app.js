class RDFEApp {
    constructor() {
        this.currentEmiten = 'BBCA';
        this.currentModule = 'dashboard';
        this.dataManager = new DataManager();
        this.storage = new StorageHandler();
        this.init();
    }

    init() {
        // Initialize from localStorage or create default
        if (!this.storage.get('rdfe_emiten_list')) {
            this.initializeSampleData();
        }
        
        this.loadModule('dashboard');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auto-save on input change
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('auto-save')) {
                this.autoSave();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentData();
            }
        });
    }

    async loadModule(moduleName) {
        this.currentModule = moduleName;
        
        // Update active nav
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        event?.target.closest('.list-group-item').classList.add('active');
        
        const modules = {
            'dashboard': this.loadDashboard,
            'input': this.loadInputForm,
            'ratios': this.loadRatios,
            'valuation': this.loadValuation,
            'comparison': this.loadComparison,
            'settings': this.loadSettings
        };
        
        if (modules[moduleName]) {
            await modules[moduleName].call(this);
        }
    }

    async loadDashboard() {
        const data = this.dataManager.getEmitenData(this.currentEmiten);
        
        const html = `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <h2 class="mb-0">
                            <i class="fas fa-tachometer-alt me-2"></i>
                            Dashboard - ${this.currentEmiten}
                        </h2>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.editEmiten('${this.currentEmiten}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="app.refreshData()">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <p class="text-muted">Data terakhir update: ${new Date().toLocaleDateString('id-ID')}</p>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6">
                    <div class="kpi-card">
                        <div class="kpi-label">Market Cap</div>
                        <div class="kpi-value">${this.formatNumber(data?.valuation?.marketCap || 0)}</div>
                        <div class="kpi-change positive">
                            <i class="fas fa-arrow-up"></i> 5.2% YoY
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="kpi-card">
                        <div class="kpi-label">PER</div>
                        <div class="kpi-value">${data?.ratios?.PER?.latest || 'N/A'}</div>
                        <div class="kpi-change neutral">vs Avg: 18.5x</div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="kpi-card">
                        <div class="kpi-label">ROE</div>
                        <div class="kpi-value">${data?.ratios?.ROE?.latest || 'N/A'}</div>
                        <div class="kpi-change positive">
                            <i class="fas fa-arrow-up"></i> 16.0%
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="kpi-card">
                        <div class="kpi-label">Dividend Yield</div>
                        <div class="kpi-value">${data?.ratios?.dividendYield?.latest || 'N/A'}</div>
                        <div class="kpi-change positive">+2.1%</div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="row mb-4">
                <div class="col-lg-8">
                    <div class="chart-container">
                        <h5>Revenue & Net Profit Growth</h5>
                        <canvas id="revenueChart" height="250"></canvas>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="chart-container">
                        <h5>Profitability Margins</h5>
                        <canvas id="marginChart" height="250"></canvas>
                    </div>
                </div>
            </div>

            <!-- Second Charts Row -->
            <div class="row">
                <div class="col-lg-6">
                    <div class="chart-container">
                        <h5>Valuation Metrics</h5>
                        <canvas id="valuationChart" height="200"></canvas>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="chart-container">
                        <h5>Financial Health</h5>
                        <canvas id="healthChart" height="200"></canvas>
                    </div>
                </div>
            </div>

            <!-- Data Summary -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="data-table">
                        <h5 class="p-3 mb-0 bg-light">5-Year Financial Summary</h5>
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    ${this.generateYearHeaders(data)}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateSummaryRows(data)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
        
        // Render charts
        this.renderCharts(data);
    }

    async loadInputForm() {
        const data = this.dataManager.getEmitenData(this.currentEmiten) || this.dataManager.getEmptyTemplate();
        
        const html = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-edit me-2"></i>Input Data - ${this.currentEmiten}</h2>
                    <p class="text-muted">Masukkan data laporan keuangan tahunan dan kuartalan</p>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <ul class="nav nav-tabs" id="inputTabs">
                        <li class="nav-item">
                            <a class="nav-link active" data-bs-toggle="tab" href="#tabAnnual">
                                Data Tahunan
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-bs-toggle="tab" href="#tabQuarterly">
                                Data Kuartalan
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-bs-toggle="tab" href="#tabPrices">
                                Data Harga
                            </a>
                        </li>
                    </ul>

                    <div class="tab-content p-4 border border-top-0 bg-white">
                        <!-- Annual Data Tab -->
                        <div class="tab-pane fade show active" id="tabAnnual">
                            <form id="annualForm">
                                ${this.generateAnnualForm(data)}
                            </form>
                        </div>
                        
                        <!-- Quarterly Data Tab -->
                        <div class="tab-pane fade" id="tabQuarterly">
                            <form id="quarterlyForm">
                                ${this.generateQuarterlyForm(data)}
                            </form>
                        </div>
                        
                        <!-- Prices Data Tab -->
                        <div class="tab-pane fade" id="tabPrices">
                            <form id="pricesForm">
                                ${this.generatePricesForm(data)}
                            </form>
                        </div>
                    </div>

                    <div class="mt-4 text-end">
                        <button class="btn btn-secondary me-2" onclick="app.cancelInput()">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button class="btn btn-save btn-action" onclick="app.saveInputData()">
                            <i class="fas fa-save"></i> Simpan Semua Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    }

    async loadRatios() {
        const data = this.dataManager.calculateRatios(this.currentEmiten);
        
        const html = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-calculator me-2"></i>Rasio Keuangan - ${this.currentEmiten}</h2>
                    <p class="text-muted">Rasio yang dihitung otomatis dari data input</p>
                </div>
            </div>

            <div class="row">
                <!-- Profitability -->
                <div class="col-lg-6">
                    <div class="form-section">
                        <h5><i class="fas fa-chart-line me-2"></i>Profitability Ratios</h5>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rasio</th>
                                    <th>2023</th>
                                    <th>2022</th>
                                    <th>2021</th>
                                    <th>5Y Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateRatioTable(data, 'profitability')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Leverage -->
                <div class="col-lg-6">
                    <div class="form-section">
                        <h5><i class="fas fa-balance-scale me-2"></i>Leverage Ratios</h5>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rasio</th>
                                    <th>2023</th>
                                    <th>2022</th>
                                    <th>2021</th>
                                    <th>5Y Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateRatioTable(data, 'leverage')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Liquidity -->
                <div class="col-lg-6">
                    <div class="form-section">
                        <h5><i class="fas fa-water me-2"></i>Liquidity Ratios</h5>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rasio</th>
                                    <th>2023</th>
                                    <th>2022</th>
                                    <th>2021</th>
                                    <th>5Y Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateRatioTable(data, 'liquidity')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Valuation -->
                <div class="col-lg-6">
                    <div class="form-section">
                        <h5><i class="fas fa-coins me-2"></i>Valuation Ratios</h5>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Rasio</th>
                                    <th>2023</th>
                                    <th>2022</th>
                                    <th>2021</th>
                                    <th>5Y Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateRatioTable(data, 'valuation')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Rasio dihitung otomatis setiap kali data di-update. Gunakan menu Input Data untuk memperbarui.
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    }

    async loadValuation() {
        const valuation = new ValuationModule(this.currentEmiten);
        const results = valuation.calculateAll();
        
        const html = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-coins me-2"></i>Valuasi - ${this.currentEmiten}</h2>
                    <p class="text-muted">Perhitungan nilai wajar dengan berbagai metode</p>
                </div>
            </div>

            <div class="row">
                <!-- PER Valuation -->
                <div class="col-lg-4">
                    <div class="form-section">
                        <h5><i class="fas fa-chart-bar me-2"></i>PER Valuation</h5>
                        <div class="mb-3">
                            <label class="form-label">EPS 2024E</label>
                            <input type="number" class="form-control auto-save" id="epsProjection" 
                                   value="${results.PER.EPS_projection}" step="0.01">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">PER Wajar</label>
                            <input type="number" class="form-control auto-save" id="fairPER" 
                                   value="${results.PER.fair_PER}" step="0.1">
                        </div>
                        <div class="alert alert-success">
                            <strong>Target Harga:</strong>
                            <div class="h4 mt-2">Rp ${this.formatNumber(results.PER.target_price)}</div>
                            <small>Upside: ${results.PER.upside}%</small>
                        </div>
                    </div>
                </div>

                <!-- PBV Valuation -->
                <div class="col-lg-4">
                    <div class="form-section">
                        <h5><i class="fas fa-book me-2"></i>PBV Valuation</h5>
                        <div class="mb-3">
                            <label class="form-label">BVPS 2024E</label>
                            <input type="number" class="form-control auto-save" id="bvpsProjection" 
                                   value="${results.PBV.BVPS_projection}" step="0.01">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">PBV Wajar</label>
                            <input type="number" class="form-control auto-save" id="fairPBV" 
                                   value="${results.PBV.fair_PBV}" step="0.1">
                        </div>
                        <div class="alert alert-warning">
                            <strong>Target Harga:</strong>
                            <div class="h4 mt-2">Rp ${this.formatNumber(results.PBV.target_price)}</div>
                            <small>Upside: ${results.PBV.upside}%</small>
                        </div>
                    </div>
                </div>

                <!-- DCF Valuation -->
                <div class="col-lg-4">
                    <div class="form-section">
                        <h5><i class="fas fa-calculator me-2"></i>DCF Valuation</h5>
                        <div class="mb-3">
                            <label class="form-label">WACC</label>
                            <input type="number" class="form-control auto-save" id="wacc" 
                                   value="${results.DCF.WACC * 100}" step="0.1">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Terminal Growth</label>
                            <input type="number" class="form-control auto-save" id="terminalGrowth" 
                                   value="${results.DCF.terminal_growth * 100}" step="0.1">
                        </div>
                        <div class="alert alert-primary">
                            <strong>Target Harga:</strong>
                            <div class="h4 mt-2">Rp ${this.formatNumber(results.DCF.target_price)}</div>
                            <small>Upside: ${results.DCF.upside}%</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sensitivity Analysis -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="form-section">
                        <h5><i class="fas fa-table me-2"></i>Sensitivity Analysis</h5>
                        <div id="sensitivityTable">
                            ${this.generateSensitivityTable(results)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="alert alert-dark">
                        <h5><i class="fas fa-star me-2"></i>Ringkasan Valuasi</h5>
                        <div class="row mt-3">
                            <div class="col-md-4 text-center">
                                <div class="h5">PER Method</div>
                                <div class="h3">Rp ${this.formatNumber(results.PER.target_price)}</div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="h5">PBV Method</div>
                                <div class="h3">Rp ${this.formatNumber(results.PBV.target_price)}</div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="h5">DCF Method</div>
                                <div class="h3">Rp ${this.formatNumber(results.DCF.target_price)}</div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12 text-center">
                                <div class="h4 text-primary">
                                    Average Target Price: Rp ${this.formatNumber(results.average_target_price)}
                                </div>
                                <div class="h5 ${results.average_upside > 0 ? 'positive' : 'negative'}">
                                    Average Upside: ${results.average_upside}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    }

    // Helper Methods
    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toLocaleString('id-ID');
    }

    generateYearHeaders(data) {
        if (!data?.annual) return '';
        return Object.keys(data.annual).sort().slice(0, 5).map(year => 
            `<th>${year}</th>`
        ).join('');
    }

    generateSummaryRows(data) {
        if (!data?.annual) return '';
        const metrics = ['revenue', 'netProfit', 'totalAssets', 'equity'];
        const labels = ['Revenue', 'Net Profit', 'Total Assets', 'Equity'];
        
        return metrics.map((metric, index) => `
            <tr>
                <td><strong>${labels[index]}</strong></td>
                ${Object.keys(data.annual).sort().slice(0, 5).map(year =>
                    `<td>${this.formatNumber(data.annual[year][metric] || 0)}</td>`
                ).join('')}
            </tr>
        `).join('');
    }

    generateAnnualForm(data) {
        const years = ['2023', '2022', '2021', '2020', '2019'];
        const fields = [
            { id: 'revenue', label: 'Revenue (Rp Miliar)', type: 'number' },
            { id: 'netProfit', label: 'Net Profit (Rp Miliar)', type: 'number' },
            { id: 'totalAssets', label: 'Total Assets (Rp Miliar)', type: 'number' },
            { id: 'equity', label: 'Equity (Rp Miliar)', type: 'number' },
            { id: 'shares', label: 'Shares Outstanding (Juta)', type: 'number' }
        ];
        
        let html = '<div class="row">';
        
        years.forEach(year => {
            html += `
                <div class="col-md-12">
                    <h6 class="mt-3 mb-2 p-2 bg-light">Tahun ${year}</h6>
                </div>
            `;
            
            fields.forEach(field => {
                const value = data.annual?.[year]?.[field.id] || '';
                html += `
                    <div class="col-md-6 mb-3">
                        <label class="form-label">${field.label}</label>
                        <input type="${field.type}" 
                               class="form-control auto-save" 
                               id="${field.id}_${year}"
                               value="${value}">
                    </div>
                `;
            });
        });
        
        html += '</div>';
        return html;
    }

    generateRatioTable(data, category) {
        const ratios = {
            profitability: ['ROE', 'ROA', 'GrossMargin', 'NetMargin'],
            leverage: ['DER', 'DebtToAssets', 'InterestCoverage'],
            liquidity: ['CurrentRatio', 'QuickRatio', 'CashRatio'],
            valuation: ['PER', 'PBV', 'DividendYield']
        };
        
        return ratios[category].map(ratio => `
            <tr>
                <td>${ratio}</td>
                <td>${data?.[ratio]?.['2023'] || 'N/A'}</td>
                <td>${data?.[ratio]?.['2022'] || 'N/A'}</td>
                <td>${data?.[ratio]?.['2021'] || 'N/A'}</td>
                <td>${data?.[ratio]?.average || 'N/A'}</td>
            </tr>
        `).join('');
    }

    generateSensitivityTable(results) {
        let html = '<table class="table table-bordered">';
        html += '<thead><tr><th>PER</th><th>14x</th><th>15x</th><th>16x</th><th>17x</th><th>18x</th></tr></thead>';
        html += '<tbody>';
        
        const epsGrowth = [8, 10, 12, 14, 16];
        epsGrowth.forEach(growth => {
            html += `<tr><td>${growth}% EPS Growth</td>`;
            [14, 15, 16, 17, 18].forEach(per => {
                const price = (results.PER.EPS_projection * (1 + growth/100) * per).toFixed(0);
                html += `<td>${this.formatNumber(price)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    }

    // Data Management Methods
    saveInputData() {
        const data = this.collectFormData();
        this.dataManager.updateEmitenData(this.currentEmiten, data);
        this.storage.save();
        
        // Show success message
        this.showToast('Data berhasil disimpan!', 'success');
        
        // Return to dashboard
        setTimeout(() => this.loadDashboard(), 1000);
    }

    collectFormData() {
        const data = {
            annual: {},
            quarterly: {},
            prices: {}
        };
        
        // Collect annual data
        const years = ['2023', '2022', '2021', '2020', '2019'];
        years.forEach(year => {
            data.annual[year] = {
                revenue: parseFloat(document.getElementById(`revenue_${year}`)?.value) || 0,
                netProfit: parseFloat(document.getElementById(`netProfit_${year}`)?.value) || 0,
                totalAssets: parseFloat(document.getElementById(`totalAssets_${year}`)?.value) || 0,
                equity: parseFloat(document.getElementById(`equity_${year}`)?.value) || 0,
                shares: parseFloat(document.getElementById(`shares_${year}`)?.value) || 0
            };
        });
        
        return data;
    }

    autoSave() {
        // Auto-save to localStorage every 30 seconds
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const data = this.collectFormData();
            this.dataManager.updateEmitenData(this.currentEmiten, data);
            this.storage.autoSave();
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        }, 30000);
    }

    // Chart Rendering Methods
    renderCharts(data) {
        this.renderRevenueChart(data);
        this.renderMarginChart(data);
        this.renderValuationChart(data);
        this.renderHealthChart(data);
    }

    renderRevenueChart(data) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const years = Object.keys(data?.annual || {}).sort();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Revenue',
                        data: years.map(year => data.annual[year]?.revenue || 0),
                        borderColor: '#0f52ba',
                        backgroundColor: 'rgba(15, 82, 186, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Net Profit',
                        data: years.map(year => data.annual[year]?.netProfit || 0),
                        borderColor: '#00a86b',
                        backgroundColor: 'rgba(0, 168, 107, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => this.formatNumber(value)
                        }
                    }
                }
            }
        });
    }

    renderMarginChart(data) {
        const ctx = document.getElementById('marginChart').getContext('2d');
        const years = Object.keys(data?.annual || {}).sort();
        
        // Calculate margins
        const grossMargins = years.map(year => {
            const revenue = data.annual[year]?.revenue || 1;
            const grossProfit = revenue * 0.65; // Example
            return (grossProfit / revenue * 100).toFixed(1);
        });
        
        const netMargins = years.map(year => {
            const revenue = data.annual[year]?.revenue || 1;
            const netProfit = data.annual[year]?.netProfit || 0;
            return (netProfit / revenue * 100).toFixed(1);
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Gross Margin %',
                        data: grossMargins,
                        backgroundColor: 'rgba(15, 82, 186, 0.7)'
                    },
                    {
                        label: 'Net Margin %',
                        data: netMargins,
                        backgroundColor: 'rgba(0, 168, 107, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }

    // Additional helper methods
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        setTimeout(() => toast.remove(), 3000);
    }

    initializeSampleData() {
        const sampleData = {
            BBCA: {
                info: {
                    name: 'Bank Central Asia',
                    sector: 'Perbankan',
                    beta: 1.1,
                    listingDate: '2000-05-30'
                },
                annual: {
                    '2023': { revenue: 150000, netProfit: 40000, totalAssets: 1200000, equity: 250000, shares: 123456 },
                    '2022': { revenue: 135000, netProfit: 36000, totalAssets: 1100000, equity: 230000, shares: 123456 },
                    '2021': { revenue: 120000, netProfit: 31000, totalAssets: 1000000, equity: 200000, shares: 123000 },
                    '2020': { revenue: 110000, netProfit: 28000, totalAssets: 950000, equity: 180000, shares: 122500 },
                    '2019': { revenue: 100000, netProfit: 25000, totalAssets: 900000, equity: 165000, shares: 122000 }
                },
                prices: {
                    '2023-12-29': { close: 9550, volume: 250000000 },
                    '2023-12-28': { close: 9500, volume: 230000000 }
                }
            }
        };
        
        this.storage.set('rdfe_emiten_list', ['BBCA', 'TLKM', 'ASII']);
        this.storage.set('rdfe_data', sampleData);
    }
}

// Initialize app
const app = new RDFEApp();
window.app = app;
