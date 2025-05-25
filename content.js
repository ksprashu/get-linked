(function() {
  const pageContent = document.body.innerText;
  chrome.runtime.sendMessage({ action: "readContent", content: pageContent });
})();
