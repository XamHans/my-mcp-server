import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { z } from 'zod';

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
  private static env: any;

  server = new McpServer({
    name: 'Authless Calculator',
    version: '1.0.0',
  });

  static setEnv(env: any): void {
    this.env = env;
  }

  async init() {
    // Simple addition tool
    this.server.tool(
      'add',
      { a: z.number(), b: z.number() },
      async ({ a, b }) => ({
        content: [{ type: 'text', text: String(a + b) }],
      })
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
        console.log('DB  URL from env variables:', MyMCP.env.DB_URL);

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
    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      // @ts-ignore
      return MyMCP.serveSSE('/sse').fetch(request, env, ctx);
    }

    if (url.pathname === '/mcp') {
      // @ts-ignore
      return MyMCP.serve('/mcp').fetch(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};
