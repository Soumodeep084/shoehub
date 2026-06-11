export const getAddressIcon = (label: string) => {
    const value = label.toLowerCase();
    if (value.includes("home")) return "home-outline";
    if (value.includes("office")) return "business-outline";
    return "location-outline";
};