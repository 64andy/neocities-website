const VALID_CHARS = "qwertyuiopasdfghjklzxcvbnm"
const NUM_COLUMNS = 5
const ENTER = "Enter";
const BACKSPACE = "Backspace";

const rowTemplate = document.querySelector(".template-holder").querySelector(".word-input-row");
const displayBoard = document.querySelector("#display-board");

class TypingController {
    /**
     * 
     * @param {HTMLElement} template 
     * @param {HTMLElement} container 
     */
    constructor(template, container) {
        this.template = template;
        this.container = container;
        this.numRows = 0;
        this.currentRow = 0;
        this.currentCol = 0;
        this.currentWord = [];
    }

    addNewRow() {
        this.currentRow += 1;
        this.numRows += 1;
        this.currentWord = [];

        const newRow = this.template.cloneNode(true);   // Deep clone
        newRow.dataset.row = this.numRows;
        this.container.append(newRow);
    }

    /**
     * @param {string} input 
     */
    typeCharacter(input) {
        // Did the user hit "Enter"?
        if (input == ENTER) {
            console.log("Cool you hit enter, doing nothing until you implement this");
            return true;
        }
        // Did the user hit "Backspace"?
        if (input == BACKSPACE) {
            if (this.currentWord.length > 0) {
                this.currentWord.pop();
            }
            this.#displayWord();
            return true;
        }

        // Normal characters
        const char = input.toLowerCase();
        if (!VALID_CHARS.includes(char)) {
            return false;
        }

        if (this.currentWord.length >= NUM_COLUMNS) {
            return false;
        }

        this.currentWord.push(char);

        this.#displayWord();
    }

    #displayWord() {
        const rowElement = this.container.lastElementChild;
        for (let i = 0; i < NUM_COLUMNS; i++) {
            const characterElement = rowElement.querySelector(`.word-char[data-col='${i}']`);
            const char = this.currentWord[i] || ''
            characterElement.innerText = char;
        }
    }
}

const typingController = new TypingController(rowTemplate, displayBoard);

typingController.addNewRow();


document.onkeydown = (ev) => {
    typingController.typeCharacter(ev.key);
}

document.querySelectorAll(".keyboard-char").forEach((elem) => {
    elem.onclick = (ev) => typingController.typeCharacter(elem.dataset.key);
})
