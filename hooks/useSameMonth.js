export const isSameMonth = (date1, date2) => {
  return (
    date1 instanceof Date &&
    !isNaN(date1) &&
    date2 instanceof Date &&
    !isNaN(date2) &&
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};
