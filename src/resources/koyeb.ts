import {
    DetectorSync,
    Resource,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';
import {
    SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';

export class KoyebDetector implements DetectorSync {
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!process.env.KOYEB_APP_NAME) {
            return Resource.empty();

        }
        const portProtocols = Object.keys(process.env).filter((key) => key.startsWith('KOYEB_PORT_'));
       
        const protocols = portProtocols.reduce((sum, el) => ({
            ...sum,
            [el.replace('_', '.').toLowerCase()]: process.env[el]
        }), {} as Record<string, string>);

        const attributes = {
            [SemanticResourceAttributes.CLOUD_PROVIDER]: String(
                'Koyeb'
            ),
            [SemanticResourceAttributes.CLOUD_PLATFORM]: String(
                'Koyeb MicroVM'
            ),
            [SemanticResourceAttributes.CLOUD_REGION]: String(process.env.KOYEB_DC),
            'koyeb.app.name': String(process.env.KOYEB_APP_NAME),
            'koyeb.app.id': String(process.env.KOYEB_APP_ID),
            'koyeb.organization.name': String(process.env.KOYEB_ORGANIZATION_NAME),
            'koyeb.organization.id': String(process.env.KOYEB_ORGANIZATION_ID),
            'koyeb.service.name': String(process.env.KOYEB_SERVICE_NAME),
            'koyeb.service.id': String(process.env.KOYEB_SERVICE_ID),
            'koyeb.service.privateDomain': String(process.env.KOYEB_SERVICE_PRIVATE_DOMAIN),
            'koyeb.publicDomain': String(process.env.KOYEB_PUBLIC_DOMAIN),
            'koyeb.region': String(process.env.KOYEB_REGION),
            'koyeb.regionalDeploymentId': String(process.env.KOYEB_REGIONAL_DEPLOYMENT_ID),
            'koyeb.instance.id': String(process.env.KOYEB_INSTANCE_ID),
            'koyeb.instance.type': String(process.env.KOYEB_INSTANCE_TYPE),
            'koyeb.instance.memory': String(process.env.KOYEB_INSTANCE_MEMORY_MB),
            'koyeb.privileged': process.env.KOYEB_PRIVILEGED === 'true',
            'koyeb.hypervisor.id': String(process.env.KOYEB_HYPERVISOR_ID),
            'koyeb.dc': String(process.env.KOYEB_DC),
            'koyeb.docker.ref': String(process.env.KOYEB_DOCKER_REF),
            'koyeb.git.sha': String(process.env.KOYEB_GIT_SHA),
            'koyeb.git.branch': String(process.env.KOYEB_GIT_BRANCH),
            'koyeb.git.commit.author': String(process.env.KOYEB_GIT_COMMIT_AUTHOR),
            'koyeb.git.commit.message': String(process.env.KOYEB_GIT_COMMIT_MESSAGE),
            'koyeb.git.repository': String(process.env.KOYEB_GIT_REPOSITORY),
            ...protocols,

            // SET OTEL SPECIAL ATTRIBUTES
            'service.name': String(process.env.KOYEB_APP_NAME),
            'service.namespace': String(process.env.KOYEB_SERVICE_NAME),
        }


        
        return new Resource(attributes);
    }
}