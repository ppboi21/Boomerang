import { Backpack, BookOpen, IdCard, KeyRound, Milk, Package, Shirt, Smartphone } from 'lucide-react';

export const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: Smartphone },
  { value: 'id-wallets', label: 'ID Cards & Wallets', icon: IdCard },
  { value: 'keys', label: 'Keys', icon: KeyRound },
  { value: 'bags', label: 'Bags & Accessories', icon: Backpack },
  { value: 'books', label: 'Books & Stationery', icon: BookOpen },
  { value: 'clothing', label: 'Clothing', icon: Shirt },
  { value: 'bottles', label: 'Water Bottles', icon: Milk },
  { value: 'other', label: 'Other', icon: Package },
];

export const categoryInfo = (value) => CATEGORIES.find((c) => c.value === value) || CATEGORIES.at(-1);

export const SENSITIVE_CATEGORIES = ['id-wallets'];

export const STATUS = {
  open: { label: 'Open', className: 'border-ink-600 bg-ink-800 text-ink-100' },
  contacted: { label: 'Contacted', className: 'border-sun/30 bg-sun/10 text-sun-fg' },
  resolved: { label: 'Resolved', className: 'border-cobalt/40 bg-cobalt/15 text-cobalt-fg' },
};

export const TYPE = {
  lost: { label: 'Lost', verb: 'lost', className: 'bg-grape text-night', accent: 'text-grape-fg' },
  found: { label: 'Found', verb: 'found', className: 'bg-zap text-night', accent: 'text-zap-fg' },
};

export const MAX_IMAGES = 3;
export const MAX_IMAGE_MB = 5;
