import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getLocal, completionCheckers, MockedEndpoint, CompletedRequest } from 'mockttp';
import { BaselimeSDK } from "../src/index";
import { trace } from "@opentelemetry/api"
import { getSpans, waitForCollector } from './utils/otel';

describe("Test BaselimeSDK for opentelemetry", async () => {

    const mockServer = getLocal();
    beforeEach(() => mockServer.start())
    afterEach(() => mockServer.stop())


    it("Traces are recieved", async () => {
        const collector = await mockServer.forAnyRequest().once().thenReply(200, "Ok");
        const baselimeKey = "love is magic"
        const sdk = new BaselimeSDK({
            collectorUrl: mockServer.url,
            serverless: true,
            baselimeKey: baselimeKey,
            service: "my_service",
            namespace: "my_namespace"
        })

        sdk.start();

        // Create a span

        const span = trace.getTracer("test").startSpan("test");


        span.end();


        const [request] = await waitForCollector(collector)

        expect(request.headers["x-api-key"]).toBe(baselimeKey);
        

        const { resourceSpans: [serialisedSpan]} = getSpans(request)

        console.log(JSON.stringify(serialisedSpan, null, 2))
        expect(serialisedSpan.resource.attributes.find((attr) => attr.key === "$baselime.service")?.value.stringValue).toBe("my_service");
        expect(serialisedSpan.resource.attributes.find((attr) => attr.key === "$baselime.namespace")?.value.stringValue).toBe("my_namespace")
    })
});