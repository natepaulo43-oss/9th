export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // stored in cents for currency-safe math
  currency?: string;
  image: string;
  images?: string[];
  category: 'hat' | 'apparel';
}

export const products: Product[] = [
  {
    id: 'prod_TRRTgFMRWW7OZS',
    name: 'Canvas 9thform Skate Hat',
    description: 'Premium canvas surf style hat with iconic 9thform skate logo. Designed for comfort and style. ',
    price: 3499,
    currency: 'usd',
    image: '/images/skatecap.PNG',
    images: [
      '/images/skatecap.PNG',
      '/images/behind_hat.JPG',
      '/images/treehat.jpg',
      '/images/IMG_2415.jpg',
      '/images/MAX05476.jpg',
    ],
    category: 'hat',
  },
  {
    id: 'prod_TRRUrKA3MQ9fay',
    name: 'Canvas 9thform Falling Guy Hat',
    description: 'Premium canvas surf hat with 9thform Falling Guy logo. Designed for comfort and style.',
    price: 3499,
    currency: 'usd',
    image: '/images/aspect_white.png',
    images: [
      '/images/aspect_white.png',
      '/images/Thrown.JPG',
    ],
    category: 'hat',
  },
  {
    id: 'prod_UFcE8PRgn7qBzR',
    name: 'Phased Motion Tee',
    description: 'Oversized Fit. Order your normal size.\nBuilt for movement, designed for momentum. Progression without pause. Made from 100% organic cotton, it carries a substantial feel with a soft, worn-in finish. Minimal at a distance, precise up close. Boxy, cropped fit. 7.5 oz Heavyweight cotton. Soft, structured feel.',
    price: 3199,
    currency: 'usd',
    image: '/images/shirt mockup.jpg',
    images: [
      '/images/shirt mockup.jpg',
      '/images/Chart_588.png',
      '/images/image0 (1).jpeg',
    ],
    category: 'apparel',
  },
];

export const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const formatCurrency = (value: number, currency: string = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value / 100);

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);
