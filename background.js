import {computeSpentTimeRatio} from "../extras/utils.js";



let db;
let currentLabel = "";
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


/**
 * Creates DB for visited websites.
 * @returns {Promise<unknown>}
 */
function createDB(){
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WebDietDB", 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      const objStore = db.createObjectStore("visitedWebsitesList", {autoIncrement: true});

      objStore.createIndex("name", ["name"], {unique: true});
      objStore.createIndex("url", ["url"], {unique: true});
      objStore.createIndex("limitEnabled", ["limitEnabled"], {unique: false});
      objStore.createIndex("limitTime", ["limitTime"], {unique: false});
      objStore.createIndex("spentTime", ["spentTime"], {unique: false});
      objStore.createIndex("spentTimeRatio", ["spentTimeRatio"], {unique: false});

      //add initial websites - for testing
      let record;
      record = {name: "youtube", url: "https://www.youtube.com", limitEnabled: true, limitTime: "02:00:00", spentTime: "01:45:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.limitTime);
      objStore.add(record);
      record = {name: "netflix", url: "https://www.netflix.com", limitEnabled: true, limitTime: "00:30:00", spentTime: "00:15:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.limitTime);
      objStore.add(record);
      record = {name: "spotify", url: "https://www.spotify.com", limitEnabled: true, limitTime: "00:20:00", spentTime: "00:20:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.limitTime);
      objStore.add(record);
      record = {name: "facebook", url: "https://www.facebook.com", limitEnabled: true, limitTime: "00:30:00", spentTime: "00:15:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.limitTime);
      objStore.add(record);
      record = {name: "snapchat", url: "https://www.snapchat.com", limitEnabled: false, limitTime: "00:00:00", spentTime: "00:00:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.limitTime);
      objStore.add(record);
      
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


/**
 * Checks if the new domain has changed, adds it to DB if it does not already exist there. Then refreshes popup websites list. 
 * @param newDomain
 * @param newLabel
 * @returns {Promise<void>}
 */
async function handleNewDomain(newDomain, newLabel){
  if(isLabelChanged(newLabel)){
    currentLabel = newLabel;

    // if newLabel is not in visitedWebsitesList DB add it there
    if(!websiteList.some(w => w.name === newLabel)){
      await addWebsite(newDomain, newLabel);
      console.log(websiteList);
      await chrome.runtime.sendMessage({action: "showAllWebsites", data: websiteList});
    }
    else{
      //get already existing website
    }
  }
}


/**
 * Checks if the new label is different from the currently held one.
 * @param newLabel
 * @returns {boolean}
 */
function isLabelChanged(newLabel){
  if (newLabel == null) 
    return false;

  return newLabel !== currentLabel;
}


/**
 * Adds website into DB.
 * @param newDomain
 * @param newLabel
 */
function addWebsite(newDomain, newLabel){
  const newWebsite = {
    name: newLabel,
    url: newDomain,
    limitEnabled: false,
    limitTime: "00:00:00",
    spentTime: "00:00:00",
    spentTimeRatio: computeSpentTimeRatio(this.spentTime, this.limitTime)
  }
  const request = db.transaction("visitedWebsitesList", "readwrite")
    .objectStore("visitedWebsitesList")
    .add(newWebsite);
  
  request.onsuccess = (event) => {
    console.log(`New website added: ${event.target.result}`);
    websiteList.push(newWebsite);
    websiteList = websiteListSort(websiteList); // chyba usunąć i pytać za każdym razem od strony index.js?
  };
  request.onerror = (event) => {
    console.error(`addWebsite error: ${event.target.error?.message}`);
  };
}


/**
 * Sorts array of websites by spentTimeRatio.
 * @param websiteList
 */
function websiteListSort(websiteList){
  websiteList.sort((a, b) => {
    return a.spentTimeRatio - b.spentTimeRatio;
  })
}




/* =====================================  listeners ===================================== */




/**
 * Gets websites array from DB .
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.action === "getAllWebsites"){
    createDB().then((db) => {
      const query = db.transaction("visitedWebsitesList", "readwrite")
        .objectStore("visitedWebsitesList")
        .index("spentTimeRatio")
        .openCursor(null, "prev");

      const results = [];
      query.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor){
          results.push(cursor.value);
          cursor.continue();
        }
        else{
          console.log("cursor finished");
          websiteList = results;
          sendResponse({result: websiteList});
        }
      }
      query.onerror = (event) => {
        console.error(`getAllWebsites error: ${event.target.error?.message}`);
        sendResponse({result: []});
      }
    }).catch((error) => {
      sendResponse({websites: []});
    });
    return true;
  }
});


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
