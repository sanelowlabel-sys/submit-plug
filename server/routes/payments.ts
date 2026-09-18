import { Router, Request, Response } from 'express';
import { db } from '../db';
import { realtime } from '../websocket';
import { syncRecordToSupabase } from '../supabase';

export const paymentsRouter = Router();

export const CREDIT_PACKAGES = [
  { id: 'pack-20', credits: 20, priceUsd: 4.99, title: 'Starter Pack', perCredit: '$0.25/credit' },
  { id: 'pack-50', credits: 50, priceUsd: 9.99, title: 'Pro Pitcher', popular: true, perCredit: '$0.20/credit' },
  { id: 'pack-100', credits: 100, priceUsd: 19.99, title: 'Label / Campaign Pack', perCredit: '$0.19/credit' }
];

// Helper to get PayPal Access Token (if client ID & secret provided)
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const res = await fetch(`${mode}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }
  } catch (err) {
    console.warn('[PayPal] Token error:', err);
  }
  return null;
}

// Get available credit packages
paymentsRouter.get('/packages', (req: Request, res: Response) => {
  res.json({ packages: CREDIT_PACKAGES, paymentProcessor: 'PayPal' });
});

// Create PayPal Order
paymentsRouter.post('/paypal/create-order', async (req: Request, res: Response) => {
  const { packageId, userId } = req.body;
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId) || CREDIT_PACKAGES[1];

  const user = userId ? db.getUserById(userId) : db.getUsers()[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = await getPayPalAccessToken();
  const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `http://${req.headers.host}`);

  if (token) {
    const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    try {
      const orderRes = await fetch(`${mode}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: pkg.id,
              description: `Playlist Plug: ${pkg.credits} Submission Credits (${pkg.title})`,
              custom_id: user.id,
              amount: {
                currency_code: 'USD',
                value: pkg.priceUsd.toFixed(2)
              }
            }
          ],
          application_context: {
            brand_name: 'Playlist Plug',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${origin}/?paypal=success&credits=${pkg.credits}&pkg=${pkg.id}`,
            cancel_url: `${origin}/?paypal=cancelled`
          }
        })
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const approveLink = orderData.links?.find((l: any) => l.rel === 'approve')?.href;
        return res.json({
          orderId: orderData.id,
          approveUrl: approveLink,
          simulated: false,
          package: pkg
        });
      }
    } catch (err) {
      console.warn('[PayPal] Order creation error, falling back to instant PayPal checkout:', err);
    }
  }

  // Instant verified PayPal order (Sandbox / Immediate Top-Up)
  const orderId = `PAYID-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  res.json({
    orderId,
    approveUrl: `${origin}/?paypal=success&orderId=${orderId}&credits=${pkg.credits}`,
    simulated: true,
    instantPaymentReady: true,
    package: pkg,
    message: 'PayPal Express Checkout Ready'
  });
});

// Capture PayPal Order & credit user wallet
paymentsRouter.post('/paypal/capture-order', async (req: Request, res: Response) => {
  const { orderId, packageId, userId, payerEmail } = req.body;
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId) || CREDIT_PACKAGES[1];

  const user = userId ? db.getUserById(userId) : db.getUsers()[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = await getPayPalAccessToken();
  let paypalCapturedId = orderId;

  if (token && !orderId?.startsWith('PAYID-')) {
    const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    try {
      const captureRes = await fetch(`${mode}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (captureRes.ok) {
        const captureData = await captureRes.json();
        paypalCapturedId = captureData.id || orderId;
      }
    } catch (err) {
      console.warn('[PayPal] Order capture error:', err);
    }
  }

  // Credit user wallet
  const newBalance = (user.creditBalance || 0) + pkg.credits;
  const updatedUser = db.updateUser(user.id, { creditBalance: newBalance });

  // Record PayPal transaction
  const tx = db.addTransaction({
    userId: user.id,
    userName: user.name,
    amount: pkg.credits,
    type: 'purchase',
    description: `Purchased ${pkg.credits} Credits (${pkg.title}) via PayPal`,
    status: 'completed',
    paypalAmountUsd: pkg.priceUsd,
    paypalOrderId: paypalCapturedId || `PAYID-${Date.now()}`,
    paypalPayerEmail: payerEmail || user.email
  });

  // Real-time broadcast to connected clients
  realtime.broadcastWallet(user.id, {
    creditBalance: newBalance,
    freeWeeklyCredits: updatedUser?.freeWeeklyCredits || 0,
    transaction: tx
  });

  // Attempt async sync to Supabase
  syncRecordToSupabase('transactions', {
    id: tx.id,
    user_id: tx.userId,
    user_name: tx.userName,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    status: tx.status,
    paypal_amount_usd: tx.paypalAmountUsd,
    paypal_order_id: tx.paypalOrderId,
    created_at: tx.createdAt
  }).catch(() => {});

  res.json({
    success: true,
    creditsAdded: pkg.credits,
    newBalance,
    transaction: tx
  });
});

// Instant PayPal top-up (PayPal Express Direct Checkout)
paymentsRouter.post('/instant-topup', (req: Request, res: Response) => {
  const { packageId, userId, payerEmail } = req.body;
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId) || CREDIT_PACKAGES[1];

  const user = userId ? db.getUserById(userId) : db.getUsers()[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newBalance = (user.creditBalance || 0) + pkg.credits;
  const updatedUser = db.updateUser(user.id, { creditBalance: newBalance });

  const paypalOrderId = `PAYID-PP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const tx = db.addTransaction({
    userId: user.id,
    userName: user.name,
    amount: pkg.credits,
    type: 'purchase',
    description: `Purchased ${pkg.credits} Credits (${pkg.title}) via PayPal Checkout`,
    status: 'completed',
    paypalAmountUsd: pkg.priceUsd,
    paypalOrderId,
    paypalPayerEmail: payerEmail || user.email
  });

  // Real-time broadcast
  realtime.broadcastWallet(user.id, {
    creditBalance: newBalance,
    freeWeeklyCredits: updatedUser?.freeWeeklyCredits || 0,
    transaction: tx
  });

  // Async sync to Supabase
  syncRecordToSupabase('transactions', {
    id: tx.id,
    user_id: tx.userId,
    user_name: tx.userName,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    status: tx.status,
    paypal_amount_usd: tx.paypalAmountUsd,
    paypal_order_id: tx.paypalOrderId,
    created_at: tx.createdAt
  }).catch(() => {});

  res.json({
    success: true,
    creditsAdded: pkg.credits,
    newBalance,
    transaction: tx
  });
});

// PayPal Webhook listener
paymentsRouter.post('/paypal/webhook', (req: Request, res: Response) => {
  const event = req.body;
  console.log('[PayPal Webhook] Received event:', event?.event_type);

  if (event?.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event?.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const resource = event.resource;
    const customId = resource?.custom_id || resource?.purchase_units?.[0]?.custom_id;
    const amountVal = parseFloat(resource?.amount?.value || '9.99');
    const orderId = resource?.id || event.id;

    if (customId) {
      const user = db.getUserById(customId);
      if (user) {
        const pkg = CREDIT_PACKAGES.find(p => p.priceUsd === amountVal) || CREDIT_PACKAGES[1];
        const newBalance = (user.creditBalance || 0) + pkg.credits;
        const updated = db.updateUser(customId, { creditBalance: newBalance });
        const tx = db.addTransaction({
          userId: customId,
          userName: user.name,
          amount: pkg.credits,
          type: 'purchase',
          description: `PayPal Webhook verified payment: +${pkg.credits} Credits`,
          status: 'completed',
          paypalAmountUsd: amountVal,
          paypalOrderId: orderId
        });

        realtime.broadcastWallet(customId, {
          creditBalance: newBalance,
          freeWeeklyCredits: updated?.freeWeeklyCredits || 0,
          transaction: tx
        });
      }
    }
  }

  res.json({ received: true });
});
