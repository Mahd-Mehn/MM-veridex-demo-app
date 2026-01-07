/**
 * Relayer Proxy API Route
 * 
 * Proxies all requests to the Veridex relayer backend.
 * This hides the actual relayer URL from the browser's Network tab.
 * 
 * Users see: POST /api/relayer/aptos/vault
 * Actually calls: POST https://<koyeb-url>/api/v1/aptos/vault
 */

import { NextRequest, NextResponse } from 'next/server';

// Get relayer URL from server-side env (not exposed to client)
const RELAYER_URL = process.env.RELAYER_BACKEND_URL || process.env.NEXT_PUBLIC_RELAYER_URL || 'https://amused-kameko-veridex-demo-37453117.koyeb.app';

// Headers to forward from client request
const FORWARDED_HEADERS = ['content-type', 'accept', 'x-api-key', 'authorization'];

// Headers to forward from relayer response
const RESPONSE_HEADERS = ['content-type', 'x-request-id'];

async function proxyRequest(
  request: NextRequest,
  method: string,
  pathSegments: string[]
): Promise<NextResponse> {
  // Join path segments and strip any leading 'api/v1' since we add it ourselves
  let path = pathSegments.join('/');
  
  // Handle case where SDK sends /api/relayer/api/v1/... (strip duplicate api/v1)
  if (path.startsWith('api/v1/')) {
    path = path.slice(7); // Remove 'api/v1/'
  } else if (path.startsWith('api/v1')) {
    path = path.slice(6); // Remove 'api/v1' (no trailing slash)
  }
  
  const targetUrl = `${RELAYER_URL}/api/v1/${path}`;
  
  // Debug logging (only in dev)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Relayer Proxy] ${method} ${targetUrl}`);
  }

  // Create abort controller for timeout (30s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Build headers to forward
    const headers: Record<string, string> = {};
    for (const header of FORWARDED_HEADERS) {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    }

    // Forward query params
    const url = new URL(request.url);
    const targetWithParams = new URL(targetUrl);
    url.searchParams.forEach((value, key) => {
      targetWithParams.searchParams.set(key, value);
    });

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const body = await request.json();
          fetchOptions.body = JSON.stringify(body);
        } catch {
          // Empty body is OK for some requests
        }
      } else {
        fetchOptions.body = await request.text();
      }
    }

    // Make the proxied request
    const response = await fetch(targetWithParams.toString(), fetchOptions);
    
    // Clear timeout on success
    clearTimeout(timeoutId);

    // Build response headers
    const responseHeaders: Record<string, string> = {};
    for (const header of RESPONSE_HEADERS) {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
      }
    }

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let body: string | object;

    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
    } else {
      body = await response.text();
    }

    // Return proxied response
    return NextResponse.json(
      typeof body === 'string' ? { data: body } : body,
      {
        status: response.status,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Better error messages
    let errorMessage = 'Relayer request failed';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Relayer request timed out';
        errorDetails = 'Request took longer than 30 seconds';
      } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot reach relayer service';
        errorDetails = `Network error: ${error.message}`;
      } else {
        errorDetails = error.message;
      }
    }
    
    console.error(`[Relayer Proxy] Error proxying to ${targetUrl}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        targetUrl: process.env.NODE_ENV === 'development' ? targetUrl : undefined,
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'GET', path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'POST', path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PUT', path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'DELETE', path);
}
