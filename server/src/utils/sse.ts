import { Response } from 'express';
import { logger } from './logger';

interface Client {
  id: string;
  centreId: string;
  res: Response;
}

class SSEManager {
  private clients: Client[] = [];

  public addClient(id: string, centreId: string, res: Response): void {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE stream connected for centre ' + centreId })}\n\n`);

    const client = { id, centreId, res };
    this.clients.push(client);

    logger.debug(`SSE client connected: ${id} for centre ${centreId}. Total clients: ${this.clients.length}`);

    // Clean up on client disconnect
    res.on('close', () => {
      this.removeClient(id);
    });
  }

  public removeClient(id: string): void {
    this.clients = this.clients.filter((c) => c.id !== id);
    logger.debug(`SSE client disconnected: ${id}. Remaining: ${this.clients.length}`);
  }

  public broadcastToCentre(centreId: string, eventType: string, data: any): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    let deliveredCount = 0;

    for (const client of this.clients) {
      if (client.centreId === centreId || client.centreId === 'GLOBAL') {
        try {
          client.res.write(payload);
          deliveredCount++;
        } catch (err) {
          logger.error(`Failed to send SSE to client ${client.id}`, err);
        }
      }
    }

    logger.debug(`Broadcasted SSE event '${eventType}' to centre ${centreId} (${deliveredCount} clients)`);
  }

  public broadcastGlobal(eventType: string, data: any): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        logger.error(`Failed to send SSE global to client ${client.id}`, err);
      }
    }
  }
}

export const sseManager = new SSEManager();
