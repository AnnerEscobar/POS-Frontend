export interface CreateProductDto {
  code: string | null;
  name: string;
  stock: number;
  salePrice: number;
  costPrice: number;
  category: string | null;
  description: string | null;
  showOnline: boolean;
  images: File[]; // por ahora solo en memoria
}
