export function getGreeting(firstName?: string | null) {
    const hour = new Date().getHours();

    if (hour < 12) {
        return `Good morning, ${firstName || "sneakerhead"}!`;
    }

    if (hour < 18) {
        return `Good afternoon, ${firstName || "sneakerhead"}!`;
    }

    return `Good evening, ${firstName || "sneakerhead"}!`;
}



