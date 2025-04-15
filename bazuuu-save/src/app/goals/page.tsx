'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import GoalsList from '@/components/goals/GoalsList';

const GoalsPage = () => {
  return (
    <AppLayout>
      <GoalsList />
    </AppLayout>
  );
};

export default GoalsPage;
