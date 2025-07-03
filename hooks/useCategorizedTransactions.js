import { useMemo } from "react";

export const useCategorizedTransactions = (transactions, currentMonth, isSameMonth) => {
  return useMemo(() => {
    const categorized = {};
    const monthly = transactions.filter((t) => {
      const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return isSameMonth(tDate, currentMonth);
    });

    monthly.forEach((t) => {
      const cat = t.category || "Other";
      if (!categorized[cat]) categorized[cat] = { total: 0 };
      categorized[cat].total += parseFloat(t.amount || 0);
    });

    return { categorized, monthly };
  }, [transactions, currentMonth, isSameMonth]);
};
