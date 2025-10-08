// Listen for clicks on the extension icon
browser.action.onClicked.addListener(() => {
  // Open popup.html in a new tab
  browser.tabs.create({
    url: 'popup.html'
  });
});
