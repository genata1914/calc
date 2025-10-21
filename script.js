const expressionInput = document.getElementById('expression');
const resultDisplay = document.getElementById('result');
const buttons = document.querySelectorAll('.button-grid.basic button');
const scientificButtons = document.querySelectorAll('.button-grid.scientific button');
const scientificGrid = document.querySelector('.button-grid.scientific');
const themeToggle = document.getElementById('theme-toggle');
const modeToggle = document.getElementById('mode-toggle');
const clearHistoryBtn = document.getElementById('clear-history');
const historyList = document.getElementById('history-list');
const calculator = document.querySelector('.calculator');

const STORAGE_KEYS = {
    history: 'calc-history',
    theme: 'calc-theme',
    scientific: 'calc-scientific-mode',
};

let expression = '';
let lastResult = 0;

function loadState() {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
    if (savedHistory) {
        try {
            const history = JSON.parse(savedHistory);
            history.slice().reverse().forEach(addHistoryItem);
        } catch (error) {
            console.error('Грешка при зареждане на историята', error);
        }
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme) {
        calculator.dataset.theme = savedTheme;
        document.body.style.setProperty('--bg', savedTheme === 'dark' ? '#1d1f27' : '#f5f5f5');
    }

    const savedScientific = localStorage.getItem(STORAGE_KEYS.scientific);
    if (savedScientific === 'true') {
        toggleScientific(true);
    }
}

function saveHistory() {
    const items = Array.from(historyList.children).map((li) => ({
        expression: li.dataset.expression,
        result: li.dataset.result,
    }));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items));
}

function addHistoryItem({ expression, result }) {
    const li = document.createElement('li');
    li.dataset.expression = expression;
    li.dataset.result = result;
    li.innerHTML = `<span>${expression}</span><strong>${result}</strong>`;
    historyList.prepend(li);
}

function updateDisplays() {
    expressionInput.value = expression || '0';
    resultDisplay.textContent = lastResult;
}

function appendValue(value) {
    expression += value;
    updateDisplays();
}

function clearExpression() {
    expression = '';
    lastResult = 0;
    updateDisplays();
}

function backspace() {
    expression = expression.slice(0, -1);
    updateDisplays();
}

function calculate() {
    if (!expression.trim()) return;
    try {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expression})`)();
        lastResult = Number.isFinite(result) ? +result.toFixed(8) : 'Грешка';
        addHistoryItem({ expression, result: lastResult });
        saveHistory();
        expression = String(lastResult);
        updateDisplays();
    } catch (error) {
        lastResult = 'Грешка';
        updateDisplays();
    }
}

function applyScientific(funcName, args) {
    const value = expression ? Number(expression) : Number(lastResult);
    if (Number.isNaN(value)) return;

    let result;
    if (funcName === 'Math.pow') {
        const power = Number(args);
        result = Math.pow(value, power);
    } else {
        const fn = Function(`return ${funcName}`)();
        result = fn(value);
    }

    const rounded = +result.toFixed(8);
    expression = String(rounded);
    lastResult = rounded;
    updateDisplays();
}

function toggleTheme() {
    const current = calculator.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    calculator.dataset.theme = next;
    document.body.style.setProperty('--bg', next === 'dark' ? '#1d1f27' : '#f5f5f5');
    localStorage.setItem(STORAGE_KEYS.theme, next);
}

function toggleScientific(forceState) {
    const shouldEnable = typeof forceState === 'boolean'
        ? forceState
        : scientificGrid.classList.contains('hidden');
    scientificGrid.classList.toggle('hidden', !shouldEnable);
    modeToggle.classList.toggle('active', shouldEnable);
    localStorage.setItem(STORAGE_KEYS.scientific, shouldEnable);
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const { action, value } = button.dataset;
        switch (action) {
            case 'clear':
                clearExpression();
                break;
            case 'backspace':
                backspace();
                break;
            case 'calculate':
                calculate();
                break;
            default:
                appendValue(value);
        }
    });
});

scientificButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const { func, args } = button.dataset;
        applyScientific(func, args);
    });
});

themeToggle.addEventListener('click', toggleTheme);
modeToggle.addEventListener('click', () => toggleScientific());
clearHistoryBtn.addEventListener('click', () => {
    historyList.innerHTML = '';
    saveHistory();
});

loadState();
updateDisplays();
