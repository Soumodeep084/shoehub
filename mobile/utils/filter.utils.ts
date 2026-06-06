export const SIZES = [
    { label: "Any", value: "Any" },
    { label: "6", value: "6" },
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "10", value: "10" },
    { label: "11", value: "11" },
];

export const PRICE_PRESETS = [
    { label: "Under ₹8K", min: null, max: 8000 },
    { label: "₹8K – ₹12K", min: 8000, max: 12000 },
    { label: "₹12K – ₹18K", min: 12000, max: 18000 },
    { label: "Above ₹18K", min: 18000, max: null },
];

export const SORT_BY = [
    { label: "Price: Low to High", value: "priceLowToHigh" },
    { label: "Price: High to Low", value: "priceHighToLow" },
    { label: "Featured", value: "featured" },
    { label: "Newest", value: "newest" },
    { label: "Trending", value: "trending" },
];


export const SORT_LABELS = {
    newest: "Newest",
    trending: "Trending",
    featured: "Featured",
    priceLowToHigh: "Price ↑",
    priceHighToLow: "Price ↓",
};