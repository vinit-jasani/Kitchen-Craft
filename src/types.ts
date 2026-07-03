export interface User {
  id: number;
  username: string;
}

export interface Customer {
  customer_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Material {
  material_id: number;
  name: string;
  rate: number;
  image?: string;
}

export interface Estimate {
  estimate_id: number;
  customer_id: number;
  material_id: number;
  length: number;
  width: number;
  layout_type: string;
  area: number;
  material_cost: number;
  gst: number;
  total_cost: number;
  created_date: string;
  // Populated fields from server API
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  material_name?: string;
  material_rate?: number;
}
