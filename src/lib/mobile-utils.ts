export interface DeviceInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  hasMetaMask: boolean;
  hasWalletConnect: boolean;
}

export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isMobile = isAndroid || isIOS;
  
  // Check for MetaMask
  const hasMetaMask = typeof window !== 'undefined' && 
    typeof window.ethereum !== 'undefined' && 
    window.ethereum.isMetaMask;
  
  // Basic WalletConnect detection (can be enhanced)
  const hasWalletConnect = typeof window !== 'undefined' && 
    localStorage.getItem('walletconnect') !== null;
  
  return {
    isMobile,
    isAndroid,
    isIOS,
    hasMetaMask,
    hasWalletConnect
  };
}

export function getMobileWalletLinks() {
  const currentUrl = window.location.href;
  
  return {
    metamask: {
      android: `https://metamask.app.link/dapp/${currentUrl}`,
      ios: `https://metamask.app.link/dapp/${currentUrl}`,
      installAndroid: 'https://play.google.com/store/apps/details?id=io.metamask',
      installIOS: 'https://apps.apple.com/app/metamask/id1438144202'
    },
    trustWallet: {
      android: `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`,
      ios: `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`,
      installAndroid: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
      installIOS: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
    }
  };
}

export function openMobileWallet(walletType: 'metamask' | 'trustWallet', action: 'open' | 'install') {
  const device = detectDevice();
  const links = getMobileWalletLinks();
  
  let url = '';
  
  if (walletType === 'metamask') {
    if (action === 'install') {
      url = device.isAndroid ? links.metamask.installAndroid : links.metamask.installIOS;
    } else {
      url = device.isAndroid ? links.metamask.android : links.metamask.ios;
    }
  } else if (walletType === 'trustWallet') {
    if (action === 'install') {
      url = device.isAndroid ? links.trustWallet.installAndroid : links.trustWallet.installIOS;
    } else {
      url = device.isAndroid ? links.trustWallet.android : links.trustWallet.ios;
    }
  }
  
  if (url) {
    window.open(url, '_blank');
  }
}