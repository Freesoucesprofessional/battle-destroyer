import React, { useEffect, useRef, useState } from 'react';

export default function TurnstileWidget({ onVerify, onExpire, onError }) {
    const containerRef = useRef(null);
    const widgetId     = useRef(null);
    const [ready, setReady] = useState(false);

    // ── Store callbacks in refs so the widget effect never re-runs when the
    //    parent passes a new function reference (even after re-renders).
    //    This is the root cause of the blinking on Vercel.
    const onVerifyRef  = useRef(onVerify);
    const onExpireRef  = useRef(onExpire);
    const onErrorRef   = useRef(onError);

    // Keep refs in sync with latest props without triggering re-renders
    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
    useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

    // ── Wait for Cloudflare's script to load ──────────────────────────────────
    useEffect(() => {
        // Already loaded (e.g. hot reload)
        if (window.turnstile) { setReady(true); return; }

        const interval = setInterval(() => {
            if (window.turnstile) {
                setReady(true);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []); // ← runs once, no deps

    // ── Render the widget exactly once when ready ─────────────────────────────
    useEffect(() => {
        // Not ready yet, container not mounted, or already rendered
        if (!ready || !containerRef.current || widgetId.current !== null) return;

        // Small defer so the DOM is fully painted before Turnstile measures it
        const timer = setTimeout(() => {
            try {
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
                    theme:   'dark',
                    retry:   'auto',

                    // Use ref wrappers — these closures never go stale and
                    // never cause the effect to re-run
                    callback: (token) => {
                        onVerifyRef.current?.(token);
                    },
                    'expired-callback': () => {
                        onExpireRef.current?.();
                    },
                    'error-callback': () => {
                        onErrorRef.current?.();
                    },
                });
            } catch (e) {
                console.warn('Turnstile render error:', e);
            }
        }, 200);

        // Cleanup: remove widget when component unmounts
        return () => {
            clearTimeout(timer);
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.remove(widgetId.current); } catch {}
                widgetId.current = null;
            }
        };
    }, [ready]); // ← ONLY depends on `ready` — never on callback props

    return (
        <div className="my-2">
            {!ready && (
                <div className="text-gray-500 text-xs py-2 animate-pulse">
                    Loading CAPTCHA...
                </div>
            )}
            <div ref={containerRef} />
        </div>
    );
}