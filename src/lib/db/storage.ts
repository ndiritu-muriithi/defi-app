import { formatISO, parseISO, addDays } from 'date-fns';

// Types
export type GoalType = 'land' | 'business' | 'savings' | 'crypto' | 'other';
export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface SavingsGoal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  description: string;
  status: GoalStatus;
  priority: GoalPriority;
  reminderFrequency?: 'daily' | 'weekly' | 'monthly';
  lastReminderSent?: string; // ISO date string
}

export interface Transaction {
  id: string;
  goalId: string;
  amount: number;
  date: string; // ISO date string
  type: 'deposit' | 'withdrawal';
  description: string;
  txHash?: string; // blockchain transaction hash
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  reward: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: 'active' | 'completed' | 'failed';
  goalId?: string;
  targetAmount?: number;
  currentAmount?: number;
}

// Storage keys
const GOALS_KEY = 'web3_savings_goals';
const TRANSACTIONS_KEY = 'web3_savings_transactions';
const CHALLENGES_KEY = 'web3_savings_challenges';
const REMINDERS_KEY = 'web3_savings_reminders';

// Helper functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Goals CRUD
export const getGoals = (): SavingsGoal[] => {
  const goals = localStorage.getItem(GOALS_KEY);
  return goals ? JSON.parse(goals) : [];
};

export const getGoalById = (id: string): SavingsGoal | undefined => {
  const goals = getGoals();
  return goals.find(goal => goal.id === id);
};

export const createGoal = (goal: Omit<SavingsGoal, 'id'>): SavingsGoal => {
  const goals = getGoals();
  const newGoal: SavingsGoal = {
    ...goal,
    id: generateId(),
  };

  localStorage.setItem(GOALS_KEY, JSON.stringify([...goals, newGoal]));
  return newGoal;
};

export const updateGoal = (goal: SavingsGoal): SavingsGoal => {
  const goals = getGoals();
  const updatedGoals = goals.map(g => (g.id === goal.id ? goal : g));

  localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
  return goal;
};

export const deleteGoal = (id: string): boolean => {
  const goals = getGoals();
  const filteredGoals = goals.filter(goal => goal.id !== id);

  if (filteredGoals.length !== goals.length) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(filteredGoals));

    // Also delete related transactions
    const transactions = getTransactions();
    const filteredTransactions = transactions.filter(tx => tx.goalId !== id);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));

    return true;
  }

  return false;
};

// Transactions CRUD
export const getTransactions = (): Transaction[] => {
  const transactions = localStorage.getItem(TRANSACTIONS_KEY);
  return transactions ? JSON.parse(transactions) : [];
};

export const getTransactionsByGoalId = (goalId: string): Transaction[] => {
  const transactions = getTransactions();
  return transactions.filter(tx => tx.goalId === goalId);
};

export const createTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
  };

  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([...transactions, newTransaction]));

  // Update goal current amount
  const goal = getGoalById(transaction.goalId);
  if (goal) {
    const updatedAmount = transaction.type === 'deposit'
      ? goal.currentAmount + transaction.amount
      : goal.currentAmount - transaction.amount;

    updateGoal({
      ...goal,
      currentAmount: Math.max(0, updatedAmount), // Ensure we don't go below 0
      status: updatedAmount >= goal.targetAmount ? 'completed' : goal.status
    });
  }

  return newTransaction;
};

export const updateTransaction = (transaction: Transaction): Transaction => {
  const transactions = getTransactions();
  const oldTransaction = transactions.find(tx => tx.id === transaction.id);
  const updatedTransactions = transactions.map(tx => (tx.id === transaction.id ? transaction : tx));

  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));

  // Update goal current amount if necessary
  if (oldTransaction && (oldTransaction.amount !== transaction.amount || oldTransaction.type !== transaction.type)) {
    const goal = getGoalById(transaction.goalId);
    if (goal) {
      // Remove old transaction effect
      let updatedAmount = goal.currentAmount;
      if (oldTransaction.type === 'deposit') {
        updatedAmount -= oldTransaction.amount;
      } else {
        updatedAmount += oldTransaction.amount;
      }

      // Add new transaction effect
      if (transaction.type === 'deposit') {
        updatedAmount += transaction.amount;
      } else {
        updatedAmount -= transaction.amount;
      }

      updateGoal({
        ...goal,
        currentAmount: Math.max(0, updatedAmount),
        status: updatedAmount >= goal.targetAmount ? 'completed' : goal.status
      });
    }
  }

  return transaction;
};

export const deleteTransaction = (id: string): boolean => {
  const transactions = getTransactions();
  const transactionToDelete = transactions.find(tx => tx.id === id);
  const filteredTransactions = transactions.filter(tx => tx.id !== id);

  if (filteredTransactions.length !== transactions.length && transactionToDelete) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));

    // Update goal current amount
    const goal = getGoalById(transactionToDelete.goalId);
    if (goal) {
      const updatedAmount = transactionToDelete.type === 'deposit'
        ? goal.currentAmount - transactionToDelete.amount
        : goal.currentAmount + transactionToDelete.amount;

      updateGoal({
        ...goal,
        currentAmount: Math.max(0, updatedAmount),
        status: updatedAmount >= goal.targetAmount ? 'completed' : (updatedAmount < goal.targetAmount && goal.status === 'completed' ? 'active' : goal.status)
      });
    }

    return true;
  }

  return false;
};

// Challenges CRUD
export const getChallenges = (): Challenge[] => {
  const challenges = localStorage.getItem(CHALLENGES_KEY);
  return challenges ? JSON.parse(challenges) : [];
};

export const getChallengeById = (id: string): Challenge | undefined => {
  const challenges = getChallenges();
  return challenges.find(challenge => challenge.id === id);
};

export const createChallenge = (challenge: Omit<Challenge, 'id'>): Challenge => {
  const challenges = getChallenges();
  const newChallenge: Challenge = {
    ...challenge,
    id: generateId(),
  };

  localStorage.setItem(CHALLENGES_KEY, JSON.stringify([...challenges, newChallenge]));
  return newChallenge;
};

export const updateChallenge = (challenge: Challenge): Challenge => {
  const challenges = getChallenges();
  const updatedChallenges = challenges.map(c => (c.id === challenge.id ? challenge : c));

  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updatedChallenges));
  return challenge;
};

export const deleteChallenge = (id: string): boolean => {
  const challenges = getChallenges();
  const filteredChallenges = challenges.filter(challenge => challenge.id !== id);

  if (filteredChallenges.length !== challenges.length) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(filteredChallenges));
    return true;
  }

  return false;
};

// Reminders
export interface Reminder {
  id: string;
  goalId: string;
  message: string;
  date: string; // ISO date string
  acknowledged: boolean;
}

export const getReminders = (): Reminder[] => {
  const reminders = localStorage.getItem(REMINDERS_KEY);
  return reminders ? JSON.parse(reminders) : [];
};

export const getPendingReminders = (): Reminder[] => {
  const reminders = getReminders();
  const now = new Date();
  return reminders.filter(
    reminder => !reminder.acknowledged && parseISO(reminder.date) <= now
  );
};

export const createReminder = (reminder: Omit<Reminder, 'id'>): Reminder => {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: generateId(),
  };

  localStorage.setItem(REMINDERS_KEY, JSON.stringify([...reminders, newReminder]));
  return newReminder;
};

export const acknowledgeReminder = (id: string): boolean => {
  const reminders = getReminders();
  const updatedReminders = reminders.map(r =>
    r.id === id ? { ...r, acknowledged: true } : r
  );

  localStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders));
  return true;
};

// Generate reminders for goals
export const generateRemindersForGoals = (): void => {
  const goals = getGoals().filter(goal =>
    goal.status === 'active' && goal.reminderFrequency
  );

  const now = new Date();
  const today = formatISO(now);

  goals.forEach(goal => {
    if (!goal.reminderFrequency || !goal.lastReminderSent) {
      // First reminder
      createReminder({
        goalId: goal.id,
        message: `Remember to add to your "${goal.name}" goal!`,
        date: today,
        acknowledged: false,
      });

      // Update goal with lastReminderSent
      updateGoal({
        ...goal,
        lastReminderSent: today,
      });
      return;
    }

    const lastSent = parseISO(goal.lastReminderSent);
    let shouldSendReminder = false;
    let nextReminderDate: Date | null = null;

    // Check if we should send a reminder based on frequency
    switch (goal.reminderFrequency) {
      case 'daily':
        // Send reminder if a day has passed
        nextReminderDate = addDays(lastSent, 1);
        shouldSendReminder = nextReminderDate <= now;
        break;
      case 'weekly':
        // Send reminder if a week has passed
        nextReminderDate = addDays(lastSent, 7);
        shouldSendReminder = nextReminderDate <= now;
        break;
      case 'monthly':
        // Send reminder if a month has passed
        nextReminderDate = addDays(lastSent, 30);
        shouldSendReminder = nextReminderDate <= now;
        break;
    }

    if (shouldSendReminder && nextReminderDate) {
      createReminder({
        goalId: goal.id,
        message: `Remember to add to your "${goal.name}" goal!`,
        date: formatISO(nextReminderDate),
        acknowledged: false,
      });

      // Update goal with lastReminderSent
      updateGoal({
        ...goal,
        lastReminderSent: formatISO(nextReminderDate),
      });
    }
  });
};

// Get progress reports
export const getProgressReport = (goalId: string) => {
  const goal = getGoalById(goalId);
  const transactions = getTransactionsByGoalId(goalId);

  if (!goal) {
    return null;
  }

  const progressPercentage = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );

  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const startDate = parseISO(goal.startDate);
  const endDate = parseISO(goal.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  const timeProgressPercentage = Math.min(
    100,
    Math.round((elapsedDays / totalDays) * 100)
  );

  const isOnTrack = progressPercentage >= timeProgressPercentage;

  const dailyAmountNeeded = remainingDays > 0
    ? (goal.targetAmount - goal.currentAmount) / remainingDays
    : 0;

  return {
    goal,
    progressPercentage,
    totalDeposits,
    totalWithdrawals,
    elapsedDays,
    remainingDays,
    timeProgressPercentage,
    isOnTrack,
    dailyAmountNeeded,
    transactions
  };
};

// Initialize sample data (for demonstration purposes)
export const initializeSampleData = () => {
  if (getGoals().length === 0) {
    // Sample goals
    const landGoal = createGoal({
      name: 'Buy Land Property',
      type: 'land',
      targetAmount: 50000,
      currentAmount: 5000,
      startDate: formatISO(new Date()),
      endDate: formatISO(addDays(new Date(), 365)), // 1 year from now
      description: 'Saving for a small plot of land for future development',
      status: 'active',
      priority: 'high',
      reminderFrequency: 'weekly'
    });

    const businessGoal = createGoal({
      name: 'Start Online Business',
      type: 'business',
      targetAmount: 15000,
      currentAmount: 3000,
      startDate: formatISO(new Date()),
      endDate: formatISO(addDays(new Date(), 180)), // 6 months from now
      description: 'Capital for starting an e-commerce store',
      status: 'active',
      priority: 'medium',
      reminderFrequency: 'daily'
    });

    const savingsGoal = createGoal({
      name: 'Emergency Fund',
      type: 'savings',
      targetAmount: 10000,
      currentAmount: 1000,
      startDate: formatISO(new Date()),
      endDate: formatISO(addDays(new Date(), 120)), // 4 months from now
      description: 'Building an emergency fund for unexpected expenses',
      status: 'active',
      priority: 'high',
      reminderFrequency: 'weekly'
    });

    // Sample transactions
    createTransaction({
      goalId: landGoal.id,
      amount: 5000,
      date: formatISO(new Date()),
      type: 'deposit',
      description: 'Initial deposit'
    });

    createTransaction({
      goalId: businessGoal.id,
      amount: 3000,
      date: formatISO(new Date()),
      type: 'deposit',
      description: 'Initial deposit'
    });

    createTransaction({
      goalId: savingsGoal.id,
      amount: 1000,
      date: formatISO(new Date()),
      type: 'deposit',
      description: 'Initial deposit'
    });

    // Sample challenges
    createChallenge({
      name: 'Monthly Saver',
      description: 'Save $1000 in the next 30 days',
      reward: '10% bonus toward any goal',
      startDate: formatISO(new Date()),
      endDate: formatISO(addDays(new Date(), 30)),
      status: 'active',
      targetAmount: 1000,
      currentAmount: 0
    });

    createChallenge({
      name: 'Land Investment Master',
      description: 'Reach 20% of your land investment goal',
      reward: 'Investment strategy consultation',
      startDate: formatISO(new Date()),
      endDate: formatISO(addDays(new Date(), 60)),
      status: 'active',
      goalId: landGoal.id,
      targetAmount: landGoal.targetAmount * 0.2,
      currentAmount: landGoal.currentAmount
    });
  }
};

// Calculate return on investment (ROI) for a savings plan
export const calculateROI = (
  principal: number,
  monthlyContribution: number,
  annualInterestRate: number,
  years: number
) => {
  const monthlyInterestRate = annualInterestRate / 12 / 100;
  const totalMonths = years * 12;
  let futureValue = principal;

  for (let month = 1; month <= totalMonths; month++) {
    futureValue += monthlyContribution;
    futureValue *= (1 + monthlyInterestRate);
  }

  const totalContribution = principal + (monthlyContribution * totalMonths);
  const interestEarned = futureValue - totalContribution;
  const roi = (interestEarned / totalContribution) * 100;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalContribution: Math.round(totalContribution * 100) / 100,
    interestEarned: Math.round(interestEarned * 100) / 100,
    roi: Math.round(roi * 100) / 100
  };
};
