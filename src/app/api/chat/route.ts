import { NextRequest, NextResponse } from "next/server";

const DEBUG = process.env.DEBUG_CHAT === "true";

function log(...args: unknown[]) {
  if (DEBUG) {
    console.log("[CHAT DEBUG]", ...args);
  }
}

function logError(...args: unknown[]) {
  console.error("[CHAT ERROR]", ...args);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  log(`[${requestId}] Incoming request`);

  try {
    const body = await request.json();
    log(`[${requestId}] Raw body keys:`, Object.keys(body));

    let userMessage = "";
    let jobPostingUrl = "";
    let context = "";

    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      const firstMessage = body.messages[0];
      if (firstMessage.parts && Array.isArray(firstMessage.parts)) {
        const textPart = firstMessage.parts.find((part: any) => part.type === "text");
        if (textPart && textPart.text) {
          userMessage = textPart.text;
        }
      }
    } else if (body.message) {
      userMessage = body.message;
    }

    jobPostingUrl = body.jobPostingUrl || body.data?.jobPostingUrl || "";
    context = body.context || body.data?.context || "";

    log(`[${requestId}] Message:`, userMessage);
    log(`[${requestId}] jobPostingUrl:`, jobPostingUrl);

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let jobContent = "";

    if (jobPostingUrl) {
      log(`[${requestId}] Scraping via MCP: ${jobPostingUrl}`);
      try {
        jobContent = await scrapeViaMCP(jobPostingUrl);
        log(`[${requestId}] Job content length:`, jobContent.length);
      } catch (error) {
        logError(`[${requestId}] MCP scrape failed:`, error);
        jobContent = `Could not retrieve job posting content from ${jobPostingUrl}`;
      }
    } else {
      logError("job posting URL not found!")
    }

    const systemPrompt = `You are a helpful career assistant helping users understand job opportunities.

${jobContent ? `Here is the job posting content:\n\n${jobContent}\n\n` : ""}
${context ? `Additional context: ${context}\n\n` : ""}

Provide helpful, accurate information about the job. If you couldn't retrieve the full job posting, suggest visiting the original posting URL.

Keep your responses concise and focused on helping the user understand the role, requirements, and how to apply.`;

    const nearAiBaseUrl = process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1";
    const nearAiApiKey = process.env.NEAR_AI_PRIVATE_KEY;

    if (!nearAiApiKey) {
      return NextResponse.json({ error: "NEAR_AI_PRIVATE_KEY not configured" }, { status: 500 });
    }

    const response = await fetch(`${nearAiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nearAiApiKey}`,
      },
      body: JSON.stringify({
        model: "zai-org/GLM-4.7",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    log(`[${requestId}] AI response status:`, response.status);
    log(`[${requestId}] AI response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      logError(`[${requestId}] NEAR AI API error:`, errorText);
      return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
    }

    const data = await response.json();
    log(`[${requestId}] AI response keys:`, Object.keys(data));
    log(`[${requestId}] AI response preview:`, JSON.stringify(data).slice(0, 500));

    const message = data.choices?.[0]?.message;
    const reply = message?.content || message?.reasoning || "I couldn't generate a response.";
    log(`[${requestId}] Reply:`, typeof reply === "string" ? reply.slice(0, 200) : "object");

    const messageId = crypto.randomUUID();

    return NextResponse.json({
      messages: [
        {
          id: messageId,
          role: "assistant",
          content: typeof reply === "string" ? reply : JSON.stringify(reply),
          parts: [
            {
              type: "text",
              text: typeof reply === "string" ? reply : JSON.stringify(reply),
            },
          ],
        },
      ],
    });
  } catch (error) {
    logError(`[${requestId}] Chat error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function scrapeViaMCP(url: string): Promise<string> {
  const mcpToken = process.env.BRIGHT_DATA_MCP_TOKEN;
  if (!mcpToken) {
    throw new Error("BRIGHT_DATA_MCP_TOKEN not configured");
  }

  const mcpUrl = `https://mcp.brightdata.com/mcp?token=${mcpToken}`;

  const initializeRequest = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "uw-blockchain-chatbot",
        version: "1.0.0"
      }
    }
  };

  log(`[scrapeViaMCP] Sending initialize request...`);

  const initResponse = await fetch(mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify(initializeRequest),
  });

  log(`[scrapeViaMCP] Initialize response status:`, initResponse.status);

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`MCP initialize failed: ${initResponse.status} - ${errorText}`);
  }

  const sessionId = initResponse.headers.get("mcp-session-id");
  log(`[scrapeViaMCP] Session ID from header:`, sessionId);

  if (!sessionId) {
    const rawResponse = await initResponse.text();
    log(`[scrapeViaMCP] Raw response:`, rawResponse.slice(0, 500));

    const dataMatch = rawResponse.match(/data:\s*(\{[^}]+\})/);
    if (dataMatch) {
      try {
        const parsed = JSON.parse(dataMatch[1]);
        if (parsed.result?.sessionId) {
          const newSessionId = parsed.result.sessionId;
          log(`[scrapeViaMCP] Got session ID from body:`, newSessionId);
          return scrapeWithSession(mcpUrl, newSessionId, url);
        }
      } catch (e) {
        log(`[scrapeViaMCP] Failed to parse SSE data:`, e);
      }
    }
    throw new Error("No session ID in MCP initialize response");
  }

  return scrapeWithSession(mcpUrl, sessionId, url);
}

async function scrapeWithSession(mcpUrl: string, sessionId: string, url: string): Promise<string> {
  const toolRequest = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name: "scrape_as_markdown",
      arguments: { url }
    }
  };

  log(`[scrapeViaMCP] Sending tool call with session:`, sessionId);

  const toolResponse = await fetch(mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Mcp-Session-Id": sessionId
    },
    body: JSON.stringify(toolRequest),
  });

  log(`[scrapeViaMCP] Tool response status:`, toolResponse.status);

  if (!toolResponse.ok) {
    const errorText = await toolResponse.text();
    throw new Error(`MCP tool call failed: ${toolResponse.status} - ${errorText}`);
  }

  const contentType = toolResponse.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    const rawResponse = await toolResponse.text();
    log(`[scrapeViaMCP] SSE response length:`, rawResponse.length);

    const result = parseSSEData(rawResponse);
    if (result) {
      return result;
    }
    return rawResponse;
  }

  const toolData = await toolResponse.json();
  log(`[scrapeViaMCP] Tool response:`, JSON.stringify(toolData).slice(0, 500));

  if (toolData.error) {
    throw new Error(`MCP error: ${toolData.error.message}`);
  }

  if (toolData.result?.content && Array.isArray(toolData.result.content)) {
    const textContent = toolData.result.content.find((c: any) => c.type === "text");
    if (textContent) {
      return textContent.text;
    }
  }

  return JSON.stringify(toolData.result);
}

function parseSSEData(raw: string): string | null {
  const lines = raw.split("\n");
  let currentData = "";
  let inDataBlock = false;

  for (const line of lines) {
    if (line.startsWith("data:")) {
      inDataBlock = true;
      currentData = line.slice(5).trim();
    } else if (inDataBlock) {
      if (line === "" || line.startsWith("event:") || line.startsWith("id:")) {
        inDataBlock = false;
        if (currentData) {
          try {
            const parsed = JSON.parse(currentData);
            if (parsed.result?.content && Array.isArray(parsed.result.content)) {
              const textContent = parsed.result.content.find((c: any) => c.type === "text");
              if (textContent) {
                return textContent.text;
              }
            }
            if (parsed.result) {
              return JSON.stringify(parsed.result, null, 2);
            }
          } catch (e) {
            log(`[parseSSEData] Failed to parse:`, e);
          }
        }
        currentData = "";
      } else {
        currentData += "\n" + line;
      }
    }
  }

  if (currentData) {
    try {
      const parsed = JSON.parse(currentData);
      if (parsed.result?.content && Array.isArray(parsed.result.content)) {
        const textContent = parsed.result.content.find((c: any) => c.type === "text");
        if (textContent) {
          return textContent.text;
        }
      }
      if (parsed.result) {
        return JSON.stringify(parsed.result, null, 2);
      }
    } catch (e) {
      log(`[parseSSEData] Final parse failed:`, e);
    }
  }

  return null;
}
