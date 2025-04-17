'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import InvestmentCalculator from '@/components/calculator/InvestmentCalculator';

const CalculatorPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investment Calculator</h1>
        <p className="text-gray-600">
          Use this calculator to estimate how your USDC savings will grow over time through regular contributions and compound interest.
        </p>
        <InvestmentCalculator />
      </div>
    </AppLayout>
  );
};

export default CalculatorPage;
