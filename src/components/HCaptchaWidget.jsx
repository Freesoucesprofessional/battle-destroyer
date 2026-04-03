// src/components/HCaptchaWidget.jsx
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const HCaptchaWidget = forwardRef(({ onVerify, onExpire, onError, theme }, ref) => {
  const captchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      captchaRef.current?.resetCaptcha();
    },
    execute: () => {
      captchaRef.current?.execute();
    }
  }));

  const handleVerify = (token, ekey) => {
    // Create captcha data object
    const captchaData = {
      token: token,
      ekey: ekey,
      timestamp: Date.now(),
    };
    
    onVerify(captchaData);
  };

  const handleExpire = () => {
    onExpire?.();
  };

  const handleError = (err) => {
    console.error('hCaptcha error:', err);
    onError?.();
  };

  return (
    <div className="flex justify-center my-2">
      <HCaptcha
        ref={captchaRef}
        sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        theme={theme === 'dark' ? 'dark' : 'light'}
        size="normal"
      />
    </div>
  );
});

HCaptchaWidget.displayName = 'HCaptchaWidget';

export default HCaptchaWidget;