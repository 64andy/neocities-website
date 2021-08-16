// https://stackoverflow.com/a/39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeOutText(elem_id, ms) {
    const highlightChar = (c) =>
    `<span class="console-typed-highlight">${c}</span>`;
    const shouldSlow = (c) => c == '.';
    let banner = document.getElementById(elem_id);
    let msg = banner.innerText; // Get text from banner
    banner.innerHTML = "";      // then clear banner
    for (let i = 0; i < msg.length+1; i++) {
        let c = msg[i] || "&nbsp";
        if (c.match(/\s/)) c = "&nbsp";
        let startPadding = (i%2 == 1) ? "&nbsp" : "";
        banner.innerHTML = startPadding + msg.substring(0, i) + highlightChar(c);
        await sleep(shouldSlow(c) ? ms*4 : ms); // Type 4x slower on certain chars
    }
    banner.innerHTML = msg + `<span class="console-blinky">&nbsp</span>`;

}

function getSlapped(self) {
    self.classList.toggle('handSlap');
    setTimeout(()=>self.classList.remove('handSlap'), 1500);
}

function init() {
    typeOutText('console-banner', 100);
}