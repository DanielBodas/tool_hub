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

export const calculateEndDate = (startDate: Date, weeks: number): Date => {
  return addDays(startDate, weeks * 7 - 1);
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getLeaveStatus = (date: Date, mandatoryMother: LeaveBlock | null, mandatoryFather: LeaveBlock | null, flexibleBlocks: LeaveBlock[]) => {
  const status = {
    mother: false,
    father: false,
  };

  if (mandatoryMother && date >= mandatoryMother.startDate && date <= mandatoryMother.endDate) {
    status.mother = true;
  }
  if (mandatoryFather && date >= mandatoryFather.startDate && date <= mandatoryFather.endDate) {
    status.father = true;
  }

  flexibleBlocks.forEach(block => {
    if (date >= block.startDate && date <= block.endDate) {
      if (block.parent === 'mother') status.mother = true;
      if (block.parent === 'father') status.father = true;
    }
  });

  return status;
};
