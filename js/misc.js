// https://stackoverflow.com/a/39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Async function: Applies a 'typing' animation to the given element's text.
 * 
 * Note: 1st param is a string, 2nd param is an **object** with keys
 * 
 * @param {String} elemQuery The `querySelector` identifier for what you want
 * @param {number} ms The delay (in ms) between key strokes
 *                    _(def. 100ms)_
 * @param {String} slowChars The characters you want to slow on
 *                           _(def. ".,!?")_
 * @param {number} slowCoeff Multiplier on how much slower a slowChar is
 *                           _(def. 4x)_
 * @param {String} align Message alignment, values: ['left', 'right', ('center'|'centre')]
 *                             _(def. "left")_
 * @param {boolean} endWithCursor Determines if the line should have a blinky box at the end
 *                                _(def. false)
 */
async function typeOutText(
    elemQuery = null,
    {
    ms = 100,
    slowCoeff = 4,
    slowChars = ".,!?",
    align = "left",
    endWithCursor = false}) {
    const highlight = (c) =>
        '<span class="console-typed-highlight">' + c + '</span>';
    const shouldSlow = (c) => slowChars.includes(c);

    const banner = document.querySelector(elemQuery);
    if (banner === null) throw new TypeError(`'${elemQuery}' not found in page`);
    const msg = banner.innerText;

    // Keeping the innerText length the same as the final length at all times.
    // This prevents jittering, and also prevents the container from
    // growing during typing
    const finalLength = msg.length + endWithCursor;
    let leftPaddingLength, rightPaddingLength;
    align = align.trim().toLowerCase();
    if (align == 'left') {
        leftPaddingLength = (_i) => 0;
        rightPaddingLength = (i) => (finalLength - (i+1));
    }
    else if (align == 'right') {
        leftPaddingLength = (i) => (finalLength - (i+1));
        rightPaddingLength = (_i) => 0;
    }
    else if (align == 'centre' || align == 'center') {
        leftPaddingLength = (i) => (Math.ceil((finalLength - (i+1)) / 2));
        rightPaddingLength = (i) => (Math.floor((finalLength - (i+1)) / 2));
    }
    banner.innerHTML = "&nbsp;".repeat(finalLength);

    for (let i = 0; i < msg.length; i++) {
        let c = msg[i];
        if (c.match(/\s/)) c = "&nbsp;";     // Convert whitespace
        let startPadding = "&nbsp;".repeat(leftPaddingLength(i))
        let endPadding = "&nbsp;".repeat(rightPaddingLength(i))
        banner.innerHTML = startPadding + msg.substring(0, i) + highlight(c) + endPadding;
        await sleep(shouldSlow(c) ? ms * slowCoeff : ms); // Type slower on certain chars
    }
    banner.innerText = msg;
    if (endWithCursor)
        banner.innerHTML += `<span class="console-blinky">&nbsp;</span>`;
}

/**
 * Applies the spin CSS animation to the given element
 * @param {HTMLElement} elem 
 * @requires style.css
 */
function spin(elem) {
    const ANIM_DURATION = 1800;
    const currentTime = new Date().getTime();
    const lastTime = spin.lastTime || 0;
    // If the animation's still playing
    if (currentTime < ANIM_DURATION + lastTime) {
        return;
    }
    // Readd the tag to initiate the animation
    if (elem.classList.contains('handSlap')) {
        elem.classList.remove('handSlap');
        elem.offsetWidth = elem.offsetWidth;
    }
    elem.classList.add('handSlap');
    spin.lastTime = currentTime;
}
