class DataManager {
    constructor() {
        this.storage = new StorageHandler();
        this.cache = {};
    }

    getEmitenData(ticker) {
        if (this.cache[ticker]) {
            return this.cache[ticker];
        }
        
        const allData = this.storage.get('rdfe_data') || {};
        this.cache[ticker] = allData[ticker];
        return this.cache[ticker];
    }

    updateEmitenData(ticker, data) {
        const allData = this.storage.get('rdfe_data') || {};
        allData[ticker] = {
            ...allData[ticker],
            ...data,
            lastUpdated: new Date().toISOString()
        };
        
        this.storage.set('rdfe_data', allData);
        this.cache[ticker] = allData[ticker];
        
        // Recalculate ratios
        this.calculateRatios(ticker);
    }

    calculateRatios(ticker) {
        const data = this.getEmitenData(ticker);
        if (!data || !data.annual) return {};
        
        const ratios = {};
        const years = Object.keys(data.annual).sort();
        
        years.forEach(year => {
            const yearData = data.annual[year];
            
            // Profitability Ratios
            ratios.ROE = ratios.ROE || {};
            ratios.ROE[year] = ((yearData.netProfit / yearData.equity) * 100).toFixed(1) + '%';
            
            ratios.ROA = ratios.ROA || {};
            ratios.ROA[year] = ((yearData.netProfit / yearData.totalAssets) * 100).toFixed(1) + '%';
            
            ratios.NetMargin = ratios.NetMargin || {};
            ratios.NetMargin[year] = ((yearData.netProfit / yearData.revenue) * 100).toFixed(1) + '%';
            
            // Valuation Ratios (if price data available)
            if (data.prices) {
                const latestPrice = Object.values(data.prices)[0]?.close || 0;
                const eps = yearData.netProfit * 1000 / yearData.shares; // Convert to per share
                const bvps = yearData.equity * 1000 / yearData.shares;
                
                ratios.EPS = ratios.EPS || {};
                ratios.EPS[year] = eps.toFixed(0);
                
                ratios.PER = ratios.PER || {};
                ratios.PER[year] = (latestPrice / eps).toFixed(1) + 'x';
                
                ratios.PBV = ratios.PBV || {};
                ratios.PBV[year] = (latestPrice / bvps).toFixed(1) + 'x';
            }
        });
        
        // Calculate averages
        Object.keys(ratios).forEach(ratio => {
            const values = Object.values(ratios[ratio])
                .map(v => parseFloat(v) || 0)
                .filter(v => !isNaN(v));
            
            if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                ratios[ratio].average = avg.toFixed(1) + (ratio.includes('PER') || ratio.includes('PBV') ? 'x' : '%');
            }
        });
        
        // Save calculated ratios
        if (data) {
            data.ratios = ratios;
            this.updateEmitenData(ticker, { ratios });
        }
        
        return ratios;
    }

    getEmptyTemplate() {
        return {
            annual: {
                '2023': { revenue: 0, netProfit: 0, totalAssets: 0, equity: 0, shares: 0 },
                '2022': { revenue: 0, netProfit: 0, totalAssets: 0, equity: 0, shares: 0 },
                '2021': { revenue: 0, netProfit: 0, totalAssets: 0, equity: 0, shares: 0 }
            },
            quarterly: {},
            prices: {}
        };
    }

    addNewEmiten(ticker, name) {
        const emitenList = this.storage.get('rdfe_emiten_list') || [];
        if (!emitenList.includes(ticker)) {
            emitenList.push(ticker);
            this.storage.set('rdfe_emiten_list', emitenList);
            
            const newData = {
                [ticker]: {
                    info: {
                        name: name,
                        sector: '',
                        beta: 1.0,
                        listingDate: new Date().toISOString().split('T')[0]
                    },
                    ...this.getEmptyTemplate()
                }
            };
            
            this.updateEmitenData(ticker, newData[ticker]);
            return true;
        }
        return false;
    }

    deleteEmiten(ticker) {
        const emitenList = this.storage.get('rdfe_emiten_list') || [];
        const index = emitenList.indexOf(ticker);
        if (index > -1) {
            emitenList.splice(index, 1);
            this.storage.set('rdfe_emiten_list', emitenList);
            
            const allData = this.storage.get('rdfe_data') || {};
            delete allData[ticker];
            this.storage.set('rdfe_data', allData);
            
            delete this.cache[ticker];
            return true;
        }
        return false;
    }

    exportToCSV(ticker) {
        const data = this.getEmitenData(ticker);
        if (!data) return '';
        
        let csv = 'Year,Revenue,Net Profit,Total Assets,Equity,Shares\n';
        Object.keys(data.annual).sort().forEach(year => {
            const y = data.annual[year];
            csv += `${year},${y.revenue},${y.netProfit},${y.totalAssets},${y.equity},${y.shares}\n`;
        });
        
        return csv;
    }

    importFromCSV(ticker, csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        const annualData = {};
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            const year = values[0];
            
            annualData[year] = {
                revenue: parseFloat(values[1]) || 0,
                netProfit: parseFloat(values[2]) || 0,
                totalAssets: parseFloat(values[3]) || 0,
                equity: parseFloat(values[4]) || 0,
                shares: parseFloat(values[5]) || 0
            };
        }
        
        this.updateEmitenData(ticker, { annual: annualData });
        return true;
    }
}
