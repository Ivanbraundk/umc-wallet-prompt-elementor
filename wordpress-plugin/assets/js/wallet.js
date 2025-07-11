// UMC Wallet Onboarding JavaScript
class UMCWallet {
    constructor(widgetId) {
        this.widgetId = widgetId;
        this.provider = null;
        this.signer = null;
        this.userAccount = null;
        this.settings = null;
        
        // Get settings from the widget
        const container = document.getElementById(`umc-wallet-${widgetId}`);
        if (container) {
            this.settings = JSON.parse(container.dataset.settings);
        }
        
        this.init();
    }
    
    async init() {
        await this.checkMetaMask();
    }
    
    async checkMetaMask() {
        const statusEl = document.getElementById(`metamask-status-${this.widgetId}`);
        const actionsEl = document.getElementById(`wallet-actions-${this.widgetId}`);
        
        if (typeof window.ethereum !== 'undefined') {
            statusEl.innerHTML = '✅';
            statusEl.nextElementSibling.textContent = 'MetaMask detected';
            
            // Check if already connected
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    await this.checkNetwork();
                } else {
                    this.showConnectButton();
                }
            } catch (error) {
                console.error('Error checking accounts:', error);
                this.showConnectButton();
            }
        } else {
            statusEl.innerHTML = '❌';
            statusEl.nextElementSibling.textContent = this.settings.no_metamask_text;
            
            actionsEl.innerHTML = `
                <a href="${this.settings.metamask_install_url.url}" 
                   target="_blank" 
                   class="umc-button umc-button-primary">
                    Install MetaMask
                </a>
            `;
        }
    }
    
    showConnectButton() {
        const actionsEl = document.getElementById(`wallet-actions-${this.widgetId}`);
        actionsEl.innerHTML = `
            <button onclick="umcWalletInstances['${this.widgetId}'].connectWallet()" 
                    class="umc-button umc-button-primary">
                ${this.settings.connect_wallet_text}
            </button>
        `;
    }
    
    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.userAccount = accounts[0];
            this.updateStatus('wallet', '✅', 'Wallet connected');
            await this.checkNetwork();
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.updateStatus('wallet', '❌', 'Failed to connect wallet');
        }
    }
    
    async checkNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (chainId === '0x89') { // Polygon Mainnet
                this.updateStatus('network', '✅', 'Connected to Polygon');
                this.showConnectedInfo();
            } else {
                this.updateStatus('network', '⚠️', 'Wrong network');
                this.showSwitchNetworkButton();
            }
        } catch (error) {
            console.error('Error checking network:', error);
            this.updateStatus('network', '❌', 'Network check failed');
        }
    }
    
    showSwitchNetworkButton() {
        const actionsEl = document.getElementById(`wallet-actions-${this.widgetId}`);
        actionsEl.innerHTML = `
            <button onclick="umcWalletInstances['${this.widgetId}'].switchToPolygon()" 
                    class="umc-button umc-button-warning">
                ${this.settings.switch_network_text}
            </button>
        `;
    }
    
    async switchToPolygon() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }]
            });
            
            // Check network again after switch
            setTimeout(() => this.checkNetwork(), 1000);
            
        } catch (error) {
            if (error.code === 4902) {
                // Network not added, try to add it
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x89',
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18
                            },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }]
                    });
                    
                    setTimeout(() => this.checkNetwork(), 1000);
                    
                } catch (addError) {
                    console.error('Error adding Polygon network:', addError);
                }
            } else {
                console.error('Error switching to Polygon:', error);
            }
        }
    }
    
    updateStatus(type, icon, text) {
        const statusEl = document.getElementById(`wallet-status-${this.widgetId}`);
        
        // Add new status item
        const statusItem = document.createElement('div');
        statusItem.className = 'status-item';
        statusItem.innerHTML = `
            <span class="status-icon">${icon}</span>
            <span class="status-text">${text}</span>
        `;
        
        statusEl.appendChild(statusItem);
    }
    
    showConnectedInfo() {
        const actionsEl = document.getElementById(`wallet-actions-${this.widgetId}`);
        const connectedEl = document.getElementById(`wallet-connected-${this.widgetId}`);
        const addressEl = document.getElementById(`wallet-address-${this.widgetId}`);
        
        // Hide action buttons
        actionsEl.style.display = 'none';
        
        // Show connected info
        connectedEl.style.display = 'block';
        addressEl.textContent = this.formatAddress(this.userAccount);
    }
    
    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Global instances storage
window.umcWalletInstances = {};

// Initialize wallet function
function initUMCWallet(widgetId) {
    window.umcWalletInstances[widgetId] = new UMCWallet(widgetId);
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function(accounts) {
        // Reload page when account changes
        window.location.reload();
    });
    
    window.ethereum.on('chainChanged', function(chainId) {
        // Reload page when network changes
        window.location.reload();
    });
}