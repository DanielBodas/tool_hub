export type ConsumptionMode = "all" | "days" | "weeks";

export type Allowance = {
  id: string;
  name: string;
  totalDays: number;
  parent: "mother" | "father";
  consumptionMode: ConsumptionMode;
};

export type LeaveBlock = {
  id: string;
  startDate: Date;
  endDate: Date;
  allowanceId: string;
  parent: "mother" | "father";
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const dateStr = formatDate(date);
  return holidays.includes(dateStr);
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

// Calculate effective leave days in a block, excluding holidays
export const countEffectiveLeaveDays = (
  startDate: Date,
  endDate: Date,
  holidays: string[],
): number => {
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

export const calculateEndDate = (startDate: Date, days: number): Date => {
  return addDays(startDate, days - 1);
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  // Use UTC to avoid timezone shifts when generating days
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getLeaveStatus = (date: Date, flexibleBlocks: LeaveBlock[]) => {
  const status = {
    mother: false,
    father: false,
  };

  flexibleBlocks.forEach((block) => {
    if (date >= block.startDate && date <= block.endDate) {
      if (block.parent === "mother") status.mother = true;
      if (block.parent === "father") status.father = true;
    }
  });

  return status;
};
