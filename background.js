let db;
let currentWebsite = "", previousWebsite = "";
let websiteList;
getWebsite();
createDB();

function getWebsite(){
  chrome.tabs.query({currentWindow: true, active: true}//, 
    // function(tabs){
    // let activeTab = tabs[0];
    // console.log(activeTab.url);
    // // let activeTabId = activeTab.id;
    // return activeTab.url;
//}
  ).then((tabs) => {
    previousWebsite = currentWebsite;
    currentWebsite = tabs[0].url;
    console.log(currentWebsite);
  });
}

/**
 * Create DB for visited websites.
 */
function createDB(){
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
    objStore.put({name: "youtube", url: "https://youtube.com", spentTime: "01:45:00", limitEnabled: false, limitTime: "02:00:00"});
    objStore.put({name: "netflix", url: "https://netflix.com", spentTime: "00:15:00", limitEnabled: false, limitTime: "00:30:00"});
    objStore.put({name: "spotify", url: "https://spotify.com", spentTime: "00:20:00", limitEnabled: false, limitTime: "00:20:00"});
    objStore.put({name: "facebook", url: "https://facebook.com", spentTime: "00:15:00", limitEnabled: false, limitTime: "00:30:00"});


    objStore.transaction.oncomplete = (event) => {
      console.log("Transaction complete");
    }
  }

  request.onsuccess = (event) => {
    db = event.target.result;
    // db.close(); // keep it?
  }

  request.onerror = (event) => {
    console.error(`Database opening error: ${event.target.error?.message}`);
  }
}

//put website data as an arg?
/**
 * Adds website into DB.
 */
function addWebsite(){
  const request = db.transaction("visitedWebsitesList", "readwrite")
    .objectStore("visitedWebsitesList")
    .put([
      {
        name: window.location.hostname,
        url: window.location.host,
        limitEnabled: true,
      }
    ]);

  request.onsuccess = (event) => {
    console.log(`New website added: ${event.target.result}`);

  };
  request.onerror = (event) => {
    console.error(`addWebsite error: ${event.target.error?.message}`);
  };
}



/**
 * Gets websites array from DB .
 * @param db
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.greeting === "getWebsites"){
    createDB();
    if(db){
      const query = db.transaction("visitedWebsitesList", "readwrite")
        .objectStore("visitedWebsitesList")
        .index("url")
        .getAll();

      query.onsuccess = () => {
        websiteList = query.result;
        console.log("getWebsiteListQuery", query);
        sendResponse({result: query.result});
      }
      query.onerror = (event) => {
        console.error(`getWebsiteListQuery error: ${event.target.error?.message}`);
        sendResponse({result: []});
      }
    }
    else{
      sendResponse({websites: []});
    }
    return true;
  }
});



chrome.tabs.onActivated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab has finished loading a new URL
  if (changeInfo.url) {
    console.log("Tab URL changed to: ", changeInfo.url);
  }
});

// watch for change of the website
// if (window.location.host !== currentWebsite) { // window cannot be in background.js
//   currentWebsite = window.location.host;
//   if (!websiteList.includes(currentWebsite)){
//     addWebsite();
//     console.log(currentWebsite);
//   }
// }
