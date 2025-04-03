'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentStatus() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentId = searchParams.get('id');
    const paymentStatus = searchParams.get('status');

    if (paymentStatus === 'success') {
      setStatus('success');
      setMessage('Your payment was successful! Thank you for your order.');
    } else if (paymentStatus === 'failed') {
      setStatus('failed');
      setMessage('The payment failed. Please try again or contact support.');
    } else {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="container">
      <div className="payment-status-container">
        <h1 className="payment-status-title">
          {status === 'loading' ? 'Processing Payment...' :
           status === 'success' ? 'Payment Successful!' :
           status === 'failed' ? 'Payment Failed' :
           'Payment Error'}
        </h1>
        
        <div className="payment-status-message">
          {message}
        </div>

        <div className="payment-status-actions">
          {status === 'success' ? (
            <Link href="/" className="payment-status-button">
              Return to Home
            </Link>
          ) : (
            <Link href="/cart" className="payment-status-button">
              Return to Cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 