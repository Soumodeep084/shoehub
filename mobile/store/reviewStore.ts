// // import { create } from "zustand";
// // import { ENV } from "@/config/env";

// // const BACKEND_URL = ENV.API_URL;

// // type MediaFile = {
// //     uri: string;
// //     name: string;
// //     type: string;
// // };

// // interface Review {
// //     id: string;
// //     rating: number;
// //     comment?: string;
// //     user: {
// //         firstName: string;
// //         lastName: string;
// //         imageUrl?: string;
// //     };
// //     media: any[];
// // }

// // interface ReviewStore {
// //     reviews: Review[];
// //     isLoading: boolean;

// //     fetchReviews: (productId: string) => Promise<void>;

// //     createReview: (
// //         token: string,
// //         payload: {
// //             productId: string;
// //             rating: number;
// //             comment?: string;
// //         }
// //     ) => Promise<string>;

// //     uploadMedia: (
// //         token: string,
// //         reviewId: string,
// //         files: MediaFile[]
// //     ) => Promise<void>;
// // }

// // export const useReviewStore = create<ReviewStore>((set, get) => ({
// //     reviews: [],
// //     isLoading: false,

// //     fetchReviews: async (productId) => {
// //         try {
// //             set({ isLoading: true });

// //             const res = await fetch(
// //                 `${BACKEND_URL}/api/products/${productId}`
// //             );

// //             const data = await res.json();

// //             set({ reviews: data.reviews });
// //         } catch (e) {
// //             console.error(e);
// //         } finally {
// //             set({ isLoading: false });
// //         }
// //     },

// //     createReview: async (token, payload) => {
// //         const res = await fetch(`${BACKEND_URL}/api/reviews`, {
// //             method: "POST",
// //             headers: {
// //                 "Content-Type": "application/json",
// //                 Authorization: `Bearer ${token}`,
// //             },
// //             body: JSON.stringify(payload),
// //         });

// //         const data = await res.json();
// //         return data.reviewId;
// //     },

// //     uploadMedia: async (token, reviewId, files) => {
// //         for (const file of files) {
// //             const formData = new FormData();

// //             formData.append("reviewId", reviewId);
// //             formData.append("file", file as any);
// //             formData.append(
// //                 "type",
// //                 file.type.startsWith("video") ? "video" : "image"
// //             );

// //             await fetch(`${BACKEND_URL}/api/reviews/media`, {
// //                 method: "POST",
// //                 headers: {
// //                     Authorization: `Bearer ${token}`,
// //                 },
// //                 body: formData,
// //             });
// //         }
// //     },
// // }));

// import { create } from "zustand";
// import { ENV } from "@/config/env";

// const BACKEND_URL = ENV.API_URL;

// interface Media {
//     id: string;
//     type: "image" | "video";
//     url: string;
// }

// interface User {
//     id: string;
//     firstName: string;
//     lastName: string;
//     imageUrl?: string;
// }

// export interface Review {
//     id: string;
//     rating: number;
//     comment?: string;
//     createdAt: string;
//     updatedAt: string;

//     user: User;
//     media: Media[];
// }

// interface RatingSummary {
//     total: number;
//     average: number;
//     distribution: {
//         5: number;
//         4: number;
//         3: number;
//         2: number;
//         1: number;
//     };
// }

// interface ReviewStore {
//     // Everyone's reviews
//     reviews: Review[];

//     // Logged-in user's review
//     myReview: Review | null;

//     ratingSummary: RatingSummary | null;

//     isLoading: boolean;
//     isSaving: boolean;

//     fetchReviews: (productId: string) => Promise<void>;

//     fetchMyReview: (
//         token: string,
//         productId: string
//     ) => Promise<void>;

//     createReview: (
//         token: string,
//         body: FormData
//     ) => Promise<void>;

//     updateReview: (
//         token: string,
//         reviewId: string,
//         body: FormData
//     ) => Promise<void>;

//     deleteReview: (
//         token: string,
//         reviewId: string
//     ) => Promise<void>;

//     clear: () => void;
// }

// export const useReviewStore = create<ReviewStore>((set) => ({
//     reviews: [],
//     myReview: null,
//     ratingSummary: null,

//     isLoading: false,
//     isSaving: false,

//     fetchReviews: async (productId) => {
//         try {
//             set({ isLoading: true });

//             const res = await fetch(
//                 `${BACKEND_URL}/api/products/${productId}/reviews`
//             );

//             if (!res.ok) {
//                 throw new Error("Failed to fetch reviews");
//             }

//             const data = await res.json();

//             set({
//                 reviews: data.reviews,
//                 ratingSummary: data.ratingSummary,
//             });
//         } catch (error) {
//             console.error("fetchReviews", error);
//         } finally {
//             set({ isLoading: false });
//         }
//     },

//     fetchMyReview: async () => {
//         // we'll implement later
//     },

//     createReview: async () => {
//         // later
//     },

//     updateReview: async () => {
//         // later
//     },

//     deleteReview: async () => {
//         // later
//     },

//     clear: () =>
//         set({
//             reviews: [],
//             myReview: null,
//             ratingSummary: null,
//         }),
// }));


import { create } from "zustand";
import { ENV } from "@/config/env";
import type { Review } from "@/types";

const BACKEND_URL = ENV.API_URL;

interface RatingSummary {
    total: number;
    average: number;
}

interface CreateReviewPayload {
    productId: string;
    rating: number;
    comment: string;
}

interface UpdateReviewPayload {
    reviewId: string;
    rating: number;
    comment: string;
}

interface UploadMediaPayload {
    reviewId: string;
    file: {
        uri: string;
        name: string;
        type: string;
    };
    type: "IMAGE" | "VIDEO";
}

interface ReviewDetailsResponse {
    review: Review;
}

interface ReviewState {
    reviews: Review[];
    ratingSummary: RatingSummary;
    hasPurchased: boolean;
    hasReviewed: boolean;
    canReview: boolean;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isUploading: boolean;
    selectedReview: Review | null;

    fetchReviews: (productId: string, token: string | null) => Promise<void>;
    createReview: (payload: CreateReviewPayload, token: string | null) => Promise<{ reviewId: string }>;
    uploadMedia: (payload: UploadMediaPayload, token: string | null) => Promise<void>;
    updateReview: (payload: UpdateReviewPayload, token: string | null) => Promise<void>;
    deleteReview: (reviewId: string, token: string | null) => Promise<void>;
    getReviewById: (reviewId: string) => Promise<Review>;
    clearReviews: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
    reviews: [],

    ratingSummary: {
        total: 0,
        average: 0,
    },

    hasPurchased: false,
    hasReviewed: false,
    canReview: false,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isUploading: false,
    selectedReview: null,

    //  It fetches the information that current user has purchased the product or not if not then review button is disabled
    fetchReviews: async (productId, token) => {
        try {
            set({ isLoading: true });

            const res = await fetch(
                `${BACKEND_URL}/api/products/${productId}/reviews`,
                {
                    headers: {
                        Authorization: token
                            ? `Bearer ${token}`
                            : "",
                    },
                }
            );

            const data = await res.json();

            set({
                reviews: data.reviews,
                ratingSummary: data.ratingSummary,
                hasPurchased: data.hasPurchased,
                hasReviewed: data.hasReviewed,
                canReview: data.canReview,
            });
        } catch (error) {
            console.error("FETCH_REVIEWS_ERROR", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    createReview: async (payload, token) => {
        try {
            set({ isCreating: true });

            const res = await fetch(`${BACKEND_URL}/api/reviews`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            return {
                reviewId: data.reviewId,
            };
        } catch (error) {
            console.error("CREATE_REVIEW_ERROR", error);
            throw error;
        } finally {
            set({ isCreating: false });
        }
    },

    uploadMedia: async (payload, token) => {
        try {
            set({ isUploading: true });

            const formData = new FormData();

            formData.append("reviewId", payload.reviewId);
            formData.append("type", payload.type);

            formData.append(
                "file",
                {
                    uri: payload.file.uri,
                    name: payload.file.name,
                    type: payload.file.type,
                } as any
            );

            const res = await fetch(`${BACKEND_URL}/api/reviews/media`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("UPLOAD_REVIEW_MEDIA_ERROR", error);
            throw error;
        } finally {
            set({ isUploading: false });
        }
    },

    updateReview: async (payload, token) => {
        try {
            set({ isUpdating: true });

            const res = await fetch(
                `${BACKEND_URL}/api/reviews/${payload.reviewId}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        rating: payload.rating,
                        comment: payload.comment,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("UPDATE_REVIEW_ERROR", error);
            throw error;
        } finally {
            set({ isUpdating: false });
        }
    },

    deleteReview: async (reviewId, token) => {
        try {
            set({ isDeleting: true });

            const res = await fetch(
                `${BACKEND_URL}/api/reviews/${reviewId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("DELETE_REVIEW_ERROR", error);
            throw error;
        } finally {
            set({ isDeleting: false });
        }
    },

    getReviewById: async (reviewId) => {
        try {
            set({
                isLoading: true,
            });

            const res = await fetch(
                `${BACKEND_URL}/api/reviews/${reviewId}`
            );

            const data: ReviewDetailsResponse = await res.json();

            if (!res.ok) {
                throw new Error(
                    (data as any).message ?? "Failed to fetch review"
                );
            }

            set({
                selectedReview: data.review,
            });

            return data.review;
        } catch (error) {
            console.error("GET_REVIEW_ERROR", error);
            throw error;
        } finally {
            set({
                isLoading: false,
            });
        }
    },

    clearReviews: () =>
        set({
            reviews: [],
            selectedReview: null,
            hasPurchased: false,
            hasReviewed: false,
            canReview: false,
            ratingSummary: {
                total: 0,
                average: 0,
            },
        }),
}));