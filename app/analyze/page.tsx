'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

const LINES_TEMPLATE = [
    '> INITIALIZING SECURE CONNECTION TO LINKEDIN NODE...',
    '> HANDSHAKE ESTABLISHED.',
    '> LOCATING PROFILE: [ {USERNAME} ]',
    '> EXTRACTING EXPERIENCE & EDUCATION DATA...',
    '> DOWNLOADING SKILL ENDORSEMENTS...',
    '> CROSS-REFERENCING WITH GLOBAL JOB MARKET DB...',
    '> APPLYING MATCHING ALGORITHM (v3.0)...',
    '> GENERATING VISUAL MIND MAP...',
    '> CALCULATING PROFILE STRENGTH SCORE...',
    '> EXTRACTION COMPLETE. PREPARING DASHBOARD...',
];

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get('url') || '';
    const termRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<string[]>([]);
    const [status, setStatus] = useState<'extracting' | 'done' | 'error'>('extracting');
    const [errorMsg, setErrorMsg] = useState('');
    const calledRef = useRef(false);

    // Extract username for display in terminal
    const match = url.match(/in\/([^/]+)/);
    const displayName = match
        ? match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'User';

    useEffect(() => {
        if (!url || calledRef.current) return;
        calledRef.current = true;

        const terminalLines = LINES_TEMPLATE.map((l) =>
            l.replace('{USERNAME}', displayName.toUpperCase())
        );

        // Start the terminal typing animation
        let i = 0;
        const addLine = () => {
            if (i < terminalLines.length) {
                setLines((prev) => [...prev, terminalLines[i]]);
                i++;
                setTimeout(addLine, Math.random() * 300 + 150);
            }
        };
        addLine();

        // In parallel, make the actual API call
        fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    // Store the real extracted data in sessionStorage
                    sessionStorage.setItem('careeros_profile', JSON.stringify(result.data));
                    setStatus('done');
                } else {
                    setErrorMsg(result.error || 'Unknown error');
                    setStatus('error');
                }
            })
            .catch(() => {
                setErrorMsg('Network error. Please try again.');
                setStatus('error');
            });
    }, [url, displayName]);

    // Redirect once terminal is done AND data is ready
    useEffect(() => {
        if (status === 'done' && lines.length >= LINES_TEMPLATE.length) {
            setTimeout(() => {
                router.push(`/dashboard?url=${encodeURIComponent(url)}`);
            }, 800);
        }
        if (status === 'error' && lines.length >= LINES_TEMPLATE.length) {
            setLines((prev) => [
                ...prev,
                '',
                `> ERROR: ${errorMsg}`,
                '> FALLING BACK TO DEMO DATA...',
            ]);
            setTimeout(() => {
                router.push(`/dashboard?url=${encodeURIComponent(url)}&demo=true`);
            }, 1500);
        }
    }, [status, lines.length, url, errorMsg, router]);

    // Auto-scroll terminal
    useEffect(() => {
        if (termRef.current) {
            termRef.current.scrollTop = termRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <body className="terminal-page">
            <div className="scanlines" aria-hidden="true" />
            <div className="noise" aria-hidden="true" />
            <div className="terminal-container">
                <div className="terminal-window">
                    <div className="terminal-header">
                        <div className="term-dots">
                            <span /><span /><span />
                        </div>
                        <div className="term-title">careeros_extraction_node.exe</div>
                    </div>
                    <div className="terminal-body font-mono" id="terminalOutput" ref={termRef}>
                        {lines.map((line, i) => (
                            <div key={i} style={{ color: line.startsWith('> ERROR') ? 'var(--rose)' : undefined }}>
                                {line}
                            </div>
                        ))}
                        {status === 'extracting' && lines.length > 0 && (
                            <div style={{ color: 'var(--amber)' }}>▊</div>
                        )}
                    </div>
                </div>
            </div>
        </body>
    );
}

export default function AnalyzePage() {
    return (
        <Suspense fallback={<body className="terminal-page"><div className="terminal-container"><p className="font-mono" style={{ color: 'var(--emerald)' }}>Loading...</p></div></body>}>
            <AnalyzeContent />
        </Suspense>
    );
}
