import { z } from "zod";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;
const emailSchema = z.string().trim().min(1, "Email is required")
  .email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(USERNAME_REGEX, "Username can only contain letters, numbers, and underscores"),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim()
    .refine((phone) => phone === "" || PHONE_REGEX.test(phone), "Please enter a valid phone number")
    .transform((phone) => phone || undefined).optional(),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((registration) => registration.password === registration.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
