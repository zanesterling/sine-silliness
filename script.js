/* jshint esnext: true */

run = function () {
    canvas = document.getElementById('canvas');
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext('2d');
    w = canvas.width;
    h = canvas.height;

    state = {};
    let inputs = document.getElementsByClassName('input');
    Array.from(inputs).forEach(input => {
        input.onchange=inputChanged;
        inputChanged({target: input});
    });

    update();
    render(0);
};

update = function() {
    state.sines = count(state.numSines).reverse().map(makeSine);
    canvas.width = 5 * state.numSamples + 20;

    let left = document.getElementsByClassName('left')[0];
    while (left.firstChild) { left.removeChild(left.firstChild); }
    left.appendChild(leftControls(state.sines));
};

const TAU = Math.PI * 2;

render = function(t) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgb(255,0,0)";

    let margin = 10;
    let buffer = 0.2;
    let rowHeight = ((h - 2 * margin) / (state.numSines * (1 + buffer)));
    iota(state.sines.length).forEach(i => {
        let sine = state.sines[i];
        iota(state.numSamples).forEach(x => {
            let sinArg = x * sine.frequency / state.numSamples * TAU;
            let ampl = rowHeight * sine.amplitude / 100;
            // fillRectBottomUp(ctx, margin + 5*x, 100, 20, 20);
            fillRectBottomUp(ctx,
                margin + 5*x,
                margin + (i+1) * rowHeight * (1 + buffer),
                5,
                ampl * (Math.cos(sinArg) + 1) * 0.5);
        });
    });
};

function fillRectBottomUp(ctx, left, bot, width, height) {
    ctx.fillRect(left, bot - height, width, height);
}

function inputChanged(event) {
    let input = event.target;
    let varName = input.id.split('-')[1];
    state[varName] = parseInt(input.value);

    update();
    render(0);
}

function iota(n) { return count(n-1, [0]); }

function count(n, l) {
    if (!l) {l = [];}
    for (var i = 0; i < n ; i++) {
        l.push(i+1);
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
        // TODO: Add controls for each sin wave.
        item.innerHTML = "blah";
        list.appendChild(item);
        i++;
    });
    return list;
}

window.onload = run;
