/**
 * Date utility functions for debt management
 * Provides consistent date handling across the application
 */

// Helper function to normalize dates for consistent comparison
export function normalizeDate(date) {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

// Helper function to check if a debt is overdue
export function isDebtOverdue(dueDate) {
    if (!dueDate) return false;
    const today = normalizeDate(new Date());
    const dueDateNormalized = normalizeDate(dueDate);
    return dueDateNormalized < today;
}

// Helper function to check if a debt is due today
export function isDebtDueToday(dueDate) {
    if (!dueDate) return false;
    const today = normalizeDate(new Date());
    const dueDateNormalized = normalizeDate(dueDate);
    return dueDateNormalized && dueDateNormalized.getTime() === today.getTime();
}

// Helper function to format dates consistently
export function formatDate(dateStr) {
    if (!dateStr) return "No date";

    try {
        const date = new Date(dateStr);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    } catch (error) {
        console.warn("Error formatting date:", dateStr, error);
        return "Invalid date";
    }
}

// Helper function to categorize and sort debts properly
export function categorizeAndSortDebts(debts) {
    if (!debts || debts.length === 0) return { overdue: [], dueToday: [], upcoming: [] };

    const today = normalizeDate(new Date());
    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    debts.forEach(debt => {
        // Validate debt object
        if (!debt || typeof debt.amount !== 'number' || debt.amount <= 0) {
            console.warn("Invalid debt object:", debt);
            return;
        }

        const dueDate = normalizeDate(debt.dueDate);
        if (!dueDate) {
            // If no due date, treat as upcoming with low priority
            upcoming.push(debt);
            return;
        }

        if (dueDate < today) {
            overdue.push(debt);
        } else if (dueDate.getTime() === today.getTime()) {
            dueToday.push(debt);
        } else {
            upcoming.push(debt);
        }
    });

    // Sort each category by due date (oldest first for overdue, earliest first for others)
    const sortByDueDate = (a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);

        // Handle invalid dates
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateA - dateB;
    };

    overdue.sort(sortByDueDate);
    dueToday.sort(sortByDueDate);
    upcoming.sort(sortByDueDate);

    return { overdue, dueToday, upcoming };
}

// Helper function to get days until due date
export function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;

    const today = normalizeDate(new Date());
    const dueDateNormalized = normalizeDate(dueDate);

    if (!dueDateNormalized) return null;

    const diffTime = dueDateNormalized.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Helper function to get debt status text
export function getDebtStatusText(dueDate) {
    if (!dueDate) return "No due date";

    const daysUntil = getDaysUntilDue(dueDate);

    if (daysUntil === null) return "Invalid date";
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;

    return formatDate(dueDate);
} 