export type Role = "USER" | "ADMIN";

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