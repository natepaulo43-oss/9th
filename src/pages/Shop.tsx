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
      name: 'Canvas 9thform Skate Hat',
      description: 'Premium canvas surf style hat with iconic 9thform skate logo. Designed for comfort and style. ',
      price: 'Coming Soon...',
      image: '/images/skatecap.png',
      images: [
        '/images/skatecap.png',
        '/images/behind_hat.jpg',
        '/images/treehat.jpg',
      ],
    },
    {
      id: 2,
      name: 'Canvas 9thform Falling Guy Hat',
      description: 'Premium canvas surf hat with 9thform Falling Guy logo. Designed for comfort and style.',
      price: 'Coming Soon...',
    image: '/images/aspect_white.png',
      images: [
        '/images/aspect_white.png',
        '/images/Thrown.JPG',
      ],
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
          Always in Motion.
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
              <div className="product-image-frame">
                <img
                  src={getCurrentImage(product)}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo1.png';
                  }}
                />
              </div>
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

