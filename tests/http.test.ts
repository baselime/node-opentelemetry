import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getLocal, completionCheckers, MockedEndpoint, CompletedRequest } from 'mockttp';
import { BaselimeSDK, betterHttpInstrumentation } from "../src/index";
import { trace } from "@opentelemetry/api"
import { getSpans, waitForCollector } from './utils/otel';
import { VercelPlugin } from '../src/http-plugins/vercel';
import { request } from 'undici';

describe("Test BaselimeSDK for opentelemetry", async () => {

    const mockServer = getLocal();
    beforeEach(() => mockServer.start())
    afterEach(() => mockServer.stop())


    it.skip("HTTP Vercel HEADERS!", async () => {
        const collector = await mockServer.forAnyRequest().once().thenReply(200, "Ok");

        const vercelServer = getLocal();
        await vercelServer.start();
        const fakeVercel = await vercelServer.forAnyRequest().once().thenReply(200, "Ok");
        const baselimeKey = "love is magic"
        const sdk = new BaselimeSDK({
            collectorUrl: mockServer.url,
            serverless: true,
            baselimeKey: baselimeKey,
            instrumentations: [
               
            ]
        })

        sdk.start();

        // Create a span
        await request(vercelServer.url, {
            headers: {
                'x-vercel-id': 'test::test::test',
            }
        })


        const [traceRequest] = await waitForCollector(collector)

        expect(traceRequest.headers["x-api-key"]).toBe(baselimeKey);
        

        const { resourceSpans: [serialisedSpan]} = getSpans(traceRequest)

        console.log(JSON.stringify(serialisedSpan, null, 2))
        expect(serialisedSpan.resource.attributes.find((attr) => attr.key === "$baselime.service")?.value.stringValue).toBe("my_service");
        expect(serialisedSpan.resource.attributes.find((attr) => attr.key === "$baselime.namespace")?.value.stringValue).toBe("my_namespace")
    })
});