import { NextResponse } from 'next/server';
import { createMollieClient } from '@mollie/api-client';

export async function POST(request) {
  try {
    // Initialize Mollie client inside the function
    const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
    
    const paymentId = request.nextUrl.searchParams.get('id');
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'No payment ID provided' },
        { status: 400 }
      );
    }

    // Verify the payment
    const payment = await mollieClient.payments.get(paymentId);
    
    // Here you would typically:
    // 1. Update your database with the payment status
    // 2. Send confirmation emails
    // 3. Update order status
    // 4. Clear the cart
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 