import { CompletedRequest, MockedEndpoint } from "mockttp";


export function waitForCollector(collector: MockedEndpoint): Promise<CompletedRequest[]> {
    return new Promise(async (resolve) => {
        let pending = true;
        while (pending) {
            await new Promise((resolve) => setTimeout(resolve, 10))
            pending = await collector.isPending();
        }
        const requests = await collector.getSeenRequests();
        resolve(requests);
    });
}

export type SerialisedSpan = {
    resourceSpans: Array<{
      resource: {
        attributes: Array<{
          key: string
          value: {
            stringValue?: string
            intValue?: number
            arrayValue?: {
              values: Array<{
                stringValue: string
              }>
            }
          }
        }>
        droppedAttributesCount: number
      }
      scopeSpans: Array<{
        scope: {
          name: string
        }
        spans: Array<{
          traceId: string
          spanId: string
          name: string
          kind: number
          startTimeUnixNano: {
            low: number
            high: number
          }
          endTimeUnixNano: {
            low: number
            high: number
          }
          attributes: Array<any>
          droppedAttributesCount: number
          events: Array<any>
          droppedEventsCount: number
          status: {
            code: number
          }
          links: Array<any>
          droppedLinksCount: number
        }>
      }>
    }>
  }
  

export function getSpans(request: CompletedRequest): SerialisedSpan {
    return JSON.parse(request.body.buffer.toString());
}