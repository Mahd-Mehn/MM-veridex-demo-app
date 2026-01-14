'use client';

/**
 * Veridex Auth Portal Page
 * 
 * This page handles cross-origin authentication for third-party apps.
 * It should be deployed at auth.veridex.network (or any subdomain of veridex.network).
 * 
 * Flow:
 * 1. Third-party app opens this page in a popup or redirects here
 * 2. User authenticates with their Veridex passkey
 * 3. Page sends the session back to the third-party app
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    PasskeyManager,
    sendAuthResponse,
    sendAuthError,
    type PasskeyCredential,
    type WebAuthnSignature,
    type CrossOriginSession,
} from '@veridex/sdk';

interface AuthState {
    status: 'loading' | 'ready' | 'authenticating' | 'success' | 'error';
    error?: string;
    origin?: string;
    mode?: 'popup' | 'redirect';
}

function AuthContent() {
    const searchParams = useSearchParams();
    const [state, setState] = useState<AuthState>({ status: 'loading' });
    
    // Parse URL parameters
    const origin = searchParams.get('origin') || '';
    const redirectUri = searchParams.get('redirect_uri') || '';
    const callbackMode = searchParams.get('callback') || 'redirect';
    const stateParam = searchParams.get('state') || '';
    
    useEffect(() => {
        // Validate origin
        if (!origin) {
            setState({ 
                status: 'error', 
                error: 'Missing origin parameter',
            });
            return;
        }
        
        setState({ 
            status: 'ready',
            origin,
            mode: callbackMode === 'postMessage' ? 'popup' : 'redirect',
        });
    }, [origin, callbackMode]);
    
    const handleAuthenticate = async () => {
        setState(prev => ({ ...prev, status: 'authenticating' }));
        
        try {
            // Create PasskeyManager with veridex.network as rpId
            const manager = new PasskeyManager({
                rpId: 'veridex.network',
                rpName: 'Veridex Protocol',
            });
            
            // Authenticate using discoverable credentials
            const result = await manager.authenticate();
            
            // Create session object
            const session: CrossOriginSession = {
                address: computeVaultAddress(result.credential),
                sessionPublicKey: '', // Would be generated for session key flow
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                signature: result.signature,
                credential: result.credential,
            };
            
            // Send response back to calling app
            if (callbackMode === 'postMessage') {
                sendAuthResponse(session, origin);
            } else if (redirectUri) {
                // Redirect with session
                const url = new URL(redirectUri);
                url.searchParams.set('session', btoa(JSON.stringify(session)));
                url.searchParams.set('state', stateParam);
                window.location.href = url.toString();
            }
            
            setState(prev => ({ ...prev, status: 'success' }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            setState(prev => ({ ...prev, status: 'error', error: message }));
            
            // Send error back
            if (callbackMode === 'postMessage') {
                sendAuthError(message, 'AUTH_FAILED', origin);
            } else if (redirectUri) {
                const url = new URL(redirectUri);
                url.searchParams.set('error', message);
                url.searchParams.set('state', stateParam);
                window.location.href = url.toString();
            }
        }
    };
    
    const handleCancel = () => {
        if (callbackMode === 'postMessage') {
            sendAuthError('User cancelled', 'USER_CANCELLED', origin);
            window.close();
        } else if (redirectUri) {
            const url = new URL(redirectUri);
            url.searchParams.set('error', 'User cancelled');
            url.searchParams.set('state', stateParam);
            window.location.href = url.toString();
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Veridex Authentication</h1>
                    <p className="text-gray-400 mt-2">Sign in with your passkey</p>
                </div>
                
                {/* Origin Info */}
                {state.origin && (
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-400 mb-1">Connecting to:</p>
                        <p className="text-white font-mono text-sm break-all">{state.origin}</p>
                    </div>
                )}
                
                {/* Status Content */}
                {state.status === 'loading' && (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading...</p>
                    </div>
                )}
                
                {state.status === 'ready' && (
                    <div className="space-y-4">
                        <button
                            onClick={handleAuthenticate}
                            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                            Sign in with Passkey
                        </button>
                        
                        <button
                            onClick={handleCancel}
                            className="w-full py-3 px-6 bg-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-600 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                
                {state.status === 'authenticating' && (
                    <div className="text-center py-8">
                        <div className="animate-pulse">
                            <svg className="w-16 h-16 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        </div>
                        <p className="text-white mt-4">Waiting for passkey...</p>
                        <p className="text-gray-400 text-sm mt-2">Use your fingerprint, face, or PIN</p>
                    </div>
                )}
                
                {state.status === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-white mt-4">Authentication successful!</p>
                        <p className="text-gray-400 text-sm mt-2">Returning to app...</p>
                    </div>
                )}
                
                {state.status === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-white mt-4">Authentication failed</p>
                        <p className="text-red-400 text-sm mt-2">{state.error}</p>
                        
                        <button
                            onClick={() => setState(prev => ({ ...prev, status: 'ready' }))}
                            className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                )}
                
                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                    <p className="text-gray-500 text-xs">
                        Powered by Veridex Protocol
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                        Your passkey never leaves your device
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper function to compute vault address from credential
function computeVaultAddress(credential: PasskeyCredential): string {
    // This is a placeholder - in production, you'd compute the actual vault address
    // using the credential's public key and the CREATE2 formula
    return `0x${credential.keyHash.slice(0, 40)}`;
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
