// Credentials travel only between the hosted widget and its own sign-in popup.
// The extension and Acumatica page never receive an IMP or ERP token.
export function validWidgetNonce(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value); }
export function acceptsWidgetSession(event, popup, nonce, origin) {
  return !!popup && event.source === popup && event.origin === origin &&
    event.data?.type === 'imp-widget-session' && validWidgetNonce(nonce) && event.data.nonce === nonce;
}
export function createWidgetSignIn({ host, randomSecret, activeSession, onSession, onStatus }) {
  let popup, nonce, timer, deadline;
  const cancel = () => { clearInterval(timer); timer = undefined; popup?.close(); popup = undefined; nonce = undefined; };
  host.addEventListener('message', event => {
    if (!acceptsWidgetSession(event, popup, nonce, host.location.origin)) return;
    if (Date.now() > deadline || !activeSession(event.data.session)) { cancel(); onStatus('Sign-in expired. Please try again.', true); return; }
    const session = event.data.session;
    popup.postMessage({ type: 'imp-widget-accepted', nonce }, host.location.origin);
    cancel(); onSession(session);
  });
  return {
    cancel,
    start() {
      cancel(); nonce = randomSecret(); deadline = Date.now() + 10 * 60 * 1000;
      popup = host.open(`/login?widgetAuth=${encodeURIComponent(nonce)}`, '_blank', 'popup,width=560,height=760');
      if (!popup) { cancel(); onStatus('Allow the sign-in popup, then try again.', true); return; }
      onStatus('Complete Acumatica sign-in in the new window.');
      timer = setInterval(() => {
        if (popup?.closed || Date.now() > deadline) { cancel(); onStatus('Sign-in window closed or expired. Sign in to try again.'); }
      }, 1000);
    }
  };
}
