'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import RemindersList from '@/components/reminders/RemindersList';

const RemindersPage = () => {
  return (
    <AppLayout>
      <RemindersList />
    </AppLayout>
  );
};

export default RemindersPage;
