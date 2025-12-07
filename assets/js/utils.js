const RDFEUtils = {
    // Format number with Indonesian locale
    formatNumber: (num, decimals = 0) => {
        if (num === null || num === undefined) return '0';
        
        if (typeof num === 'string') {
            num = parseFloat(num.replace(/[^0-9.-]+/g, ''));
        }
        
        if (num >= 1e12) {
            return (num / 1e12).toFixed(decimals) + 'T';
        }
        if (num >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'B';
        }
        if (num >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        }
        if (num >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        }
        
        return num.toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    // Format currency
    formatCurrency: (amount, currency = 'IDR') => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Calculate CAGR
    calculateCAGR: (beginningValue, endingValue, years) => {
        if (!beginningValue || !endingValue || years <= 0) return 0;
        return Math.pow(endingValue / beginningValue, 1 / years) - 1;
    },

    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Download file
    downloadFile: (content, fileName, contentType) => {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    // Read file as text
    readFileAsText: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    },

    // Parse CSV to JSON
    parseCSV: (csvText) => {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const obj = {};
            const currentline = line.split(',');
            
            headers.forEach((header, index) => {
                obj[header.trim()] = currentline[index] ? currentline[index].trim() : '';
            });
            
            return obj;
        });
    },

    // Convert JSON to CSV
    jsonToCSV: (jsonData) => {
        if (jsonData.length === 0) return '';
        
        const headers = Object.keys(jsonData[0]);
        const csvRows = [
            headers.join(','),
            ...jsonData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    const escaped = ('' + value).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            )
        ];
        
        return csvRows.join('\n');
    },

    // Format date
    formatDate: (date, format = 'id-ID') => {
        const d = new Date(date);
        return d.toLocaleDateString(format, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Calculate age from date
    calculateAge: (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    // Sleep/delay function
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Deep clone object
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    // Merge objects
    mergeObjects: (target, ...sources) => {
        sources.forEach(source => {
            Object.keys(source).forEach(key => {
                if (source[key] !== undefined) {
                    target[key] = source[key];
                }
            });
        });
        return target;
    },

    // Generate random color
    getRandomColor: () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    // Validate Indonesian phone number
    validatePhoneID: (phone) => {
        const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
        return re.test(phone);
    },

    // Capitalize first letter
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Truncate text
    truncateText: (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // Get query parameter
    getQueryParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Set query parameter
    setQueryParam: (param, value) => {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    },

    // Remove query parameter
    removeQueryParam: (param) => {
        const url = new URL(window.location);
        url.searchParams.delete(param);
        window.history.pushState({}, '', url);
    },

    // Check if mobile device
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Copy to clipboard
    copyToClipboard: (text) => {
        return navigator.clipboard.writeText(text);
    }
};

// Make globally available
window.RDFEUtils = RDFEUtils;
