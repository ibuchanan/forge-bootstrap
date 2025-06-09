export interface Context {
  cloudId: string; // The cloud ID.
  moduleKey: string; // The key identifying the module in the manifest that defines the scheduled trigger function and its frequency.
}

export interface Request {
  context: Context; // Properties identifying this scheduled trigger to Atlassian
  contextToken: string; // An encoded token used by Atlassian to identify the scheduled trigger invocation. This value has no meaning to an app.
}

export interface Response {
  body: string; // HTTP response body sent back to the caller.
  headers: { [key: string]: string[] }; // HTTP headers sent by the caller.
  statusCode: number; // HTTP status code returned to the caller.
  // The platform recognizes a status code of 204 as success, and status codes in the 500 series as errors.
  statusText: string; // Text returned to communicate status. The text provides context to the status code.
}

function buildResponse(
  message = "OK",
  statusCode = 200,
  statusText = "OK",
): Response {
  return {
    body: JSON.stringify({ message: message }),
    headers: { "Content-Type": ["application/json"] },
    statusCode: statusCode,
    statusText: statusText,
  };
}

export async function trigger(req: Request): Promise<Response> {
  console.debug(
    `Context token (invocation identification) for invocation of jira/touch: ${req.contextToken}`,
  );
  // TODO: wire up to the functions that would be invoked by scheduled triggers
  const res: Response = buildResponse();
  console.debug(`response: ${JSON.stringify(res)}`);
  return res;
}
