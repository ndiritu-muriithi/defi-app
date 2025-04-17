'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ChallengesList from '@/components/challenges/ChallengesList';

const ChallengesPage = () => {
  return (
    <AppLayout>
      <ChallengesList />
    </AppLayout>
  );
};

export default ChallengesPage;
