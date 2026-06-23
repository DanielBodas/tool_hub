export type LeaveBlock = {
  id: string;
  startDate: Date;
  endDate: Date;
  type: 'mandatory' | 'flexible';
  parent: 'mother' | 'father';
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const calculateMandatoryLeave = (birthDate: Date, parent: 'mother' | 'father'): LeaveBlock => {
  return {
    id: `mandatory-${parent}`,
    startDate: birthDate,
    endDate: addDays(birthDate, 6 * 7 - 1), // 6 weeks minus 1 day
    type: 'mandatory',
    parent,
  };
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const dateStr = formatDate(date);
  return holidays.includes(dateStr);
};

// Calculate effective leave days in a block, excluding holidays
export const countEffectiveLeaveDays = (startDate: Date, endDate: Date, holidays: string[]): number => {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isHoliday(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Calculate end date for a number of effective leave days (excluding holidays)
export const calculateEndDateWithHolidays = (startDate: Date, targetDays: number, holidays: string[]): Date => {
  const current = new Date(startDate);
  let effectiveDays = 0;

  while (effectiveDays < targetDays) {
    if (!isHoliday(current, holidays)) {
      effectiveDays++;
    }
    if (effectiveDays < targetDays) {
      current.setDate(current.getDate() + 1);
    }
  }
  return current;
};

export const calculateEndDate = (startDate: Date, weeks: number): Date => {
  return addDays(startDate, weeks * 7 - 1);
};
