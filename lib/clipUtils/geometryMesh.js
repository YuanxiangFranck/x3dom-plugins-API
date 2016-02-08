'use strict';
var Octree = require('./octree').Octree;
var Plane = require('./plane').Plane;
var Aabb = require('./aabb').Aabb;
var mat4 = require('gl-matrix-mat4');
var vec3 = require('gl-matrix-vec3');
var mat3 = require('gl-matrix-mat3');
var Geometry = require('./geometry').Geometry;
/**
 * A tetrahedrical mesh represented by the geometry buffers and a transformation matrix.
 *
 * @class
 * @param {Float32Array} nodeArray_ The array of nodes
 * @param {Uint32Array|Uint16Array} tetraArray_ The index array defining the tetrahedron
 * @param {vec3} center_ The center of the mesh
 * @param {Octree} octree_ The octree of the mesh
 * @param {mat4} matTransform_ The transformation matrix of the mesh
 * @param {float} scale_ The scale of the mesh
 */
function GeometryMesh() {
    //tetrahedron informations

    this.countVertices_ = 0;
    this.nodeArray_ = null;
    this.indexArray_ = null;
    this.dataArray_ = null;
    this.endOfGeometry = [-1];

    this.center_ = [0, 0, 0];
    this.octree_ = new Octree();

    this.matTransform_ = mat4.create();
    this.scale_ = 1;

    this.initGeometryMesh = function(){
        // Get the end of each geometry
        var idx = this.indexArray.indexOf(-1);
        while (idx != -1) {
            this.endOfGeometry_.push(idx);
            idx = this.indexArray.indexOf(-1, idx + 1);
        }
        var n = this.indexArray.length;
        // Add the last geometry If the index array do not end with -1
        if (this.indexArray[n-1] != -1) this.endOfGeometry_.push(n);
        this.computeAabbAndCenter();
        this.computeOctree();
    };

    /**
     * Compute the root bounding box and the mesh center.
     */
    this.computeAabbAndCenter= function() {
        var vAr = this.nodeArray_;
        var aabb = this.octree_.aabbLoose_;
        aabb.min_ = [vAr[0], vAr[1], vAr[2]];
        aabb.max_ = [vAr[0], vAr[1], vAr[2]];
        var nbVertices = vAr.length / 3;
        for (var i = 0; i < nbVertices; ++i)
        {
            var j = i * 3;
            aabb.expandsWithPoint(vAr[j], vAr[j + 1], vAr[j + 2]);
        }
        this.center_ = aabb.computeCenter();
    };

    /**
     * Compute the mesh octree (used for picking).
     *
     */
    this.computeOctree = function() {
        var nbGeo = this.endOfGeometry_.length-1;
        var geometryAll = new Array(nbGeo);
        var geometryAabb = new Array(nbGeo);
        var vertices = new Array(3*nbGeo);
        var count = 0;
        for (var i = 0; i < nbGeo; ++i)
        {
            geometryAll[i] = i;
            geometryAabb[i] = new Aabb();
            var indices= this.getGeometryIndices(i);
            this.getGeometryVertices(indices, vertices, count);
            count += 3*indices.length;
            Geometry.ComputeGeometryAabb(geometryAabb[i], vertices);
        }
        this.octree_.build(geometryAll, geometryAabb, this.octree_.aabbLoose_);
    };

    /**
     * Get the indices of a geometry.
     * @param {int} i The index of the geometry
     */
    this.getGeometryIndices = function(i){
        var start = this.endOfGeometry_[i]+1,
            end   = this.endOfGeometry_[i+1];
        return this.indexArray_.slice(start, end);

    };

    /**
     * Get the indices of a geometry.
     * If a list a verticies is given, the function update the list
     * @param {int} i The index of the geometry
     * @param {Array} vertices [optionnal] The vertices list to update
     * @param {int} start [optionnal] The position where to start update vertices
     */
    this.getGeometryVertices = function(indices, vertices, start){
        var n = indices.length;
        if (start === undefined) {
            start = 0;
        }
        if (vertices === undefined) {
            vertices = new Array(3*n);
        }
        for (var j = 0; j < n; i++) {
            vertices[start + 3*j]   = this.nodeArray_[3*indices[j]];
            vertices[start + 3*j+1] = this.nodeArray_[3*indices[j]+1];
            vertices[start + 3*j+2] = this.nodeArray_[3*indices[j]+2];
        }
        return vertices;
    };


    /**
     * Make a slice from the trehadrical mesh.
     *
     * @param {Plane} plane The cutting plane
     */
    this.makeSlice = function(a, b, c, d) {
        var plane = new Plane();
        // Equation is a*X + b*Y +c*Z + d = 0
        plane.updateFromEquation(a, b, c, d);
        //transform the plane in the same space as the tetra mesh
        var origin = [plane.originX_, plane.originY_, plane.originZ_];
        var normal = [plane.normalX_, plane.normalY_, plane.normalZ_];
        vec3.normalize(normal, normal);
        var matInverse = mat4.create();
        mat4.invert(matInverse, this.matTransform_);
        vec3.transformMat4(origin, origin, matInverse);
        vec3.transformMat3(normal, normal, mat3.normalFromMat4(mat3.create(), matInverse));

        //plane octree intersection
        var iGeometryCandidates = this.octree_.intersectPlane(origin, normal);
        var nbGeometryCandidates = iGeometryCandidates.length;

        var vAr = [];
        var dAr = [];
        var pts = this.nodeArray_;
        var ids = this.tetraArray_;
        var datas = this.dataArray_;
        var tmp = [0, 0, 0];
        var i = 0;

        //For each tetrahedron...
        for(i = 0; i < nbGeometryCandidates; ++i) {
            var id = this.getGeometryIndices(iGeometryCandidates[i]);
            var v = this.getGeometryVertices(id);
            var n = v.length;
            var dot = [];
            for (var j = 0;j < n; j++ ) {
                dot.push(vec3.dot(normal, vec3.sub(tmp, origin, v[j])) > 0 ? -1 : 1);
            }
            var interPoints = [];
            var interScalar = [];
            var vinter = [];
            var coeff=0;
            // For each edges find if there is an intersection
            for ( var k = 0; k < n-1; k++) {
                for( var l = k+1; l < n ; l++ ) {
                    // Test if the two points are on the same side of the plane
                    if (dot[k]*dot[l]>0) continue;
                    vinter = Geometry.intersectionSegmentPlane(v[k], v[l], origin, normal);
                    coeff = vinter[1] / vec3.dist(v[k], v[l]);
                    if (isNaN(vinter[0][0]) || isNaN(vinter[0][1]) || isNaN(vinter[0][2]) ) {
                        console.log("intersection is nan");
                    }
                    if (isNaN(coeff)) { console.log("coeff is Nan");}
                    interPoints.push(vinter[0]);
                    var val = datas[id[k]] +
                            (vinter[1] / vec3.dist(v[k], v[l])) *
                            (datas[id[l]] - datas[id[k]]);
                    if (isNaN(val)) { console.log("new data is nan");}
                    interScalar.push(val);
                }
            }
            var dotSum = dot.reduce(function(a, b) { return a + b;});
            // If all the points are on the same side of the plane
            if ( Math.abs(dotSum) == dot.length) continue;
            var v1 = interPoints[0];
            var v2 = interPoints[1];
            var v3 = interPoints[2];
            var s1 = interScalar[0];
            var s2 = interScalar[1];
            var s3 = interScalar[2];
            //check if the winding of the 3 vertices
            if (vec3.dot(Geometry.normalNonUnitV(tmp, v1, v2, v3), normal) < 0.0) {
                // vAr.push(v1, v3, v2); ???
                vAr.push(v1, v2, v3);
                dAr.push(s1, s2, s3);
                if (interPoints.length === 4) {
                    vAr.push(v2, interPoints[3], v3);
                    dAr.push(s2, interScalar[3], s3);
                }
            }
            else {
                vAr.push(v1, v3, v2);
                dAr.push(s1, s3, s2);
                if (interPoints.length === 4) {
                    vAr.push(v2, v3, interPoints[3]);
                    dAr.push(s2, s3, interScalar[3]);
                }
            }
        } // End for each tetra

        //Now we set the vertex, normal and color arrays ...
        // push.apply is based on recursion and therefore can trigger
        // a max call stack error if the array is big
        //vAr = new Float32Array([].concat.apply([], vAr));
        var nbPoints = vAr.length;
        var vArray = new Float32Array(nbPoints * 3);
        for (i = 0; i < nbPoints; ++i) {
            vArray[i * 3] = vAr[i][0];
            vArray[i * 3 + 1] = vAr[i][1];
            vArray[i * 3 + 2] = vAr[i][2];
        }
        var nAr = new Float32Array(vArray.length);
        var nx = normal[0],
            ny = normal[1],
            nz = normal[2];
        for(i = 0; i < nbPoints; ++i)
        {
            j = i * 3;
            nAr[j] =  -nx;
            nAr[j + 1] = -ny;
            nAr[j + 2] = -nz;
        }
        this.countVertices_ = nbPoints;
        return {"vertex":vArray, "data":dAr};
    };
}

exports.TetraMesh = TetraMesh;
