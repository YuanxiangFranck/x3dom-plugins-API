/** @namespace x3dom.nodeTypes */

function new_node(x3dom){
    x3dom.registerNodeType(
        "ColorMap",
        "Custom",
        defineClass(
            x3dom.nodeTypes.CustomAttributeNode,
            /**
             * Constructor for ColorMap
             * @constructs x3dom.nodeTypes.CustomAttributNode
             * @x3d 3.2
             * @component Custom
             * @status ?
             * @extends x3dom.nodeTypes.X3DChildNode
             * @param {Object} [ctx=null] - context object, containing initial settings like namespace
             * @classdesc The threshold field allows to hide part of the mesh.
             * The hidden part is when the given is are higer or lower
             * than a given value
             */
            function (ctx) {
                x3dom.nodeTypes.ColorMap.superClass.call(this, ctx);
                /**
                 * Defines the upper bound for threashold,
                 * values higher than the upper bound will be hidden
                 * @var {x3dom.fields.SFFloat} upperBound
                 * @memberof x3dom.nodeTypes.Threashold
                 * @initvalue 0.0
                 * @field x3dom
                 * @instance
                 */
                this.addField_SFFloat(ctx, 'max', 0.0);

                /**
                 * Defines the upper bound for threashold
                 * values lower than the lower bound will be hidden
                 * @var {x3dom.fields.SFFloat} lowerBound
                 * @memberof x3dom.nodeTypes.Threshold
                 * @initvalue 0.0
                 * @field x3dom
                 * @instance
                 */
                this.addField_SFFloat(ctx, 'min', 0.0);

                /**
                 * Defines the data associated to each vertices
                 * @var {x3dom.fields.MFFloat} lowerBound
                 * @memberof x3dom.nodeTypes.Threshold
                 * @initvalue []
                 * @field x3dom
                 * @instance
                 */
                this.addField_SFString(ctx, 'dataName', []);

            },
            {
                /**
                 * Functun call in the creation of the nodes
                 */
                nodeChanged: function(){
                    // Add unfiforms
                    this.addUniform("colormapMinUniform",
                                    this.get("min"),"float");
                    this.addUniform("colormapMaxUniform",
                                    this.get("max"),"float");
                    // Add the shader
                    this.addVertexShaderPart(
                        "fragTexcoord = vec2((( "+this.get("dataName")+" - colormapMinUniform ) / ( colormapMaxUniform - colormapMinUniform )), 0.0);");
                    this.addFragmentShaderPart("");

                },
                /**
                 * Functun call by setAttribute
                 */
                fieldChanged: function (fieldName) {
                    if (fieldName === "min" )
                        this.updateUniform(fieldName, "colormapMinUniform");
                    else if(fieldName === 'max')
                        this.updateUniform(fieldName, "colormapMaxUniform");
                    else if (fieldName === "dataName")
                        this.attributeNameChanged(fieldName);
                }
            }
        )
    );
}

exports.new_node = new_node;

function defineClass(parent, ctor, methods) {
    if (parent) {
        function Inheritance() {}
        Inheritance.prototype = parent.prototype;

        ctor.prototype = new Inheritance();
        ctor.prototype.constructor = ctor;
        ctor.superClass = parent;
    }
    if (methods) {
        for (var m in methods) {
            ctor.prototype[m] = methods[m];
        }
    }
    return ctor;
}
