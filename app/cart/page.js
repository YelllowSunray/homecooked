'use client';

import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, updateQuantity, calculateTotal } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setError('');

      // Create a unique order ID
      const orderId = `ORDER-${Date.now()}`;

      // Call the payment API
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(calculateTotal()),
          description: `Order ${orderId} - ${cartItems.length} items`,
          orderId: orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to Mollie checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <div className="login-container" style={{ maxWidth: '800px' }}>
        <h1 className="login-title">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Your cart is empty.</p>
            <Link href="/" className="login-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items" style={{ marginBottom: '2rem' }}>
              {cartItems.map(item => (
                <div key={item.id} className="cart-item" style={{ 
                  display: 'flex', 
                  marginBottom: '1.5rem', 
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  background: '#fff'
                }}>
                  <div className="cart-item-image" style={{ 
                    width: '80px', 
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #9b93f3, #cc9ae4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div className="placeholder-text" style={{ 
                      color: 'white', 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold' 
                    }}>
                      {item.name[0]}
                    </div>
                  </div>
                  
                  <div className="cart-item-details" style={{ 
                    flex: '1', 
                    padding: '0 1rem' 
                  }}>
                    <h2 className="cart-item-name" style={{ 
                      margin: '0 0 0.5rem', 
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {item.name}
                    </h2>
                    <p className="cart-item-cook" style={{ 
                      margin: '0 0 0.5rem',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      Made by: {item.userName || 'Anonymous Cook'}
                    </p>
                    <p className="cart-item-price" style={{ 
                      margin: '0',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#5f2053'
                    }}>
                      €{typeof item.price === 'string' ? item.price : item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="cart-item-controls" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div className="quantity-controls" style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        disabled={(item.quantity || 1) <= 1}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: '#f5f5f5',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        -
                      </button>
                      <span className="quantity" style={{ 
                        margin: '0 0.5rem',
                        fontWeight: 'bold'
                      }}>
                        {item.quantity || 1}
                      </span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: '#f5f5f5',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        background: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="divider" style={{ marginBottom: '1.5rem' }}>
              <span>Summary</span>
            </div>
            
            <div className="cart-summary" style={{ 
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              background: '#f9f9f9',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderTop: '1px solid #e5e7eb',
                fontWeight: 'bold'
              }}>
                <span>Total:</span>
                <span style={{ color: '#5f2053' }}>€{calculateTotal()}</span>
              </div>
              
              {error && (
                <div style={{ 
                  color: '#d32f2f',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}
              
              <button 
                className="login-button" 
                style={{ width: '100%', marginBottom: '1rem' }}
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Pay with iDEAL'}
              </button>
              
              <button 
                className="clear-cart-btn" 
                onClick={clearCart}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#333',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Clear Cart
              </button>
            </div>
            
            <div className="login-options" style={{ textAlign: 'center' }}>
              <Link href="/" className="forgot-password-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
