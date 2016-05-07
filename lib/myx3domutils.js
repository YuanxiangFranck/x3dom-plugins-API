let x3dElem = document.getElementById("x3dElem");

let positionsUrl;
let indexUrl;
let texCoordUrl;
let normalsUrl;
let x3dom;
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
    let length =  data.length/dim;
    let res = Array(length);
    let vectType = "SFVec"+String(dim)+"f";
    for (let i = 0; i < length ; i++) {
        // If dim == 2 , the third values are ignored
        res[i] = new x3dom.fields[vectType](data[dim*i],
                                            data[dim*i+1],
                                            data[dim*i+2]);
    }
    let arrayType = "MFVec"+String(dim)+"f";
    let out = new x3dom.fields[arrayType](res);
    return out;
}

/**
 * Update the point field of an Coordinate
 */
function updateCoordPoint(elem, data){
    let values = X3domCreateArray(data, 3);
    setX3domAttribut(elem, values, "point");
}

/**
 * Update the point field of an TextureCoordinate
 */
function updateTexCoordPoint(elem, data){
    let values = X3domCreateArray(data, 2);
    setX3domAttribut(elem, values, "point");
}

/**
 * Update the vector field of an Normal
 */
function updateNormalVector(elem, data){
    let values = X3domCreateArray(data, 3);
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
    let value = X3domCreateArray(data, 1);
    setX3domAttribut(elem, value, "value");
    x3dElem.render();
}

function get(name){ return document.getElementById(name); }

/**
 * Initialize an indexedFaceSet
 */
function setIndexFaceSet(arrays){
    let positions = arrays.coord;
    let coordIndex = arrays.coordIndex;
    let normal = arrays.normal;
    let data = arrays.data;
    updateCoordPoint(get("faceSetCoord"), positions);
    updateNormalVector(get("faceSetNormal"), normal);
    updateCoordIndex(get("faceSet"), coordIndex);
    updateDataValue(get("faceSetAttr"), data);
    updateDataValue(get("triSetAttr"), data);
    updateCoordPoint(get("faceSetCoord2"), positions);
    updateNormalVector(get("faceSetNormal2"), normal);
    updateCoordIndex(get("faceSet2"), coordIndex);
    updateDataValue(get("faceSetAttr2"), data);
}

exports.updateCoordPoint = updateCoordPoint;
exports.updateTexCoordPoint = updateTexCoordPoint;
exports.setIndexFaceSet = setIndexFaceSet;
exports.updateDataValue = updateDataValue;
exports.getx3dom = getx3dom;
