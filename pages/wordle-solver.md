---
layout: default
title: Totally not cheating
permalink: /wordle-solver/
---

<div class="template-holder" style="display: none;">
    <table> <!-- So the tr doesn't get deleted for being invalid -->
    <tr class="word-input-row">
        {% for col in (0..4) %}
        <td class="word-char" data-col="{{col}}"></td>
        {% endfor %}
    </tr>
    </table>
</div>
<table class="display-board" id="display-board">
    <!-- The JS will fill this up -->
</table>

<div class="keyboard" id="keyboard">
    <!-- You can't create literal arrays in Liquid, but you can split a string into one -->
    <!-- https://heliumdev.com/blog/create-an-array-in-shopifys-liquid -->
    <!-- Row #1: QWERTYUIOP -->
    <div class="keyboard-row">
    {% assign row = "qwertyuiop" | split: '' %}
    {% for char in row %}
        <button class="keyboard-char" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
    </div>

    <!-- Row #2: ASDFGHJKL -->
    <div class="keyboard-row">
    {% assign row = "asdfghjkl" | split: '' %}
    {% for char in row %}
        <button class="keyboard-char" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
    </div>

    <!-- Row #3: Enter + ZXCVBNM + Backspace -->
    <div class="keyboard-row">
        <button class="keyboard-char special-char" data-key="Enter">
            Enter
        </button>
    {% assign row = "zxcvbnm" | split: '' %}
    {% for char in row %}
        <button class="keyboard-char" data-key="{{char}}">
            {{char | upcase}}
        </button>
    {% endfor %}
        <button class="keyboard-char special-char" data-key="Backspace">
            Bksp
        </button>
    </div>
</div>
<link href="/css/wordle.css" rel="stylesheet" type="text/css" media="all">
<script src="/js/wordle/wordle-solver.js" type="text/javascript"></script>
<script>
    const rowTemplate = document
                        .querySelector(".template-holder")
                        .querySelector(".word-input-row");
    const displayBoard = document.querySelector("#display-board");
    
    const renderer = new CurrentGuessDisplayer(rowTemplate, displayBoard);
    const colourKeyboard = new ColourKeyboard();
    const charKeyboard = new CharacterKeyboard();
    const typingController = new TypingController(charKeyboard, colourKeyboard, renderer);

    // Enter characters when the user types
    document.onkeydown = (ev) => {
        typingController.handleKey(ev.key);
    }

    // Make the onscreen keys do something
    document.querySelectorAll(".keyboard-char").forEach((elem) => {
        elem.onclick = () => typingController.handleKey(elem.dataset.key);
    })

    // Finally, render the first line
    renderer.addNewRow();
</script>
