'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
    value: string;
    size?: number;
    title?: string;
}

export function QRCodeDisplay({ value, size = 200, title }: QRCodeDisplayProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!value) return;

        QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        })
            .then(setQrDataUrl)
            .catch((err) => setError(err.message));
    }, [value, size]);

    if (error) {
        return (
            <div className="flex items-center justify-center bg-red-500/10 rounded-lg p-4">
                <span className="text-red-400 text-sm">Failed to generate QR code</span>
            </div>
        );
    }

    if (!qrDataUrl) {
        return (
            <div 
                className="flex items-center justify-center bg-white/5 rounded-lg animate-pulse"
                style={{ width: size, height: size }}
            >
                <span className="text-gray-400 text-sm">Loading...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            {title && (
                <h4 className="text-sm font-medium text-gray-300">{title}</h4>
            )}
            <div className="bg-white p-3 rounded-xl">
                <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
            </div>
        </div>
    );
}

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
    chainName: string;
    onCopy: () => void;
    /** Whether this is a Solana chain */
    isSolana?: boolean;
}

export function ReceiveModal({ isOpen, onClose, address, chainName, onCopy, isSolana = false }: ReceiveModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
    }, [address, onCopy]);

    const openExplorer = useCallback(() => {
        if (isSolana) {
            window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, '_blank');
        }
    }, [address, isSolana]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className={`relative rounded-2xl p-6 max-w-md w-full mx-4 border shadow-2xl ${
                isSolana 
                    ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500/30' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border-white/10'
            }`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    {isSolana && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">SOL</span>
                        </div>
                    )}
                    <h3 className="text-xl font-bold text-white">Receive Funds</h3>
                </div>
                <p className={`text-sm mb-6 ${isSolana ? 'text-purple-200' : 'text-gray-400'}`}>
                    {isSolana 
                        ? 'Scan this QR code or copy the address to receive SOL on Solana Devnet'
                        : `Scan this QR code or copy the address to receive funds on ${chainName}`
                    }
                </p>

                <div className="flex justify-center mb-6">
                    <QRCodeDisplay value={address} size={180} />
                </div>

                <div className={`rounded-xl p-4 mb-4 ${isSolana ? 'bg-black/30' : 'bg-white/5'}`}>
                    <p className={`text-xs mb-1 ${isSolana ? 'text-purple-300' : 'text-gray-400'}`}>
                        {isSolana ? 'Solana Vault Address (PDA)' : 'Your Vault Address'}
                    </p>
                    <p className="text-white font-mono text-sm break-all">{address}</p>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleCopy}
                        className={`flex-1 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            isSolana 
                                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        }`}
                    >
                        {copied ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Address
                            </>
                        )}
                    </button>
                    {isSolana && (
                        <button
                            onClick={openExplorer}
                            className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center justify-center"
                            title="View on Explorer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className={`text-xs text-center ${isSolana ? 'text-purple-300/70' : 'text-gray-500'}`}>
                    {isSolana 
                        ? 'This address can receive native SOL and SPL tokens on Solana Devnet'
                        : `Only send supported tokens to this address on ${chainName}`
                    }
                </p>
            </div>
        </div>
    );
}
