import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Coins,
  Network,
  Download,
  Loader2,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { detectDevice, openMobileWallet, type DeviceInfo } from '@/lib/mobile-utils';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

type WalletStep = 'install' | 'connect' | 'network' | 'complete';

interface WalletState {
  isMetaMaskInstalled: boolean;
  isConnected: boolean;
  isPolygonNetwork: boolean;
  userAddress: string | null;
  isLoading: boolean;
  currentStep: WalletStep;
  deviceInfo: DeviceInfo;
}

const UMC_CONTRACT_ADDRESS = "0x80f2c9eD338BFcE2Bb128eCCBb9B11bbCa041A82";
const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

export function WalletOnboarding() {
  const { toast } = useToast();
  
  const [walletState, setWalletState] = useState<WalletState>({
    isMetaMaskInstalled: false,
    isConnected: false,
    isPolygonNetwork: false,
    userAddress: null,
    isLoading: false,
    currentStep: 'install',
    deviceInfo: detectDevice()
  });

  // Check MetaMask installation on component mount
  useEffect(() => {
    const deviceInfo = detectDevice();
    setWalletState(prev => ({ ...prev, deviceInfo }));
    checkMetaMaskInstallation();
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkMetaMaskInstallation = async () => {
    const isInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    
    if (isInstalled) {
      setWalletState(prev => ({ ...prev, isMetaMaskInstalled: true }));
      await checkWalletConnection();
    } else {
      setWalletState(prev => ({ ...prev, currentStep: 'install' }));
    }
  };

  const checkWalletConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const network = await provider.getNetwork();
        const isPolygon = network.chainId === 137n;
        
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          userAddress: accounts[0].address,
          isPolygonNetwork: isPolygon,
          currentStep: isPolygon ? 'complete' : 'network'
        }));
      } else {
        setWalletState(prev => ({ ...prev, currentStep: 'connect' }));
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setWalletState(prev => ({ ...prev, currentStep: 'connect' }));
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletState(prev => ({
        ...prev,
        isConnected: false,
        userAddress: null,
        currentStep: 'connect'
      }));
    } else {
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        userAddress: accounts[0]
      }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    const isPolygon = chainId === POLYGON_CHAIN_ID;
    setWalletState(prev => ({
      ...prev,
      isPolygonNetwork: isPolygon,
      currentStep: prev.isConnected ? (isPolygon ? 'complete' : 'network') : prev.currentStep
    }));
  };

  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      const isPolygon = network.chainId === 137n;
      
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        userAddress: accounts[0].address,
        isPolygonNetwork: isPolygon,
        currentStep: isPolygon ? 'complete' : 'network',
        isLoading: false
      }));
      
      toast({
        title: "Wallet Connected!",
        description: "Successfully connected to MetaMask",
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const switchToPolygon = async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
      
      setWalletState(prev => ({
        ...prev,
        isPolygonNetwork: true,
        currentStep: 'complete',
        isLoading: false
      }));
      
      toast({
        title: "Network Switched!",
        description: "Successfully switched to Polygon network",
      });
      
    } catch (error: any) {
      console.error('Error switching network:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      
      if (error.code === 4902) {
        // Network not added to MetaMask
        await addPolygonNetwork();
      } else {
        toast({
          title: "Network Switch Failed",
          description: "Failed to switch to Polygon network",
          variant: "destructive",
        });
      }
    }
  };

  const addPolygonNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: POLYGON_CHAIN_ID,
          chainName: 'Polygon',
          rpcUrls: ['https://polygon-rpc.com/'],
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          },
          blockExplorerUrls: ['https://polygonscan.com/'],
        }],
      });
      
      setWalletState(prev => ({
        ...prev,
        isPolygonNetwork: true,
        currentStep: 'complete',
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Error adding Polygon network:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getStepIcon = (step: WalletStep, isActive: boolean, isComplete: boolean) => {
    if (walletState.isLoading && isActive) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    
    if (isComplete) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    
    switch (step) {
      case 'install':
        return <Download className="w-5 h-5" />;
      case 'connect':
        return <Wallet className="w-5 h-5" />;
      case 'network':
        return <Network className="w-5 h-5" />;
      case 'complete':
        return <Coins className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStepStatus = (step: WalletStep) => {
    switch (step) {
      case 'install':
        return walletState.isMetaMaskInstalled;
      case 'connect':
        return walletState.isConnected;
      case 'network':
        return walletState.isPolygonNetwork;
      case 'complete':
        return walletState.isMetaMaskInstalled && walletState.isConnected && walletState.isPolygonNetwork;
      default:
        return false;
    }
  };

  const steps = [
    { 
      key: 'install' as WalletStep, 
      title: walletState.deviceInfo.isMobile ? 'Install Mobile Wallet' : 'Install MetaMask', 
      description: walletState.deviceInfo.isMobile ? 'Download and install a mobile wallet app' : 'Download and install MetaMask browser extension' 
    },
    { key: 'connect' as WalletStep, title: 'Connect Wallet', description: 'Connect your wallet to continue' },
    { key: 'network' as WalletStep, title: 'Switch to Polygon', description: 'Switch to Polygon network' },
    { key: 'complete' as WalletStep, title: 'Ready for UMC', description: 'Your wallet is ready for UMC tokens' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-crypto animate-glow">
            <Coins className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-crypto bg-clip-text text-transparent">
            UMC Wallet Setup
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to access UMC tokens on Polygon
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="bg-gradient-card border-border shadow-crypto">
          <CardContent className="p-6">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const isActive = walletState.currentStep === step.key;
                const isComplete = getStepStatus(step.key);
                
                return (
                  <div key={step.key} className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-accent/20 border border-primary/20' : ''
                  }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isComplete ? 'bg-success/20' : isActive ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      {getStepIcon(step.key, isActive, isComplete)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isComplete ? 'text-success' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    
                    {isComplete && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Complete
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card className="bg-gradient-card border-border shadow-crypto">
          <CardContent className="p-6 space-y-6">
            {walletState.currentStep === 'install' && (
              <div className="text-center space-y-4">
                {walletState.deviceInfo.isMobile ? (
                  <Smartphone className="w-12 h-12 text-primary mx-auto" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-warning mx-auto" />
                )}
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {walletState.deviceInfo.isMobile ? 'Mobile Wallet Required' : 'MetaMask Required'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {walletState.deviceInfo.isMobile 
                      ? 'Install a mobile wallet app to connect and access UMC tokens'
                      : 'Install MetaMask to connect your wallet and access UMC tokens'
                    }
                  </p>
                  
                  {walletState.deviceInfo.isMobile ? (
                    <div className="space-y-3">
                      <Button 
                        variant="crypto" 
                        size="lg" 
                        className="w-full"
                        onClick={() => openMobileWallet('metamask', 'install')}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install MetaMask Mobile
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={() => openMobileWallet('trustWallet', 'install')}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install Trust Wallet
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      <div className="text-sm text-muted-foreground mt-4">
                        {walletState.deviceInfo.isAndroid ? 'Android' : 'iOS'} detected
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="crypto" 
                      size="lg" 
                      className="w-full"
                      onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install MetaMask
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {walletState.currentStep === 'connect' && (
              <div className="text-center space-y-4">
                <Wallet className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-muted-foreground mb-4">
                    {walletState.deviceInfo.isMobile 
                      ? 'Connect your mobile wallet to continue'
                      : 'Connect your MetaMask wallet to continue'
                    }
                  </p>
                  
                  {walletState.deviceInfo.isMobile && !walletState.deviceInfo.hasMetaMask ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        If you have a wallet app installed, try opening this page in your wallet's browser:
                      </p>
                      <Button 
                        variant="crypto" 
                        size="lg" 
                        className="w-full"
                        onClick={() => openMobileWallet('metamask', 'open')}
                      >
                        <Wallet className="w-5 h-5 mr-2" />
                        Open in MetaMask
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={() => openMobileWallet('trustWallet', 'open')}
                      >
                        <Wallet className="w-5 h-5 mr-2" />
                        Open in Trust Wallet
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="crypto" 
                      size="lg" 
                      className="w-full"
                      onClick={connectWallet}
                      disabled={walletState.isLoading}
                    >
                      {walletState.isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-5 h-5 mr-2" />
                      )}
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            )}

            {walletState.currentStep === 'network' && (
              <div className="text-center space-y-4">
                <Network className="w-12 h-12 text-warning mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Switch to Polygon</h3>
                  <p className="text-muted-foreground mb-4">
                    UMC tokens are available on the Polygon network
                  </p>
                  <Button 
                    variant="warning" 
                    size="lg" 
                    className="w-full"
                    onClick={switchToPolygon}
                    disabled={walletState.isLoading}
                  >
                    {walletState.isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Network className="w-5 h-5 mr-2" />
                    )}
                    Switch to Polygon
                  </Button>
                </div>
              </div>
            )}

            {walletState.currentStep === 'complete' && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-success">Wallet Connected!</h3>
                  <p className="text-muted-foreground">
                    Your wallet is ready for UMC tokens
                  </p>
                </div>

                {/* Wallet Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Connected Address:</span>
                    <Badge variant="outline" className="font-mono">
                      {walletState.userAddress && formatAddress(walletState.userAddress)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network:</span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Polygon
                    </Badge>
                  </div>
                </div>

                {/* UMC Token Info */}
                <div className="bg-gradient-crypto/10 rounded-lg p-4 border border-primary/20">
                  <h4 className="font-semibold mb-3 text-primary">UMC Token Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="font-semibold">UMC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract:</span>
                      <span className="font-mono text-xs">{UMC_CONTRACT_ADDRESS}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(`https://polygonscan.com/token/${UMC_CONTRACT_ADDRESS}`, '_blank')}
                    >
                      View on PolygonScan
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="crypto" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open('https://www.umojacoin.com/buy', '_blank')}
                    >
                      Buy UMC Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}