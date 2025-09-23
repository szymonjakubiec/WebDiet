let db;
let currentDomain = "", previousDomain = "";
let websiteList;
/**
 * Gets label of domain name from given url.
 * @param url
 * @returns {null|string}
 */
function getLabel(url){
  try {
    const u = new URL(url);
    console.log(`url: ${url}`);
    const origin = u.origin;
    const label = origin.split(".")[1];
    return label;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Gets origin from given url.
 * @param url
 * @returns {null|string}
 */
function getOriginUrl(url){
  try {
    const u = new URL(url);
    return u.origin;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function getWebsite(){
  chrome.tabs.query({currentWindow: true, active: true}//, 
    // function(tabs){
    // let activeTab = tabs[0];
    // console.log(activeTab.url);
    // // let activeTabId = activeTab.id;
    // return activeTab.url;
//}
  ).then((tabs) => {
    previousDomain = currentDomain;
    currentDomain = tabs[0].url;
    console.log(currentDomain);
  });
}



/**
 * Create DB for visited websites.
 */
function createDB(){
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WebDietDB", 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      const objStore = db.createObjectStore("visitedWebsitesList", {autoIncrement: true});

      objStore.createIndex("name", ["name"], {unique: true});
      objStore.createIndex("url", ["url"], {unique: true});
      objStore.createIndex("spentTime", ["spentTime"], {unique: false});
      objStore.createIndex("limitEnabled", ["limitEnabled"], {unique: false});
      objStore.createIndex("limitTime", ["limitTime"], {unique: false});

      //add initial websites - for testing
      objStore.add({name: "youtube", url: "https://www.youtube.com", spentTime: "01:45:00", limitEnabled: false, limitTime: "02:00:00"});
      objStore.add({name: "netflix", url: "https://www.netflix.com", spentTime: "00:15:00", limitEnabled: false, limitTime: "00:30:00"});
      objStore.add({name: "spotify", url: "https://www.spotify.com", spentTime: "00:20:00", limitEnabled: false, limitTime: "00:20:00"});
      objStore.add({name: "facebook", url: "https://www.facebook.com", spentTime: "00:15:00", limitEnabled: false, limitTime: "00:30:00"});
      objStore.add({name: "snapchat", url: "https://www.snapchat.com", spentTime: "00:00:00", limitEnabled: false, limitTime: "00:40:00"});


      objStore.transaction.oncomplete = (event) => {
        console.log("Transaction complete");
      }
    }

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    }

    request.onerror = (event) => {
      console.error(`Database opening error: ${event.target.error?.message}`);
      reject(event.target.error);
    }
  })
  
}


function handleNewDomain(newDomain, newLabel){
  if(isDomainChanged(newDomain)){
    currentDomain = newDomain;

    // if newDomain is not in visitedWebsitesList DB add it there
    if(!websiteList.includes(newDomain)){
      addWebsite(newDomain, newLabel);
      websiteList.push(newDomain);
      console.log(websiteList);
    }
    else{
      //get already existing website
    }
  }
}


/**
 * Checks if the new domain is different from the currently held one.
 * @param newDomain
 */
function isDomainChanged(newDomain){
  if (newDomain == null) return false;

  return newDomain !== currentDomain;
}

//put website data as an arg?
/**
 * Adds website into DB.
 */
function addWebsite(newDomain, newLabel){
  const request = db.transaction("visitedWebsitesList", "readwrite")
    .objectStore("visitedWebsitesList")
    .add([
      {
        name: newLabel,
        url: newDomain,
        spentTime: "00:00:00",
        limitEnabled: false,
        limitTime: "00:00:00",
      }
    ]);

  request.onsuccess = (event) => {
    console.log(`New website added: ${event.target.result}`);

  };
  request.onerror = (event) => {
    console.error(`addWebsite error: ${event.target.error?.message}`);
  };
}




/* =====================================  listeners ===================================== */




/**
 * Gets websites array from DB .
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.greeting === "getAllWebsites"){
    createDB().then((db) => {
      const query = db.transaction("visitedWebsitesList", "readwrite")
        .objectStore("visitedWebsitesList")
        .index("url")
        .getAll();

      query.onsuccess = () => {
        websiteList = query.result;
        // console.log("getWebsiteListQuery", query);
        sendResponse({result: query.result});
      }
      query.onerror = (event) => {
        console.error(`getWebsiteListQuery error: ${event.target.error?.message}`);
        sendResponse({result: []});
      }
    }).catch((error) => {
      sendResponse({websites: []});
    });
    return true;
  }
});


// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log(`tabId: ${tabId}`);
//   console.log(`changeInfo: ${changeInfo.url}`);
//   getLabel();
//   if (changeInfo.url) {
//     if (currentDomain.url) {
//       if (changeInfo.url !== currentDomain.url) {
//        
//       }
//     }
//   }
// })


/**
 * Gets url and domain label of currently active tab on active tab change.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    let tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url.startsWith("http")){
      console.log(`tabId: ${tab.id}, tabUrl: ${tab.url}, tab: ${tab}`);

      let origin = await getOriginUrl(tab.url);
      console.log(`origin: ${origin}`);

      let label = await getLabel(tab.url);
      console.log(`label: ${label}`);

      handleNewDomain(origin, label);
    }
  } catch (e) {
    console.error(`error occurred while checking changed active tab: ${e.target.error?.message}`);
  }
});


/**
 * Gets url and domain label of currently active tab on top-level frame navigation.
 */
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;

  if (details.url.startsWith("http")){
    console.log(`detailsId: ${details.tabId}, detailsUrl: ${details.url}, details: ${details}`);

    let origin = getOriginUrl(details.url);
    console.log(`origin: ${origin}`);

    let label = getLabel(details.url);
    console.log(`label: ${label}`);

    handleNewDomain(origin, label);
  }
});


/**
 * Gets url and domain label of currently active tab on changing focus to other browser window.
 */
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  chrome.windows.get(windowId, {populate: true}).then((win) => {
    if(chrome.runtime.lastError || !win) return;

    const active = win.tabs && win.tabs.find(t => t.active);
    if (active.url.startsWith("http")){
      console.log(`windowTabId: ${active.id}, windowTabUrl: ${active.url}, windowTab: ${active}`);

      let origin = getOriginUrl(active.url);
      console.log(`origin: ${origin}`);

      let label = getLabel(active.url);
      console.log(`label: ${label}`);

      handleNewDomain(origin, label);
    }
  });
});
