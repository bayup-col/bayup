import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe ser más detallada"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  category: z.string().min(1, "Selecciona una categoría"),
  status: z.enum(["active", "draft", "out_of_stock"]),
  sku: z.string().min(3, "El SKU es obligatorio"),
});

export type ProductFormData = z.infer<typeof productSchema>;
