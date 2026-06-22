import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const dbUser = await getCurrentDbUser(req);

        if (!dbUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await req.formData();

        const reviewId = formData.get("reviewId") as string;
        const file = formData.get("file") as File;
        const type = formData.get("type") as "IMAGE" | "VIDEO";

        if (type !== "IMAGE" && type !== "VIDEO") {
            return NextResponse.json(
                { message: "Invalid media type" },
                { status: 400 }
            );
        }

        if (!file || !reviewId) {
            return NextResponse.json(
                { message: "Missing data" },
                { status: 400 }
            );
        }

        if (type === "IMAGE" && !file.type.startsWith("image/")) {
            return NextResponse.json(
                { message: "Invalid image file" },
                { status: 400 }
            );
        }

        if (type === "VIDEO" && !file.type.startsWith("video/")) {
            return NextResponse.json(
                { message: "Invalid video file" },
                { status: 400 }
            );
        }

        const IMAGE_LIMIT = 2 * 1024 * 1024;        // 2MB Image limit
        const VIDEO_LIMIT = 6 * 1024 * 1024;        // 6MB Video limit

        if (type === "IMAGE" && file.size > IMAGE_LIMIT) {
            return NextResponse.json(
                { message: "Image must be under 2 MB" },
                { status: 400 }
            );
        }

        if (type === "VIDEO" && file.size > VIDEO_LIMIT) {
            return NextResponse.json(
                { message: "Video must be under 6 MB" },
                { status: 400 }
            );
        }

        // optional security check: ensure review belongs to user
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review || review.userId !== dbUser.id) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        const existingMedia = await prisma.reviewMedia.findMany({
            where: {
                reviewId,
            },
            select: {
                type: true,
            },
        });

        const imageCount = existingMedia.filter(
            (media) => media.type === "IMAGE"
        ).length;

        const videoCount = existingMedia.filter(
            (media) => media.type === "VIDEO"
        ).length;

        if (type === "IMAGE" && imageCount >= 4) {
            return NextResponse.json(
                { message: "Maximum 4 images allowed per review." },
                { status: 400 }
            );
        }

        if (type === "VIDEO" && videoCount >= 2) {
            return NextResponse.json(
                { message: "Maximum 2 videos allowed per review." },
                { status: 400 }
            );
        }

        const ext = file.name.split(".").pop();
        const fileName = `${randomUUID()}.${ext}`;

        const folder = type === "IMAGE" ? "images" : "videos";
        const path = `${folder}/${fileName}`;

        const buffer = await file.arrayBuffer();

        const { error } = await supabaseAdmin.storage
            .from("review-media")
            .upload(path, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            return NextResponse.json(
                { message: error.message },
                { status: 500 }
            );
        }

        const { data } = supabaseAdmin.storage
            .from("review-media")
            .getPublicUrl(path);

        try {
            const media = await prisma.reviewMedia.create({
                data: {
                    reviewId,
                    type,
                    url: data.publicUrl,
                    path,
                },
            });
            return NextResponse.json(media);
        }
        catch (err) {
            await supabaseAdmin.storage
                .from("review-media")
                .remove([path]);

            throw err;
        }


    } catch (error) {
        console.error("UPLOAD_MEDIA_ERROR", error);

        return NextResponse.json(
            { message: "Upload failed" },
            { status: 500 }
        );
    }
}