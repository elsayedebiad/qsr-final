// Window extensions for analytics and tracking scripts

interface Window {
  // Microsoft Clarity
  clarity?: {
    (command: 'set', key: string, value: string | boolean): void;
    (command: 'identify', userId: string, sessionId?: string, pageId?: string, friendlyName?: string): void;
    (command: 'consent'): void;
    (command: 'upgrade', upgradeReason: string): void;
    q?: any[];
  };

  // Google Tag Manager
  dataLayer?: any[];

  // TikTok Pixel
  ttq?: {
    load: (pixelId: string) => void;
    page: () => void;
    track: (event: string, data?: any) => void;
    identify: (data: any) => void;
  };

  // Facebook Pixel
  fbq?: {
    (command: 'init', pixelId: string): void;
    (command: 'track', event: string, data?: any): void;
    (command: 'trackCustom', event: string, data?: any): void;
  };

  // Sentry
  Sentry?: {
    init: (options: any) => void;
    captureException: (error: Error) => void;
    captureMessage: (message: string) => void;
  };
}

