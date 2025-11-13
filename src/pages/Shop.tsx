import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Shop.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  images?: string[];
}

const Shop: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ [key: number]: number }>({});

  const products: Product[] = [
    {
      id: 1,
      name: '9thform Hat',
      description: 'Premium action sports cap featuring the iconic 9thform logo. Designed for comfort and style.',
      price: '$35.00',
      image: '/images/9thform_logo_white.png',
      images: [
        '/images/9thform_logo_white.png',
        '/images/9thform_logo_white_flame.png',
        '/images/9thform_logo_white_ski.png',
      ],
    },
    {
      id: 2,
      name: '9thform Shirt',
      description: 'Classic action sports t-shirt with bold 9thform branding. Made from premium materials.',
      price: '$45.00',
      image: '/images/9thform_logo_all_white_transparent_text_v3.png',
    },
  ];

  const getCurrentImage = (product: Product): string => {
    if (product.images && selectedImage[product.id] !== undefined) {
      return product.images[selectedImage[product.id]];
    }
    return product.image;
  };

  const handleAddToCart = (product: Product) => {
    // Placeholder for future cart functionality
    console.log('Add to cart:', product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        <motion.h1
          className="shop-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          SHOP
        </motion.h1>
        <motion.p
          className="shop-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Premium Action Sports Apparel
        </motion.p>
      </div>

      <div className="products-container">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            className="product-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            whileHover={{ y: -5 }}
          >
            <div className="product-image-container">
              <img
                src={getCurrentImage(product)}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/logo1.png';
                }}
              />
              {product.images && product.images.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((img, imgIndex) => (
                    <button
                      key={imgIndex}
                      className={`thumbnail ${selectedImage[product.id] === imgIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImage({ ...selectedImage, [product.id]: imgIndex })}
                    >
                      <img src={img} alt={`${product.name} view ${imgIndex + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              <h2 className="product-name">{product.name}</h2>
              <p className="product-description">{product.description}</p>
              <div className="product-footer">
                <span className="product-price">{product.price}</span>
                <button
                  className="add-to-cart-button"
                  onClick={() => handleAddToCart(product)}
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Shop;

