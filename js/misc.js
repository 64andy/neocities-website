// https://stackoverflow.com/a/39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 * @param {String} elem_id The ID of the element getting typed
 * @param {number} ms The delay (in ms) between key strokes
 *                    _(def. 100ms)_
 * @param {number} slowCoeff How much a key is delayed on punctuation
 *                           _(def. 4x)_
 * @param {boolean} isCentered Fakes character grid snapping if text is centred & fixed-width
 *                             _(def. false)_
 * @param {boolean} endWithCursor Determines if the line should have a blinky box at the end
 *                                _(def. false)
 */
async function typeOutText(elem_id, ms=100, slowCoeff=4, isCentered=false,
                            endWithCursor=false) {
    const highlight = (c) =>
    '<span class="console-typed-highlight">'+c+'</span>';
    const slowChars = ".,!?";
    const shouldSlow = (c) => slowChars.includes(c);

    let banner = document.getElementById(elem_id);
    let msg = banner.innerText; // Get text from banner
    let bc = msg.length % 2;
    banner.innerHTML = "";      // then clear banner

    for (let i = 0; i < msg.length; i++) {
        let c = msg[i];
        if (c.match(/\s/)) c = "&nbsp;";     // Convert whitespace
        let centerPadding = (isCentered && i%2 == bc)
            ? "&nbsp;"   // Fakes a "snap" to fixed-width spaces if centered
            : "";
        banner.innerHTML = centerPadding + msg.substring(0, i) + highlight(c);
        await sleep(shouldSlow(c) ? ms*slowCoeff : ms); // Type slower on certain chars
    }
    banner.innerHTML = (isCentered && bc) ? `&nbsp;` : ``;  // Extra bounce to snap
    if (endWithCursor)
        // Snapping bounce
        banner.innerHTML += msg + `<span class="console-blinky">&nbsp</span>`;
    else
        banner.innerText += msg;
}

function getSlapped(self) {
    self.classList.toggle('handSlap');
    setTimeout(()=>self.classList.remove('handSlap'), 1500);
}
