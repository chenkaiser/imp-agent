/* Native Classic UI shell asset. Load once from the verified shell customization.
   No browser extension, ERP field scraping, credential copying or business writes. */
(() => {
  'use strict';
  if (window.top !== window || !/^\/Main(?:\.aspx)?\/?$/i.test(location.pathname.replace(/\/\(W\(\d+\)\)/i, '')) || document.getElementById('ask-imp-native')) return;
  const mount = () => {
    if (document.getElementById('ask-imp-native')) return;
    const host = document.createElement('div'); host.id = 'ask-imp-native';
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host{position:fixed;right:20px;bottom:22px;z-index:100000;font:14px system-ui;color:#243830}
      *{box-sizing:border-box}[hidden]{display:none!important}
      button,a{font:inherit}button{cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #dba64b;outline-offset:3px}
      .launcher{border:1px solid #769486;border-radius:24px;background:#183f37;color:white;padding:12px 20px;font-weight:600;box-shadow:0 4px 18px #0003}
      .panel{position:fixed;right:20px;bottom:78px;width:min(460px,calc(100vw - 32px));height:min(780px,calc(100dvh - 100px));display:flex;flex-direction:column;background:#f8faf5;border:1px solid #cad8cf;border-radius:12px;box-shadow:0 10px 45px #0004;overflow:hidden}
      header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #dbe4da;background:#183f37;color:white;flex-shrink:0}
      header strong{font-size:15px}header button{border:0;background:transparent;color:white;font-size:24px;line-height:1;padding:2px 6px}
      iframe{border:0;width:100%;flex:1;min-height:0;background:#f8faf5}
      footer{padding:8px 12px;font-size:11px;border-top:1px solid #dae3d9}a{color:#24583e}
      @media(max-width:540px){:host{right:12px;bottom:12px}.panel{right:8px;bottom:68px;width:calc(100vw - 16px);height:calc(100dvh - 80px)}}
    `;
    const launcher = document.createElement('button'); launcher.type = 'button'; launcher.className = 'launcher';
    launcher.textContent = 'Ask IMP'; launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'ask-imp-panel');
    const panel = document.createElement('section'); panel.id = 'ask-imp-panel'; panel.className = 'panel'; panel.hidden = true;
    panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Ask IMP assistant');
    const header = document.createElement('header'), title = document.createElement('strong'), close = document.createElement('button');
    title.textContent = 'Ask IMP'; close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close Ask IMP'); header.append(title, close);
    const footer = document.createElement('footer'), full = document.createElement('a');
    full.href = 'https://ask.impops.work/chat'; full.target = '_blank'; full.rel = 'noopener noreferrer'; full.textContent = 'Open full workspace ↗'; footer.append(full);
    panel.append(header, footer);
    const setOpen = open => {
      if (open && !panel.querySelector('iframe')) {
        const frame = document.createElement('iframe'); frame.title = 'IMP Agent'; frame.referrerPolicy = 'no-referrer';
        frame.src = 'https://ask.impops.work/widget'; panel.insertBefore(frame, footer);
      }
      panel.hidden = !open; launcher.setAttribute('aria-expanded', String(open));
      (open ? close : launcher).focus();
    };
    launcher.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    root.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false); } });
    root.append(style, panel, launcher); document.body.append(host);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
