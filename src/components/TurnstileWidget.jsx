// ─── TurnstileWidget.jsx ─────────────────────────────────────────────────────
// FIX: expose a reset() method via ref so the parent can reset the exact widget
// by its ID instead of calling window.turnstile.reset() with no arguments,
// which silently does nothing.

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef(null);
    const widgetId     = useRef(null);
    const [ready, setReady] = useState(false);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef  = useRef(onError);

    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
    useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

    // FIX: expose reset() to parent via ref
    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.reset(widgetId.current); } catch {}
            }
        }
    }), []);

    useEffect(() => {
        if (window.turnstile) { setReady(true); return; }
        const interval = setInterval(() => {
            if (window.turnstile) { setReady(true); clearInterval(interval); }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!ready || !containerRef.current || widgetId.current !== null) return;

        const timer = setTimeout(() => {
            try {
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
                    theme:   'dark',
                    retry:   'auto',
                    callback:           (token) => onVerifyRef.current?.(token),
                    'expired-callback': ()      => onExpireRef.current?.(),
                    'error-callback':   ()      => onErrorRef.current?.(),
                });
            } catch (e) {
                console.warn('Turnstile render error:', e);
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.remove(widgetId.current); } catch {}
                widgetId.current = null;
            }
        };
    }, [ready]);

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
});

export default TurnstileWidget;