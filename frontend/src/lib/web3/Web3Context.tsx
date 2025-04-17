'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { InjectedConnector } from '@web3-react/injected-connector';
import { toast } from 'sonner';

// USDC Token info (Ethereum Mainnet)
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint)',
  'function transfer(address to, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

// Define injected connector (MetaMask, etc.)
export const injected = new InjectedConnector({
  supportedChainIds: [1, 11155111] // Ethereum Mainnet and Sepolia Testnet
});

// Web3 context types
type Web3ContextType = {
  account: string | null;
  chainId: number | null;
  provider: ethers.JsonRpcProvider | null;
  signer: ethers.Signer | null;
  usdcBalance: string;
  connecting: boolean;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  approveUsdc: (spender: string, amount: string) => Promise<boolean>;
  transferUsdc: (to: string, amount: string) => Promise<boolean>;
};

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);

  // Connect to wallet
  const connect = async () => {
    try {
      setConnecting(true);

      // Check if window.ethereum is available
      if (typeof window.ethereum === 'undefined') {
        toast.error('Metamask not installed!');
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(chainId));
      setConnected(true);

      // Fetch USDC balance
      await fetchUsdcBalance(provider, address);

      toast.success('Connected to wallet');
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from wallet
  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setUsdcBalance('0');
    setConnected(false);
    toast.info('Disconnected from wallet');
  };

  // Fetch USDC balance
  const fetchUsdcBalance = async (provider: ethers.JsonRpcProvider, address: string) => {
    try {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();

      // Format to display with correct decimal places
      const formattedBalance = ethers.formatUnits(balance, decimals);
      setUsdcBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setUsdcBalance('0');
    }
  };

  // Approve USDC spending
  const approveUsdc = async (spender: string, amount: string): Promise<boolean> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      // Convert amount to USDC's decimal precision (6 decimals)
      const decimals = await usdcContract.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      // Send approval transaction
      const tx = await usdcContract.approve(spender, parsedAmount);

      // Wait for transaction to be mined
      toast.info('Approving USDC transaction...');
      await tx.wait();

      toast.success('USDC approved successfully');
      return true;
    } catch (error) {
      console.error('Error approving USDC:', error);
      toast.error('Failed to approve USDC');
      return false;
    }
  };

  // Transfer USDC
  const transferUsdc = async (to: string, amount: string): Promise<boolean> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      // Convert amount to USDC's decimal precision (6 decimals)
      const decimals = await usdcContract.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      // Send transfer transaction
      const tx = await usdcContract.transfer(to, parsedAmount);

      // Wait for transaction to be mined
      toast.info('Processing USDC transfer...');
      await tx.wait();

      // Update balance after transfer
      if (account && provider) {
        await fetchUsdcBalance(provider, account);
      }

      toast.success('USDC transferred successfully');
      return true;
    } catch (error) {
      console.error('Error transferring USDC:', error);
      toast.error('Failed to transfer USDC');
      return false;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);

          if (provider && accounts[0]) {
            await fetchUsdcBalance(provider, accounts[0]);
          }
        }
      };

      const handleChainChanged = (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16));
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, provider]);

  // Refresh USDC balance periodically
  useEffect(() => {
    if (connected && provider && account) {
      const interval = setInterval(() => {
        fetchUsdcBalance(provider, account);
      }, 15000); // every 15 seconds

      return () => clearInterval(interval);
    }
  }, [connected, provider, account]);

  const value = {
    account,
    chainId,
    provider,
    signer,
    usdcBalance,
    connecting,
    connected,
    connect,
    disconnect,
    approveUsdc,
    transferUsdc
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Add window.ethereum type for TypeScript
declare global {
  interface Window {
    ethereum: any;
  }
}
