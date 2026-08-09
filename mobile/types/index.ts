export type Role = "USER" | "ADMIN";

export type OrderStatus =
	| "PENDING"
	| "CONFIRMED"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELLED"
	| "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface User {
	id: string;
	clerkId: string;
	firstName: string;
	lastName: string;
	email: string;
	imageUrl: string | null;
	phone: string | null;
	role: Role;
	createdAt: string;
	updatedAt: string;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	imageUrl: string | null;
	description: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	products?: Product[]; // Available when relations are included
}

export interface ProductImage {
	id: string;
	productId: string;
	imageUrl: string;
	storagePath: string;
	isPrimary: boolean;
	sortOrder: number;
	createdAt: string;
	product?: Product;
}

export interface ProductVariant {
	id: string;
	productId: string;
	color: string;
	size: string;
	sku: string;
	stock: number;
	createdAt: string;
	product?: Product;
}

export interface Product {
	id: string;
	categoryId: string;
	name: string;
	slug: string;
	brand: string;
	description: string;
	basePrice: string;       // Next.js JSON response turns Decimal into string
	salePrice: string;       // Next.js JSON response turns Decimal into string
	discountPercent: number;
	averageRating: string;   // Next.js JSON response turns Decimal into string
	ratingCount: number;
	soldCount: number;
	isFeatured: boolean;
	isNew: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;

	// Relations included by your API endpoints
	category?: Category;
	images?: ProductImage[];
	variants?: ProductVariant[];
}


export interface Address {
	id: string;
	userId: string;
	label: string;
	fullName: string;
	phone: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	landmark: string | null;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AddressInput {
	label: string;
	fullName: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	state: string;
	postalCode: string;
	country?: string;
	landmark?: string;
	isDefault?: boolean;
}

export interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	variantId: string;
	productName: string;
	productBrand: string;
	productImageUrl: string;
	size: string;
	color: string;
	quantity: number;
	unitPrice: string;
	totalPrice: string;
	createdAt: string;
}

export interface Order {
	id: string;
	userId: string;
	orderNumber: string;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	currency: string;
	subtotal: string;
	shippingFee: string;
	discountAmount: string;
	totalAmount: string;
	couponCode: string | null;
	couponDiscount: string;
	bankOfferName: string | null;
	bankOfferDiscount: string;
	shippingName: string;
	shippingPhone: string;
	shippingLine1: string;
	shippingLine2: string | null;
	shippingCity: string;
	shippingState: string;
	shippingPostalCode: string;
	shippingCountry: string;
	shippingLandmark: string | null;
	createdAt: string;
	updatedAt: string;
	items: OrderItem[];
	itemCount?: number;
	events?: OrderEvent[];
	cancelledAt?: string | null;
	cancelReason?: string | null;
}

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
	id: string;
	code: string;
	description: string | null;
	discountType: DiscountType;
	discountValue: number;
	minOrderAmount: number;
	maxDiscount: number | null;
	expiresAt: string | null;
}

export interface AppliedCoupon {
	coupon: Coupon;
	discount: number;
	subtotal: number;
	newTotal: number;
}

export interface BankOffer {
	id: string;
	bankName: string;
	cardType: string | null;
	description: string;
	discountType: DiscountType;
	discountValue: number;
	minOrderAmount: number;
	maxDiscount: number | null;
	expiresAt: string | null;
}

export interface CouponValidationResponse {
	valid: boolean;
	message?: string;
	coupon?: Coupon;
	discount?: number;
	subtotal?: number;
	newTotal?: number;
}

export type ReviewMediaType = "IMAGE" | "VIDEO";

export interface ReviewMedia {
	id: string;
	type: ReviewMediaType;
	url: string;
}

export interface ReviewUser {
	clerkId: string;
	firstName: string;
	lastName: string;
	imageUrl: string | null;
}

export interface Review {
	id: string;
	userId: string;
	productId: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;

	user: ReviewUser;
	media: ReviewMedia[];
}

export interface RatingSummary {
	total: number;
	average: number;
}

export interface ProductReviewsResponse {
	reviews: Review[];
	ratingSummary: RatingSummary;
}

export interface ProfileStats {
	addressCount: number;
	orderCount: number;
}

export interface ProfileResponse {
	user: User;
	stats: ProfileStats;
	defaultAddress: Address | null;
}

export type SessionItem = {
	id: string;
	status: string;
	lastActiveAt: Date;

	latestActivity?: {
		browserName?: string;
		deviceType?: string;
		city?: string;
		country?: string;
	};

	revoke: () => Promise<any>;
}

export interface OrderEvent {
	id: string;
	orderId: string;
	status: OrderStatus;
	title: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PROMOTIONS_OFFERS"
  | "COUPONS"
  | "BANK_OFFERS"
  | "NEW_ARRIVALS";

export interface Notification {
	id: string;
	userId: string;
	orderId: string | null;
	type: NotificationType;
	title: string;
	body: string;
	data: any;
	readAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface NotificationPreference {
	id: string;
	userId: string;
	orderUpdates: boolean;
	promotionsOffers: boolean;
	coupons: boolean;
	bankOffers: boolean;
	newArrivals: boolean;
	createdAt: string;
	updatedAt: string;
}

