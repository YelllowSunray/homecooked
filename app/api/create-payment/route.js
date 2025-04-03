import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';

// Initialize Mollie client
const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export async function POST(request) {
  try {
    const { amount, description, orderId } = await request.json();

    // Create payment
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2)
      },
      description: description,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/status`,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-webhook`,
      metadata: {
        orderId: orderId
      },
      methods: ['ideal']
    });

    // Get available iDEAL issuers
    const issuers = await mollieClient.methods.get('ideal', { include: 'issuers' });

    return NextResponse.json({
      checkoutUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      issuers: issuers.issuers
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
} 