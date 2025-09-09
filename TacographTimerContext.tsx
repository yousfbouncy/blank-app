import React, { createContext, useContext } from 'react';
import { useTacographTimer } from '@/hooks/useTacographTimer';
import { ActivityType, ActivityRecord, DailyTotals } from '@/types/tacograph';

interface TacographTimerContextType {
  currentActivity: ActivityType | null;
  startActivity: (type: ActivityType, location?: string) => Promise<void>;
  currentTimer: number;
  drivingCountdown: number;
  dailyRestCountdown: number;
  availabilityCountdown: number;
  dailyTotals: DailyTotals;
  weeklyTotal: number;
  biweeklyTotal: number;
  nextBreakRequired: '15 min' | '30 min' | 'N/A' | '45 min' | 'Overdue';
  isWorkdayActive: boolean;
  updateActivityRecord: (recordId: string, newDurationInSeconds: number) => Promise<void>;
  activityRecordsRef: React.MutableRefObject<ActivityRecord[]>;
  pauseActivity: () => Promise<void>;

  pauseTimer: () => void;
  startTimer: (activityType: ActivityType | null) => void;
  dataUpdated: number;
  endWorkday: (location: string) => Promise<void>;
  currentActivityRecordId: string | null;
}

const TacographTimerContext = createContext<TacographTimerContextType | undefined>(undefined);

export const TacographTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const allTimerProps = useTacographTimer();

  return (
    <TacographTimerContext.Provider value={allTimerProps}>
      {children}
    </TacographTimerContext.Provider>
  );
};

export const useTacographTimerContext = () => {
  const context = useContext(TacographTimerContext);
  if (context === undefined) {
    throw new Error('useTacographTimerContext must be used within a TacographTimerProvider');
  }
  return context;
};