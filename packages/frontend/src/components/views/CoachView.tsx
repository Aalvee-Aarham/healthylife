import React from 'react';
import { ClientRecord, CoachSession } from '../../types';
import { CoachDashboardView } from './CoachDashboardView';

interface CoachViewProps {
  clients?: ClientRecord[];
  sessions?: CoachSession[];
  activeTab?: string;
  user?: any;
}

export const CoachView: React.FC<CoachViewProps> = ({ user }) => {
  const defaultCoach = user || {
    name: 'Coach Alex',
    role: 'coach',
    email: 'coach@healthylife.local',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  };

  return <CoachDashboardView user={defaultCoach} />;
};

