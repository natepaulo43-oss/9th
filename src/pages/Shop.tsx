import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Shop.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // stored in cents for currency-safe math
  currency?: string;
  image: string;
  images?: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

const formatCurrency = (value: number, currency: string = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value / 100);

const resolveCheckoutEndpoint = () => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/thform-33f71/us-central1/api/stripe';
  }

  return '/stripe';
};

const CHECKOUT_ENDPOINT = resolveCheckoutEndpoint();

const Shop: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const products: Product[] = [
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
      ],
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
    },
  ];

  const getCurrentImage = (product: Product): string => {
    if (product.images && selectedImage[product.id] !== undefined) {
      return product.images[selectedImage[product.id]];
    }
    return product.image;
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!cartItems.length) return;
    setCheckoutStatus('loading');
    setCheckoutError(null);

    try {
      const response = await fetch(`${CHECKOUT_ENDPOINT.replace(/\/$/, '')}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          successUrl: `${window.location.origin}/thank-you`,
          cancelUrl: `${window.location.origin}/shop?status=cancelled`,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let derivedMessage = raw;

        try {
          const parsed = JSON.parse(raw);
          derivedMessage = parsed?.error || parsed?.message || raw;
        } catch (jsonError) {
          // Non-JSON response, keep raw text
        }

        const fallbackMessage = `Checkout failed (${response.status})`;
        throw new Error(derivedMessage?.trim() || fallbackMessage || 'Unable to start checkout.');
      }

      const session = await response.json();

      if (!session.url) {
        throw new Error('Checkout session link was not returned.');
      }

      window.location.href = session.url;
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
              cartItems.map((item) => (
                <div className="cart-item" key={item.product.id}>
                  <div className="cart-item-thumb">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <h3 className="cart-item-name">{item.product.name}</h3>
                      <button
                        className="remove-item"
                        onClick={() => handleRemoveFromCart(item.product.id)}
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
                          onClick={() => updateQuantity(item.product.id, -1)}
                          disabled={item.quantity === 1}
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
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
    </div>
  );
};

export default Shop;

