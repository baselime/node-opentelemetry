import { ClientRequest, IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Plugin } from "./plugin.ts";

export const VercelPlugin: Plugin = {
    name: 'vercel',
    shouldParseRequest(request: ClientRequest | IncomingMessage): boolean {
       
        if (request instanceof IncomingMessage && request.headers['x-vercel-id']) {
            return true;
        }
        return false;
    },

    parseIncommingMessage(request: IncomingMessage) {

        const headers = request.headers;
        const vercelRequestId = headers['x-vercel-id'];

        if (typeof vercelRequestId === "string") {
            const requestIdParts = vercelRequestId.split("::");
            const requestId = requestIdParts[requestIdParts.length - 1];
            const user = {
                ip: headers['x-forwarded-for'],
                country: headers['x-vercel-ip-country'],
                region: headers['x-vercel-ip-region'],
                city: headers['x-vercel-ip-city'],
                latitude: headers['x-vercel-ip-latitude'],
                longitude: headers['x-vercel-ip-longitude'],
                timezone: headers['x-vercel-ip-timezone'],
            }
            return {
                requestId: requestId,
                faas: { execution: requestId },
                user
            }
        }
    }
}