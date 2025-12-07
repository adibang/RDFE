class ChartEngine {
    constructor() {
        this.charts = new Map();
        this.defaultColors = {
            revenue: 'rgba(15, 82, 186, 0.8)',
            profit: 'rgba(0, 168, 107, 0.8)',
            margin: 'rgba(255, 193, 7, 0.8)',
            roe: 'rgba(156, 39, 176, 0.8)',
            per: 'rgba(33, 150, 243, 0.8)',
            negative: 'rgba(220, 20, 60, 0.8)'
        };
    }

    renderRevenueChart(ctx, data) {
        const years = Object.keys(data.annual || {}).sort();
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Revenue (Rp Miliar)',
                        data: years.map(year => data.annual[year]?.revenue || 0),
                        borderColor: this.defaultColors.revenue,
                        backgroundColor: this.hexToRgba(this.defaultColors.revenue, 0.1),
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Net Profit (Rp Miliar)',
                        data: years.map(year => data.annual[year]?.netProfit || 0),
                        borderColor: this.defaultColors.profit,
                        backgroundColor: this.hexToRgba(this.defaultColors.profit, 0.1),
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    }
                ]
            },
            options: this.getChartOptions('Revenue & Net Profit Growth', 'Rp Miliar')
        });
    }

    renderMarginChart(ctx, data) {
        const years = Object.keys(data.annual || {}).sort();
        
        const grossMargins = years.map(year => {
            const revenue = data.annual[year]?.revenue || 1;
            const grossProfit = revenue * 0.65; // Simplified calculation
            return (grossProfit / revenue * 100);
        });
        
        const netMargins = years.map(year => {
            const revenue = data.annual[year]?.revenue || 1;
            const netProfit = data.annual[year]?.netProfit || 0;
            return (netProfit / revenue * 100);
        });
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Gross Margin %',
                        data: grossMargins,
                        backgroundColor: this.hexToRgba('#0f52ba', 0.7),
                        borderColor: '#0f52ba',
                        borderWidth: 1
                    },
                    {
                        label: 'Net Margin %',
                        data: netMargins,
                        backgroundColor: this.hexToRgba('#00a86b', 0.7),
                        borderColor: '#00a86b',
                        borderWidth: 1
                    }
                ]
            },
            options: this.getChartOptions('Profitability Margins', '%')
        });
    }

    renderROEChart(ctx, data) {
        const years = Object.keys(data.annual || {}).sort();
        
        const roeValues = years.map(year => {
            const equity = data.annual[year]?.equity || 1;
            const profit = data.annual[year]?.netProfit || 0;
            return (profit / equity * 100);
        });
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'ROE %',
                    data: roeValues,
                    borderColor: this.defaultColors.roe,
                    backgroundColor: this.hexToRgba(this.defaultColors.roe, 0.1),
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: this.getChartOptions('Return on Equity (ROE)', '%')
        });
    }

    renderValuationChart(ctx, data) {
        const years = Object.keys(data.annual || {}).sort();
        const perValues = [15.2, 16.8, 18.1, 19.5, 21.0]; // Example data
        const pbvValues = [2.4, 2.6, 2.8, 3.0, 3.2]; // Example data
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'PER (x)',
                        data: perValues.slice(0, years.length),
                        borderColor: this.defaultColors.per,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'PBV (x)',
                        data: pbvValues.slice(0, years.length),
                        borderColor: this.defaultColors.margin,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Valuation Ratios Trend'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'PER'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'PBV'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    renderComparisonChart(ctx, comparisonData) {
        const tickers = comparisonData.map(item => item.ticker);
        const roeValues = comparisonData.map(item => {
            const roe = item.ROE || '0%';
            return parseFloat(roe);
        });
        
        const perValues = comparisonData.map(item => {
            const per = item.PER || '0x';
            return parseFloat(per);
        });
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tickers,
                datasets: [
                    {
                        label: 'ROE %',
                        data: roeValues,
                        backgroundColor: this.hexToRgba('#00a86b', 0.7),
                        borderColor: '#00a86b',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'PER (x)',
                        data: perValues,
                        backgroundColor: this.hexToRgba('#0f52ba', 0.7),
                        borderColor: '#0f52ba',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparison: ROE vs PER'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'ROE %'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'PER (x)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // Utility methods
    getChartOptions(title, yAxisLabel) {
        return {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    ticks: {
                        callback: function(value) {
                            if (yAxisLabel === '%') return value + '%';
                            if (yAxisLabel === 'Rp Miliar') return value.toLocaleString('id-ID');
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
}

// Make globally available
window.ChartEngine = ChartEngine;
