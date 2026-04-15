import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { products, formatCurrency, APPAREL_SIZES, Product } from '../data/products';
import './Shop.css';

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  if (window.location.hostname === 'localhost') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Production traffic stays same-origin and is proxied via Netlify redirects.
  return '';
};

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

const Shop: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<Record<string, number>>({});
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const { cartItems, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

  const getCurrentImage = (product: Product): string => {
    if (product.images && selectedImage[product.id] !== undefined) {
      return product.images[selectedImage[product.id]];
    }
    return product.image;
  };

  const handleAddToCart = (product: Product, size?: string) => {
    // Check if product requires size selection
    if (product.category === 'apparel' && !size) {
      setSizeModalProduct(product);
      setSelectedSize('');
      return;
    }

    addToCart(product, size);
  };

  const handleSizeSelection = (size: string) => {
    if (sizeModalProduct) {
      handleAddToCart(sizeModalProduct, size);
      setSizeModalProduct(null);
      setSelectedSize('');
    }
  };

  const handleCheckout = async () => {
    if (!cartItems.length) return;
    setCheckoutStatus('loading');
    setCheckoutError(null);

    try {
      const response = await fetch(buildApiUrl('/stripe/create-checkout-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to start checkout. Please try again.');
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout session was created but no URL was returned.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutStatus('error');
      setCheckoutError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setCheckoutStatus('idle');
    }
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
          PRE-ORDER OPEN NOW
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

      <div className="shop-content">
        <div className="products-section">
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
                <Link to={`/product/${product.id}`} className="product-card-link">
                  <div className="product-image-container">
                    <div className="product-image-frame">
                      <img
                        src={getCurrentImage(product)}
                        alt={product.name}
                        className={`product-image ${getCurrentImage(product).includes('Screenshot') || getCurrentImage(product).includes('size') ? 'size-chart-image' : ''}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo1.png';
                        }}
                      />
                    </div>
                  </div>
                </Link>
                {product.images && product.images.length > 1 && (
                  <div className="image-thumbnails-row">
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

                <div className="product-info">
                  <Link to={`/product/${product.id}`} className="product-name-link">
                    <h2 className="product-name">{product.name}</h2>
                  </Link>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">{formatCurrency(product.price, product.currency)}</span>
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

        <aside className="cart-panel">
          <div className="cart-header">
            <div>
              <p className="cart-label">Cart</p>
              <h2 className="cart-title">Your Selection</h2>
            </div>
            <span className="cart-count-pill">{cartCount} items</span>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty. Add a piece of 9thform to get started.</p>
            ) : (
              cartItems.map((item, idx) => (
                <div className="cart-item" key={`${item.product.id}-${item.size || 'no-size'}-${idx}`}>
                  <div className="cart-item-thumb">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <h3 className="cart-item-name">
                        {item.product.name}
                        {item.size && <span style={{ fontSize: '0.9em', opacity: 0.7, marginLeft: '8px' }}>({item.size})</span>}
                      </h3>
                      <button
                        className="remove-item"
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        aria-label={`Remove ${item.product.name}`}
                      >
                        remove
                      </button>
                    </div>
                    <p className="cart-item-price">
                      {formatCurrency(item.product.price, item.product.currency)}
                    </p>
                    <div className="cart-item-controls">
                      <div className="quantity-pill">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1, item.size)}
                          disabled={item.quantity === 1}
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1, item.size)}
                          aria-label={`Increase quantity for ${item.product.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="line-total">
                        {formatCurrency(item.product.price * item.quantity, item.product.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="cart-total-row">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>
            <p className="cart-note">Checkout is powered securely by Stripe.</p>
            {checkoutError && <p className="checkout-error">{checkoutError}</p>}
            <button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || checkoutStatus === 'loading'}
            >
              {checkoutStatus === 'loading' ? 'Preparing Checkout…' : 'Checkout'}
            </button>
          </div>
        </aside>
      </div>

      {/* Size Selection Modal */}
      {sizeModalProduct && (
        <div className="size-modal-overlay" onClick={() => setSizeModalProduct(null)}>
          <motion.div 
            className="size-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3>Select Size</h3>
            <p className="size-modal-product">{sizeModalProduct.name}</p>
            <div className="size-options">
              {APPAREL_SIZES.map((size) => (
                <button
                  key={size}
                  className={`size-button ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="size-modal-actions">
              <button 
                className="size-modal-cancel"
                onClick={() => setSizeModalProduct(null)}
              >
                Cancel
              </button>
              <button 
                className="size-modal-confirm"
                onClick={() => selectedSize && handleSizeSelection(selectedSize)}
                disabled={!selectedSize}
              >
                Add to Cart
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shop;

