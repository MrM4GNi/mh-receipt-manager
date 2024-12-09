export const parseDateString = (dateString) => {
    const formattedString = dateString
    .replace(/,/, '') // Remove the comma
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2') // Change to YYYY-MM-DD
    .replace(/(\d{1,2}:\d{2}:\d{2}) (AM|PM)/, (match, time, period) => {
        // Convert to 24-hour format
        let [hours, minutes, seconds] = time.split(':');
        if (period === 'PM' && hours !== '12') {
        hours = (parseInt(hours) + 12).toString();
        }
        if (period === 'AM' && hours === '12') {
        hours = '00';
        }
        return `${hours}:${minutes}:${seconds}`;
    });

    // Create a new Date object
    return new Date(`${formattedString}`);
};