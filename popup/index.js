import {computeSpentTimeRatio} from "../extras/utils.js";



showUsage();


/**
 * Displays all websites.
 * @param websiteList
 */
function renderAllWebsites(websiteList) {
  // brać jeszcze z website limits
  console.log(websiteList);
  const divWebList = document.getElementsByClassName("website-list")[0];
  divWebList.classList.remove("website-list--limits");
  divWebList.innerHTML = "";
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
  divWebList.insertAdjacentHTML(`afterbegin`, `<ul id="list"> ${li} </ul>`);
  
  const divBottombar = document.getElementsByClassName("bottom-bar")[0];
  divBottombar.innerHTML = "";
}

/**
 * Displays all websites without limits with buttons to add new limits and 1 edit button do modify existing limits.
 * @param websiteList
 * @param limitList
 */
function renderAllSettings(websiteList, limitList){
  console.log(websiteList);
  const divWebList = document.getElementsByClassName("website-list")[0];
  divWebList.classList.add("website-list--limits");
  divWebList.innerHTML = "";
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
  divWebList.insertAdjacentHTML("afterbegin",`<ul id="list"> ${li} </ul>`);
  
  const divBottombar = document.getElementsByClassName("bottom-bar")[0];
  divBottombar.innerHTML = "";
  divBottombar.insertAdjacentHTML("afterbegin", 
    `<button id="add-btn" class="bottom-btn">Add</button>
<button id="edit-btn" class="bottom-btn">Edit</button>`);
  
  document.getElementById("edit-btn").addEventListener("click", showLimitedWebsites);
}

/**
 * Displays all websites with limits with buttons to edit existing limits and back button.
 * @param websiteList
 * @param limitList
 */
function renderLimitedWebsites(websiteList, limitList){
  console.log(websiteList);
  const divWebList = document.getElementsByClassName("website-list")[0];
  // divWebList.classList.add("website-list--limits");
  divWebList.innerHTML = "";
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
          Edit
        </button>
      </div>
    </li>`
  }
  divWebList.insertAdjacentHTML("afterbegin",`<ul id="list"> ${li} </ul>`);

  const divBottombar = document.getElementsByClassName("bottom-bar")[0];
  divBottombar.innerHTML = "";
  divBottombar.insertAdjacentHTML("afterbegin", `<button id="back-btn" class="bottom-btn">Back</button>`);
  
  document.getElementById("back-btn").addEventListener("click", showSettings);
}


/**
 * Sends request message for all websites with limits and then displays them.
 * @returns {Promise<void>}
 */
async function showLimitedWebsites(){
  const response = await chrome.runtime.sendMessage({action: "getWebsitesWithLimits"});
  renderLimitedWebsites(response.result);
}


/**
 * Sends request message for all websites without limits and then displays them.
 * @returns {Promise<void>}
 */
async function showSettings(){
  const response = await chrome.runtime.sendMessage({action: "getWebsitesNoLimits"});
  renderAllSettings(response.result);
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

document.getElementById("settings-btn").addEventListener("click", showSettings);
document.getElementById("usage-btn").addEventListener("click", showUsage);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "renderAllWebsites"){
    renderAllWebsites(request.data);
  }
})
