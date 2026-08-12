export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface ServiceConnection {
  baseUrl: string;
  token: string;
}

export function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function requiredEnvironment(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalConnection(
  environment: NodeJS.ProcessEnv,
  baseUrlName: string,
  tokenName: string
): ServiceConnection | undefined {
  const baseUrl = environment[baseUrlName];
  const token = environment[tokenName];

  if (Boolean(baseUrl) !== Boolean(token)) {
    throw new Error(`Set both ${baseUrlName} and ${tokenName} to enable this integration.`);
  }

  return baseUrl && token ? { baseUrl: trimTrailingSlash(baseUrl), token } : undefined;
}

export async function parseJsonResponse(response: Response): Promise<JsonValue> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}

export async function fetchGitLab(
  connection: ServiceConnection,
  path: string
): Promise<JsonValue> {
  const response = await fetch(`${connection.baseUrl}${path}`, {
    headers: {
      'PRIVATE-TOKEN': connection.token,
      Accept: 'application/json'
    }
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(`GitLab request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

export async function fetchJira(
  connection: ServiceConnection,
  path: string,
  init?: RequestInit
): Promise<JsonValue> {
  const response = await fetch(`${connection.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${connection.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(`Jira request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

export function jiraCommentRequest(comment: string): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify({ body: comment })
  };
}

export function jiraWorklogRequest(timeSpent: string, comment?: string): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify({
      timeSpent,
      ...(comment ? { comment } : {})
    })
  };
}

export async function fetchBearerApi(
  service: string,
  connection: ServiceConnection,
  path: string
): Promise<JsonValue> {
  const response = await fetch(`${connection.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${connection.token}`,
      Accept: 'application/json'
    }
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(`${service} request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

export function textResult(body: JsonValue) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(body, null, 2) }]
  };
}
