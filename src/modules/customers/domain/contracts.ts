import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string(),
  type: z.enum(["company", "individual"]),
  name: z.string(),
  nameLocal: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  address: z.string().nullable(),
  taxId: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type CustomerDTO = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  type: z.enum(["company", "individual"]).default("company"),
  name: z.string().min(1, "ຕ້ອງໃສ່ຊື່"),
  nameLocal: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

export const CustomerLookupQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});
export type CustomerLookupQueryDTO = z.infer<typeof CustomerLookupQuerySchema>;
