import { Span } from "@opentelemetry/api";
import { ClientRequest, IncomingHttpHeaders, IncomingMessage } from "http";
import { Plugin } from "./http-plugins/plugin.ts";
import { flatten } from "flat";


type BetterHttpInstrumentationOptions = {
    plugins: Plugin[],
}

function captureBody(request: ClientRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: string[] = [];
        const oldWrite = request.write.bind(request);
        const oldEnd = request.end.bind(request);
        request.on('data', chunk => {
            chunks.push(decodeURIComponent(chunk.toString()))
            return oldWrite(chunk);
        });
        request.on('end', (chunk) => {
            if (chunk) {
                chunks.push(decodeURIComponent(chunk.toString()));
            }
            oldEnd(chunk);
            return resolve(chunks.join(''))
        });
    });
}

export function betterHttpInstrumentation (options: BetterHttpInstrumentationOptions) {
    return {
        requestHook (span: Span, request: ClientRequest | IncomingHttpHeaders) {
            if (request instanceof ClientRequest) {
                const plugin = options.plugins.find(plugin => plugin.shouldParseRequest && plugin.shouldParseRequest(request));

                if (plugin.captureBody) {
                    captureBody(request).then(body => {
                        span.setAttributes(flatten({ body }));
                    })
                }
            }
            if (request instanceof IncomingMessage) {
                const plugin = options.plugins.find(plugin => plugin.shouldParseRequest && plugin.shouldParseRequest(request));

                span.setAttribute('http.plugin.name', plugin.name);

                if (plugin.parseIncommingMessage) {
                    const attributes = plugin.parseIncommingMessage(request);
                    span.setAttributes(flatten(attributes));
                }
            }
        }
    }
}
        