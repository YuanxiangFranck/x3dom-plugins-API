var TetraMesh   = require('./lib/clipUtils/mytetraMesh').TetraMesh;
var jBinary     = require("jbinary");
var x3domUtils  = require('./lib/myx3domutils');
var utils       = require('./lib/utils');

x3dom = require('./lib/x3dom.debug.js').initX3dom();
x3domUtils.getx3dom(x3dom);
require('./threshold.js').new_node(x3dom);
require('./isoColor.js').new_node(x3dom);

var datadir = "./binGeo/piston/";
// Jbinary read and load the binary files and return the arraybuffer with a promise
var loadPositionsPromise = jBinary.loadData(datadir+'coord.bin.gz');
var loadIndexPromise     = jBinary.loadData(datadir+'tetras.bin.gz');
var loadTriIndexPromise  = jBinary.loadData(datadir+'faces.bin.gz');
var loadDataPromise      = jBinary.loadData(datadir+'data.bin.gz');
var loadNormalsPromise   = jBinary.loadData(datadir+'normals.bin.gz');

var TETRAMESH = new TetraMesh();
var CAN_START  = false;
var DATA_REAL_MIN = 0;
var DATA_REAL_MAX = 0;
// Lower and upper bound for the geometry ( y axis)
var POS_MIN = 0;
var POS_MAX = 0;

/**
 * Set the event listener on the element in the dom
 */
function initEventListener(){
    // Button to hide or unhide the clipping plane
    get("clipOnButton").addEventListener(
        'click',
        function(event){
            var clipPlane = get("clipPlane");
            if (clipPlane.getAttribute("on")==="false") return;
            var switcher = get("switcher");
            var on = switcher.getAttribute("whichChoice") === "0"? "-1" : "0";
            switcher.setAttribute("whichChoice", on);
        }, false );

    // Slider to move the clipping plane in y axis
    get("clipSlider").addEventListener(
        'change',
        function(event){
            var pos = -1*(POS_MIN + this.value*(POS_MAX-POS_MIN));
            var clipPlane = get("clipPlane");
            if (this.value == 0) {
                clipPlane.setAttribute("on", "false");
                // get("disp").innerHTML = "no clipping";
            }
            else if (CAN_START){
                // Equation is a*X + b*Y +c*Z + d = 0
                var newpos = '0, 1, 0, ' + pos;
                clipPlane.setAttribute("on", "true");
                clipPlane.setAttribute("value", newpos);
                clipPlane.setAttribute("plane", newpos);
                get("clipPlane2").setAttribute("plane", '0, -1, 0, ' + (-1*pos));
                // get("disp").innerHTML = "y = "+(-1*pos);
                createClipping(pos);
            }
            // else {
            //     get("disp").innerHTML = "data not loaded";
            // }
        }, false );

    // Slider to change the iso color
    get("isoColor1" ).addEventListener('change', updateIsoColor);
    get("isoColor2" ).addEventListener('change', updateIsoColor);
    get("threshold1").addEventListener('change', updateThreshold);
    get("threshold2").addEventListener('change', updateThreshold);
    get("transx").addEventListener('change', updateTranslation);
    get("transy").addEventListener('change', updateTranslation);
    get("transz").addEventListener('change', updateTranslation);
}

/**
 * Update the map color with the new border values
 */
function updateIsoColor() {
    var sliderValues = utils.getSliderMinMax("isoColor", DATA_REAL_MIN, DATA_REAL_MAX);
    get("faceSetIsoColor").setAttribute("min", sliderValues.min);
    get("faceSetIsoColor").setAttribute("max", sliderValues.max);
    get("triSetIsoColor").setAttribute("min", sliderValues.min);
    get("triSetIsoColor").setAttribute("max", sliderValues.max);
}

function updateTranslation() {
    var translation =
            get("transx").value+" "+
            get("transy").value+" "+
            get("transz").value;
    get("transform").setAttribute("translation", translation);
}

/**
 * Update the map color with the new border values
 */
function updateThreshold() {
    var sliderValues = utils.getSliderMinMax("threshold", DATA_REAL_MIN, DATA_REAL_MAX);
    get("faceSetThreshold").setAttribute("lowerBound", sliderValues.min);
    get("faceSetThreshold").setAttribute("upperBound", sliderValues.max);
    get("faceSetThreshold2").setAttribute("lowerBound", sliderValues.min);
    get("faceSetThreshold2").setAttribute("upperBound", sliderValues.max);
    get("triSetThreshold").setAttribute("lowerBound", sliderValues.min);
    get("triSetThreshold").setAttribute("upperBound", sliderValues.max);
}

/**
 * Compute the new clip plane from the new position (pos)
 * Update the Triangle Set for rendering
 */
function createClipping(pos){
    // Plane Equation is a*X + b*Y +c*Z + d = 0
    var res = TETRAMESH.makeSlice(0, 1, 0, Number(pos));
    var triCoord = res["vertex"];
    var trisetData = res["data"];
    var sliderValues;
    if (triCoord.length !== 0) {
        x3domUtils.updateCoordPoint(get("triSetCoordinate"), triCoord);
        x3domUtils.updateDataValue(get("triSetAttr"), trisetData);
        sliderValues = utils.getSliderMinMax("isoColor", DATA_REAL_MIN, DATA_REAL_MAX);
        get("triSetIsoColor").setAttribute("min", sliderValues.min);
        get("triSetIsoColor").setAttribute("max", sliderValues.max);
        sliderValues = utils.getSliderMinMax("threshold", DATA_REAL_MIN, DATA_REAL_MAX);
        get("triSetThreshold").setAttribute("lowerBound", sliderValues.min);
        get("triSetThreshold").setAttribute("upperBound", sliderValues.max);
    }
}

/**
 * Main : lunched after loading all the data
 */
Promise.all([loadPositionsPromise, loadIndexPromise, loadTriIndexPromise,
             loadDataPromise, loadNormalsPromise])
    .then(function(bufferArrays) {
        var posArray    = new Float32Array(bufferArrays[0]);
        var tetraArray  = new Uint32Array(bufferArrays[1]);
        var triArray    = new Int32Array(bufferArrays[2]);
        var dataArray   = new Float32Array(bufferArrays[3]);
        var normalArray = new Float32Array(bufferArrays[4]);
        var positions   = utils.scale_center(posArray);
        var data = dataArray;
        DATA_REAL_MIN = Math.min.apply(null, data);
        DATA_REAL_MAX = Math.max.apply(null, data);
        get("faceSetIsoColor").setAttribute("min",DATA_REAL_MIN);
        get("faceSetIsoColor").setAttribute("max",DATA_REAL_MAX);
        get("faceSetThreshold").setAttribute("lowerBound",DATA_REAL_MIN);
        get("faceSetThreshold").setAttribute("upperBound",DATA_REAL_MAX);
        get("faceSetThreshold2").setAttribute("lowerBound",DATA_REAL_MIN);
        get("faceSetThreshold2").setAttribute("upperBound",DATA_REAL_MAX);
        // Initialise the tetra mesh : compute aabb / octree
        TETRAMESH.initTetraMesh(positions, tetraArray, data);
        POS_MIN = TETRAMESH.octree_.aabbLoose_.min_[1];
        POS_MAX = TETRAMESH.octree_.aabbLoose_.max_[1];
        CAN_START = true;
        // Set the data of the IndexedFaceSet
        x3domUtils.setIndexFaceSet({"coord": positions,
                                    "coordIndex": triArray,
                                    "normal": normalArray,
                                    "data": data});
        // Initialise the event lisner on the sliders
        initEventListener();
        createClipping(0);
        // Set slider description
        // get("disp").innerHTML = "no clipping";
    });

function get(name){ return document.getElementById(name); }
