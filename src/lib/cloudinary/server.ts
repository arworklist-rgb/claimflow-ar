import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface SignedUploadPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "raw";
  type: "authenticated";
}

/** Generate a short-lived Cloudinary upload signature for authenticated raw assets. */
export function createSignedUploadParams(organizationId: string, categoryFolder: "knowledge" | "imports" | "remittances"): SignedUploadPayload {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `claimflow/${organizationId}/${categoryFolder}`;

  const paramsToSign = {
    folder,
    timestamp,
    type: "authenticated",
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
    resourceType: "raw",
    type: "authenticated",
  };
}

/** Generate a short-lived signed download URL (default 5 minutes) for an authenticated raw asset. */
export function createSignedDownloadUrl(publicId: string, expiresInSeconds = 300): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type: "authenticated",
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
}

/** Permanently remove a raw authenticated asset from Cloudinary. */
export async function deleteCloudinaryAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
    type: "authenticated",
    invalidate: true,
  });
}
