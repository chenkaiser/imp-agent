chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'open-ask-imp' || sender.id !== chrome.runtime.id || sender.frameId !== 0 ||
      !sender.tab?.id || !sender.url?.startsWith('https://imp-ttr.acumatica.com/')) return false;
  // Call immediately: sidePanel.open requires the launcher's user gesture.
  chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => respond({ ok: true }), () => respond({ ok: false }));
  return true;
});
