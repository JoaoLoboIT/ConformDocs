import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../errors/app-error.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function sanitizeExtension(fileName) {
  const extension = path.extname(fileName || "").toLowerCase();
  return [".pdf", ".png", ".jpg", ".jpeg", ".webp"].includes(extension)
    ? extension
    : "";
}

export async function saveBase64Attachment({
  fileData,
  fileName,
  fileMimeType,
}) {
  if (!fileData) return null;

  if (!ALLOWED_MIME_TYPES.has(fileMimeType)) {
    throw new AppError("Envie um arquivo PDF, PNG, JPG ou WEBP.");
  }

  const base64Content = fileData.includes(",")
    ? fileData.split(",").pop()
    : fileData;
  const buffer = Buffer.from(base64Content, "base64");
  const maxUploadBytes = (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024;

  if (!buffer.length) {
    throw new AppError("O arquivo enviado está vazio ou corrompido.");
  }

  if (buffer.length > maxUploadBytes) {
    throw new AppError(
      `O arquivo deve possuir no máximo ${Number(process.env.MAX_UPLOAD_MB) || 8} MB.`,
    );
  }

  const extension = sanitizeExtension(fileName);
  const storedName = `${randomUUID()}${extension}`;
  const uploadsDirectory = path.resolve(process.cwd(), "uploads");
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(path.join(uploadsDirectory, storedName), buffer);

  return {
    originalName: fileName,
    storedName,
    relativePath: `/uploads/${storedName}`,
    mimeType: fileMimeType,
    sizeBytes: buffer.length,
    uploadedAt: new Date(),
  };
}
