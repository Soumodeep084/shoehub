export interface BankOfferUsageRow {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    discountApplied: number;
    totalAmount: number;
    createdAt: Date;
}

export interface CouponUsageRow {
    id: string;
    userName: string;
    userEmail: string;
    orderNumber: string;
    orderTotal: number;
    createdAt: Date;
}