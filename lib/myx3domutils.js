var x3dElem = document.getElementById("x3dElem");

var positionsUrl;
var indexUrl;
var texCoordUrl;
var normalsUrl;
var x3dom;
function getx3dom(_x3dom){
    x3dom = _x3dom;
}
/**
 * Update the coordIndex field of an IndexedFaceSet
 */
function setX3domAttribut(elem, values, field){
    elem._x3domNode._vf[field] = values;
    elem._x3domNode.fieldChanged(field);
    x3dElem.render();
}


/**
 * Set attribut for an x3dom element
 * Can only be used to set 2d or 3d float array
 * Exemple the point file of a Coordinate object
 */
function X3domCreateArray(data, dim){
    if (dim ==1) return new x3dom.fields.MFFloat(data);
    var length =  data.length/dim;
    var res = Array(length);
    var vectType = "SFVec"+String(dim)+"f";
    for (var i = 0; i < length ; i++) {
        // If dim == 2 , the third values are ignored
        res[i] = new x3dom.fields[vectType](data[dim*i],
                                            data[dim*i+1],
                                            data[dim*i+2]);
    }
    var arrayType = "MFVec"+String(dim)+"f";
    var out = new x3dom.fields[arrayType](res);
    return out;
}

/**
 * Update the point field of an Coordinate
 */
function updateCoordPoint(elem, data){
    var values = X3domCreateArray(data, 3);
    setX3domAttribut(elem, values, "point");
}

/**
 * Update the point field of an TextureCoordinate
 */
function updateTexCoordPoint(elem, data){
    var values = X3domCreateArray(data, 2);
    setX3domAttribut(elem, values, "point");
}

/**
 * Update the vector field of an Normal
 */
function updateNormalVector(elem, data){
    var values = X3domCreateArray(data, 3);
    setX3domAttribut(elem, values, "vector");
}

/**
 * Update the vector field of an Normal
 */
function updateCoordIndex(elem, data){
    setX3domAttribut(elem, data, "coordIndex");
}

/**
 * Update the value field of an FloatVertexAttribute
 */
function updateDataValue(elem, data){
    var value = X3domCreateArray(data, 1);
    setX3domAttribut(elem, value, "value");
    x3dElem.render();
}

function get(name){ return document.getElementById(name); }

/**
 * Initialize an indexedFaceSet
 */
function setIndexFaceSet(arrays){
    var positions = arrays.coord;
    var coordIndex = arrays.coordIndex;
    var normal = arrays.normal;
    var data = arrays.data;
    updateCoordPoint(get("faceSetCoord"), positions);
    updateNormalVector(get("faceSetNormal"), normal);
    updateCoordIndex(get("faceSet"), coordIndex);
    updateDataValue(get("faceSetAttr"), data);
    updateDataValue(get("triSetAttr"), data);
}

exports.updateCoordPoint = updateCoordPoint;
exports.updateTexCoordPoint = updateTexCoordPoint;
exports.setIndexFaceSet = setIndexFaceSet;
exports.updateDataValue = updateDataValue;
exports.getx3dom = getx3dom;
