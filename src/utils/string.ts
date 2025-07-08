export function snakeToPascal(str: string): string {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export const normalizeText = (text: string): string => {
  return text
    .normalize("NFD") // Decompose accented characters into their base + diacritic
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase();
};
