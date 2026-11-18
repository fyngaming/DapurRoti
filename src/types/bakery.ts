export type OrderType = 'po' | 'direct';
export type PaymentMethod = 'cash' | 'transfer';
export type OrderStatus = 'pending_wa' | 'confirmed' | 'completed' | 'cancelled';
export type ProductCategory = string;
export type DiscountType = 'percent' | 'fixed';
export type ViewMode = 'desktop' | 'mobile';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: 'customer' | 'admin';
  google_id?: string | null;
  avatar?: string | null;
  phone?: string | null;
  default_address?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  variants: string[];
  image: string;
  is_available: boolean;
}

export interface StoreBranch {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  is_active: boolean;
}

export interface Promo {
  id: number;
  code: string;
  title: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order: number;
  is_active: boolean;
}

export interface AdBanner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta_label: string;
  is_active: boolean;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  footerServiceText: string;
  operatingHours: string;
  footerAddress: string;
  footerCopyright: string;
  adminWhatsapp: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  quantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  variant: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  store_id?: number | null;
  store_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  event_datetime: string;
  order_type: OrderType;
  payment_method: PaymentMethod;
  promo_code?: string | null;
  discount_amount: number;
  total_amount: number;
  dp_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
  whatsapp_url?: string;
}

export interface CheckoutFormData {
  store_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  event_datetime: string;
  order_type: OrderType;
  payment_method: PaymentMethod;
  promo_code: string;
}

export interface CheckoutValidationErrors {
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  event_datetime?: string;
}
