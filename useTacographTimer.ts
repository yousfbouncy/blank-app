import { useState, useEffect, useRef } from 'react';
import { ActivityType, ActivityRecord, DailyTotals } from '@/types/tacograph';
import { saveTacographData, loadTacographData } from '@/utils/storage';
import { calculateDailyTotals, calculateWeeklyTotal, calculateBiweeklyTotal } from '@/utils/calculations';

export function useTacographTimer() {
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [currentTimer, setCurrentTimer] = useState(0);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    driving: 0,
    break: 0,
    other_work: 0,
    total_workday: 0,
  

```);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [biweeklyTotal, setBiweeklyTotal] = useState(0);
  const [isWorkdayActive, setIsWorkdayActive] = useState(false);
  const [drivingCountdown, setDrivingCountdown] = useState(4.5 * 3600); // 4h 30m in seconds
  const [dailyRestCountdown, setDailyRestCountdown] = useState(0);
  const [availabilityCountdown, setAvailabilityCountdown] = useState(0);
  const [nextBreakRequired, setNextBreakRequired] = useState<'15 min' | '30 min' | 'N/A' | '45 min' | 'Overdue'>('45 min');
  const [drivingTimeSinceLastBreak, setDrivingTimeSinceLastBreak] = useState(0);
  const [hasTakenFirstBreak, setHasTakenFirstBreak] = useState(false);
  const [hasTakenSecondBreak, setHasTakenSecondBreak] = useState(false);


  const [dataUpdated, setDataUpdated] = useState(0);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const activityRecordsRef = useRef<ActivityRecord[]>([]);

  const [currentActivityRecordId, setCurrentActivityRecordId] = useState<string | null>(null);


  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      let data = await loadTacographData();
      if (!Array.isArray(data)) data = [];
      activityRecordsRef.current = data;
      
      const today = new Date().toDateString();
      const todayRecords = data.filter(record => record.date === today);
      const hasStarted = todayRecords.some(record => record.type === 'workday_start');
      const hasEnded = todayRecords.some(record => record.type === 'workday_end');


      // *** INICIO DE LA CORRECCIÓN: Lógica para restaurar el estado de la pausa ***
      // Recalcula el estado de la pausa basándose en el historial del día para asegurar que sea correcto al cargar la app.
      let currentDrivingTime = 0;
      let firstBreakTaken = false;
      let secondBreakTaken = false;

      for (const record of todayRecords) {
        if (record.type === 'driving' && record.duration) {
          currentDrivingTime += record.duration;
        

``` else if (record.type === 'break' && record.duration) {
          if (record.duration >= 15 * 60 && !firstBreakTaken) {
            firstBreakTaken = true;
            currentDrivingTime = 0; // Reset driving time after a valid break
          

``` else if (record.duration >= 30 * 60 && firstBreakTaken && !secondBreakTaken) {
            secondBreakTaken = true;
            firstBreakTaken = false; // Reset for next cycle if needed
            currentDrivingTime = 0; // Reset driving time after a valid break
          

```
        

```
      

```
      setDrivingTimeSinceLastBreak(currentDrivingTime);
      setHasTakenFirstBreak(firstBreakTaken);
      setHasTakenSecondBreak(secondBreakTaken);
      // Determine nextBreakRequired based on loaded state
      if (currentDrivingTime >= 4.5 * 3600) {
        setNextBreakRequired('Overdue');
      

``` else if (currentDrivingTime >= 3 * 3600 && !firstBreakTaken) {
        setNextBreakRequired('15 min');
      

``` else if (currentDrivingTime >= 45 * 60 && firstBreakTaken && !secondBreakTaken) {
        setNextBreakRequired('30 min');
      

``` else {
        setNextBreakRequired('45 min');
      

```
    // *** FIN DE LA CORRECCIÓN ***


      if (hasEnded) {
        setIsWorkdayActive(false); // Ensure workday is not active
        const workdayEndRecord = todayRecords.findLast(record => record.type === 'workday_end');
        if (workdayEndRecord) {
          const timeSinceWorkdayEnd = (Date.now() - workdayEndRecord.startTime) / 1000; // Time in seconds
          const initialDailyRest = 11 * 3600; // 11 hours
          const remainingRest = Math.max(0, initialDailyRest - timeSinceWorkdayEnd);
          setDailyRestCountdown(remainingRest);
          // Start a timer for daily rest if it's not already running
          if (remainingRest > 0) {
            startTimer(null); // Pass null as activityType for daily rest countdown
          

```
        

```
      

``` else {
        setDailyRestCountdown(0); // Ensure daily rest countdown is 0 if no workday_end record
      

```
      
      // Recalculate availabilityCountdown on load
      setAvailabilityCountdown(Math.max(0, 13 * 3600 - (todayRecords.reduce((acc, record) => acc + (record.type === 'driving' || record.type === 'other_work' ? record.duration || 0 : 0), 0))));

        if (hasStarted && !hasEnded) {
          setDailyRestCountdown(0); // Ensure daily rest countdown is 0 if workday is active
          setIsWorkdayActive(true);
          const lastRecord = todayRecords[todayRecords.length - 1];
          if (lastRecord && !lastRecord.endTime && lastRecord.type !== 'workday_start') {
            setCurrentActivity(lastRecord.type);
            startTimeRef.current = lastRecord.startTime;
            setCurrentTimer(Math.floor((Date.now() - lastRecord.startTime) / 1000)); // Calculate current timer based on elapsed time
            startTimer(lastRecord.type);
          

```
        

```
        await updateTotals(today);
      

```;
    fetchData();
  

```, []);

  const updateBreakState = (records: ActivityRecord[]) => {
    let currentDrivingTime = 0;
    let firstBreakTaken = false;
    let secondBreakTaken = false;

    for (const record of records) {
      if (record.type === 'driving' && record.duration) {
        currentDrivingTime += record.duration;
      

``` else if (record.type === 'break' && record.duration) {
        if (record.duration >= 15 * 60 && !firstBreakTaken) {
          firstBreakTaken = true;
          currentDrivingTime = 0; // Reset driving time after a valid break
        

``` else if (record.duration >= 30 * 60 && firstBreakTaken && !secondBreakTaken) {
          secondBreakTaken = true;
          firstBreakTaken = false; // Reset for next cycle if needed
          currentDrivingTime = 0; // Reset driving time after a valid break
        

```
      

```
    

```
    return { currentDrivingTime, firstBreakTaken, secondBreakTaken 

```;
  

```;

  const updateTotals = async (date?: string) => {
    const today = date || new Date().toDateString();
    const allRecords = await loadTacographData();
    const dailyRecords = allRecords.filter(record => record.date === today);

    let totals: DailyTotals = { driving: 0, break: 0, other_work: 0, total_workday: 0 };
    if (Array.isArray(dailyRecords) && dailyRecords.length > 0) {
      totals = calculateDailyTotals(dailyRecords, today);
    }
    setDailyTotals(totals);

    let weekly = 0;
    if (Array.isArray(allRecords) && allRecords.length > 0) {
      weekly = calculateWeeklyTotal(allRecords);
    }
    setWeeklyTotal(weekly);

    let biweekly = 0;
    if (Array.isArray(allRecords) && allRecords.length > 0) {
      biweekly = calculateBiweeklyTotal(allRecords);
    }
    setBiweeklyTotal(biweekly);

    setDataUpdated(Date.now());
    return { totals, weekly, biweekly };
  

  const startTimer = (activityType: ActivityType | null) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    

```

    if (activityType === null) {
      // This is for daily rest countdown
      intervalRef.current = window.setInterval(() => {
        setDailyRestCountdown(prev => Math.max(0, prev - 1));
      

```, 1000);
    

``` else {
      startTimeRef.current = Date.now() - (currentTimer * 1000); // Adjust startTimeRef based on currentTimer
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setCurrentTimer(elapsed);

        if (activityType === 'driving') {
          // Calculate driving time since last break including current session
          const todayRecords = activityRecordsRef.current.filter(rec => rec.date === new Date().toDateString());
          const { currentDrivingTime: savedDrivingTime, firstBreakTaken: savedFirstBreakTaken, secondBreakTaken: savedSecondBreakTaken 

``` = updateBreakState(todayRecords);

          // Add current elapsed driving time to the saved driving time
          const totalDrivingTimeForBreakCheck = savedDrivingTime + currentTimer;

          setDrivingTimeSinceLastBreak(totalDrivingTimeForBreakCheck);
          setDrivingCountdown(prev => Math.max(0, prev - 1));

          // Update nextBreakRequired based on totalDrivingTimeForBreakCheck
          if (totalDrivingTimeForBreakCheck >= 4.5 * 3600) {
            setNextBreakRequired('Overdue');
          

``` else if (totalDrivingTimeForBreakCheck >= 3 * 3600 && !savedFirstBreakTaken) {
            setNextBreakRequired('15 min');
          

``` else if (totalDrivingTimeForBreakCheck >= 45 * 60 && savedFirstBreakTaken && !savedSecondBreakTaken) {
            setNextBreakRequired('30 min');
          

``` else {
            setNextBreakRequired('45 min');
          

```
        

```
        setAvailabilityCountdown(prev => Math.max(0, prev - 1));
      

```, 1000);
    

```
  

```;

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    

```
  

```;

  const stopTimer = () => {
    pauseTimer();
    setCurrentTimer(0);
  

```;

  const startActivity = async (type: ActivityType, location?: string) => {
    const now = Date.now();

    // 1. Finalizar la actividad actual si existe
    if (currentActivity && currentActivityRecordId) {
      let allRecords = await loadTacographData();
      const recordToUpdateIndex = allRecords.findIndex(rec => rec.id === currentActivityRecordId);

      if (recordToUpdateIndex !== -1) {
        const recordToUpdate = allRecords[recordToUpdateIndex];
        if (recordToUpdate && !recordToUpdate.endTime) {
          const duration = Math.floor((now - recordToUpdate.startTime) / 1000); // Calculate duration from record's start time
          recordToUpdate.endTime = now;
          recordToUpdate.duration = duration;
          await saveTacographData(allRecords);
          activityRecordsRef.current = allRecords;
        

```
      

```
    

```

    // Common action before starting new activity
    stopTimer();

    // 2. Iniciar la nueva actividad
    if (type === 'workday_start') {
      setIsWorkdayActive(true);
      await updateTotals(new Date().toDateString());
      setCurrentActivity(null);
      setAvailabilityCountdown(13 * 3600); // 13 horas de disponibilidad
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      

```
      setDailyRestCountdown(0); // Reset daily rest countdown when a new workday starts
    

``` else {
      setCurrentActivity(type);
      startTimeRef.current = now;
      startTimer(type);
    

```

    // Common record creation and saving logic
    const record: ActivityRecord = {
      id: Date.now().toString(),
      type,
      startTime: now,
      duration: 0,
      location,
      date: new Date().toDateString(),
    

```;

    let data = await loadTacographData();
    if (!Array.isArray(data)) data = [];
    data.push(record);
    await saveTacographData(data);
    activityRecordsRef.current = data; // Ensure ref is updated
    setCurrentActivityRecordId(record.id);
  

```;


  const endWorkday = async (location: string) => {
    const now = Date.now();


    // Finalizar la actividad actual si existe
    if (currentActivity && currentActivityRecordId) {
      let allRecords = await loadTacographData();
      const recordToUpdateIndex = allRecords.findIndex(rec => rec.id === currentActivityRecordId);

      if (recordToUpdateIndex !== -1) {
        const recordToUpdate = allRecords[recordToUpdateIndex];
        if (recordToUpdate && !recordToUpdate.endTime) {
          const duration = Math.floor((now - recordToUpdate.startTime) / 1000); // Calculate duration from record's start time
          recordToUpdate.endTime = now;
          recordToUpdate.duration = duration;
          await saveTacographData(allRecords);
          activityRecordsRef.current = allRecords;
        

```
      

```
    

```

    // Añadir el registro de fin de jornada
    const endRecord: ActivityRecord = {
      id: Date.now().toString(),
      type: 'workday_end',
      startTime: now,
      duration: 0,
      location,
      date: new Date().toDateString(),
    

```;

    let data = await loadTacographData();
    if (!Array.isArray(data)) data = [];
    data.push(endRecord);
    await saveTacographData(data);

    stopTimer();
    setCurrentActivity(null);
    setIsWorkdayActive(false);
    const today = new Date().toDateString();
    await updateTotals(today);


    // Iniciar el contador de descanso diario (11 horas por defecto)
    setDailyRestCountdown(11 * 3600);
    startTimer(null); // Iniciar el temporizador para el descanso diario
  

```;


  // Limpiar el intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      

```
    

```;
  

```, []);


  const pauseActivity = async () => {
    if (currentActivity !== 'break') {
      await startActivity('break');
    

```
  

```;


  const updateActivityRecord = async (recordId: string, newDurationInSeconds: number) => {
    let data = await loadTacographData();
    if (!Array.isArray(data)) data = [];
    const today = new Date().toDateString();

    const recordIndex = data.findIndex(record => record.id === recordId && record.date === today);

    if (recordIndex !== -1) {
      const record = data[recordIndex];
      if (record) {
        const currentRecord: ActivityRecord = record;
        const originalDuration = currentRecord.duration || 0;
        const difference = newDurationInSeconds - originalDuration;
      
        currentRecord.duration = newDurationInSeconds;
        currentRecord.endTime = currentRecord.startTime + (newDurationInSeconds * 1000);
        // If the edited activity is the current activity, update the currentTimer and startTimeRef
        if (currentRecord.id === currentActivityRecordId) {
          setCurrentTimer(newDurationInSeconds);
          startTimeRef.current = currentRecord.startTime; // Set startTimeRef to the record's start time
          // Clear and restart the timer to reflect the new duration immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          

```
          startTimer(currentActivity); // Restart with the current activity type
        

```
      
      await saveTacographData(data);
      activityRecordsRef.current = data;
      await recalculateAndSyncState(data);
      setDataUpdated(Date.now());
    

```
  

```

  const recalculateAndSyncState = async (data: ActivityRecord[]) => {
    const today = new Date().toDateString();
    const { totals: updatedDailyTotals 

``` = await updateTotals(today);

    // Sincronizar los contadores de cuenta atrás
    // Recalcular drivingCountdown basado en el total de conducción y las reglas de descanso
    const todayRecords = data.filter(record => record.date === today);
    let newDrivingCountdown = 4.5 * 3600 - updatedDailyTotals.driving;

    // Re-evaluar el estado de la pausa y usar los valores actualizados
    const { currentDrivingTime: freshDrivingTime, firstBreakTaken: freshFirstBreakTaken, secondBreakTaken: freshSecondBreakTaken 

``` = updateBreakState(todayRecords);

    setHasTakenFirstBreak(freshFirstBreakTaken);
    setHasTakenSecondBreak(freshSecondBreakTaken);
    setDrivingTimeSinceLastBreak(freshDrivingTime);
    setDrivingCountdown(Math.max(0, newDrivingCountdown));

    // Update nextBreakRequired based on re-evaluated state
    if (freshDrivingTime >= 4.5 * 3600) {
      setNextBreakRequired('Overdue');
    

``` else if (freshDrivingTime >= 45 * 60 && !freshFirstBreakTaken) {
      setNextBreakRequired('15 min');
    

``` else if (freshDrivingTime >= 3 * 3600 && freshFirstBreakTaken && !freshSecondBreakTaken) {
      setNextBreakRequired('30 min');
    

``` else {
      setNextBreakRequired('45 min');
    

```

    setAvailabilityCountdown(Math.max(0, 13 * 3600 - (updatedDailyTotals.driving + updatedDailyTotals.other_work)));

    // Sincronizar el contador de descanso diario
    const hasEnded = todayRecords.some(record => record.type === 'workday_end');
    if (hasEnded) {
      const workdayEndRecord = todayRecords.findLast(record => record.type === 'workday_end');
      if (workdayEndRecord) {
        const timeSinceWorkdayEnd = (Date.now() - workdayEndRecord.startTime) / 1000;
        const initialDailyRest = 11 * 3600;
        const remainingRest = Math.max(0, initialDailyRest - timeSinceWorkdayEnd);
        setDailyRestCountdown(remainingRest);
      

```
    

``` else {
      setDailyRestCountdown(0);
    

```

    setDataUpdated(Date.now());
  

```;

  return {
    currentActivity,
    startActivity,
    currentTimer,
    drivingCountdown,
    dailyRestCountdown,
    availabilityCountdown,
    pauseActivity,
    updateActivityRecord,
    dataUpdated,
    nextBreakRequired,
    dailyTotals,
    weeklyTotal,
    biweeklyTotal,
    isWorkdayActive,
    endWorkday,
    activityRecordsRef,
    currentActivityRecordId,
    pauseTimer,
    startTimer,
  

```;


```