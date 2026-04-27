exports.getPeriodRange = (month, year) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

exports.daysInMonth = (month, year) => new Date(year, month, 0).getDate();