
export const handler = async (_evt) => {
  console.log(_evt)
  return {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
  };
};
