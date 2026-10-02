declare module "@vercel/node" {
  export interface VercelRequest extends import("http").IncomingMessage {
    method?: string;
    body?: any;
    query: Record<string, string | string[] | undefined>;
  }
  export interface VercelResponse extends import("http").ServerResponse {
    status(code: number): this;
    json(body: unknown): this;
    send(body: unknown): this;
  }
}
