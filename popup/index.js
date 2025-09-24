requestAllWebsites();

/**
 * Sends request message for all websites and then displays them.
 * @returns {Promise<void>}
 */
async function requestAllWebsites(){
  let response = await chrome.runtime.sendMessage({action: "getAllWebsites"});
  await showAllWebsites(response.result);
}



/**
 * Displays all websites.
 */
function showAllWebsites(websiteList) {
  console.log(websiteList);
  let divMain = document.getElementsByClassName("main")[0];
  let websitesNumber = websiteList.length;
  let li = "";
  
  
  for (let i = 0; i < websitesNumber; i++) {
    let name = websiteList[i].name;
    
    let tempTS = websiteList[i].spentTime.split(":")
    let timeSpent = Number(tempTS[0])*3600 + Number(tempTS[1])*60 + Number(tempTS[2])

    let tempTL = websiteList[i].limitTime.split(":")
    let timeLimit = Number(tempTL[0])*3600 + Number(tempTL[1])*60 + Number(tempTL[2])

    let percentage = Math.floor(timeSpent*100/timeLimit);
    let timeSpentCut = websiteList[i].spentTime.substring(0,websiteList[i].spentTime.length-3)
    let timeLimitCut = websiteList[i].limitTime.substring(0,websiteList[i].limitTime.length-3)

    li += `
    <li>
      <div class="element">
        <div class="site-name">
          ${name}
        </div>
        <img src="../img/icon16.png" alt="web-im">
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
  divMain.innerHTML = `<ul id="list"> ${li} </ul>`
}


// let startTime = Date.now();
//
// let measuredtime = Date.now() - startTime;



/* =====================================  listeners ===================================== */

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "showAllWebsites"){
    showAllWebsites(request.data);
  }
})
