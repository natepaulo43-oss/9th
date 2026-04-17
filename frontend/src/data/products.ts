export interface ColorVariant {
  color: string;
  displayName: string;
  image: string;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // stored in cents for currency-safe math
  currency?: string;
  image: string;
  images?: string[];
  category: 'hat' | 'apparel';
  colorVariants?: ColorVariant[];
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
    image: '/images/image0 (1).jpeg',
    images: [
      '/images/image0 (1).jpeg',
      '/images/images/Tezza-9729.jpg',
      '/images/images/cream-garment.jpg',
      '/images/images/white-garment.jpg',
      '/images/images/5823543_7382_590_900.jpg',
      '/images/Screenshot 2026-04-14 231425.png',
    ],
    category: 'apparel',
    colorVariants: [
      {
        color: 'cream',
        displayName: 'Cream',
        image: '/images/images/cream-garment.jpg',
        images: [
          '/images/images/cream-garment.jpg',
          '/images/image0 (1).jpeg',
          '/images/Screenshot 2026-04-14 231425.png',
        ],
      },
      {
        color: 'white',
        displayName: 'White',
        image: '/images/images/white-garment.jpg',
        images: [
          '/images/images/white-garment.jpg',
          '/images/image0 (1).jpeg',
          '/images/Screenshot 2026-04-14 231425.png',
        ],
      },
      {
        color: 'stone',
        displayName: 'Stone',
        image: '/images/images/5823543_7382_590_900.jpg',
        images: [
          '/images/images/5823543_7382_590_900.jpg',
          '/images/images/Tezza-9729.jpg',
          '/images/Screenshot 2026-04-14 231425.png',
        ],
      },
    ],
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
