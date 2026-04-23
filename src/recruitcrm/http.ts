import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export type HttpRequestOptions = {
  url: URL;
  method: "GET" | "POST";
  headers: Record<string, string>;
  jsonBody?: unknown;
  timeoutMs: number;
};

export type HttpResponse = {
  statusCode: number;
  bodyText: string;
};

export type HttpTransport = (options: HttpRequestOptions) => Promise<HttpResponse>;

export const nodeHttpTransport: HttpTransport = async (options) =>
  new Promise<HttpResponse>((resolve, reject) => {
    const requestFactory = selectRequestFactory(options.url);

    if (!requestFactory) {
      reject(new Error(`Unsupported protocol: ${options.url.protocol}`));
      return;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), options.timeoutMs);
    const payload = options.jsonBody === undefined ? undefined : JSON.stringify(options.jsonBody);
    const headers = { ...options.headers };

    if (payload !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const request = requestFactory(
      options.url,
      {
        method: options.method,
        headers,
        signal: abortController.signal,
      },
      (response) => {
        let bodyText = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          bodyText += chunk;
        });
        response.on("end", () => {
          clearTimeout(timeout);
          resolve({
            statusCode: response.statusCode ?? 0,
            bodyText,
          });
        });
      },
    );

    request.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    if (payload !== undefined) {
      request.write(payload);
    }

    request.end();
  });

function selectRequestFactory(url: URL): typeof httpRequest | typeof httpsRequest | null {
  if (url.protocol === "http:") {
    return httpRequest;
  }

  if (url.protocol === "https:") {
    return httpsRequest;
  }

  return null;
}
