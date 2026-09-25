// Broad product families used by product forms, filters and production outputs.
export const PRODUCT_TYPES = [
  { value: 'meat', label: 'Meat' },
  { value: 'meat_products', label: 'Meat products' },
  { value: 'dairy', label: 'Dairy products' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'fish', label: 'Fish and seafood' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'grain', label: 'Grains and cereals' },
  { value: 'legume', label: 'Legumes' },
  { value: 'nuts_seeds', label: 'Nuts and seeds' },
  { value: 'bakery', label: 'Bakery products' },
  { value: 'honey', label: 'Honey and bee products' },
  { value: 'oils', label: 'Oils and fats' },
  { value: 'preserves', label: 'Preserves' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'herbs_spices', label: 'Herbs and spices' },
  { value: 'other', label: 'Other' },
];

// Retained for existing records; new products use the broader families above.
export const LEGACY_PRODUCT_TYPES = [
  { value: 'cheese', label: 'Cheese (legacy)' },
  { value: 'sausage', label: 'Sausage (legacy)' },
];

export function productTypeOptions(current?: string | null) {
  return [...PRODUCT_TYPES, ...LEGACY_PRODUCT_TYPES.filter(type => type.value === current)];
}
