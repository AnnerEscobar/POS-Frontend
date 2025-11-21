export interface CreateProductDto {
  code: string | null;
  name: string;
  stock: number;
  salePrice: number;
  costPrice: number;
  category: string | null;
  description: string | null;
  showOnline: boolean;
  // por ahora solo mandaremos datos, no archivos
  images?: File[]; // más adelante si guardas URLs
}
