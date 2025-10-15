import { NextResponse } from 'next/server';

// Store active connections
let connections = new Set();

export async function GET() {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to active connections
      const connection = {
        controller,
        send: (data) => {
          try {
            // Double check if controller is still open and writable
            if (controller.desiredSize !== null && !controller.signal?.aborted) {
              const message = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(new TextEncoder().encode(message));
            } else {
              // Controller is closed, remove from connections
              connections.delete(connection);
            }
          } catch (error) {
            console.error('Error sending SSE message:', error.message);
            // Remove this connection from the set if it's broken
            connections.delete(connection);
          }
        },
        isClosed: () => controller.desiredSize === null
      };
      
      connections.add(connection);
      
      // Send initial connection message
      connection.send({ type: 'connected', message: 'Connected to order stream' });
      
      // Optional: Send periodic heartbeat (disabled to avoid closed controller errors)
      // Browser will auto-reconnect if needed
      const heartbeatInterval = null;
      
      // Clean up on close
      const cleanup = () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        connections.delete(connection);
        try {
          if (controller.desiredSize !== null) {
            controller.close();
          }
        } catch (error) {
          // Controller might already be closed
        }
      };

      // Set up cleanup timer - 60 minutes timeout
      const timeoutId = setTimeout(cleanup, 60 * 60 * 1000); 

      return () => {
        clearTimeout(timeoutId);
        cleanup();
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Function to broadcast to all connections
export function broadcastOrderUpdate(orderData) {
  
  // Create a copy of connections to iterate over
  const activeConnections = Array.from(connections);
  
  activeConnections.forEach(connection => {
    try {
      // Check if connection is still active before sending
      if (connection.controller && connection.controller.desiredSize !== null) {
        connection.send({
          type: 'order_update',
          data: orderData
        });
      } else {
        // Connection is closed, remove it
        connections.delete(connection);
      }
    } catch (error) {
      console.error('Failed to send to connection:', error.message);
      connections.delete(connection);
    }
  });
  
}