// client/src/components/seo/analytics-provider.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
  }
}

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();

  useEffect(() => {
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-YOUR_GA_ID', {
        page_path: location,
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Log page view
    console.log(`Page view: ${location}`);
  }, [location]);

  // Scripts d'analytics à injecter dans le head
  const analyticsScripts = (
    <>
      {/* Google Analytics */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_GA_ID"></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YOUR_GA_ID', {
            page_location: window.location.href,
            page_path: window.location.pathname,
            send_page_view: true
          });
        `
      }} />

      {/* Facebook Pixel */}
      <script dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', 'YOUR_FB_PIXEL_ID');
          fbq('track', 'PageView');
        `
      }} />
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=YOUR_FB_PIXEL_ID&ev=PageView&noscript=1"
          alt="Facebook Pixel"
        />
      </noscript>

      {/* Bing Webmaster Tools */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){
          var o={ti:"YOUR_BING_ID"};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},
          n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){
          var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},
          i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})
          (window,document,"script","//bat.bing.com/bat.js","uetq");
        `
      }} />

      {/* Yandex Metrica */}
      <script type="text/javascript" dangerouslySetInnerHTML={{
        __html: `
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(YOUR_YANDEX_ID, "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
          });
        `
      }} />
      <noscript>
        <div>
          <img src="https://mc.yandex.ru/watch/YOUR_YANDEX_ID" style={{ position: 'absolute', left: '-9999px' }} alt="Yandex Metrica" />
        </div>
      </noscript>

      {/* Hotjar */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `
      }} />

      {/* Clarity Microsoft */}
      <script type="text/javascript" dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
        `
      }} />
    </>
  );

  return (
    <>
      {analyticsScripts}
      {children}
    </>
  );
};

// Hook pour suivre les événements
export const useAnalytics = () => {
  const trackEvent = (category: string, action: string, label?: string, value?: number) => {
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', action, {
        category,
        label,
        value,
      });
    }

    console.log(`Analytics Event: ${category} - ${action} - ${label}`);
  };

  const trackConversion = (conversionId: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        value: value,
        currency: 'MGA',
      });
    }
  };

  const trackPageView = (pageTitle: string, pageLocation: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: pageLocation,
        page_path: window.location.pathname,
      });
    }
  };

  return {
    trackEvent,
    trackConversion,
    trackPageView,
  };
};