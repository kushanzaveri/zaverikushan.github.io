/*global math*/

var graph_button = document.getElementById('graph_button');
var equation_elem = document.getElementById('equation');
var x_elem = document.getElementById('x');
var y_elem = document.getElementById('y');
var step_size_elem = document.getElementById('step_size');
var iterations_elem = document.getElementById('iterations');
var canvas_elem = document.getElementById('canvas');
canvas_elem.style.cursor = 'default'; // Don't change to text selection cursor
var canvas = canvas_elem.getContext('2d');
var iterations, step_size, points, scope;
var start = {x: -1, y: -1}, scale = 50; // Grid bottom-left corner relative to graph points
var w, h; // width and height of canvas element
var prevmouse; // Previous mouse location
var panning = false;
var scrollscale;
var mouse_pos; // mouse position
var zoomscale = 1.2;

// point object constructor
function point(x, y) {
    this.x = x;
    this.y = y;
}

var node = null, func = null;
var ROUND = 6;

function valid_input() {
    if(equation_elem.value === null || equation_elem.value.trim() === '')
        return 'invalid equation';
    
    if(x_elem.value === null || x_elem.value === '' || math.isNaN(x_elem.value))
        return 'invalid x value';
    
    if(y_elem.value === null || y_elem.value === '' || math.isNaN(y_elem.value))
        return 'invalid y value';
    
    if(step_size_elem.value === null || step_size_elem.value === '' || math.isNaN(step_size_elem.value))
        return 'invalid step size';
    
    // TODO: TEST THIS MORE
    if(iterations_elem.value === null || iterations_elem.value === '' || math.isNaN(iterations_elem.value) || !math.isInteger(iterations_elem.value))
        return 'invalid iteration value';
    
    node = math.parse(equation_elem.value);
    func = node.compile();
    
    var scope = {
        x: x_elem.value,
        y: y_elem.value
    };
    
    try {
        console.log(func.eval(scope));
    }
    catch(err) {
        return err.message;
    }
    
    return 'valid';
}

function graph() {
    var status = valid_input();

    if(status === 'valid') {
        console.log('valid input');
        // graphing stuff
        iterations = parseInt(iterations_elem.value, 10);
        step_size = parseFloat(step_size_elem.value);
        
        points = Array(iterations + 1);
        scope = null;
        
        // do (iterations / 2) iterations to the left of initial point, and (iterations / 2) iterations to the right of initial point
        
        points[iterations / 2] = new point(parseInt(x_elem.value, 10), parseInt(y_elem.value, 10));
        
        // left side
        for (var n = iterations / 2 - 1; n >= 0; --n) {
            scope = {
                x: points[n + 1].x,
                y: points[n + 1].y
            };
            
            points[n] = new point(points[n + 1].x - step_size, points[n + 1].y - step_size * func.eval(scope));
            
            // deals with coordinates being NaN or +-INFINITY
            if(isFinite(points[n].x))
               points[n].x = math.round(points[n].x, ROUND);
               
            if(isFinite(points[n].y))
                points[n].y = math.round(points[n].y, ROUND);
        }
        
        // right side
        for(var n = iterations / 2 + 1; n <= iterations; ++n) {
            scope = {
                x: points[n - 1].x,
                y: points[n - 1].y
            };
            
            points[n] = new point(points[n - 1].x + step_size, points[n - 1].y + step_size * func.eval(scope));
            
            // deals with coordinates being NaN or +-INFINITY
            if(isFinite(points[n].x))
               points[n].x = math.round(points[n].x, ROUND);
               
            if(isFinite(points[n].y))
                points[n].y = math.round(points[n].y, ROUND);
        }
        
        /*for(var n = 0; n < points.length; ++n) {
            console.log(points[n].x + " " + points[n].y);
        }*/
        
        scale = 50;
        drawGraph();
    }
    else {
        alert(status);
    }
}

function distortx(x) {
    return (x - start.x) * scale;
}

function undistortx(x) {
    return x / scale + start.x;
}

function distorty(y) {
    return h - (y - start.y) * scale;
}

function undistorty(y) {
    return (h - y) / scale + start.y;
}

function drawGrid() {
    var occ = 1;
    if(Math.abs(Math.pow(10, Math.ceil(Math.log10(50 / scale))) - 50) < Math.abs(Math.pow(10, Math.ceil(Math.log10(50 / scale))) / 2 - 50))
        occ = Math.pow(10, Math.ceil(Math.log10(50 / scale)));
    else
        occ = Math.pow(10, Math.ceil(Math.log10(50 / scale))) / 2;
    console.log('occ: ' + occ);
    
    canvas.clearRect(0, 0, w, h);
    canvas.lineWidth = 1;
    canvas.strokeStyle = '#dddddd';
    canvas.beginPath();
    
    // Horizontal lines
    for(var y = Math.floor(start.y / occ); y <= Math.ceil((start.y + h / scale) / occ); y++) {
        console.log(y * occ);
        canvas.moveTo(0, distorty(y * occ));
        canvas.lineTo(w, distorty(y * occ));
    }
    
    // Vertical lines
    for(var x = Math.floor(start.x / occ); x <= Math.ceil((start.x + w / scale) / occ); x++) {
        canvas.moveTo(distortx(x * occ), 0);
        canvas.lineTo(distortx(x * occ), h);
    }
    
    // Drawing coordinate axes
    canvas.stroke();
    canvas.beginPath();
    canvas.lineWidth = 2;
    canvas.strokeStyle = '#4d4d4d';
    if(distorty(0) >= 0 && distorty(0) <= h) {
        canvas.moveTo(0, distorty(0));
        canvas.lineTo(w, distorty(0));
    }
    if(distortx(0) >= 0 && distortx(0) <= w) {
        canvas.moveTo(distortx(0), 0);
        canvas.lineTo(distortx(0), h);
    }
    canvas.stroke();
}

function drawGraph() {
    //console.log(canvas.width + ', ' + canvas.height);
    drawGrid();
    canvas.lineWidth = 5;
    canvas.strokeStyle = '#2994cc';
    
    //console.log('------');
    
    canvas.beginPath();
    canvas.moveTo(distortx(points[0].x), distorty(points[0].y));
    for(var n = 1; n < points.length; n++) {
        canvas.lineTo(distortx(points[n].x), distorty(points[n].y));
        //console.log(distortx(points[n].x) + ' ' + distorty(points[n].y));
    }
    canvas.stroke();
}

graph_button.onclick = graph;

// init canvas resizing
window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();

function resizeCanvas() {
    w = canvas_elem.width = canvas.width = canvas_elem.scrollWidth;
    h = canvas_elem.height = canvas.height = canvas_elem.scrollHeight;
    
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
}

function get_mouse_pos(c, evt) {
    var rect = c.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
}

canvas_elem.addEventListener('mousedown', function(evt) {
    panning = true;
    prevmouse = get_mouse_pos(canvas_elem, evt);
});

canvas_elem.addEventListener('mousemove', function(evt) {
    if(panning) {
        mouse_pos = get_mouse_pos(canvas_elem, evt);
        start.x += -(mouse_pos.x - prevmouse.x) / scale;
        start.y += (mouse_pos.y - prevmouse.y) / scale;
        prevmouse = mouse_pos;
        
        if(valid_input() === 'valid')
            drawGraph();
        else
            drawGrid();
    }
  }, false);

canvas_elem.addEventListener('mouseup', function(evt) {
    panning = false;
});

canvas_elem.addEventListener('mouseout', function(evt) {
    panning = false;
});

canvas_elem.addEventListener('wheel', function(evt) {
    mouse_pos = get_mouse_pos(canvas_elem, evt);
    if(evt.wheelDelta < 0) {
        scale /= zoomscale;
        start.x -= (undistortx(mouse_pos.x) - start.x) * (zoomscale - 1);
        start.y -= (undistorty(mouse_pos.y) - start.y) * (zoomscale - 1);
    }
    else {
        scale *= zoomscale;
        start.x += (undistortx(mouse_pos.x) - start.x) * (1 - 1 / zoomscale);
        start.y += (undistorty(mouse_pos.y) - start.y) * (1 - 1 / zoomscale);
    }
    
    if(valid_input() === 'valid')
        drawGraph();
    else
        drawGrid();
});
