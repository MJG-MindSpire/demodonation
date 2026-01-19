import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { User, USER_ROLES } from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";
import { createUploader, toPublicUploadPath } from "../utils/uploads.js";

export const authRouter = Router();

const donorProfileUpload = createUploader("donor-photos");
const receiverRegisterUpload = createUploader("receiver-photos");

const maybeReceiverRegisterUpload = (req: Request, res: Response, next: () => void) => {
  if (req.is("multipart/form-data")) {
    receiverRegisterUpload.single("photo")(req, res, next);
    return;
  }
  next();
};

const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("donor"),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1).optional(),
  }),
  z.object({
    role: z.literal("receiver"),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    fatherName: z.string().min(1),
    cnic: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
  }),
  z.object({
    role: z.literal("field"),
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    fatherName: z.string().min(1),
    cnic: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
  }),
]);

authRouter.post("/register", maybeReceiverRegisterUpload, async (req: Request, res: Response) => {
  const rawBody = req.body ?? {};
  const input = registerSchema.parse(rawBody);

  const existing = await User.findOne({ email: input.email }).lean().exec();
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await User.hashPassword(input.password);
  const user = await User.create({
    email: input.email,
    passwordHash,
    role: input.role,
    name: input.name,
    ...(input.role === "field"
      ? {
          fatherName: input.fatherName,
          cnic: input.cnic,
          address: input.address,
          phone: input.phone,
          registrationStatus: "pending",
        }
      : {}),
    ...(input.role === "receiver"
      ? {
          fatherName: input.fatherName,
          cnic: input.cnic,
          address: input.address,
          phone: input.phone,
          registrationStatus: "pending",
          photoPath: req.file ? toPublicUploadPath("receiver-photos", req.file.filename) : undefined,
        }
      : {}),
  });

  if (input.role === "receiver" && !req.file) {
    await User.deleteOne({ _id: user._id }).exec();
    res.status(400).json({ message: "Profile picture is required" });
    return;
  }

  const token = signAccessToken({ sub: user._id.toString(), role: user.role });
  res.status(201).json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
      fatherName: (user as any).fatherName,
      registrationStatus: (user as any).registrationStatus,
    },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);

  const user = await User.findOne({ email: input.email }).select("+passwordHash").exec();
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ message: "Account disabled" });
    return;
  }

  const ok = await user.verifyPassword(input.password);
  if (!ok) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signAccessToken({ sub: user._id.toString(), role: user.role });
  res.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      registrationStatus: (user as any).registrationStatus,
    },
  });
});

authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.auth!.userId).lean().exec();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      fatherName: (user as any).fatherName,
      phone: user.phone,
      city: user.city,
      address: user.address,
      cnic: user.cnic,
      photoPath: user.photoPath,
      registrationStatus: (user as any).registrationStatus,
    },
  });
});

const donorProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  cnic: z.string().optional(),
});

authRouter.put(
  "/me/profile",
  requireAuth,
  requireRole(["donor"]),
  donorProfileUpload.single("photo"),
  async (req: Request, res: Response) => {
    const raw = {
      name: typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : undefined,
      phone: typeof req.body?.phone === "string" ? req.body.phone.trim() : undefined,
      city: typeof req.body?.city === "string" ? req.body.city.trim() : undefined,
      address: typeof req.body?.address === "string" ? req.body.address.trim() : undefined,
      cnic: typeof req.body?.cnic === "string" ? req.body.cnic.trim() : undefined,
    };

    const input = donorProfileSchema.parse(raw);
    const user = await User.findById(req.auth!.userId).exec();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (typeof input.name !== "undefined") user.name = input.name;
    if (typeof input.phone !== "undefined") user.phone = input.phone;
    if (typeof input.city !== "undefined") user.city = input.city;
    if (typeof input.address !== "undefined") user.address = input.address;
    if (typeof input.cnic !== "undefined") user.cnic = input.cnic;

    if (req.file) {
      user.photoPath = toPublicUploadPath("donor-photos", req.file.filename);
    }

    await user.save();

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        city: user.city,
        address: user.address,
        cnic: user.cnic,
        photoPath: user.photoPath,
      },
    });
  },
);
