import type React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calculateROI } from '@/lib/db/storage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const InvestmentCalculator = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(100);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(5);
  const [years, setYears] = useState<number>(10);
  const [result, setResult] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const handleCalculate = () => {
    // Validate inputs
    if (principal < 0 || monthlyContribution < 0 || annualInterestRate < 0 || years <= 0) {
      return;
    }

    // Calculate result
    const calculationResult = calculateROI(principal, monthlyContribution, annualInterestRate, years);
    setResult(calculationResult);

    // Generate chart data
    generateChartData();
  };

  const generateChartData = () => {
    const data = [];
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    let currentValue = principal;
    let totalContributions = principal;

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        for (let month = 1; month <= 12; month++) {
          currentValue += monthlyContribution;
          totalContributions += monthlyContribution;
          currentValue *= (1 + monthlyInterestRate);
        }
      }

      data.push({
        year,
        value: Math.round(currentValue * 100) / 100,
        contributions: Math.round(totalContributions * 100) / 100,
      });
    }

    setChartData(data);
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: string
  ) => {
    const parsedValue = Number.parseFloat(value);
    setter(isNaN(parsedValue) ? 0 : parsedValue);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Investment Calculator</CardTitle>
        <CardDescription>
          Calculate how your investment will grow over time
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Initial Investment (USDC)</Label>
            <Input
              id="principal"
              type="number"
              min="0"
              value={principal}
              onChange={(e) => handleInputChange(setPrincipal, e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyContribution">Monthly Contribution (USDC)</Label>
            <Input
              id="monthlyContribution"
              type="number"
              min="0"
              value={monthlyContribution}
              onChange={(e) => handleInputChange(setMonthlyContribution, e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              min="0"
              step="0.1"
              value={annualInterestRate}
              onChange={(e) => handleInputChange(setAnnualInterestRate, e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="years">Investment Period (Years)</Label>
            <Input
              id="years"
              type="number"
              min="1"
              value={years}
              onChange={(e) => handleInputChange(setYears, e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleCalculate}>
          Calculate
        </Button>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Future Value</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-green-600">
                    {result.futureValue.toLocaleString()} USDC
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Total Contributions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">
                    {result.totalContribution.toLocaleString()} USDC
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Interest Earned</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-blue-600">
                    {result.interestEarned.toLocaleString()} USDC
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Return on Investment</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-purple-600">
                    {result.roi.toLocaleString()}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      label={{ value: 'Years', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis
                      label={{ value: 'Value (USDC)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} USDC`, undefined]}
                      labelFormatter={(year) => `Year ${year}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.3}
                      name="Total Value"
                    />
                    <Area
                      type="monotone"
                      dataKey="contributions"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                      name="Your Contributions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-sm text-gray-500">
        This calculator provides estimates based on a constant interest rate and regular monthly
        contributions. Actual results may vary based on market conditions and investment choices.
      </CardFooter>
    </Card>
  );
};

export default InvestmentCalculator;
