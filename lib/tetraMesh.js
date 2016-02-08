'use strict';

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
function TetraMesh(gl)
{
    //tetrahedron informations
    this.nodeArray_ = null;
    this.tetraArray_ = null;
    this.dataArray_ = null;

    this.center_ = [0, 0, 0];
    this.octree_ = new Octree();

    this.matTransform_ = mat4.create();
    this.scale_ = 1;
    // this.render_ = new Render(gl);

    this.countVertices_ = 0;
}

TetraMesh.prototype = {
    /**
     * Compute the root bounding box and the mesh center.
     */
    computeAabbAndCenter: function ()
    {
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
    },

    /**
     * Scale the mesh.
     *
     * @param {float|null} factor Optional parameter representing the scale factor
     */
    scale: function (factor)
    {
        var aabb = this.octree_.aabbLoose_;

        //if no parameter is given, we normalize the mesh size according the globalScale_
        var scale = this.scale_ = factor ? factor : TriMesh.globalScale_ / vec3.dist(aabb.min_, aabb.max_);
        var vAr = this.nodeArray_;
        var nbVar = vAr.length;
        for (var i = 0; i < nbVar; ++i)
            vAr[i] *= scale;
        vec3.scale(aabb.min_, aabb.min_, scale);
        vec3.scale(aabb.max_, aabb.max_, scale);
        vec3.scale(this.center_, this.center_, scale);
    },

    /**
     * Compute the mesh octree (used for picking).
     *
     */
    computeOctree: function ()
    {
        var vAr = this.nodeArray_;
        var iAr = this.tetraArray_;
        var nbTetras = iAr.length / 4;
        var tetrasAll = new Array(nbTetras);
        var tetrasAabb = new Array(nbTetras);
        for (var i = 0; i < nbTetras; ++i)
        {
            tetrasAll[i] = i;
            tetrasAabb[i] = new Aabb();
            var j = i * 4;
            var ind1 = iAr[j] * 3,
                ind2 = iAr[j + 1] * 3,
                ind3 = iAr[j + 2] * 3,
                ind4 = iAr[j + 3] * 3;
            var v1x = vAr[ind1],
                v1y = vAr[ind1 + 1],
                v1z = vAr[ind1 + 2];
            var v2x = vAr[ind2],
                v2y = vAr[ind2 + 1],
                v2z = vAr[ind2 + 2];
            var v3x = vAr[ind3],
                v3y = vAr[ind3 + 1],
                v3z = vAr[ind3 + 2];
            var v4x = vAr[ind4],
                v4y = vAr[ind4 + 1],
                v4z = vAr[ind4 + 2];
            Geometry.computeTetraAabb(tetrasAabb[i], v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z, v4x, v4y, v4z);
        }
        this.octree_.build(tetrasAll, tetrasAabb, this.octree_.aabbLoose_);
    },

    /**
     * Move the mesh center to a certain point.
     *
     * @param {vec3} destination The destination where the mesh center should be
     */
    moveTo: function (destination)
    {
        mat4.translate(this.matTransform_, mat4.create(), vec3.sub(destination, destination, this.center_));
    },

    /**
     * Make a slice from the trehadrical mesh.
     *
     * @param {Plane} plane The cutting plane
     */
    makeSlice: function (plane)
    {
        //transform the plane in the same space as the tetra mesh
        var origin = [plane.originX_, plane.originY_, plane.originZ_];
        var normal = [plane.normalX_, plane.normalY_, plane.normalZ_];
        vec3.normalize(normal, normal);
        var matInverse = mat4.create();
        mat4.invert(matInverse, this.matTransform_);
        vec3.transformMat4(origin, origin, matInverse);
        vec3.transformMat3(normal, normal, mat3.normalFromMat4(mat3.create(), matInverse));

        //plane-octree intersection
        var iTetrasCandidates = this.octree_.intersectPlane(origin, normal);
        var nbTetrasCandidates = iTetrasCandidates.length;

        var vAr = [];
        var cAr = [];
        var pts = this.nodeArray_;
        var ids = this.tetraArray_;
        var datas = this.dataArray_;

        var tmp = [0, 0, 0];
        var i = 0;

        //For each tetrahedron...
        for(i = 0; i < nbTetrasCandidates; ++i)
        {
            var j = iTetrasCandidates[i] * 4;
            var id1 = ids[j],
                id2 = ids[j + 1],
                id3 = ids[j + 2],
                id4 = ids[j + 3];
			var id = [id1, id2, id2, id4];
            var v1 = [pts[id1 * 3], pts[id1 * 3 + 1], pts[id1 * 3 + 2]],
                v2 = [pts[id2 * 3], pts[id2 * 3 + 1], pts[id2 * 3 + 2]],
                v3 = [pts[id3 * 3], pts[id3 * 3 + 1], pts[id3 * 3 + 2]],
                v4 = [pts[id4 * 3], pts[id4 * 3 + 1], pts[id4 * 3 + 2]];
			var v = [v1, v2, v3, v4];
            var dot1 = vec3.dot(normal, vec3.sub(tmp, origin, v1)) > 0 ? -1 : 1;
            var dot2 = vec3.dot(normal, vec3.sub(tmp, origin, v2)) > 0 ? -1 : 1;
            var dot3 = vec3.dot(normal, vec3.sub(tmp, origin, v3)) > 0 ? -1 : 1;
            var dot4 = vec3.dot(normal, vec3.sub(tmp, origin, v4)) > 0 ? -1 : 1;
			var dot = [dot1, dot2, dot3, dot4];
            // the tetra is overlapping the plane
            var interPoints = [];
            var interScalar = [];
            var vinter = [];
			var coeff=0;
			// For each edges find if there is an intersection
			// Bug if no intersection
			for ( var k = 0; k < 3; k++)
				for( var l = k+1; l < 4 ; l++ ){
					vinter = Geometry.intersectionSegmentPlane(v[k], v[l], origin, normal);
					if (!isFinite(vinter[1])) continue;
					coeff = vinter[1] / vec3.dist(v[k], v[l]);
					interPoints.push(vinter[0]);
					var pos1 = 3*id[k];
					var pos2 = 3*id[l];
					tmp = new Float32Array(3);
					tmp[0]= datas[pos1] + coeff*(datas[pos2] - datas[pos1]);
					tmp[1]= datas[pos1+1] + coeff*(datas[pos2+1] - datas[pos1+1]);
					tmp[2]= datas[pos1+2] + coeff*(datas[pos2+2] - datas[pos1+2]);
					interScalar.push(tmp);
					console.log("coeff",coeff);
					console.log(datas[pos1] , datas[pos2]);
					console.log(datas[pos1+1] , datas[pos2+1]);
			        console.log(datas[pos1+2] , datas[pos2+2]);
					console.log(tmp);
					console.log("interS", interScalar);
				}
			// If no intersection goto the next tetra
			if (interPoints.length ===0) continue;
            v1 = interPoints[0];
            v2 = interPoints[1];
            v3 = interPoints[2];
            var s1 = interScalar[0];
            var s2 = interScalar[1];
            var s3 = interScalar[2];

            //check if the winding of the 3 vertices
            if (vec3.dot(Geometry.normalNonUnitV(tmp, v1, v2, v3), normal) < 0.0)
            {
                // vAr.push(v1, v2, v3);
                vAr.push(v1, v3, v2);
                cAr.push(s1, s2, s3);
                if (interPoints.length === 4)
                {
                    vAr.push(v2, interPoints[3], v3);
                    cAr.push(s2, interScalar[3], s3);
                }
            }
            else
            {
                vAr.push(v1, v3, v2);
                cAr.push(s1, s3, s2);
                if (interPoints.length === 4)
                {
                    vAr.push(v2, v3, interPoints[3]);
                    cAr.push(s2, s3, interScalar[3]);
                }
            }
        }

        //Now we set the vertex, normal and color arrays ...
        // push.apply is based on recursion and therefore can trigger
        // a max call stack error if the array is big
        //vAr = new Float32Array([].concat.apply([], vAr));
        var nbPoints = vAr.length;
        var vArray = new Float32Array(nbPoints * 3);
        var cArray = new Float32Array(nbPoints * 3);
        for (i = 0; i < nbPoints; ++i)
        {
            vArray[i * 3] = vAr[i][0];
            vArray[i * 3 + 1] = vAr[i][1];
            vArray[i * 3 + 2] = vAr[i][2];
            cArray[i * 3] = cAr[i][0];
            cArray[i * 3 + 1] = cAr[i][1];
            cArray[i * 3 + 2] = cAr[i][2];
        }
        var dataRGB = new Float32Array(vArray.length);
        var nAr = new Float32Array(vArray.length);
        var nx = normal[0],
            ny = normal[1],
            nz = normal[2];
        this.countVertices_ = nbPoints;
        return [vArray, nAr, cArray];
    }
};

function rainBowColor(length) {
  var r = Math.round(Math.sin(0.024 * length + 0) * 127 + 128);
  var g = Math.round(Math.sin(0.024 * length + 2) * 127 + 128);
  var b = Math.round(Math.sin(0.024 * length + 4) * 127 + 128);
  return [r / 255, g / 255, b / 255];
};
