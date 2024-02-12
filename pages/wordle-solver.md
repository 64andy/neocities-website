---
layout: default
title: Totally not cheating
permalink: /wordle-solver/
---

<div class="template-holder" style="display: none;">
    <table> <!-- So the tr doesn't get deleted for being invalid -->
    <tr class="word-input-row">
        {% for col in (0..4) %}
        <td class="word-char char-nothing" data-col="{{col}}"></td>
        {% endfor %}
    </tr>
    </table>
</div>
<div class="top-screen">
    <table class="display-board" id="display-board">
        <!-- The JS will fill this up -->
    </table>
    <div id="answer-info">
        ...
    </div>
</div>

<div id="message-box">
    <span class="msg" id="input-word">Input your word</span>
    <span class="msg hidden" id="input-colours">Input your word's colours</span>
</div>

<div class="keyboard" id="char-keyboard">
    <!-- You can't create literal arrays in Liquid, but you can split a string into one -->
    <!-- https://heliumdev.com/blog/create-an-array-in-shopifys-liquid -->
    <!-- Row #1: QWERTYUIOP -->
    <div class="keyboard-row">
    {% assign row = "qwertyuiop" | split: '' %}
    {% for char in row %}
        <button class="keyboard-key char-key" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
    </div>

    <!-- Row #2: ASDFGHJKL -->
    <div class="keyboard-row">
    {% assign row = "asdfghjkl" | split: '' %}
    {% for char in row %}
        <button class="keyboard-key char-key" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
    </div>

    <!-- Row #3: Enter + ZXCVBNM + Backspace -->
    <div class="keyboard-row">
        <button class="keyboard-key char-key special-char" data-key="Enter">
            Enter
        </button>
    {% assign row = "zxcvbnm" | split: '' %}
    {% for char in row %}
        <button class="keyboard-key char-key" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
        <button class="keyboard-key char-key special-char" data-key="Backspace">
            Bksp
        </button>
    </div>
</div>

<div class="keyboard hidden" id="colour-keyboard">
    <div class="keyboard-row">
        <button class="keyboard-key colour-key char-correct" data-key="g">Correct (G)</button>
    </div>
    <div class="keyboard-row">
        <button class="keyboard-key colour-key char-wrong-spot" data-key="y">Wrong Spot (Y)</button>
    </div>
    <div class="keyboard-row">
        <button class="keyboard-key char-key special-char" data-key="Enter">Enter</button>
        <button class="keyboard-key colour-key char-wrong-char" data-key="r">Wrong Character (R/B)</button>
        <button class="keyboard-key char-key special-char" data-key="Backspace">Bksp</button>
    </div>
</div>

<link href="/css/wordle.css" rel="stylesheet" type="text/css" media="all">
<script src="/js/wordle/wordle-words.js" type="text/javascript"></script>
<script src="/js/wordle/wordle-solver.js" type="text/javascript"></script>
<script>
    const rowTemplate = document
                        .querySelector(".template-holder")
                        .querySelector(".word-input-row");
    const displayBoard = document.querySelector("#display-board");
    
    const renderer = new CurrentGuessDisplayer(rowTemplate, displayBoard);
    const colourKeyboard = new ColourKeyboard();
    const charKeyboard = new CharacterKeyboard();
    const solver = new Corpus(ALL_WORDS);
    const game = new Game(charKeyboard, colourKeyboard, renderer, solver);

    // Enter characters when the user types
    document.onkeydown = (ev) => {
        game.handleKey(ev.key);
    }

    // Make the onscreen keys do something
    document.querySelectorAll(".keyboard-key").forEach((elem) => {
        elem.onclick = () => game.handleKey(elem.dataset.key);
    })

    // Finally, render the first line
    renderer.addNewRow();
</script>
