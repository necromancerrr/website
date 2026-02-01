import { NextRequest, NextResponse } from 'next/server';

const NEAR_AI_BASE_URL = process.env.NEAR_AI_BASE_URL;
const NEAR_AI_PRIVATE_KEY = process.env.NEAR_AI_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, temperature, max_tokens, stream } = body as {
      messages?: Array<{ role: string; content: string }>;
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const endpoint = `${NEAR_AI_BASE_URL}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEAR_AI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'zai-org/GLM-4.7',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
        stream: stream ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NEAR AI API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get response from NEAR AI', details: errorText },
        { status: response.status }
      );
    }

    if (stream) {
      const reader = response.body?.getReader();
      if (!reader) {
        return NextResponse.json(
          { error: 'Failed to read stream' },
          { status: 500 }
        );
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('NEAR AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
