export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation } = await import('../../dist/index.cjs');
    const sdk = new BaselimeSDK({
      serverless: true,
      service: "your-project-name",
      collectorUrl: "https://otel.baselime.cc/v1",
      instrumentations: [
        // new HttpInstrumentation(),
        new BetterHttpInstrumentation({
          plugins: [
            // Add the Vercel plugin to enable correlation between your logs and traces for projects deployed on Vercel
            new VercelPlugin()
          ]
        }),
      ]
    });

    sdk.start();
  }
}