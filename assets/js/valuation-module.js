class ValuationModule {
    constructor(ticker) {
        this.ticker = ticker;
        this.dataManager = new DataManager();
        this.data = this.dataManager.getEmitenData(ticker);
    }

    calculateAll() {
        return {
            PER: this.calculatePERValuation(),
            PBV: this.calculatePBVValuation(),
            DCF: this.calculateDCFValuation(),
            average_target_price: this.calculateAverageTargetPrice(),
            average_upside: this.calculateAverageUpside()
        };
    }

    calculatePERValuation() {
        const latestData = this.getLatestAnnualData();
        const prices = this.data?.prices || {};
        const latestPrice = Object.values(prices)[0]?.close || 0;
        
        // Calculate EPS
        const eps = (latestData.netProfit * 1000) / latestData.shares;
        
        // Estimate future EPS growth (5-year average growth rate)
        const growthRate = this.calculateEPSGrowthRate();
        
        // Project EPS
        const epsProjection = eps * (1 + growthRate);
        
        // Determine fair PER (historical average ± adjustments)
        const fairPER = this.calculateFairPER();
        
        // Calculate target price
        const targetPrice = epsProjection * fairPER;
        
        // Calculate upside
        const upside = latestPrice > 0 ? ((targetPrice - latestPrice) / latestPrice * 100).toFixed(1) : 0;
        
        return {
            current_EPS: eps.toFixed(0),
            EPS_projection: epsProjection.toFixed(0),
            fair_PER: fairPER.toFixed(1),
            target_price: Math.round(targetPrice),
            upside: upside,
            current_price: latestPrice
        };
    }

    calculatePBVValuation() {
        const latestData = this.getLatestAnnualData();
        const prices = this.data?.prices || {};
        const latestPrice = Object.values(prices)[0]?.close || 0;
        
        // Calculate BVPS
        const bvps = (latestData.equity * 1000) / latestData.shares;
        
        // Estimate BVPS growth
        const growthRate = this.calculateEquityGrowthRate();
        const bvpsProjection = bvps * (1 + growthRate);
        
        // Determine fair PBV
        const fairPBV = this.calculateFairPBV();
        
        // Calculate target price
        const targetPrice = bvpsProjection * fairPBV;
        
        // Calculate upside
        const upside = latestPrice > 0 ? ((targetPrice - latestPrice) / latestPrice * 100).toFixed(1) : 0;
        
        return {
            current_BVPS: Math.round(bvps),
            BVPS_projection: Math.round(bvpsProjection),
            fair_PBV: fairPBV.toFixed(2),
            target_price: Math.round(targetPrice),
            upside: upside
        };
    }

    calculateDCFValuation() {
        const latestData = this.getLatestAnnualData();
        const prices = this.data?.prices || {};
        const latestPrice = Object.values(prices)[0]?.close || 0;
        
        // Assumptions
        const wacc = 0.11; // Weighted Average Cost of Capital
        const terminalGrowth = 0.03; // Terminal growth rate
        const projectionYears = 5;
        
        // Calculate Free Cash Flow
        const fcf = latestData.netProfit * 0.8; // Simplified: 80% of net profit
        
        // Project FCF growth
        const fcfGrowth = this.calculateFCFGrowthRate();
        
        // Calculate present value of projected FCF
        let pvFCF = 0;
        for (let i = 1; i <= projectionYears; i++) {
            const projectedFCF = fcf * Math.pow(1 + fcfGrowth, i);
            const discountFactor = 1 / Math.pow(1 + wacc, i);
            pvFCF += projectedFCF * discountFactor;
        }
        
        // Calculate terminal value
        const terminalFCF = fcf * Math.pow(1 + fcfGrowth, projectionYears);
        const terminalValue = terminalFCF * (1 + terminalGrowth) / (wacc - terminalGrowth);
        const pvTerminal = terminalValue / Math.pow(1 + wacc, projectionYears);
        
        // Calculate enterprise value
        const enterpriseValue = pvFCF + pvTerminal;
        
        // Adjust for net debt (simplified)
        const netDebt = 0; // Would need debt and cash data
        const equityValue = enterpriseValue - netDebt;
        
        // Calculate target price per share
        const targetPrice = equityValue * 1000 / latestData.shares; // Convert to per share
        
        // Calculate upside
        const upside = latestPrice > 0 ? ((targetPrice - latestPrice) / latestPrice * 100).toFixed(1) : 0;
        
        return {
            FCF: Math.round(fcf),
            WACC: wacc,
            terminal_growth: terminalGrowth,
            enterprise_value: Math.round(enterpriseValue),
            equity_value: Math.round(equityValue),
            target_price: Math.round(targetPrice),
            upside: upside
        };
    }

    calculateAverageTargetPrice() {
        const valuations = this.calculateAll();
        const prices = [
            valuations.PER.target_price,
            valuations.PBV.target_price,
            valuations.DCF.target_price
        ].filter(price => price > 0);
        
        return prices.length > 0 
            ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
            : 0;
    }

    calculateAverageUpside() {
        const valuations = this.calculateAll();
        const upsides = [
            parseFloat(valuations.PER.upside),
            parseFloat(valuations.PBV.upside),
            parseFloat(valuations.DCF.upside)
        ].filter(upside => !isNaN(upside));
        
        return upsides.length > 0 
            ? (upsides.reduce((a, b) => a + b, 0) / upsides.length).toFixed(1)
            : 0;
    }

    // Helper methods
    getLatestAnnualData() {
        if (!this.data?.annual) return {};
        const years = Object.keys(this.data.annual).sort().reverse();
        return this.data.annual[years[0]] || {};
    }

    calculateEPSGrowthRate() {
        if (!this.data?.annual) return 0.1; // Default 10%
        
        const years = Object.keys(this.data.annual).sort();
        if (years.length < 2) return 0.1;
        
        const epsValues = years.map(year => {
            const data = this.data.annual[year];
            return (data.netProfit * 1000) / data.shares;
        });
        
        // Calculate CAGR
        const first = epsValues[0];
        const last = epsValues[epsValues.length - 1];
        const yearsCount = epsValues.length - 1;
        
        return yearsCount > 0 ? Math.pow(last / first, 1 / yearsCount) - 1 : 0.1;
    }

    calculateEquityGrowthRate() {
        if (!this.data?.annual) return 0.08; // Default 8%
        
        const years = Object.keys(this.data.annual).sort();
        if (years.length < 2) return 0.08;
        
        const equityValues = years.map(year => this.data.annual[year].equity);
        const first = equityValues[0];
        const last = equityValues[equityValues.length - 1];
        const yearsCount = equityValues.length - 1;
        
        return yearsCount > 0 ? Math.pow(last / first, 1 / yearsCount) - 1 : 0.08;
    }

    calculateFCFGrowthRate() {
        // Simplified: average of EPS growth and equity growth
        return (this.calculateEPSGrowthRate() + this.calculateEquityGrowthRate()) / 2;
    }

    calculateFairPER() {
        // Based on historical average, industry average, and growth rate
        const growthRate = this.calculateEPSGrowthRate();
        const basePER = 15; // Base PER for no-growth company
        
        // PEG ratio approach: Fair PER = Growth Rate * 100
        const pegBasedPER = growthRate * 100;
        
        // Average of different approaches
        return (basePER + pegBasedPER) / 2;
    }

    calculateFairPBV() {
        // Based on ROE: PBV = ROE * PER / (1 + g)
        const roe = this.calculateROE();
        const per = this.calculateFairPER();
        const growth = this.calculateEquityGrowthRate();
        
        return (roe * per) / (100 * (1 + growth));
    }

    calculateROE() {
        const latestData = this.getLatestAnnualData();
        return latestData.netProfit && latestData.equity
            ? (latestData.netProfit / latestData.equity * 100)
            : 15; // Default 15%
    }

    generateSensitivityTable(basePrice, variables) {
        // Generate sensitivity analysis table
        const table = [];
        
        // Example for PER sensitivity
        for (let per = 10; per <= 20; per += 2) {
            const row = { PER: per };
            for (let growth = 0.05; growth <= 0.15; growth += 0.02) {
                row[`${(growth * 100).toFixed(0)}%`] = 
                    Math.round(basePrice * (1 + growth) * per);
            }
            table.push(row);
        }
        
        return table;
    }
}
