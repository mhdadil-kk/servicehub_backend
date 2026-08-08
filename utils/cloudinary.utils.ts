import { v2 as cloudinary } from "cloudinary";


export function generateSignedUrl(publicId: string, ttlSeconds = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    secure: true
  });
}


export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl);
    const parts = url.pathname.split("/");
    const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    if (versionIdx === -1) return null;
    const pathAfterVersion = parts.slice(versionIdx + 1).join("/");
    return pathAfterVersion.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}
