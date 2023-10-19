import { ClientRequest, IncomingMessage, ServerResponse } from "http";

export class HttpPlugin {
    parseIncommingMessage?(request: IncomingMessage): Record<string, unknown>;
    parseClientRequest?(request: ClientRequest): Record<string, unknown>;
    captureBody = false
    name = 'base-plugin-should-extend'
    constructor() {

    }

    shouldParseRequest(request: ClientRequest | IncomingMessage): boolean {
        return false;
    }
    shouldParseResponse(response: IncomingMessage | ServerResponse<IncomingMessage>): boolean {
        return false
    }
}