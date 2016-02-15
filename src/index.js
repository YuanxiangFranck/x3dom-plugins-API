let jBinary     = require("jbinary");

let TetraMesh   = require('./clipUtils/mytetraMesh');
let x3domUtils  = require('./x3dom/myx3domutils');

let utils       = require('./utils');
let get = utils.get; // alia for document.getElementById

let x3dom = require('./x3dom/x3dom.debug.js');
require('./x3dom/plugins/threshold.js')(x3dom);
require('./x3dom/plugins/isoColor.js')(x3dom);

let datadir = "./binGeo/piston/";
// Jbinary read and load the binary files and return the arraybuffer with a promise

var loadPositionsPromise = jBinary.loadData(datadir+'coord.bin');
var loadIndexPromise     = jBinary.loadData(datadir+'tetras.bin');
var loadTriIndexPromise  = jBinary.loadData(datadir+'faces.bin');
var loadDataPromise      = jBinary.loadData(datadir+'data.bin');
var loadNormalsPromise   = jBinary.loadData(datadir+'normals.bin');

let loadPromise = new Promise(function(resolve,reject){
    document.addEventListener("load", resolve );
});
let TETRAMESH = new TetraMesh();
let HAS_SLICE  = false;
let DATA_REAL_MIN = 0;
let DATA_REAL_MAX = 0;
// Lower and upper bound for the geometry ( y axis)
let POS_MIN = 0;
let POS_MAX = 0;

/**
 * Set the event listener on the element in the dom
 */
function initEventListener(){
    // Button to hide or unhide the clipping plane
    get("resetButton").addEventListener(
        'click',
        function(event){
            get("transx").value=0;
            get("transy").value=0;
            get("transz").value=0;
            get("translation").setAttribute("translation", "0 0 0");
        }, false );

    get("cboxUncolored").addEventListener(
        'click',
        function(event){
            let test = get("faceSetShape2").getAttribute("render");
            if (test == "true"){
                get("faceSetShape2").setAttribute("render", "false");
                get("transx").disabled = true;
                get("transy").disabled = true;
                get("transz").disabled = true;
                get("cboxUncolored").checked = false;
            }
            else {
                get("faceSetShape2").setAttribute("render", "true");
                get("transx").disabled = false;
                get("transy").disabled = false;
                get("transz").disabled = false;
                get("cboxUncolored").checked = true;
            }
        }, false );

    get("cboxClipPlane").addEventListener(
        'click',
        function(event){
            let test = get("triSetShape").getAttribute("render");
            if (test == "true"){
                get("triSetShape").setAttribute("render", "false");
                get("cboxClipPlane").checked= false;
            }
            else {
                get("triSetShape").setAttribute("render", "true");
                get("cboxClipPlane").checked= true;
            }
        }, false );

    // Slider to move the clipping plane in y axis
    get("clipSlider").addEventListener(
        'input',
        function(event){
            let pos = -1*(POS_MIN + this.value*(POS_MAX-POS_MIN));
            let clipPlane = get("clipPlane");
            if (this.value == 0) {
                clipPlane.setAttribute("on", "false");
                get("clipPlane2").setAttribute("plane", '0, -1, 0, ' + (-1*pos));
            }
            else if (HAS_SLICE){
                // Equation is a*X + b*Y +c*Z + d = 0
                let newpos = '0, 1, 0, ' + pos;
                clipPlane.setAttribute("on", "true");
                clipPlane.setAttribute("value", newpos);
                clipPlane.setAttribute("plane", newpos);
                get("clipPlane2").setAttribute("plane", '0, -1, 0, ' + (-1*pos));
                createClipping(pos);
            }
            // else {
            //     get("disp").innerHTML = "data not loaded";
            // }
        }, false );

    // Slider to change the iso color
    get("isoColor1" ).addEventListener('input', updateIsoColor);
    get("isoColor2" ).addEventListener('input', updateIsoColor);
    get("threshold1").addEventListener('input', updateThreshold);
    get("threshold2").addEventListener('input', updateThreshold);
    get("transx").addEventListener('input', updateTranslation);
    get("transy").addEventListener('input', updateTranslation);
    get("transz").addEventListener('input', updateTranslation);
}

/**
 * Update the map color with the new border values
 */
function updateIsoColor() {
    let sliderValues = utils.getSliderMinMax("isoColor", DATA_REAL_MIN, DATA_REAL_MAX);
    get("faceSetIsoColor").setAttribute("min", sliderValues.min);
    get("faceSetIsoColor").setAttribute("max", sliderValues.max);
    get("triSetIsoColor").setAttribute("min", sliderValues.min);
    get("triSetIsoColor").setAttribute("max", sliderValues.max);
}

function updateTranslation() {
    let translation =
            get("transx").value+" "+
            get("transy").value+" "+
            get("transz").value;
    get("translation").setAttribute("translation", translation);
}

/**
 * Update the map color with the new border values
 */
function updateThreshold() {
    let sliderValues = utils.getSliderMinMax("threshold", DATA_REAL_MIN, DATA_REAL_MAX);
    if (get("cboxthreshold").checked) {
    get("faceSetThreshold").setAttribute("lowerbound", sliderValues.min);
    get("faceSetThreshold").setAttribute("upperbound", sliderValues.max);
    get("triSetThreshold").setAttribute("lowerbound", sliderValues.min);
    get("triSetThreshold").setAttribute("upperbound", sliderValues.max);
    }
    get("faceSetThreshold2").setAttribute("lowerbound", sliderValues.min);
    get("faceSetThreshold2").setAttribute("upperbound", sliderValues.max);
}

/**
 * Compute the new clip plane from the new position (pos)
 * Update the Triangle Set for rendering
 */
function createClipping(pos){
    // Plane Equation is a*X + b*Y +c*Z + d = 0
    let res = TETRAMESH.makeSlice(0, 1, 0, Number(pos));
    let triCoord = res["vertex"];
    let trisetData = res["data"];
    let sliderValues;
    if (triCoord.length !== 0) {
        x3domUtils.updateCoordPoint(get("triSetCoordinate"), triCoord);
        x3domUtils.updateDataValue(get("triSetAttr"), trisetData);
        sliderValues = utils.getSliderMinMax("isoColor", DATA_REAL_MIN, DATA_REAL_MAX);
        get("triSetIsoColor").setAttribute("min", sliderValues.min);
        get("triSetIsoColor").setAttribute("max", sliderValues.max);
    }
}

/**
 * Main : lunched after loading all the data
 */
Promise.all([loadPositionsPromise, loadIndexPromise, loadTriIndexPromise,
             loadDataPromise, loadNormalsPromise, loadPromise])
    .then(function(bufferArrays) {
        let posArray    = new Float32Array(bufferArrays[0]);
        let tetraArray  = new Uint32Array(bufferArrays[1]);
        let triArray    = new Int32Array(bufferArrays[2]);
        let dataArray   = new Float32Array(bufferArrays[3]);
        let normalArray = new Float32Array(bufferArrays[4]);
        let positions   = utils.scale_center(posArray);
        let data = dataArray;
        DATA_REAL_MIN = Math.min.apply(null, data);
        DATA_REAL_MAX = Math.max.apply(null, data);
        get("faceSetIsoColor").setAttribute("min",DATA_REAL_MIN);
        get("faceSetIsoColor").setAttribute("max",DATA_REAL_MAX);
        get("faceSetIsoColor2").setAttribute("min",DATA_REAL_MIN);
        get("faceSetIsoColor2").setAttribute("max",DATA_REAL_MAX);
        get("triSetThreshold").setAttribute("upperBound",DATA_REAL_MAX);
        get("triSetThreshold").setAttribute("lowerBound",DATA_REAL_MIN);
        get("faceSetThreshold").setAttribute("lowerBound",DATA_REAL_MIN);
        get("faceSetThreshold").setAttribute("upperBound",DATA_REAL_MAX);
        get("faceSetThreshold2").setAttribute("lowerBound",DATA_REAL_MIN);
        get("faceSetThreshold2").setAttribute("upperBound",DATA_REAL_MAX);
        // Initialise the tetra mesh : compute aabb / octree
        TETRAMESH.initTetraMesh(positions, tetraArray, data);
        POS_MIN = TETRAMESH.octree_.aabbLoose_.min_[1];
        POS_MAX = TETRAMESH.octree_.aabbLoose_.max_[1];
        HAS_SLICE = true;
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
