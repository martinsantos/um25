// Error suppressor - Silencia errores no críticos
(function() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
      if (e.message && (
        e.message.includes('ResizeObserver') ||
        e.message.includes('chrome-extension') ||
        e.message.includes('moz-extension')
      )) {
        e.preventDefault();
      }
    }, true);
  }
})();
