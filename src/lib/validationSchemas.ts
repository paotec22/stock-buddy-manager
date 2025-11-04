import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email too long" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password too long" })
});

export const signupSchema = loginSchema.extend({
  password: z.string()
    .min(12, { message: "Password must be at least 12 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .max(100, { message: "Password too long" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Bulk sale CSV row schema
export const saleRowSchema = z.object({
  item_id: z.coerce.number().int().positive({ message: "Item ID must be a positive number" }),
  quantity: z.coerce.number().int().positive({ message: "Quantity must be positive" }).max(10000, { message: "Quantity too large" }),
  sale_price: z.coerce.number().positive({ message: "Sale price must be positive" }).max(1000000, { message: "Sale price too large" })
});

export const salesArraySchema = z.array(saleRowSchema);

// Export types
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type SaleRow = z.infer<typeof saleRowSchema>;
