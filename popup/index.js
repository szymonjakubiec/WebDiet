import {computeSpentTimeRatio} from "../extras/utils.js";



requestAllWebsites();


/**
 * Sends request message for all websites and then displays them.
 * @returns {Promise<void>}
 */
async function requestAllWebsites(){
  const response = await chrome.runtime.sendMessage({action: "getAllWebsites"});
  await showAllWebsites(response.result);
}


/**
 * Displays all websites.
 */
function showAllWebsites(websiteList) {
  console.log(websiteList);
  const divMain = document.getElementsByClassName("main")[0];
  const websitesNumber = websiteList.length;
  let li = "";
  
  
  for (let i = 0; i < websitesNumber; i++) {
    const name = websiteList[i].name;
    const spentTime = websiteList[i].spentTime;
    const limitTime = websiteList[i].limitTime;

    const percentage = computeSpentTimeRatio(spentTime, limitTime) * 100;
    const spentTimeCut = spentTime.substring(0, spentTime.length-3);
    const limitTimeCut = limitTime.substring(0, limitTime.length-3);

    li += `
    <li>
      <div class="element">
        <div class="site-name">
          ${name}
        </div>
        <img src="../img/icon16.png" alt="web-im">
        <progress min="0" max="100" value="${percentage}"></progress>
        <div class="time-spent">
          ${spentTimeCut}/${limitTimeCut}
        </div>
        <div class="percentage">
          ${percentage >= 0 ? percentage + "%" : "-"}
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
