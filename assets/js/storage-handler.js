class StorageHandler {
    constructor() {
        this.prefix = 'rdfe_';
        this.autoSaveEnabled = true;
        this.setupStorageEvents();
    }

    set(key, value) {
        try {
            const storageKey = this.prefix + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(storageKey, serialized);
            
            // Dispatch custom event for other tabs
            this.dispatchStorageEvent(storageKey, value);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            this.handleStorageFull();
            return false;
        }
    }

    get(key) {
        try {
            const storageKey = this.prefix + key;
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage read error:', error);
            return null;
        }
    }

    remove(key) {
        const storageKey = this.prefix + key;
        localStorage.removeItem(storageKey);
        this.dispatchStorageEvent(storageKey, null);
    }

    clear() {
        // Only clear RDFE-related items
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    autoSave() {
        if (this.autoSaveEnabled) {
            // Save last auto-save timestamp
            this.set('last_auto_save', new Date().toISOString());
        }
    }

    backupData() {
        const backup = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                backup[key] = localStorage.getItem(key);
            }
        });
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rdfe_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return backup;
    }

    restoreData(backupData) {
        try {
            // Clear existing data
            this.clear();
            
            // Restore backup
            Object.keys(backupData).forEach(key => {
                localStorage.setItem(key, backupData[key]);
            });
            
            return true;
        } catch (error) {
            console.error('Restore error:', error);
            return false;
        }
    }

    getStorageInfo() {
        const rdfeKeys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        let totalSize = 0;
        
        rdfeKeys.forEach(key => {
            totalSize += localStorage.getItem(key).length * 2; // Approximate size in bytes
        });
        
        return {
            items: rdfeKeys.length,
            size: this.formatBytes(totalSize),
            lastBackup: this.get('last_backup') || 'Never'
        };
    }

    setupStorageEvents() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith(this.prefix)) {
                console.log('Storage updated from another tab:', event.key);
                
                // Dispatch custom event for internal use
                window.dispatchEvent(new CustomEvent('rdfeStorageChange', {
                    detail: {
                        key: event.key.replace(this.prefix, ''),
                        value: event.newValue ? JSON.parse(event.newValue) : null
                    }
                }));
            }
        });
    }

    dispatchStorageEvent(key, value) {
        // This is for same-tab events (storage event only fires in other tabs)
        window.dispatchEvent(new CustomEvent('rdfeStorageChange', {
            detail: { key: key.replace(this.prefix, ''), value }
        }));
    }

    handleStorageFull() {
        // Try to clear old data
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item?.timestamp && new Date(item.timestamp) < oneMonthAgo) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // If can't parse, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
