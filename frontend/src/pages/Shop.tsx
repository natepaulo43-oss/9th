import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { products, formatCurrency, APPAREL_SIZES, Product } from '../data/products';
import './Shop.css';

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  if (window.location.hostname === 'localhost') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }
  return '';
};

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

interface ShopDisplayItem {
  key: string;
  productId: string;
  name: string;
  subtitle?: string;
  price: number;
  description: string;
  transparentImage: string;
  defaultColor?: string;
  category: 'hat' | 'apparel';
}

const SHOP_ITEMS: ShopDisplayItem[] = [
  {
    key: 'skate-hat',
    productId: 'prod_TRRTgFMRWW7OZS',
    name: 'Canvas 9thform Skate Hat',
    price: 3499,
    description: 'Premium canvas surf style hat with iconic 9thform skate logo. Designed for comfort and style.',
    transparentImage: '/images/transparent/canvas-9thform-skate-hat.png',
    category: 'hat',
  },
  {
    key: 'falling-guy-hat',
    productId: 'prod_TRRUrKA3MQ9fay',
    name: 'Canvas 9thform Falling Guy Hat',
    price: 3499,
    description: 'Premium canvas surf hat with 9thform Falling Guy logo. Designed for comfort and style.',
    transparentImage: '/images/transparent/canvas-9thform-falling-guy-hat.png',
    category: 'hat',
  },
  {
    key: 'phased-motion-cream',
    productId: 'prod_UFcE8PRgn7qBzR',
    name: 'Phased Motion Tee',
    subtitle: 'Cream',
    price: 3199,
    description: 'Oversized fit. 100% organic cotton. 7.5 oz heavyweight. Boxy, cropped.',
    transparentImage: '/images/transparent/phased-motion-tee-cream-removebg-preview.png',
    defaultColor: 'cream',
    category: 'apparel',
  },
  {
    key: 'phased-motion-stone',
    productId: 'prod_UFcE8PRgn7qBzR',
    name: 'Phased Motion Tee',
    subtitle: 'Stone',
    price: 3199,
    description: 'Oversized fit. 100% organic cotton. 7.5 oz heavyweight. Boxy, cropped.',
    transparentImage: '/images/transparent/phased-motion-tee-stone-removebg-preview.png',
    defaultColor: 'stone',
    category: 'apparel',
  },
  {
    key: 'phased-motion-white',
    productId: 'prod_UFcE8PRgn7qBzR',
    name: 'Phased Motion Tee',
    subtitle: 'White',
    price: 3199,
    description: 'Oversized fit. 100% organic cotton. 7.5 oz heavyweight. Boxy, cropped.',
    transparentImage: '/images/transparent/phased-motion-tee-white-removebg-preview.png',
    defaultColor: 'white',
    category: 'apparel',
  },
  {
    key: 'glide-tee',
    productId: 'prod_UeP9MPCNPrdlxF',
    name: 'The Glide Tee',
    price: 3199,
    description: 'Relaxed oversized fit. Timeless stripe graphic. 100% cotton, 7.5 oz heavyweight.',
    transparentImage: '/images/transparent/the-glide-tee-removebg-preview.png',
    category: 'apparel',
  },
  {
    key: 'triple-cord-cap',
    productId: 'prod_UklokvriH3B3yz',
    name: 'Triple Cord Cap',
    price: 3499,
    description: 'Three marks of momentum. Everyday structure with a clean embroidered finish.',
    transparentImage: '/images/transparent/triple-cord-cap-removebg-preview.png',
    category: 'hat',
  },
];

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const { cartItems, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

  // Detect touch-only devices (no hover capability)
  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
    []
  );

  // Close active panel when tapping outside on mobile
  useEffect(() => {
    if (!activePanelId) return;
    const handleOutside = (e: TouchEvent) => {
      if (!(e.target as Element).closest('.floating-product')) {
        setActivePanelId(null);
      }
    };
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => document.removeEventListener('touchstart', handleOutside);
  }, [activePanelId]);

  const handleItemClick = (item: ShopDisplayItem) => {
    if (isTouchDevice) {
      if (activePanelId === item.key) {
        navigate(`/product/${item.productId}`);
      } else {
        setActivePanelId(item.key);
      }
    } else {
      navigate(`/product/${item.productId}`);
    }
  };

  const handlePanelAddToCart = (e: React.MouseEvent, item: ShopDisplayItem) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    if (product.category === 'apparel') {
      setSizeModalProduct(product);
      setSelectedSize('');
      setSelectedColor(item.defaultColor || '');
      return;
    }
    addToCart(product);
  };

  const handleViewProduct = (e: React.MouseEvent, item: ShopDisplayItem) => {
    e.stopPropagation();
    navigate(`/product/${item.productId}`);
  };

  const handleSizeSelection = () => {
    if (sizeModalProduct && selectedSize) {
      if (sizeModalProduct.colorVariants && sizeModalProduct.colorVariants.length > 0 && !selectedColor) {
        return;
      }
      addToCart(sizeModalProduct, selectedSize, selectedColor || undefined);
      setSizeModalProduct(null);
      setSelectedSize('');
      setSelectedColor('');
    }
  };

  const handleCheckout = async () => {
    if (!cartItems.length) return;
    setCheckoutStatus('loading');
    setCheckoutError(null);

    try {
      const response = await fetch(buildApiUrl('/stripe/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      if (!response.ok) {
        let serverMessage = 'Unable to start checkout. Please try again.';
        try {
          const errData = await response.json();
          if (errData?.error) serverMessage = errData.error;
        } catch {}
        throw new Error(serverMessage);
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
          SHOP NOW
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
          <div className="floating-products-grid">
            {SHOP_ITEMS.map((item, index) => (
              <motion.div
                key={item.key}
                className={`floating-product${activePanelId === item.key ? ' panel-active' : ''}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.55, ease: 'easeOut' }}
                onClick={() => handleItemClick(item)}
              >
                <div className="fp-image-wrap">
                  <img
                    src={item.transparentImage}
                    alt={item.name + (item.subtitle ? ` - ${item.subtitle}` : '')}
                    className="fp-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/logo1.png';
                    }}
                  />
                </div>

                <div
                  className="fp-panel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="fp-panel-header">
                    <span className="fp-name">{item.name}</span>
                    {item.subtitle && (
                      <span className="fp-subtitle">{item.subtitle}</span>
                    )}
                  </div>
                  <p className="fp-description">{item.description}</p>
                  <div className="fp-footer">
                    <span className="fp-price">{formatCurrency(item.price)}</span>
                    <div className="fp-actions">
                      <button
                        className="fp-view-btn"
                        onClick={(e) => handleViewProduct(e, item)}
                      >
                        View
                      </button>
                      <button
                        className="fp-cart-btn"
                        onClick={(e) => handlePanelAddToCart(e, item)}
                      >
                        Add to Cart
                      </button>
                    </div>
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
                <div
                  className="cart-item"
                  key={`${item.product.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${idx}`}
                >
                  <div className="cart-item-thumb">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <h3 className="cart-item-name">
                        {item.product.name}
                        {item.color && (
                          <span style={{ fontSize: '0.9em', opacity: 0.7, marginLeft: '8px', textTransform: 'capitalize' }}>
                            ({item.color})
                          </span>
                        )}
                        {item.size && (
                          <span style={{ fontSize: '0.9em', opacity: 0.7, marginLeft: '8px' }}>
                            ({item.size})
                          </span>
                        )}
                      </h3>
                      <button
                        className="remove-item"
                        onClick={() => removeFromCart(item.product.id, item.size, item.color)}
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
                          onClick={() => updateQuantity(item.product.id, -1, item.size, item.color)}
                          disabled={item.quantity === 1}
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1, item.size, item.color)}
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
            <h3>Select Options</h3>
            <p className="size-modal-product">{sizeModalProduct.name}</p>

            {sizeModalProduct.colorVariants && sizeModalProduct.colorVariants.length > 0 && (
              <>
                <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
                  Color
                </h4>
                <div className="size-options">
                  {sizeModalProduct.colorVariants.map((variant) => (
                    <button
                      key={variant.color}
                      className={`size-button ${selectedColor === variant.color ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(variant.color)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {variant.displayName}
                    </button>
                  ))}
                </div>
              </>
            )}

            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
              Size
            </h4>
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
                onClick={() => {
                  setSizeModalProduct(null);
                  setSelectedSize('');
                  setSelectedColor('');
                }}
              >
                Cancel
              </button>
              <button
                className="size-modal-confirm"
                onClick={handleSizeSelection}
                disabled={
                  !selectedSize ||
                  (sizeModalProduct.colorVariants &&
                    sizeModalProduct.colorVariants.length > 0 &&
                    !selectedColor)
                }
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
