/**
 * Computes spent time ratio as a decimal value. If there is no set limit then returns value of -1.
 * @param spentTime {string}
 * @param limitTime {string}
 * @returns {number}
 */
export function computeSpentTimeRatio(spentTime, limitTime) {
  if (limitTime === "00:00:00")
    return -1;
  return Math.floor(timeToSeconds(spentTime)*100 / timeToSeconds(limitTime)) / 100;
}

/**
 * Converts time to seconds.
 * @param timeStr {string}
 * @returns {number}
 */
export function timeToSeconds(timeStr){
  const [h, m, s] = timeStr.split(":");
  return Number(h)*3600 + Number(m)*60 + Number(s);
}
