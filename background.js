chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "readContent") {
    console.log("Webpage content:", request.content);
    // You can process the content here, e.g., display it in a popup or send it to a server.
  }
});
