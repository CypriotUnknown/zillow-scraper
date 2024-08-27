export default async function waitAfterDate(params: { date: Date; seconds: number; exact?: boolean; }): Promise<void> {
    const { date, seconds, exact } = params;
    const range = 5;
    const min = seconds - range;
    const max = seconds + range;
    const timeToWait = exact === true ? seconds : Math.random() * (max - min) + min;

    const now = new Date();
    const targetDate = new Date(date.getTime() + timeToWait * 1000);

    // Calculate the delay in milliseconds
    const delay = targetDate.getTime() - now.getTime();

    // If the delay is less than or equal to zero, we have already passed the target date
    if (delay <= 0) {
        return;
    }

    console.log(`Waiting ${delay / 1000} seconds before scrape...`);

    // Wait for the calculated delay
    await new Promise<void>(resolve => setTimeout(resolve, delay));
}
