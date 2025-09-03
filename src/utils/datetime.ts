import { isValid, parseISO } from "date-fns";

export function isBetweenDatetime(isoDatetime: string, isoStart: string, isoEnd: string): boolean {
  const datetime = new Date(isoDatetime);
  const start = new Date(isoStart);
  const end = new Date(isoEnd);

  return datetime >= start && datetime <= end;
}

export function isValidIsoDatestring(isoDatetime: string): boolean {
  return isValid(parseISO(isoDatetime));
}

export const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
};
