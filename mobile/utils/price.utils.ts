export function formatPrice(price: string | number) {
    const numericPrice = Number(price);
    const formattedPrice = new Intl.NumberFormat('en-IN').format(numericPrice);
    return `₹${formattedPrice}/-`;
}


function searchFormatPriceChip(price: number | null) {
    if (!price) return null;
    const formattedPrice = new Intl.NumberFormat('en-IN').format(price);
    return `₹${formattedPrice}`;
}

export function searchPriceLabels(minPrice: number | null, maxPrice: number | null) {
    const priceLabel =
        minPrice !== null && maxPrice !== null
            ? `${searchFormatPriceChip(minPrice)} - ${searchFormatPriceChip(maxPrice)}`
            : minPrice !== null
                ? `Above ${searchFormatPriceChip(minPrice)}`
                : maxPrice !== null
                    ? `Under ${searchFormatPriceChip(maxPrice)}`
                    : "";

    return priceLabel;
}