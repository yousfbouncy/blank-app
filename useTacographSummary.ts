import { useState, useEffect } from 'react';
import { WeeklyStats } from '@/types/tacograph';
import { loadTacographData } from '@/utils/storage';
import { 
  calculateWeeklyStats, 
  calculateBiweeklyStats, 
  calculateMonthlyStats 
} from '@/utils/calculations';

export function useTacographSummary(dataUpdated: number) {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    driving: 0,
    workdays: 0,
    totalWorkTime: 0,
    averageWorkday: 0,
  });
  const [biweeklyStats, setBiweeklyStats] = useState<WeeklyStats>({
    driving: 0,
    workdays: 0,
    totalWorkTime: 0,
    averageWorkday: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<WeeklyStats>({
    driving: 0,
    workdays: 0,
    totalWorkTime: 0,
    averageWorkday: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      let data = await loadTacographData();
      if (!Array.isArray(data)) {
        console.warn('loadTacographData no devolvió un array, inicializando como array vacío.');
        data = [];
      }
      setWeeklyStats(calculateWeeklyStats(data));
      setBiweeklyStats(calculateBiweeklyStats(data));
      setMonthlyStats(calculateMonthlyStats(data));
    };
    fetchData();
  }, [dataUpdated]);

  return {
    weeklyStats,
    biweeklyStats,
    monthlyStats,
  };
}