export function formatPrice(price: string) {
    const numericPrice = parseInt(price);
    const formattedPrice = new Intl.NumberFormat('en-IN').format(numericPrice);
    return `₹ ${formattedPrice} /-`;
}