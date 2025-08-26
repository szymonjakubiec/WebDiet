let db;
const request = indexedDB.open("WebDietDB", 1);


request.onsuccess = (event) => {
  db = event.target.result;
}

request.onerror = (event) => {
  console.error(`Database error: ${event.target.error?.message}`);
}

request.onupgradeneeded = (event) => {
  db = event.target.result;

  const objStore = db.createObjectStore("visitedWebsitesList", {autoIncrement: true});

  objStore.createIndex("name", ["name"], {unique: true});
  objStore.createIndex("url", ["url"], {unique: true});
  objStore.createIndex("enabled", ["enabled"], {unique: false});

  
  
  objStore.transaction.oncomplete = (event) => {
    console.log("Transaction complete");
    
    

    // addWebsite("youtube", "https://youtube.com");
    // addWebsite("netflix", "https://netflix.com");
    // addWebsite("spotify", "https://spotify.com");
    // addWebsite("facebook", "https://facebook.com");
  }
}

request.onsuccess = (event) => {
  db = event.target.result;
  const transaction = db.transaction("visitedWebsitesList", "readwrite");

  
  const objStore = transaction.objectStore("visitedWebsitesList");
  const index = objStore.index("name");
  
  objStore.put({name: "youtube", url: "https://youtube.com", enabled: false});
  objStore.put({name: "netflix", url: "https://netflix.com", enabled: false});
  objStore.put({name: "spotify", url: "https://spotify.com", enabled: false});
  objStore.put({name: "facebook", url: "https://facebook.com", enabled: false});
  
  const query = index.get(["youtube"]);
  query.onsuccess = () => {
    console.log("query2", query.result);
    
  }
  query.onerror = (event) => {
    console.error(`query error: ${event.target.error?.message}`);
  }
  db.close();
}

function addWebsite(name, url){
  const transaction = db.transaction(["visitedWebsitesList"], "readwrite");

  transaction.oncomplete = (event) => {
    console.log("All done!");
    db.close();
  };

  transaction.onerror = (event) => {
    console.error(`addWebsite error: ${event.target.error?.message}`);
  };

  const objStore = transaction.objectStore("visitedWebsitesList");
  objStore.put([
    {
      name: name,
      url: url,
      enabled: true,
    }
  ]);
}

let ul = document.getElementById("list");
let websitesNumber = 4;

let websitesTimeLimitArr = ["02:00:00", "00:30:00", "00:20:00", "00:30:00"]
let websiteTimeSpentArr = ["01:45:00", "00:15:00", "00:20:00", "00:15:00"];

let li = "";
for (let i = 0; i < websitesNumber; i++) {
  let tempTS = websiteTimeSpentArr[i].split(":")
  let timeSpent = Number(tempTS[0])*3600 + Number(tempTS[1])*60 + Number(tempTS[2])

  let tempTL = websitesTimeLimitArr[i].split(":")
  let timeLimit = Number(tempTL[0])*3600 + Number(tempTL[1])*60 + Number(tempTL[2])

  let percentage = Math.floor(timeSpent*100/timeLimit);
  let timeSpentCut = websiteTimeSpentArr[i].substring(0,websiteTimeSpentArr[i].length-3)
  let timeLimitCut = websitesTimeLimitArr[i].substring(0,websitesTimeLimitArr[i].length-3)

  li += `
    <li>
      <div class="element">
        <img src="img/icon16.png" alt="web-im">
        <progress min="0" max="100" value="${percentage}"></progress>
        <div class="time-spent">
          ${timeSpentCut}/${timeLimitCut}
        </div>
        <div class="percentage">
          ${percentage}%
        </div>
      </div>
    </li>`
}
ul.innerHTML = `<ul id="list"> ${li} </div>`

// let startTime = Date.now();
//
// let measuredtime = Date.now() - startTime;



