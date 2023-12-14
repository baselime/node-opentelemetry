import {
    DetectorSync,
    Resource,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';
import {
    SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';

type ServiceDetectorConfig = {
    serviceName?: string, 
}

export class ServiceDetector implements DetectorSync {
    serviceName?: string;
    constructor(config?: ServiceDetectorConfig) {
        this.serviceName = config?.serviceName || process.env.OTEL_SERVICE_NAME;
    }
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!this.serviceName) {
            return Resource.empty();
        }

        const attributes = {
            'service.name': this.serviceName,
            'service.namespace': this.serviceName,
        }

        return new Resource(attributes);
    }
}