import { ClientRequest, IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";

export type Plugin = {
    shouldParseRequest?(request: ClientRequest | IncomingMessage): boolean;
    shouldParseResponse?(response: IncomingMessage | ServerResponse<IncomingMessage>): boolean;
    parseIncommingMessage?(request: IncomingMessage): Record<string, unknown>;
    parseClientRequest?(request: ClientRequest): Record<string, unknown>;
    captureBody?: boolean;
    name: string;
}
