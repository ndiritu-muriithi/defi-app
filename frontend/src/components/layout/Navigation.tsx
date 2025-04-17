import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Trophy,
  Calculator,
  Bell,
  Wallet,
  User,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/web3/Web3Context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const pathname = usePathname();
  const { account, usdcBalance, connected, connecting, connect, disconnect } = useWeb3();

  const formatAccount = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: string) => {
    return Number.parseFloat(balance).toFixed(2);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Goals', path: '/goals', icon: <Target className="w-5 h-5" /> },
    { name: 'Challenges', path: '/challenges', icon: <Trophy className="w-5 h-5" /> },
    { name: 'Calculator', path: '/calculator', icon: <Calculator className="w-5 h-5" /> },
    { name: 'Reminders', path: '/reminders', icon: <Bell className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Wallet className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-xl font-bold">Web3 Savings</span>
            </Link>

            <nav className="hidden md:ml-10 md:flex md:space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center">
            {connected ? (
              <div className="flex items-center">
                <div className="hidden sm:flex items-center bg-green-50 py-1 px-3 rounded-full text-green-700 mr-4">
                  <span className="font-medium">{formatBalance(usdcBalance)} USDC</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{formatAccount(account || '')}</span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm text-gray-500">
                      <span className="sm:hidden block">{formatBalance(usdcBalance)} USDC</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnect} className="text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={connect} disabled={connecting} variant="default">
                <Wallet className="mr-2 h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-between py-3 border-t border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-1/5 py-1 ${
                isActive(item.path)
                  ? 'text-green-700'
                  : 'text-gray-600'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
