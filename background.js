// Listen for clicks on the extension icon
browser.browserAction.onClicked.addListener(() => {
  // Open popup.html in a new tab
  browser.tabs.create({
    //url: "popup.html"
    url: browser.runtime.getURL('popup.html')
  });
});

