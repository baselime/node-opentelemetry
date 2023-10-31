import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import { captureBody } from "../src/http-plugins/captureBody";
import { getLocal, completionCheckers, MockedEndpoint, CompletedRequest } from 'mockttp';
import { URL } from "url";
import { Client } from "undici";
import { BaselimeSDK } from "../src";
import { trace } from "@opentelemetry/api";
import { waitForCollector } from "./utils/otel";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ClientRequest } from "http";


describe("Test BaselimeSDK for opentelemetry", () => {

    const mockServer = getLocal({ debug: true });
    beforeEach(() => mockServer.start())
    afterEach(() => mockServer.stop())

    it.skip("Capture Request bodies", async (t) => {
        const mocked = await mockServer.forAnyRequest().once().thenReply(200, "Ok");
        console.log('hi')
        const postData = JSON.stringify({
            'msg': 'Hello World!',
        });

        const url = new URL(mockServer.url);

        const options = {
            hostname: url.hostname,
            port: mockServer.port,
            path: '/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const clientRequest = new ClientRequest(options);


        clientRequest.write(postData);

        console.log('waiting for data')
        clientRequest.on('data', (d) => {
            console.log('data', d)
        })
        await new Promise((resolve) => setTimeout(resolve, 1000))
        clientRequest.end();
        clientRequest.on('end', (d) => {
            console.log('end', d)
        })

        // expect(requests).toMatchInlineSnapshot('[]');
        // const body = await captureBody(clientRequest);


        await new Promise((resolve) => setTimeout(resolve, 1000))

        // expect(body).toBe("Hello World");

    });

    it.skip('Instrument Req Body', async () => {
        const collector = await mockServer.forAnyRequest().twice().thenReply(200, "Ok");
        const baselimeKey = "love is magic"
        const sdk = new BaselimeSDK({
            collectorUrl: mockServer.url,
            serverless: true,
            baselimeKey: baselimeKey,
            instrumentations: [
                new HttpInstrumentation({
                    requestHook: async (span, request) => {
                        console.log(request)
                        if (request instanceof ClientRequest) {
                            const body = await captureBody(request);
                            span.setAttribute('body', body)
                            return
                        }
                    },
                })
            ]
        })

        sdk.start();

        const span = await trace.getTracer("test").startActiveSpan("test", async (span) => {
            const postData = JSON.stringify({
                'msg': 'Hello World!',
            });

            const url = new URL(mockServer.url);

            const options = {
                hostname: url.hostname,
                port: mockServer.port,
                path: '/upload',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };
            const { request } = await import('http');
            const req = request(options, () => span.end());

            req.write(postData)
            req.end();
        });



        const [data, spans] = await waitForCollector(collector)
        console.log(JSON.stringify(await data.body.getJson(), null, 2))
        console.log(JSON.stringify(await spans.body.getJson(), null, 2))
        expect(spans.headers["x-api-key"]).toBe(baselimeKey);
    })
});
