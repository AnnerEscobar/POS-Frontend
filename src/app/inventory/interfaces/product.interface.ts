export interface Product {
  id: string;
  code: string | null;
  name: string;
  stock: number;
  price: number;   // = salePrice en el DTO
  cost: number;    // = costPrice en el DTO
  category: string | null;
  description: string | null;
  showOnline: boolean;
  image?: string | null;
}
