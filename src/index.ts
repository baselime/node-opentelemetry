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
 * BaselimeSDK helps to instrument your container applications
 * 
 * ```javascript
 * import { BaselimeSDK } from '@baselime/node-opentelemetry';
 * 
 * const sdk = new BaselimeSDK({ instrumentations: [...]});
 * 
 * sdk.start();
 * ```
 * 
 * Add the instrumentations you want from https://.......
 * 
 * Then add your BASELIME_KEY as an environment variable and start sending data.
 */
export class BaselimeSDK extends NodeSDK {
    constructor(opts: BaselimeSDKOpts) {

        const collectorURL = opts.collectorUrl || process.env.COLLECTOR_URL || "https://otel.baselime.io/v1";

        const key = opts.baselimeKey || process.env.BASELIME_KEY;

        if (!key) {
            throw Error(`Please ensure that the BASELIME_KEY environment variable is set.`)
        }

        if (opts.service) {
            resource.merge(new Resource({ '$baselime.service': opts.service }));
        }

        if (opts.namespace) {
            resource.merge(new Resource({ '$baselime.namespace': opts.namespace }))
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
            instrumentations: [...opts.instrumentations]
        })
    }
}