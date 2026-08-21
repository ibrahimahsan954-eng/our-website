"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { MEDIA_SLOTS } from "./videoAssets";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible client (Cloudflare R2, MinIO, Backblaze B2, AWS S3, …).
 * Configure via env vars in the project's Keys/API keys tab:
 *   S3_ENDPOINT, S3_REGION (default "auto"), S3_BUCKET,
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL
 */
function requireS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Video storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in the project's Keys/API keys tab.",
    );
  }
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function requireBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET is not configured in the project's Keys/API keys tab.");
  }
  return bucket;
}

/**
 * Returns a presigned PUT URL so the browser can upload the MP4 directly to
 * S3/R2 storage — the file never passes through Convex. Also returns the
 * public URL the site will use to serve the video.
 *
 * Owner-only: this is a Node action (no ctx.db), so it confirms the caller is
 * the site owner via the internal isOwner query. Without this, any visitor
 * could mint presigned upload URLs and write arbitrary objects into the bucket.
 */
export const getUploadUrl = action({
  args: { slot: v.string(), fileName: v.string(), contentType: v.string() },
  handler: async (ctx, args) => {
    const isOwner = await ctx.runQuery(api.inquiries.isOwner, {});
    if (!isOwner) {
      throw new Error("Not the site owner");
    }
    if (!MEDIA_SLOTS.includes(args.slot as (typeof MEDIA_SLOTS)[number])) {
      throw new Error("Unknown media slot.");
    }
    const safeName = args.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
    const key = `videos/${args.slot}/${Date.now()}-${safeName}`;
    const uploadUrl = await getSignedUrl(
      requireS3Client(),
      new PutObjectCommand({
        Bucket: requireBucket(),
        Key: key,
        ContentType: args.contentType || "video/mp4",
      }),
      { expiresIn: 900 },
    );
    const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "");
    return {
      uploadUrl,
      key,
      publicUrl: publicBase ? `${publicBase}/${key}` : "",
    };
  },
});
