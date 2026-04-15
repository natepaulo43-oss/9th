import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getProductById, formatCurrency, APPAREL_SIZES } from '../data/products';
import './ProductPage.css';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = useMemo(() => (id ? getProductById(id) : undefined), [id]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const images = product?.images && product.images.length > 0 ? product.images : [product?.image || ''];
  const currentImage = images[selectedImageIndex] || product?.image || '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setImageAspectRatio(null);
  }, [currentImage]);

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-page-container">
          <div className="product-not-found">
            <h2>Product not found</h2>
            <Link to="/shop" className="back-to-shop-link">Back to Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const requiresSize = product.category === 'apparel';

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(ratio);
  };

  const handleAddToCart = () => {
    if (requiresSize && !selectedSize) return;
    addToCart(product, requiresSize ? selectedSize : undefined);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <div className="product-page">
      <div className="product-page-container">
        {/* Breadcrumb */}
        <motion.nav
          className="product-breadcrumb"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/shop" className="breadcrumb-link">Shop</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </motion.nav>

        <div className="product-page-content">
          {/* Image Gallery */}
          <motion.div
            className="product-page-gallery"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div 
              className="product-page-main-image-frame"
              style={imageAspectRatio ? { aspectRatio: `${imageAspectRatio}` } : undefined}
            >
              <img
                ref={imgRef}
                src={currentImage}
                alt={product.name}
                className={`product-page-main-image ${currentImage.includes('Chart') || currentImage.includes('size') ? 'size-chart-image' : ''}`}
                onLoad={handleImageLoad}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/logo1.png';
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="product-page-thumbnails">
                {images.map((img, index) => (
                  <button
                    key={index}
                    className={`product-page-thumb ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={img} alt={`${product.name} view ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            className="product-page-details"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="product-page-name">{product.name}</h1>
            <p className="product-page-price">
              {formatCurrency(product.price, product.currency)}
            </p>
            <div className="product-page-description">
              {product.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* Size Selector — only for apparel */}
            {requiresSize && (
              <div className="product-page-size-section">
                <p className="product-page-size-label">Select Size</p>
                <div className="product-page-size-options">
                  {APPAREL_SIZES.map((size) => (
                    <button
                      key={size}
                      className={`product-page-size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              className={`product-page-add-to-cart ${addedFeedback ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={requiresSize && !selectedSize}
            >
              {addedFeedback ? 'Added to Cart' : 'Add to Cart'}
            </button>

            {/* Back link */}
            <button
              className="product-page-back"
              onClick={() => navigate('/shop')}
            >
              &larr; Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
