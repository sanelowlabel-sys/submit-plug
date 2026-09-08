import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SubmissionRecord, CuratorActivityRecord } from './types';

export class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[WS] Client connected. Total active clients: ${this.clients.size}`);

      // Send initial welcome message
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: {
          timestamp: new Date().toISOString(),
          activeClients: this.clients.size
        }
      }));

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch (e) {
          // Ignore malformed ping
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected. Total active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WS] Client socket error:', err);
        this.clients.delete(ws);
      });
    });

    // Keepalive heartbeat
    setInterval(() => {
      this.broadcast('HEARTBEAT', {
        timestamp: Date.now(),
        onlineCurators: 42 + Math.floor(Math.random() * 8)
      });
    }, 25000);
  }

  public broadcast(type: string, payload: unknown) {
    const msg = JSON.stringify({ type, payload });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch (err) {
          console.error('[WS] Failed to broadcast message:', err);
        }
      }
    }
  }

  public broadcastSubmission(action: 'created' | 'updated', submission: SubmissionRecord) {
    this.broadcast('SUBMISSION_' + action.toUpperCase(), {
      action,
      submission,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastWallet(userId: string, wallet: { creditBalance: number; freeWeeklyCredits: number; transaction?: unknown }) {
    this.broadcast('WALLET_UPDATED', {
      userId,
      wallet,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastCuratorActivity(activity: CuratorActivityRecord) {
    this.broadcast('CURATOR_ACTIVITY', activity);
  }

  public getActiveCount(): number {
    return this.clients.size;
  }
}

export const realtime = new RealtimeServer();
