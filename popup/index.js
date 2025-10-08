import {computeSpentTimeRatio} from "../extras/utils.js";



showUsage();


/**
 * Displays all websites
 * @param websiteList
 */
function renderAllWebsites(websiteList) {
  // brać jeszcze z website limits
  console.log(websiteList);
  const divMain = document.getElementsByClassName("main")[0];
  const websitesNumber = websiteList.length;
  let li = "";
  
  
  for (let i = 0; i < websitesNumber; i++) {
    const name = websiteList[i].name;
    const spentTime = websiteList[i].spentTime;
    const limitTime = websiteList[i].wL_limitTime;

    const percentage = computeSpentTimeRatio(spentTime, limitTime) * 100;
    const spentTimeCut = spentTime.substring(0, spentTime.length-3);
    const limitTimeCut = limitTime.substring(0, limitTime.length-3);

    li += `
    <li>
      <div class="element">
        <div class="site-name-sticked">
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


function renderAllLimits(websiteList, limitList){
  console.log(websiteList);
  const divMain = document.getElementsByClassName("main")[0];
  const limitsNumber = websiteList.length;
  let li = "";


  for (let i = 0; i < limitsNumber; i++) {
    const name = websiteList[i].name;
    const limitTime = websiteList[i].wL_limitTime;

    const limitTimeCut = limitTime.substring(0, limitTime.length-3); // 02:00 czy 02:00:00?

    li += `
    <li>
      <div class="element">
        <img src="../img/icon16.png" alt="web-im">
        <div class="site-name">
          ${name}
        </div>
        <div class="time-spent">
          ${limitTimeCut}
        </div>
        <button class="small-btn"> 
          Add
        </button>
      </div>
    </li>`
  }
  divMain.innerHTML = `<ul id="list"> ${li} </ul>`
}


/**
 * Sends request message for all website's limits and then displays them.
 * @returns {Promise<void>}
 */
async function showLimits(){
  const response = await chrome.runtime.sendMessage({action: "getAllWebsites"});
  renderAllLimits(response.result);
}


/**
 * Sends request message for all websites and then displays them.
 * @returns {Promise<void>}
 */
async function showUsage(){
  const response = await chrome.runtime.sendMessage({action: "getAllWebsites"});
  await renderAllWebsites(response.result);
}


// let startTime = Date.now();
//
// let measuredtime = Date.now() - startTime;



/* =====================================  listeners ===================================== */

document.getElementById("usage-btn").addEventListener("click", showUsage);
document.getElementById("options-btn").addEventListener("click", showLimits);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "renderAllWebsites"){
    renderAllWebsites(request.data);
  }
})
