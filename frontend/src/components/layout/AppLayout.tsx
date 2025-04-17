import React, { type ReactNode } from 'react';
import Navigation from './Navigation';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Web3 Savings Tracker &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">A decentralized app for tracking your USDC savings and investments</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
