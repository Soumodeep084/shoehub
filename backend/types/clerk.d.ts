// types/clerk.d.ts or src/types/clerk.d.ts

import "@clerk/nextjs";

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: "ADMIN" | "STAFF" | "USER";
        };
    }
}