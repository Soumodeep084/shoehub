import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(req: Request) {
  try {
    const headerPayload = await headers();

    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing headers", { status: 400 });
    }

    const body = await req.text(); // IMPORTANT FIX

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    const evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses[0]?.email_address;

      await prisma.user.upsert({
        where: { clerkId: id },
        update: {},
        create: {
          clerkId: id,
          email,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: image_url || null,
        },
      });

      await clerkClient.users.updateUser(id, {
        publicMetadata: {
          role: "USER",
        },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err);
    return new Response("Server error", { status: 500 });
  }
}