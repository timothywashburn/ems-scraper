// Date utility functions for scraper

// Helper function to get end date (1 month from today)
export const getHistoricalEndDate = (): Date => {
    const oneMonthFromToday = new Date();
    oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
    return oneMonthFromToday;
};

// Helper function to get upcoming scraping end date (6 months from today)
export const getUpcomingEndDate = (): Date => {
    const sixMonthsFromToday = new Date();
    // sixMonthsFromToday.setDate(sixMonthsFromToday.getDate() + 10);
    sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
    return sixMonthsFromToday;
};