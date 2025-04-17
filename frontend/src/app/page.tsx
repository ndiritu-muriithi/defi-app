'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowRight, TrendingUp, Target, Trophy, Wallet, Bell, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '@/lib/web3/Web3Context';
import {
  getGoals,
  getTransactions,
  getChallenges,
  getPendingReminders,
  initializeSampleData,
  type SavingsGoal
} from '@/lib/db/storage';
import { parseISO, format, differenceInDays } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const { account, usdcBalance, connected } = useWeb3();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [activeChallengesCount, setActiveChallengesCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize sample data for demonstration
    initializeSampleData();

    // Load data
    loadData();
  }, []);

  const loadData = () => {
    const savedGoals = getGoals();
    const transactions = getTransactions();
    const challenges = getChallenges();
    const pendingReminders = getPendingReminders();

    setGoals(savedGoals);
    setPendingRemindersCount(pendingReminders.length);
    setActiveChallengesCount(challenges.filter(c => c.status === 'active').length);

    // Calculate totals
    const totalCurrentAmount = savedGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTargetAmount = savedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

    setTotalSaved(totalCurrentAmount);
    setTotalTarget(totalTargetAmount);

    // Generate monthly data for chart
    generateMonthlyData(transactions);
  };

  const generateMonthlyData = (transactions: any[]) => {
    const monthlyMap = new Map();

    // Group transactions by month
    transactions.forEach(tx => {
      const date = parseISO(tx.date);
      const monthKey = format(date, 'MMM yyyy');

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, deposits: 0, withdrawals: 0 });
      }

      const monthData = monthlyMap.get(monthKey);
      if (tx.type === 'deposit') {
        monthData.deposits += tx.amount;
      } else {
        monthData.withdrawals += tx.amount;
      }
    });

    // Convert map to array and sort by date
    const monthlyDataArray = Array.from(monthlyMap.values());
    monthlyDataArray.sort((a, b) => {
      return parseISO(a.month).getTime() - parseISO(b.month).getTime();
    });

    setMonthlyData(monthlyDataArray);
  };

  const calculateTotalProgress = () => {
    if (totalTarget === 0) return 0;
    return Math.min(100, Math.round((totalSaved / totalTarget) * 100));
  };

  const getUpcomingGoals = () => {
    return goals
      .filter(goal => goal.status === 'active')
      .sort((a, b) => {
        const daysA = differenceInDays(parseISO(a.endDate), new Date());
        const daysB = differenceInDays(parseISO(b.endDate), new Date());
        return daysA - daysB;
      })
      .slice(0, 3);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          {!connected && (
            <Alert variant="destructive" className="mb-4 max-w-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connect Your Wallet</AlertTitle>
              <AlertDescription>
                To track your USDC savings and interact with goals, please connect your Web3 wallet.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">USDC Balance</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connected ? `${Number.parseFloat(usdcBalance).toFixed(2)} USDC` : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Available for investing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSaved.toLocaleString()} USDC</div>
              <p className="text-xs text-gray-500 mt-1">Toward your financial goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goals.filter(g => g.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Financial goals you're tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeChallengesCount}</div>
              <p className="text-xs text-gray-500 mt-1">Challenges to help you save</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                Your progress toward all financial goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalTarget > 0 ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Overall Progress</span>
                      <span>{calculateTotalProgress()}%</span>
                    </div>
                    <Progress value={calculateTotalProgress()} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-500">Current</p>
                      <p className="font-semibold">{totalSaved.toLocaleString()} USDC</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Target</p>
                      <p className="font-semibold">{totalTarget.toLocaleString()} USDC</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href="/goals">
                      <Button variant="outline" className="w-full" size="sm">
                        View All Goals
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No Goals Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first savings goal to start tracking progress
                  </p>
                  <Link href="/goals/new">
                    <Button>Create First Goal</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Savings Activity</CardTitle>
              <CardDescription>
                Your monthly savings and withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} USDC`} />
                      <Bar dataKey="deposits" fill="#22c55e" name="Deposits" />
                      <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No transaction data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Goals</CardTitle>
                <Link href="/goals">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {getUpcomingGoals().length > 0 ? (
                <div className="space-y-4">
                  {getUpcomingGoals().map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{goal.name}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {goal.type}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>Progress</span>
                          <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                        </div>
                        <Progress
                          value={Math.round((goal.currentAmount / goal.targetAmount) * 100)}
                          className="h-1.5"
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} USDC</span>
                        <span>Ends: {format(parseISO(goal.endDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No active goals</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Active Challenges</CardTitle>
                <Link href="/challenges">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activeChallengesCount > 0 ? (
                <Link href="/challenges">
                  <Button className="w-full">View {activeChallengesCount} Active Challenges</Button>
                </Link>
              ) : (
                <div className="text-center py-6">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No active challenges</p>
                  <Link href="/challenges/new">
                    <Button variant="outline">Start a Challenge</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Reminders</CardTitle>
                <Link href="/reminders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingRemindersCount > 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-4">
                    You have {pendingRemindersCount} pending reminders
                  </p>
                  <Link href="/reminders">
                    <Button variant="outline">View Reminders</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending reminders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
