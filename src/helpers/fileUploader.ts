import multer from "multer";
import path from "path";
import fs from "fs";
import ApiPathError from "../errors/ApiPathError";
import httpStatus from "http-status";
import ApiError from "../errors/ApiErrors";

//  ensure upload dir
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//  storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();

    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

//  default config
const DEFAULTS = {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
};

//  file filter
const fileFilter = (allowedTypes: string[]) => {
  return (_: any, file: Express.Multer.File, cb: any) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  };
};

//  core uploader factory
const createUploader = (options: {
  type: "single" | "array" | "fields";
  fieldName?: string;
  fields?: { name: string; maxCount?: number; required?: boolean }[];
  maxCount?: number;
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}) => {
  const upload = multer({
    storage,
    limits: { fileSize: options.maxSize || DEFAULTS.maxSize },
    fileFilter: fileFilter(options.allowedTypes || DEFAULTS.allowedTypes),
  });

  let middleware: any;

  if (options.type === "single") {
    middleware = upload.single(options.fieldName!);
  } else if (options.type === "array") {
    middleware = upload.array(options.fieldName!, options.maxCount || 10);
  } else {
    middleware = upload.fields(options.fields!);
  }

  return (req: any, res: any, next: any) => {
    middleware(req, res, (err: any) => {
      if (err) {
          throw new ApiError(httpStatus.NOT_FOUND,err.message)
      }

      //  required check (simple)
      if (options.required) {
        const file = req.file || req.files;
        if (!file || (Array.isArray(file) && file.length === 0)) {
          throw new ApiPathError(
            httpStatus.NOT_FOUND,
            options.fieldName!,
            "File is required",
          );
        }
      }

      //  fields required check
      if (options.fields) {
        for (const field of options.fields) {
          if (field.required) {
            const files = req.files?.[field.name];
            if (!files || files.length === 0) {
              throw new ApiPathError(
                httpStatus.NOT_FOUND,
                field.name!,
                `${field.name} is required`,
              );
            }
          }
        }
      }

      next();
    });
  };
};

//  export
export const fileUploader = {
  single: (fieldName: string, options?: any) =>
    createUploader({ type: "single", fieldName, ...options }),

  array: (fieldName: string, options?: any) =>
    createUploader({ type: "array", fieldName, ...options }),

  fields: (fields: any[], options?: any) =>
    createUploader({ type: "fields", fields, ...options }),
};
