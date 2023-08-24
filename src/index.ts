import { NodeSDK } from '@opentelemetry/sdk-node'
import { detectResourcesSync, Resource } from '@opentelemetry/resources';
import { awsEc2Detector, awsEcsDetector } from '@opentelemetry/resource-detector-aws'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { InstrumentationOption } from '@opentelemetry/instrumentation';

type BaselimeSDKOpts = {
    instrumentations: InstrumentationOption[],
    collectorUrl?: string,
    baselimeKey?: string,
    service?: string,
    namespace?: string,
}

const resource = detectResourcesSync({
    detectors: [awsEcsDetector, awsEc2Detector],
});

enum CompressionAlgorithm {
    GZIP = "gzip",
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
 * 
 */
export class BaselimeSDK extends NodeSDK {
    constructor(options: BaselimeSDKOpts) {

        const collectorURL = options.collectorUrl || process.env.COLLECTOR_URL || "https://otel.baselime.io/v1";

        const key = options.baselimeKey || process.env.BASELIME_KEY;

        if (!key) {
            throw Error(`Please ensure that the BASELIME_KEY environment variable is set.`)
        }

        if (options.service) {
            resource.merge(new Resource({ '$baselime.service': options.service }));
        }

        if (options.namespace) {
            resource.merge(new Resource({ '$baselime.namespace': options.namespace }))
        }
        super({
            resource,
            traceExporter: new OTLPTraceExporter({
                url: collectorURL,
                compression: CompressionAlgorithm.GZIP,
                headers: {
                    "x-api-key": key,
                },
            }),
            instrumentations: [...options.instrumentations]
        })
    }
}