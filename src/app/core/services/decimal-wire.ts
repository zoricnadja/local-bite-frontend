// PostgreSQL NUMERIC is serialized as a decimal string by SQLx/BigDecimal.
// Convert once at the browser boundary; financial calculations remain on the server.
import { Product } from '../../shared/models/product.models';
import { RawMaterial } from '../../shared/models/raw-material.models';
export type ProductWire = Omit<Product, 'quantity' | 'price'> & { quantity: string | number; price: string | number };
export type MaterialWire = Omit<RawMaterial, 'quantity' | 'low_stock_threshold'> & { quantity: string | number; low_stock_threshold: string | number | null };
export function productFromWire(p: ProductWire): Product { return { ...p, quantity: Number(p.quantity), price: Number(p.price) }; }
export function materialFromWire(p: MaterialWire): RawMaterial { return { ...p, quantity: Number(p.quantity), low_stock_threshold: p.low_stock_threshold === null ? null : Number(p.low_stock_threshold) }; }
