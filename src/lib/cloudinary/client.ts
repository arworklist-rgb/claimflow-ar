import { apiClient } from "@/lib/api/client";

export interface CloudinaryUploadResult {
  publicId: string;
  assetId: string;
  bytes: number;
}

/**
 * Upload a file directly from the browser to Cloudinary as an authenticated raw asset
 * using a short-lived server-generated signature.
 */
export async function uploadToCloudinarySigned(
  file: File,
  folder: "knowledge" | "imports" | "remittances",
): Promise<CloudinaryUploadResult> {
  const sig = await apiClient.documents.signUpload(folder);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("type", sig.type);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`,
    { method: "POST", body: form },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = (await res.json()) as {
    public_id: string;
    asset_id: string;
    bytes: number;
  };

  return {
    publicId: data.public_id,
    assetId: data.asset_id,
    bytes: data.bytes,
  };
}
