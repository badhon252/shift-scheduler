export type ShiftTypeDef = {
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
};

export const SHIFT_TYPES: ReadonlyArray<ShiftTypeDef> = [
  {
    name: "Morning Shift (07:00 - 03:00 PM)",
    color: "#fad664",
    bgColor: "bg-[#fad664]",
    textColor: "text-black",
  },
  {
    name: "Evening Shift (02:50 - 11:00 PM)",
    color: "#a8f15a",
    bgColor: "bg-[#a8f15a]",
    textColor: "text-black",
  },
  {
    name: "Night Shift (10:30 - 07:00 AM)",
    color: "#108858",
    bgColor: "bg-[#108858]",
    textColor: "text-white",
  },
  {
    name: "Offday",
    color: "#9febfb",
    bgColor: "bg-[#9febfb]",
    textColor: "text-black",
  },
  {
    name: "Leave",
    color: "#dd9bfc",
    bgColor: "bg-[#dd9bfc]",
    textColor: "text-black",
  },
  {
    name: "Absent",
    color: "#d21904",
    bgColor: "bg-[#d21904]",
    textColor: "text-white",
  },
] as const;
