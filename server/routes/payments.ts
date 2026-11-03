import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { standardApiLimiter, sensitiveActionLimiter } from '../middleware/rateLimit';

export const paymentsRouter = Router();

paymentsRouter.use(standardApiLimiter);

// Fixed server-side package list with tamper-proof prices and credits
export const CREDIT_PACKAGES = [
  { id: 'pack-20', credits: 20, priceUsd: 4.99, title: 'Starter Pack', perCredit: '$0.25/credit' },
  { id: 'pack-50', credits: 50, priceUsd: 9.99, title: 'Pro Pitcher', popular: true, perCredit: '$0.20/credit' },
  { id: 'pack-100', credits: 100, priceUsd: 19.99, title: 'Label / Campaign Pack', perCredit: '$0.20/credit' }
];

/**
 * Helper to obtain PayPal Access Token using Server-Side Client ID and Secret
 */
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
    console.warn('[PayPal] Token request error:', err);
  }
  return null;
}

/**
 * GET /api/payments/packages
 * Returns server-side verified package list
 */
paymentsRouter.get('/packages', (req, res) => {
  res.json({
    packages: CREDIT_PACKAGES,
    paymentProcessor: 'PayPal',
    isPayPalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
  });
});

/**
 * POST /api/payments/paypal/create-order
 * Creates PayPal order server-side with fixed price taken strictly from the server-side package list.
 * User ID is taken from verified JWT. NO simulated fallbacks!
 */
paymentsRouter.post('/paypal/create-order', requireAuth, sensitiveActionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { packageId } = req.body;
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid credit package selected' });
  }

  const token = await getPayPalAccessToken();
  if (!token) {
    return res.status(503).json({
      error: 'PayPal payment gateway is not configured on this server. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
    });
  }

  const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const origin = req.headers.origin || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `http://${req.headers.host}`);

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
            description: `Playlist Plug: ${pkg.credits} Pitch Credits (${pkg.title})`,
            custom_id: req.user.id, // Strictly from verified JWT
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
          return_url: `${origin}/?paypal=success&pkg=${pkg.id}`,
          cancel_url: `${origin}/?paypal=cancelled`
        }
      })
    });

    if (!orderRes.ok) {
      const errBody = await orderRes.text();
      return res.status(400).json({ error: `PayPal order creation rejected: ${errBody}` });
    }

    const orderData = await orderRes.json();
    const approveLink = orderData.links?.find((l: any) => l.rel === 'approve')?.href;

    res.json({
      orderId: orderData.id,
      approveUrl: approveLink,
      package: pkg
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to communicate with PayPal: ' + (err.message || 'unknown') });
  }
});

/**
 * POST /api/payments/paypal/capture-order
 * Captures PayPal order and credits wallet ONLY if capture returns COMPLETED with the expected amount.
 * Made idempotent on the PayPal order ID.
 * Credit changes execute in atomic function creditWallet.
 */
paymentsRouter.post('/paypal/capture-order', requireAuth, sensitiveActionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required.' });
  }

  const token = await getPayPalAccessToken();
  if (!token) {
    return res.status(503).json({ error: 'PayPal credentials not configured on server.' });
  }

  const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    // 1. Look up the order via PayPal's API to get reference_id (NEVER guess from amount!)
    const orderDetailsRes = await fetch(`${mode}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderDetailsRes.ok) {
      const errText = await orderDetailsRes.text();
      return res.status(400).json({ error: `Failed to retrieve PayPal order details (${orderDetailsRes.status}): ${errText}` });
    }

    const orderDetails = await orderDetailsRes.json();
    const purchaseUnit = orderDetails.purchase_units?.[0];
    const referenceId = purchaseUnit?.reference_id;

    if (!referenceId) {
      return res.status(400).json({ error: 'PayPal order missing reference_id in purchase_units.' });
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.id === referenceId);
    if (!pkg) {
      return res.status(400).json({ error: `Invalid reference_id: ${referenceId}` });
    }

    // 2. Capture the order
    const captureRes = await fetch(`${mode}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      return res.status(400).json({ error: `PayPal capture failed (${captureRes.status}): ${errText}` });
    }

    const captureData = await captureRes.json();

    // Verify status is COMPLETED
    if (captureData.status !== 'COMPLETED') {
      return res.status(400).json({
        error: `Payment not completed. PayPal status: ${captureData.status}`
      });
    }

    // Verify captured amount equals expected package price
    const captureUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmountStr = captureUnit?.amount?.value || '0';
    const capturedAmount = parseFloat(capturedAmountStr);

    if (Math.abs(capturedAmount - pkg.priceUsd) > 0.01) {
      return res.status(400).json({
        error: `Captured payment amount ($${capturedAmount}) does not match expected package price ($${pkg.priceUsd}).`
      });
    }

    const payerEmail = captureData.payer?.email_address || orderDetails.payer?.email_address;

    // Credit wallet with idempotency check on PayPal order ID
    const result = await db.creditWallet({
      userId: req.user.id,
      amount: pkg.credits,
      type: 'purchase',
      description: `Purchased ${pkg.credits} Credits (${pkg.title}) via PayPal`,
      paypalOrderId: orderId,
      paypalAmountUsd: capturedAmount,
      paypalPayerEmail: payerEmail
    });

    res.json({
      success: true,
      creditsAdded: pkg.credits,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      idempotent: result.idempotent
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error processing PayPal capture: ' + (err.message || 'unknown') });
  }
});

/**
 * POST /api/payments/paypal/webhook
 * Verifies webhook signatures with PayPal's verify-webhook-signature API.
 * REJECTS (400) unless PayPal's verify call returns SUCCESS.
 * Credit by looking up the order's reference_id via PayPal's API, never by guessing from the amount.
 */
paymentsRouter.post('/paypal/webhook', async (req, res) => {
  const event = req.body;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  const token = await getPayPalAccessToken();
  if (!token || !webhookId) {
    return res.status(400).json({ error: 'Webhook signature verification failed: PayPal credentials or webhook ID missing.' });
  }

  const mode = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    // Verify webhook signature with PayPal verify-webhook-signature API
    const verifyRes = await fetch(`${mode}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth_algo: req.headers['paypal-auth-algo'],
        cert_url: req.headers['paypal-cert-url'],
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        transmission_time: req.headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: event
      })
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.warn('[PayPal Webhook] Signature verification endpoint error:', errText);
      return res.status(400).json({ error: 'Webhook signature verification rejected.' });
    }

    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.warn('[PayPal Webhook] Signature verification status not SUCCESS:', verifyData);
      return res.status(400).json({ error: 'Webhook signature verification failed.' });
    }
  } catch (vErr: any) {
    console.warn('[PayPal Webhook] Verification request failed:', vErr);
    return res.status(400).json({ error: 'Webhook signature verification failed: ' + vErr.message });
  }

  // Handle capture completed event
  if (event?.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource;
    // For capture events, PayPal provides the order id in supplementary_data.related_ids.order_id
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    if (!orderId) {
      console.warn('[PayPal Webhook] Missing order_id in capture event');
      return res.status(400).json({ error: 'Missing order_id in capture event' });
    }

    // Look up the order via PayPal's API to get reference_id (NEVER guess from amount!)
    const orderRes = await fetch(`${mode}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error(`[PayPal Webhook] Failed to fetch order ${orderId} from PayPal:`, errText);
      return res.status(400).json({ error: 'Failed to look up order from PayPal API' });
    }

    const orderData = await orderRes.json();
    const purchaseUnit = orderData.purchase_units?.[0];
    const referenceId = purchaseUnit?.reference_id;
    const userId = purchaseUnit?.custom_id || resource?.custom_id;

    if (!referenceId) {
      console.error(`[PayPal Webhook] Order ${orderId} missing reference_id in purchase_units`);
      return res.status(400).json({ error: 'Missing reference_id in order from PayPal API' });
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === referenceId);
    if (!pkg) {
      console.error(`[PayPal Webhook] No credit package matched reference_id: ${referenceId}`);
      return res.status(400).json({ error: `Invalid reference_id: ${referenceId}` });
    }

    if (!userId) {
      console.error(`[PayPal Webhook] No userId associated with order ${orderId}`);
      return res.status(400).json({ error: 'No user ID associated with order' });
    }

    const amountVal = parseFloat(resource?.amount?.value || '0');
    if (Math.abs(amountVal - pkg.priceUsd) > 0.01) {
      console.error(`[PayPal Webhook] Captured amount ${amountVal} does not match package price ${pkg.priceUsd}`);
      return res.status(400).json({ error: 'Captured amount does not match package price' });
    }

    try {
      await db.creditWallet({
        userId,
        amount: pkg.credits,
        type: 'purchase',
        description: `PayPal Webhook verified payment: +${pkg.credits} Credits (${pkg.title})`,
        paypalOrderId: orderId,
        paypalAmountUsd: amountVal,
        paypalPayerEmail: resource?.payer?.email_address || orderData.payer?.email_address
      });
    } catch (e: any) {
      console.error('[PayPal Webhook] Error crediting wallet:', e);
      return res.status(500).json({ error: 'Failed to credit wallet: ' + e.message });
    }
  }

  res.json({ received: true });
});
