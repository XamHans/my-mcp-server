import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { z } from 'zod';

// Define the Env interface
export interface Env {
  DB_URL?: string;
  [key: string]: any; // Allow for any other environment variables
}

// Create a global context to store environment variables
export const globalContext = {
  env: {} as Env,
};

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: 'Authless Calculator',
    version: '1.0.0',
  });

  async init() {
    // Simple addition tool
    this.server.tool(
      'add',
      { a: z.number(), b: z.number() },
      async ({ a, b }) => {
        // Access environment variables from the global context
        console.log('DB URL from global context:', globalContext.env.DB_URL);

        return {
          content: [{ type: 'text', text: String(a + b) }],
        };
      }
    );

    // Calculator tool with multiple operations
    this.server.tool(
      'calculate',
      {
        operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
        a: z.number(),
        b: z.number(),
      },
      async ({ operation, a, b }) => {
        let result: number;
        console.log('Operation:', operation);
        console.log('Numbers:', a, b);

        // Access environment variables from the global context
        console.log('DB URL from global context:', globalContext.env.DB_URL);

        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'subtract':
            result = a - b;
            break;
          case 'multiply':
            result = a * b;
            break;
          case 'divide':
            if (b === 0)
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Error: Cannot divide by zero',
                  },
                ],
              };
            result = a / b;
            break;
        }
        console.log('Final Result:', result);
        return { content: [{ type: 'text', text: String(result) }] };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    console.log('env', env);
    // Set the environment variables in the global context
    globalContext.env = env;
    console.log('globalContext', globalContext);

    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      return MyMCP.serveSSE('/sse').fetch(request, env, ctx);
    }

    if (url.pathname === '/mcp') {
      return MyMCP.serve('/mcp').fetch(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};
