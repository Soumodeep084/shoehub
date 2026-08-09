import { getCurrentDbUser } from "@/lib/currentUser";

// ─── POST /api/coupons/remove ───────────────────────────────────────────────
// Client-side only: clears the applied coupon from the mobile session.
// No server state to clean because coupon usage is only recorded at order creation.
export async function POST(req: Request) {
  try {
    const dbUser = await getCurrentDbUser(req);
    if (!dbUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      removed: true,
      message: "Coupon removed successfully",
    });
  } catch (error) {
    console.error("POST Remove Coupon Error:", error);
    return Response.json({ message: "Failed to remove coupon" }, { status: 500 });
  }
}
