import {computeSpentTimeRatio} from "../extras/utils.js";



let db;
let currentDomainName = "";
let websiteList;


/**
 * Gets domain from given url.
 * @param url {string}
 * @returns {null|string}
 */
function getDomain(url){
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    console.error(e);
    return null;
  }
}


/**
 * Gets domain name from given url.
 * @param url {string}
 * @returns {null|string}
 */
function getDomainName(url){
  try {
    const u = new URL(url);
    const hostname = u.hostname;
    
    const arr = hostname.split(".");
    
    if (arr.length === 2)
      return arr[0];
    
    if (arr[0] === "www")
      if (arr[2] === "com")
        return arr[1];
      else
        return `${arr[1]}.${arr[2]}`;
    else
      return `${arr[1]} ${arr[0]}`;
    
  } catch (e) {
    console.error(e);
    return null;
  }
}


/**
 * Gets origin from given url.
 * @param url {string}
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

      const objStoreWl = db.createObjectStore("websiteLimits", {autoIncrement: true});
      objStoreWl.createIndex("url", ["url"], {unique: true});
      objStoreWl.createIndex("limitEnabled", ["limitEnabled"], {unique: false});
      objStoreWl.createIndex("limitTime", ["limitTime"], {unique: false});

      //add initial limits - for testing
      objStoreWl.add({url: "https://www.youtube.com", limitEnabled: true, limitTime: "02:00:00"});
      objStoreWl.add({url: "https://www.netflix.com", limitEnabled: true, limitTime: "00:30:00"});
      objStoreWl.add({url: "https://www.spotify.com", limitEnabled: true, limitTime: "00:20:00"});
      objStoreWl.add({url: "https://www.facebook.com", limitEnabled: true, limitTime: "00:30:00"});

      const objStore = db.createObjectStore("visitedWebsitesList", {autoIncrement: true});

      objStore.createIndex("name", ["name"], {unique: true});
      objStore.createIndex("url", ["url"], {unique: true});
      objStore.createIndex("wL_limitEnabled", ["wL_limitEnabled"], {unique: false});
      objStore.createIndex("wL_limitTime", ["wL_limitTime"], {unique: false});
      objStore.createIndex("spentTime", ["spentTime"], {unique: false});
      objStore.createIndex("spentTimeRatio", ["spentTimeRatio"], {unique: false});

      //add initial websites - for testing
      let record;
      record = {name: "youtube", url: "https://www.youtube.com", wL_limitEnabled  : true, wL_limitTime: "02:00:00", spentTime: "01:45:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.wL_limitTime);
      objStore.add(record);
      record = {name: "netflix", url: "https://www.netflix.com", wL_limitEnabled  : true, wL_limitTime: "00:30:00", spentTime: "00:15:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.wL_limitTime);
      objStore.add(record);
      record = {name: "spotify", url: "https://www.spotify.com", wL_limitEnabled  : true, wL_limitTime: "00:20:00", spentTime: "00:20:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.wL_limitTime);
      objStore.add(record);
      record = {name: "facebook", url: "https://www.facebook.com", wL_limitEnabled  : true, wL_limitTime: "00:30:00", spentTime: "00:15:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.wL_limitTime);
      objStore.add(record);
      record = {name: "snapchat", url: "https://www.snapchat.com", wL_limitEnabled  : false, wL_limitTime: "00:00:00", spentTime: "00:00:00"}
      record.spentTimeRatio = computeSpentTimeRatio(record.spentTime, record.wL_limitTime);
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
 * @param newDomain {string}
 * @param newDomainName {string}
 * @returns {Promise<void>}
 */
async function handleNewDomain(newDomain, newDomainName){
  if(isDomainNameChanged(newDomainName)){
    currentDomainName = newDomainName;

    // if newDomainName is not in visitedWebsitesList DB add it there
    if(!websiteList.some(w => w.name === newDomainName)){
      await addWebsite(newDomain, newDomainName);
      console.log(websiteList);
      await chrome.runtime.sendMessage({action: "renderAllWebsites", data: websiteList});
    }
    else{
      //get already existing website
    }
  }
}


/**
 * Checks if the new domain name is different from the currently held one.
 * @param newDomainName {string}
 * @returns {boolean}
 */
function isDomainNameChanged(newDomainName){
  if (newDomainName == null) 
    return false;

  return newDomainName !== currentDomainName;
}


/**
 * Adds website into DB.
 * @param newDomain {string}
 * @param newDomainName {string}
 */
function addWebsite(newDomain, newDomainName){
  const newWebsite = {
    name: newDomainName,
    url: newDomain,
    wL_limitEnabled  : false,
    wL_limitTime: "00:00:00",
    spentTime: "00:00:00",
  };
  newWebsite.spentTimeRatio = computeSpentTimeRatio(newWebsite.spentTime, newWebsite.wL_limitTime);
  
  const request = db.transaction("visitedWebsitesList", "readwrite")
    .objectStore("visitedWebsitesList")
    .add(newWebsite);
  
  request.onsuccess = (event) => {
    console.log(`New website added: ${event.target.result}`);
    websiteList.push(newWebsite);
  };
  request.onerror = (event) => {
    console.error(`addWebsite error: ${event.target.error?.message}`);
  };
}




/* =====================================  listeners ===================================== */




/**
 * Gets websites array from DB and filters it if needed.
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
  else if(request.action === "getWebsitesNoLimits"){
    createDB().then((db) => {
      const query = db.transaction("visitedWebsitesList", "readwrite")
        .objectStore("visitedWebsitesList")
        .index("spentTimeRatio")
        .openCursor(null, "prev");

      const results = [];
      query.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor){
          if (!cursor.value.wL_limitEnabled){
            results.push(cursor.value);
          }
          cursor.continue();
        }
        else{
          websiteList = results;
          sendResponse({result: websiteList});
        }
      }
      query.onerror = (event) => {
        console.error(`getWebsitesNoLimits error: ${event.target.error?.message}`);
        sendResponse({result: []});
      }
    }).catch((error) => {
      sendResponse({websites: []});
    });
    return true;
  }
  else if(request.action === "getWebsitesWithLimits"){
    createDB().then((db) => {
      const query = db.transaction("visitedWebsitesList", "readwrite")
        .objectStore("visitedWebsitesList")
        .index("spentTimeRatio")
        .openCursor(null, "prev");

      const results = [];
      query.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor){
          if (cursor.value.wL_limitEnabled){
            results.push(cursor.value);
          }
          cursor.continue();
        }
        else{
          websiteList = results;
          sendResponse({result: websiteList});
        }
      }
      query.onerror = (event) => {
        console.error(`getWebsitesNoLimits error: ${event.target.error?.message}`);
        sendResponse({result: []});
      }
    }).catch((error) => {
      sendResponse({websites: []});
    });
    return true;
  }
});


/**
 * Gets url and domain name of currently active tab on active tab change.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    let tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url.startsWith("http")){
      console.log(`tabId: ${tab.id}, tabUrl: ${tab.url}, tab: ${tab}`);

      let origin = await getOriginUrl(tab.url);
      console.log(`origin: ${origin}`);

      let domainName = await getDomainName(tab.url);
      console.log(`domainName: ${domainName}`);

      handleNewDomain(origin, domainName);
    }
  } catch (e) {
    console.error(`error occurred while checking changed active tab: ${e.target.error?.message}`);
  }
});


/**
 * Gets url and domain domainName of currently active tab on top-level frame navigation.
 */
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;

  if (details.url.startsWith("http")){
    console.log(`detailsId: ${details.tabId}, detailsUrl: ${details.url}, details: ${details}`);

    let origin = getOriginUrl(details.url);
    console.log(`origin: ${origin}`);

    let domainName = getDomainName(details.url);
    console.log(`domainName: ${domainName}`);

    handleNewDomain(origin, domainName);
  }
});


/**
 * Gets url and domain domainName of currently active tab on changing focus to other browser window.
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

      let domainName = getDomainName(active.url);
      console.log(`domainName: ${domainName}`);

      handleNewDomain(origin, domainName);
    }
  });
});
