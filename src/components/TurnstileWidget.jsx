import React, { useEffect, useRef, useState } from 'react';

export default function TurnstileWidget({ onVerify }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = setInterval(() => {
      if (window.turnstile) {
        setReady(true);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    if (!ready || !ref.current || widgetId.current !== null) return;

    const timer = setTimeout(() => {
      try {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
          callback: (token) => onVerify(token),
          'expired-callback': () => {
            onVerify('');
            // Auto reset on expiry
            if (widgetId.current !== null && window.turnstile) {
              window.turnstile.reset(widgetId.current);
            }
          },
          'error-callback': () => {
            onVerify('');
            if (widgetId.current !== null && window.turnstile) {
              window.turnstile.reset(widgetId.current);
            }
          },
          theme: 'dark',
          retry: 'auto',
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

  // Expose reset function via ref
  return (
    <div className="my-2">
      {!ready && <div className="text-gray-500 text-xs py-2">Loading CAPTCHA...</div>}
      <div ref={ref} />
    </div>
  );
}