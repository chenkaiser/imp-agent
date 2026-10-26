// Top frame only. No record fields, cookies, credentials or ERP requests are read.
if (window.top === window && !document.getElementById('imp-agent-launcher')) {
  const host = document.createElement('div'); host.id = 'imp-agent-launcher';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{position:fixed;right:20px;bottom:24px;z-index:2147483646}button{font:600 14px system-ui;border:1px solid #7b9e8c;border-radius:24px;padding:12px 19px;background:#183f37;color:white;box-shadow:0 4px 18px #0003;cursor:pointer}button:focus-visible{outline:3px solid #e4ba58;outline-offset:3px}';
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Ask IMP'; button.title = 'Open IMP Agent beside Acumatica';
  button.addEventListener('click', async () => {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'open-ask-imp' });
      if (!result?.ok) throw new Error('Panel unavailable');
    } catch { window.open('https://ask.impops.work/widget', '_blank', 'noopener,noreferrer'); }
  });
  root.append(style, button); document.documentElement.append(host);
}
