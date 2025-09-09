import { useState, useEffect } from 'react';
import { ActivityRecord } from '@/types/tacograph';
import { loadTacographData } from '@/utils/storage';

export function useTacographHistory(dataUpdated: number) {
  const [calendarHistory, setCalendarHistory] = useState<{[date: string]: ActivityRecord[]}>( {} );

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadTacographData();
    // Agrupar por fecha
    const grouped: {[date: string]: ActivityRecord[]} = {};
    data.forEach(record => {
      // Convertir la fecha a formato YYYY-MM-DD para que coincida con el calendario
      const dateKey = new Date(record.startTime).toISOString().slice(0,10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(record);
    });
    // Ordenar fechas descendente y actividades por fecha descendente
    Object.keys(grouped).forEach(date => {
      grouped[date] = grouped[date].sort((a, b) => b.startTime - a.startTime);
    });
    setCalendarHistory(grouped);
    };
    fetchData();
  }, [dataUpdated]);

  return {
    calendarHistory,
  };
}