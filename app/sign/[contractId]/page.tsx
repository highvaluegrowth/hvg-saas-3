'use client';

import { use, useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

interface ContractData {
  id: string;
  residentName: string;
  residentEmail: string;
  templateTitle: string;
  status: 'pending' | 'signed' | 'voided';
  signedAt?: string;
  pdfUrl?: string;
}

export default function SignContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);

  const [contract, setContract] = useState<ContractData | null>(null);
  const [templateBody, setTemplateBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  // Load contract
  useEffect(() => {
    fetch(`/api/contracts/${contractId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? 'Contract not found');
        return res.json();
      })
      .then((data) => {
        setContract(data.contract);
        setTemplateBody(data.templateBody ?? '');
        if (data.contract.status === 'signed') {
          setSigned(true);
          setSignedPdfUrl(data.contract.pdfUrl ?? null);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [contractId]);

  // Init SignaturePad after agreeing
  useEffect(() => {
    if (!agreed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    // Resize canvas to its display size
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')!.scale(ratio, ratio);
      padRef.current?.clear();
    };
    resize();
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(30, 30, 30)',
    });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      padRef.current?.off();
    };
  }, [agreed]);

  async function handleSign() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setSigError('Please draw your signature before submitting.');
      return;
    }
    setSigError(null);
    setSigning(true);
    try {
      const signatureDataUrl = padRef.current.toDataURL('image/png');
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl,
          residentName: contract?.residentName,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Signing failed');
      const data = await res.json();
      setSigned(true);
      setSignedPdfUrl(data.pdfUrl ?? null);
    } catch (err) {
      setSigError(err instanceof Error ? err.message : 'Signing failed. Please try again.');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Contract Not Found</h1>
          <p className="text-gray-500 text-sm">{error ?? 'This signing link may have expired or been voided.'}</p>
        </div>
      </div>
    );
  }

  if (contract.status === 'voided') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-4xl mb-4">🚫</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">This contract has been voided</h1>
          <p className="text-gray-500 text-sm">Please contact your house manager for a new signing link.</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed ✓</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your signed copy of <strong>{contract.templateTitle}</strong> has been saved.
          </p>
          {signedPdfUrl && (
            <a
              href={signedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              📄 Download Signed PDF
            </a>
          )}
          <p className="text-xs text-gray-400 mt-6">
            Powered by High Value Growth · hvg.app
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-3">
            Electronic Signature Required
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{contract.templateTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Prepared for <strong>{contract.residentName}</strong>
          </p>
        </div>

        {/* Contract Body */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 max-h-[50vh] overflow-y-auto">
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: templateBody }}
          />
        </div>

        {/* Agreement checkbox */}
        {!agreed ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">
                I have read and understand the contents of this agreement. I agree to all terms and conditions
                stated above and consent to signing electronically.
              </span>
            </label>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Draw Your Signature</h2>
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            </div>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white" style={{ height: 160 }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Sign above using your mouse, trackpad, or finger
            </p>

            {sigError && (
              <p className="text-sm text-red-600">{sigError}</p>
            )}

            <button
              onClick={handleSign}
              disabled={signing}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {signing ? 'Submitting…' : 'I Agree & Sign Document →'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By clicking above, you are signing this document electronically. This constitutes a legally binding signature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
