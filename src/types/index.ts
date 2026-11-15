// Product catalogue types
export interface Product {
  id: string;
  name: string;
  category: "magnetic-materials" | "magnetic-filters" | "enameled-wire" | "agricultural-machinery";
  description: string;
  shortDescription: string;
  images: string[];
  specifications: Record<string, string>;
  price?: {
    min: number;
    max: number;
    currency: string;
    unit: string;
  };
  inStock: boolean;
  featured: boolean;
}

// Enquiry types
export interface Inquiry {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  company?: string;
  country: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  message: string;
  status: "new" | "replied" | "quoted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

// Quote types
export interface Quote {
  id: string;
  inquiryId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  validUntil: Date;
  terms: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: Date;
}

// Order types
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: "pending" | "confirmed" | "production" | "shipped" | "delivered" | "cancelled";
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country: string;
  customerType?: "regular" | "vip" | "wholesale" | string;
  subscribed: boolean;
  registeredAt: Date;
  lastOrderDate?: Date | null;
}

// Contact message types
export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  newsletter: boolean;
  status: "new" | "replied" | "closed";
  createdAt: Date;
  updatedAt: Date;
}
