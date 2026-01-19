import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

export function createUploader(subdir: string) {
  const dir = path.resolve(uploadsRoot, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safe}`);
    },
  });

  return multer({ storage });
}

export function toPublicUploadPath(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`;
}
