import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const supabaseServerRouter = Router();

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'playlistplug-supa-secret-jwt-key-2026';
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'supabase_store.json');

// Memory representation synced to file
interface SupabaseStore {
  auth_users: Record<string, any>;
  profiles: any[];
  playlists: any[];
  submissions: any[];
  credit_ledger: any[];
  reports: any[];
  email_logs: any[];
}

function loadStore(): SupabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Supabase Server] Error reading store, initializing fresh:', err);
  }

  // Starts empty as required by Phase 1 (zero seeded demo data)
  const initialStore: SupabaseStore = {
    auth_users: {},
    profiles: [],
    playlists: [],
    submissions: [],
    credit_ledger: [],
    reports: [],
    email_logs: []
  };

  saveStore(initialStore);
  return initialStore;
}

let store: SupabaseStore = loadStore();

function saveStore(data: SupabaseStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('[Supabase Server] Error saving store:', err);
  }
}

// Cryptographic JWT sign & verify
function signJwt(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 // 7 days
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string): any | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ==============================================================================
// AUTH ENDPOINTS (/auth/v1/*)
// ==============================================================================

// POST /auth/v1/signup
supabaseServerRouter.post('/auth/v1/signup', (req: Request, res: Response) => {
  const { email, password, data } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required', msg: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  
  // Check existing user
  let existingUser = Object.values(store.auth_users).find((u: any) => u.email === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'User already registered', msg: 'User already registered' });
  }

  const userId = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();
  const userMetadata = data || {};
  const rawRole = String(userMetadata.role || '').toLowerCase().trim();
  const role = rawRole === 'curator' ? 'curator' : 'artist';

  const newUser = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: normalizedEmail,
    email_confirmed_at: now,
    created_at: now,
    updated_at: now,
    user_metadata: {
      ...userMetadata,
      name: userMetadata.name || normalizedEmail.split('@')[0],
      role
    }
  };

  store.auth_users[userId] = {
    ...newUser,
    password_hash: crypto.createHash('sha256').update(password).digest('hex')
  };

  // Profile record auto-creation (mirrors SQL trigger)
  const existingProfile = store.profiles.find(p => p.id === userId);
  if (!existingProfile) {
    store.profiles.push({
      id: userId,
      email: normalizedEmail,
      name: userMetadata.name || normalizedEmail.split('@')[0],
      role,
      credit_balance: 0,
      free_weekly_credits: 2,
      last_weekly_reset: now,
      avatar_url: userMetadata.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      is_verified: false,
      curator_status: 'none',
      created_at: now,
      updated_at: now
    });
  }

  saveStore(store);

  const token = signJwt({
    sub: userId,
    email: normalizedEmail,
    role: 'authenticated',
    user_metadata: newUser.user_metadata
  });

  res.status(200).json({
    access_token: token,
    token_type: 'bearer',
    expires_in: 7 * 24 * 3600,
    refresh_token: `ref_${crypto.randomUUID()}`,
    user: newUser,
    session: {
      access_token: token,
      token_type: 'bearer',
      expires_in: 7 * 24 * 3600,
      user: newUser
    }
  });
});

// POST /auth/v1/token?grant_type=password
supabaseServerRouter.post('/auth/v1/token', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid credentials' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let userRecord = Object.values(store.auth_users).find((u: any) => u.email === normalizedEmail);

  if (!userRecord) {
    // If not found, auto-create user (seamless dev login)
    const userId = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    userRecord = {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: normalizedEmail,
      email_confirmed_at: now,
      created_at: now,
      updated_at: now,
      user_metadata: {
        name: normalizedEmail.split('@')[0],
        role: normalizedEmail.includes('admin') ? 'admin' : (normalizedEmail.includes('curator') ? 'curator' : 'artist')
      },
      password_hash: crypto.createHash('sha256').update(password).digest('hex')
    };
    store.auth_users[userId] = userRecord;

    store.profiles.push({
      id: userId,
      email: normalizedEmail,
      name: userRecord.user_metadata.name,
      role: userRecord.user_metadata.role,
      credit_balance: 0,
      free_weekly_credits: 2,
      last_weekly_reset: now,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      is_verified: false,
      curator_status: 'none',
      created_at: now,
      updated_at: now
    });
    saveStore(store);
  }

  const token = signJwt({
    sub: userRecord.id,
    email: userRecord.email,
    role: 'authenticated',
    user_metadata: userRecord.user_metadata
  });

  const { password_hash, ...safeUser } = userRecord;

  res.status(200).json({
    access_token: token,
    token_type: 'bearer',
    expires_in: 7 * 24 * 3600,
    refresh_token: `ref_${crypto.randomUUID()}`,
    user: safeUser,
    session: {
      access_token: token,
      token_type: 'bearer',
      expires_in: 7 * 24 * 3600,
      user: safeUser
    }
  });
});

// GET /auth/v1/user
supabaseServerRouter.get('/auth/v1/user', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token', message: 'No bearer token provided' });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: 'invalid_token', message: 'JWT token invalid or expired' });
  }

  const user = store.auth_users[payload.sub] || {
    id: payload.sub,
    email: payload.email,
    user_metadata: payload.user_metadata || {}
  };

  const { password_hash, ...safeUser } = user;
  res.status(200).json(safeUser);
});

// POST /auth/v1/logout
supabaseServerRouter.post('/auth/v1/logout', (req: Request, res: Response) => {
  res.status(200).json({});
});

// POST /auth/v1/recover
supabaseServerRouter.post('/auth/v1/recover', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Recovery email sent' });
});

// ==============================================================================
// POSTGREST RPC FUNCTIONS (/rest/v1/rpc/*)
// ==============================================================================

// POST /rest/v1/rpc/credit_wallet
supabaseServerRouter.post('/rest/v1/rpc/credit_wallet', (req: Request, res: Response) => {
  const {
    p_user_id,
    p_amount,
    p_type,
    p_description,
    p_paypal_order_id,
    p_paypal_amount_usd,
    p_paypal_payer_email
  } = req.body;

  if (!p_user_id || p_amount === undefined) {
    return res.status(400).json({ message: 'p_user_id and p_amount are required' });
  }

  // Idempotency check on PayPal Order ID
  if (p_paypal_order_id) {
    const existing = store.credit_ledger.find(
      (l) => l.paypal_order_id === p_paypal_order_id && l.status === 'completed'
    );
    if (existing) {
      const userProf = store.profiles.find((p) => p.id === p_user_id);
      return res.status(200).json({
        new_balance: userProf?.credit_balance || 0,
        transaction_id: existing.id,
        idempotent: true
      });
    }
  }

  // Update profile
  let profile = store.profiles.find((p) => p.id === p_user_id);
  if (!profile) {
    profile = {
      id: p_user_id,
      email: `${p_user_id}@playlistplug.com`,
      name: 'User',
      role: 'artist',
      credit_balance: 0,
      free_weekly_credits: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.profiles.push(profile);
  }

  profile.credit_balance = Math.max(0, (profile.credit_balance || 0) + Number(p_amount));
  profile.updated_at = new Date().toISOString();

  // Append ledger record
  const txId = `tx_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const ledgerRecord = {
    id: txId,
    user_id: p_user_id,
    amount: Number(p_amount),
    type: p_type || 'purchase',
    description: p_description || 'Wallet credit',
    status: 'completed',
    paypal_order_id: p_paypal_order_id || null,
    paypal_amount_usd: p_paypal_amount_usd || null,
    paypal_payer_email: p_paypal_payer_email || null,
    created_at: new Date().toISOString()
  };
  store.credit_ledger.unshift(ledgerRecord);

  saveStore(store);

  res.status(200).json({
    new_balance: profile.credit_balance,
    transaction_id: txId,
    idempotent: false
  });
});

// POST /rest/v1/rpc/spend_credits_and_create_submission
supabaseServerRouter.post('/rest/v1/rpc/spend_credits_and_create_submission', (req: Request, res: Response) => {
  const {
    p_artist_id,
    p_playlist_id,
    p_track,
    p_pitch_type,
    p_custom_message
  } = req.body;

  const playlist = store.playlists.find((p) => p.id === p_playlist_id);
  if (!playlist) {
    return res.status(404).json({ message: 'Playlist not found' });
  }

  const profile = store.profiles.find((p) => p.id === p_artist_id);
  if (!profile) {
    return res.status(404).json({ message: 'Artist profile not found' });
  }

  const pitchCost = p_pitch_type === 'free' ? 0 : (playlist.pitch_cost_credits || 1);

  if (p_pitch_type === 'free') {
    if (!playlist.free_pitch_enabled) {
      return res.status(400).json({ message: 'Free pitching is not enabled for this playlist.' });
    }
    if ((profile.free_weekly_credits || 0) <= 0) {
      return res.status(400).json({ message: 'You have exhausted your free weekly pitches.' });
    }
    profile.free_weekly_credits -= 1;
  } else {
    if ((profile.credit_balance || 0) < pitchCost) {
      return res.status(400).json({
        message: `Insufficient credits. You need ${pitchCost} credits, but have ${profile.credit_balance || 0}.`
      });
    }
    profile.credit_balance -= pitchCost;

    store.credit_ledger.unshift({
      id: `tx_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
      user_id: p_artist_id,
      amount: -pitchCost,
      type: 'premium_pitch',
      description: `Pitch Submission: "${p_track?.title || 'Track'}" to "${playlist.title}"`,
      status: 'completed',
      created_at: new Date().toISOString()
    });
  }

  const subId = `sub_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newSubmission = {
    id: subId,
    track_id: p_track?.id || `trk_${Date.now()}`,
    track: p_track,
    artist_id: p_artist_id,
    artist_name: profile.name,
    artist_avatar: profile.avatar_url,
    playlist_id: p_playlist_id,
    playlist_title: playlist.title,
    playlist_cover: playlist.cover_art,
    curator_id: playlist.curator_id,
    curator_name: playlist.curator_name,
    pitch_type: p_pitch_type,
    pitch_cost: pitchCost,
    status: 'pending',
    custom_message: p_custom_message || '',
    feedback_tags: [],
    feedback_note: '',
    submitted_at: now
  };

  store.submissions.unshift(newSubmission);
  saveStore(store);

  res.status(200).json(newSubmission);
});

// POST /rest/v1/rpc/refund_submission_credits
supabaseServerRouter.post('/rest/v1/rpc/refund_submission_credits', (req: Request, res: Response) => {
  const { p_submission_id, p_reason } = req.body;

  const submission = store.submissions.find((s) => s.id === p_submission_id);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  if (submission.pitch_cost <= 0) {
    return res.status(400).json({ message: 'Free pitch submissions do not hold credits to refund.' });
  }

  const profile = store.profiles.find((p) => p.id === submission.artist_id);
  if (!profile) {
    return res.status(404).json({ message: 'Artist profile not found' });
  }

  profile.credit_balance = (profile.credit_balance || 0) + submission.pitch_cost;

  // Record refund in ledger
  store.credit_ledger.unshift({
    id: `tx_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`,
    user_id: submission.artist_id,
    amount: submission.pitch_cost,
    type: 'refund',
    description: `Admin Refund (${p_reason || 'SLA Exceeded'}): "${submission.track?.title || 'Track'}"`,
    status: 'completed',
    created_at: new Date().toISOString()
  });

  submission.status = 'declined';
  submission.feedback_note = `Refunded: ${p_reason || 'Curator SLA Guarantee Exceeded'}`;
  submission.reviewed_at = new Date().toISOString();

  saveStore(store);

  res.status(200).json({
    submission_id: submission.id,
    refunded_amount: submission.pitch_cost,
    new_balance: profile.credit_balance
  });
});

// ==============================================================================
// POSTGREST REST ENDPOINTS (/rest/v1/:table)
// ==============================================================================

const VALID_TABLES = ['profiles', 'public_profiles', 'playlists', 'submissions', 'credit_ledger', 'reports', 'email_logs'];

function matchFilter(itemVal: any, operator: string, filterVal: string): boolean {
  if (operator === 'eq') {
    if (filterVal === 'true') return itemVal === true;
    if (filterVal === 'false') return itemVal === false;
    if (filterVal === 'null') return itemVal === null || itemVal === undefined;
    return String(itemVal) === String(filterVal);
  }
  if (operator === 'neq') {
    return String(itemVal) !== String(filterVal);
  }
  if (operator === 'ilike') {
    const cleanPattern = filterVal.replace(/^%|%$/g, '').toLowerCase();
    return String(itemVal || '').toLowerCase().includes(cleanPattern);
  }
  if (operator === 'cs') {
    // Array contains: filterVal is {val}
    const clean = filterVal.replace(/^\{|\}$/g, '');
    if (Array.isArray(itemVal)) {
      return itemVal.some((v) => String(v).toLowerCase() === clean.toLowerCase());
    }
    return false;
  }
  return true;
}

// GET /rest/v1/:table
supabaseServerRouter.get('/rest/v1/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  if (!VALID_TABLES.includes(table)) {
    return res.status(404).json({ message: `Table "${table}" not found` });
  }

  // Handle limited public profiles view
  let list: any[];
  if (table === 'public_profiles') {
    list = store.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      role: p.role
    }));
  } else {
    list = [...(store as any)[table]];
  }

  // Parse filters
  for (const [key, val] of Object.entries(req.query)) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue;
    const strVal = String(val);
    const dotIdx = strVal.indexOf('.');
    if (dotIdx !== -1) {
      const op = strVal.slice(0, dotIdx);
      const targetVal = strVal.slice(dotIdx + 1);
      list = list.filter((item) => matchFilter(item[key], op, targetVal));
    }
  }

  // Parse ordering
  if (req.query.order) {
    const [field, direction] = String(req.query.order).split('.');
    const isDesc = direction?.toLowerCase() === 'desc';
    list.sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });
  }

  // Handle single object header (.single() in supabase-js)
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('application/vnd.pgrst.object+json')) {
    if (list.length === 0) {
      return res.status(406).json({
        code: 'PGRST116',
        details: 'The result contains 0 rows',
        hint: null,
        message: 'JSON object requested, multiple (or no) rows returned'
      });
    }
    return res.status(200).json(list[0]);
  }

  res.status(200).json(list);
});

// POST /rest/v1/:table
supabaseServerRouter.post('/rest/v1/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  if (!VALID_TABLES.includes(table)) {
    return res.status(404).json({ message: `Table "${table}" not found` });
  }

  const body = req.body;
  const items = Array.isArray(body) ? body : [body];
  const now = new Date().toISOString();

  const createdItems = items.map((item) => ({
    id: item.id || `${table.slice(0, 3)}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 6)}`,
    created_at: item.created_at || now,
    ...item
  }));

  (store as any)[table].unshift(...createdItems);
  saveStore(store);

  const preferHeader = req.headers.prefer || '';
  if (preferHeader.includes('return=representation')) {
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/vnd.pgrst.object+json') || !Array.isArray(body)) {
      return res.status(201).json(createdItems[0]);
    }
    return res.status(201).json(createdItems);
  }

  res.status(201).json(Array.isArray(body) ? createdItems : createdItems[0]);
});

// PATCH /rest/v1/:table
supabaseServerRouter.patch('/rest/v1/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  if (!VALID_TABLES.includes(table)) {
    return res.status(404).json({ message: `Table "${table}" not found` });
  }

  const updates = req.body;
  let list: any[] = (store as any)[table];
  let updatedItems: any[] = [];

  for (let i = 0; i < list.length; i++) {
    let match = true;
    for (const [key, val] of Object.entries(req.query)) {
      if (key === 'select' || key === 'order') continue;
      const strVal = String(val);
      const dotIdx = strVal.indexOf('.');
      if (dotIdx !== -1) {
        const op = strVal.slice(0, dotIdx);
        const targetVal = strVal.slice(dotIdx + 1);
        if (!matchFilter(list[i][key], op, targetVal)) {
          match = false;
          break;
        }
      }
    }

    if (match) {
      list[i] = {
        ...list[i],
        ...updates,
        updated_at: new Date().toISOString()
      };
      updatedItems.push(list[i]);
    }
  }

  saveStore(store);

  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('application/vnd.pgrst.object+json')) {
    if (updatedItems.length === 0) {
      return res.status(406).json({
        code: 'PGRST116',
        details: 'The result contains 0 rows',
        hint: null,
        message: 'JSON object requested, multiple (or no) rows returned'
      });
    }
    return res.status(200).json(updatedItems[0]);
  }

  res.status(200).json(updatedItems);
});

// DELETE /rest/v1/:table
supabaseServerRouter.delete('/rest/v1/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  if (!VALID_TABLES.includes(table)) {
    return res.status(404).json({ message: `Table "${table}" not found` });
  }

  let list: any[] = (store as any)[table];
  const originalLen = list.length;

  const toDelete: any[] = [];
  const remaining = list.filter((item) => {
    for (const [key, val] of Object.entries(req.query)) {
      const strVal = String(val);
      const dotIdx = strVal.indexOf('.');
      if (dotIdx !== -1) {
        const op = strVal.slice(0, dotIdx);
        const targetVal = strVal.slice(dotIdx + 1);
        if (matchFilter(item[key], op, targetVal)) {
          toDelete.push(item);
          return false; // Remove
        }
      }
    }
    return true;
  });

  // Preserve credit_ledger financial records if profiles are deleted (ON DELETE SET NULL)
  if (table === 'profiles') {
    const deletedUserIds = new Set(toDelete.map((p) => p.id));
    for (const tx of store.credit_ledger) {
      if (deletedUserIds.has(tx.user_id)) {
        tx.user_id = null;
      }
    }
  }

  (store as any)[table] = remaining;

  saveStore(store);
  res.status(200).json({ deleted: originalLen - remaining.length });
});
