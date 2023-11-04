import { BatchSpanProcessor, NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { detectResourcesSync, ResourceAttributes } from '@opentelemetry/resources';
import { awsEc2Detector, awsEcsDetector, awsLambdaDetector } from '@opentelemetry/resource-detector-aws'
import { VercelDetector } from './resources/vercel.ts';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { InstrumentationOption, registerInstrumentations } from '@opentelemetry/instrumentation';
import { existsSync } from 'fs';

type BaselimeSDKOpts = {
    instrumentations?: InstrumentationOption[],
    collectorUrl?: string,
    baselimeKey?: string,
    service?: string,
    namespace?: string,
    serverless?: boolean
}


/**
 * BaselimeSDK is a wrapper around the OpenTelemetry NodeSDK that configures it to send traces to Baselime.
 * 
 * @param {BaselimeSDKOpts} options
 * @param {InstrumentationOption[]} options.instrumentations - The OpenTelemetry instrumentations to enable.
 * @param {string} options.collectorUrl - The URL of the Baselime collector. Defaults to https://otel.baselime.io/v1
 * @param {string} options.baselimeKey - The Baselime API key. Defaults to the BASELIME_KEY environment variable.
 * @param {string} options.service - The name of the service. 
 * @param {string} options.namespace - The namespace of the service.
 * @param {boolean} options.serverless - Whether or not the service is running in a serverless environment. Defaults to false.
 * 
 */
export class BaselimeSDK {
    options: BaselimeSDKOpts;
    attributes: ResourceAttributes;
    constructor(options: BaselimeSDKOpts) {
        options.serverless = options.serverless || false;
        options.collectorUrl = options.collectorUrl || process.env.COLLECTOR_URL || "https://otel.baselime.io/v1";
        options.baselimeKey = options.baselimeKey || process.env.BASELIME_API_KEY || process.env.BASELIME_KEY
 

        this.options = options;
    }

    start() {
        if (!this.options.baselimeKey) {
            console.warn('BaselimeSDK: No Baselime API key provided. Traces will not be sent to Baselime.');
            return;
        }

        let collectorUrl = this.options.collectorUrl;


        const provider = new NodeTracerProvider({
            resource: detectResourcesSync({
                detectors: [awsEcsDetector, awsEc2Detector, awsLambdaDetector, new VercelDetector()],
            }),
            forceFlushTimeoutMillis: 500,
        });



        // If the baselime extension is running, we need to use the sandbox collector.
        if (existsSync('/opt/extensions/baselime')) {
            collectorUrl = 'http://sandbox:4323/otel';
        }

        const exporter = new OTLPTraceExporter({
            url: collectorUrl,
            headers: {
                "x-api-key": this.options.baselimeKey || process.env.BASELIME_KEY || process.env.BASELIME_OTEL_KEY,
            },
        });

        const spanProcessor = this.options.serverless ? new SimpleSpanProcessor(exporter) : new BatchSpanProcessor(exporter, {
            maxQueueSize: 100,
            maxExportBatchSize: 5,
        });

        provider.addSpanProcessor(spanProcessor);
        provider.register();

        registerInstrumentations({
            instrumentations: [
                ...this.options.instrumentations || []
            ]
        });
        return provider;
    }
}