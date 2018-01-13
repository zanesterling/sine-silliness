/* jshint esnext: true */

// TODO: Add falling.
// TODO: Add d color settings (change per curve).
// TODO: Add delta color settings (change per unit time).
// TODO: Add more render modes.
// TODO: Add randomizer.

// TODO: Fix click-and-drag on sine wave property sliders.
// TODO: Tweak how frequency works to make it prettier.
// TODO: Fix drop bug. To repro: drop one, click on ctrl panel, try drop.

function run() {
    canvas = document.getElementById('canvas');
    canvas.width = 640;
    canvas.height = 2000;
    ctx = canvas.getContext('2d');
    w = canvas.width;
    h = canvas.height;

    state = {t: 0};
    let inputs = document.getElementsByClassName('input global');
    Array.from(inputs).forEach(input => {
        input.oninput = inputChanged;
        inputChanged({target: input}, doUpdate=false);
    });
    state.sines = count(state.numSines).reverse().map(makeSine);
    state.dropped = state.sines.map(_ => false);

    let left = document.getElementById('left-controls');
    left.appendChild(leftControls(state.sines));
    let right = document.getElementById('right-controls');
    right.appendChild(rightControls(state.sines));
    let gbs = document.getElementById('gravity-bars');
    gravityBars(state.numSines).forEach(gb => gbs.appendChild(gb));

    update();
    render(0);
}

function tryBoot() {
    if (document.readyState === 'complete') {
        run();
    } else {
        window.setTimeout(tryBoot, 100);
    }
}
tryBoot();


function update() {
    if (state.sines.length < state.numSines) {
        let indices = ints(state.sines.length, state.numSines - 1);
        state.sines = indices.map(makeSine).concat(state.sines);
        state.dropped = indices.map(_ => false).concat(state.dropped);
    } else if (state.sines.length > state.numSines) {
        let toRemove = state.sines.length - state.numSines;
        state.sines.splice(0, toRemove);
        state.dropped.splice(0, toRemove);
    }
    canvas.width = 5 * state.numSamples;

    { // Update interface.
        let left = document.getElementById('left-controls');
        while (left.firstChild) { left.removeChild(left.firstChild); }
        left.appendChild(leftControls(state.sines));

        let right = document.getElementById('right-controls');
        while (right.firstChild) { right.removeChild(right.firstChild); }
        right.appendChild(rightControls(state.sines));

        let gbs = document.getElementById('gravity-bars');
        while (gbs.firstChild) { gbs.removeChild(gbs.firstChild); }
        gravityBars(state.numSines).forEach(gb => gbs.appendChild(gb));
    }

    state.t += 0.001;
    render(state.t);

    if (state.sines.some(sine => sine.dfreq || sine.dphase || sine.dampl)) {
        setTimeout(update, 16);
    }
}

var TAU = Math.PI * 2;
function zsin(th) { return (Math.sin(th) + 1) / 2; }
function zcos(th) { return (Math.cos(th) + 1) / 2; }

function render(t) {
    // Clear canvas.
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    // Compute row offsets.
    let cfg = {};
    let withBuffer = 1.2;
    cfg.rowHeight = h / (withBuffer * state.numSines - (withBuffer - 1));
    cfg.rowHeightWithBuffer = cfg.rowHeight * withBuffer;


    // Draw rows.
    let bottom = h;
    let surface = Array(state.numSamples).fill(bottom);
    for (let i of iota(state.numSines).reverse()) {
        // Set color.
        let r = (state.numSines - i) * 255 / state.numSines;
        ctx.fillStyle = "rgb(" + r + ",0,0)";

        // Determine base height.
        let sine = state.sines[i];
        if (!state.dropped[i]) {
            let newBottom = cfg.rowHeightWithBuffer * (i+1);
            surface.fill(newBottom);
        }

        // Draw sine.
        for (let x of iota(state.numSamples)) {
            let frac = columnFrac(t, sine, x);
            let colHeight = cfg.rowHeight * frac;
            fillRectBottomUp(ctx, 5*x, surface[x], 5, colHeight);
            surface[x] -= colHeight;
        }
    }
}

const DFREQ_MAG = 10;
const DFREQ_RATE = 0.1;
const DPHASE_MAG = 0.5;
const DAMPL_MAG = 0.1;

function columnFrac(t, sine, x) {
    let y = (x + 0.5) / state.numSamples;
    let freq = sine.frequency +
        DFREQ_MAG * sine.dfreq * Math.sin(DFREQ_RATE * t);
    let phase = (sine.phase + DPHASE_MAG * sine.dphase * t) / 100;
    let ampl = (sine.amplitude * zcos(DAMPL_MAG * sine.dampl * t)) / 100;
    return ampl * zcos((y+phase) * freq * TAU);
}

function drawRow(t, stack, row, {rowHeight, rowHeightWithBuffer}) {
    iota(state.numSamples).forEach(x => {
        let vals = stack.map(sine => {
            let y = (x + 0.5) / state.numSamples;
            let freq = sine.frequency +
                DFREQ_MAG * sine.dfreq * Math.sin(DFREQ_RATE * t);
            let phase = (sine.phase + DPHASE_MAG * sine.dphase * t) / 100;
            let ampl = (sine.amplitude * zcos(DAMPL_MAG * sine.dampl * t)) / 100;
            return ampl * zcos((y+phase) * freq * TAU);
        });
        let height = sum(vals);
        fillColumn(
            ctx,
            5*x, row * rowHeightWithBuffer,
            5, rowHeight,
            height
        );
    });
}

function sum(l) {
    var s = 0;
    for (let i = 0; i < l.length; i++) {
        s += l[i];
    }
    return s;
}


function fillColumn(ctx, left, top, width, height, frac) {
    ctx.fillRect(left, top + height * (1-frac), width, height * frac);
}

function fillRectBottomUp(ctx, left, bot, width, height) {
    ctx.fillRect(left, bot - height, width, height);
}

function inputChanged(event, doUpdate=true) {
    let input = event.target;
    if (input.classList.contains('global')) {
        state[input.name] = parseInt(input.value);
    } else if (input.classList.contains('local')) {
        var [varName, i] = input.name.split('-');
        state.sines[i][varName] = parseInt(input.value);
    }

    if (doUpdate) update();
}

function iota(n) { return ints(0, n-1); }

function count(n, l=[]) {
    for (var i = 0; i < n ; i++) {
        l.push(i+1);
    }
    return l;
}

function ints(low, high) {
    let l = [];
    for (var i = low; i <= high; i++) {
        l.push(i);
    }
    return l;
}

function makeSine(n) {
    return Object.assign({}, {
        frequency: n,
        phase: 0,
        amplitude: 100,
        dfreq: 0,
        dphase: 0,
        dampl: 0
    });
}

function leftControls(sines) {
    var list = document.createElement('ul');
    list.classList.add('controls');
    var i = 0;
    sines.forEach(sine => {
        let item = document.createElement('li');
        let div = document.createElement('div');
        div.appendChild(newSlider('frequency-' + i,  1, 50,  sine.frequency));
        div.appendChild(newSlider('phase-' + i,    -50, 50,  sine.phase));
        div.appendChild(newSlider('amplitude-' + i, 10, 100, sine.amplitude));
        item.appendChild(div);
        list.appendChild(item);
        i++;
    });
    return list;
}

function rightControls(sines) {
    var list = document.createElement('ul');
    list.classList.add('controls');
    var i = 0;
    sines.forEach(sine => {
        let item = document.createElement('li');
        let div = document.createElement('div');
        div.appendChild(newSlider('dfreq-'  + i, 0, 100, sine.dfreq));
        div.appendChild(newSlider('dphase-' + i, -100, 100, sine.dphase));
        div.appendChild(newSlider('dampl-'  + i, 0, 100, sine.dampl));
        item.appendChild(div);
        list.appendChild(item);
        i++;
    });
    return list;
}

function newSlider(name, min, max, value) {
    let div = document.createElement('div');
    div.classList.add('input-wrapper');
    let slider = document.createElement('input');
    slider.name = name;
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.classList.add('slider');
    slider.classList.add('input');
    slider.classList.add('local');
    slider.oninput = inputChanged;
    div.appendChild(slider);
    return div;
}

function gravityBars(n) {
    return iota(n).map((i) => {
        let li = document.createElement('li');
        li.innerHTML = '<div> </div>';
        li.onclick = drop(i);
        return li;
    });
}

function drop(i) {
    return function(event) {
        state.dropped[i] = true;
        update();
    };
}

function resetDropped() {
    state.dropped = state.dropped.map(_ => false);
    update();
}
