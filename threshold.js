/** @namespace x3dom.nodeTypes */
var defineClass = x3dom.defineClass;

function new_node(x3dom){
    x3dom.registerNodeType(
        "Threshold",
        "Custom",
        defineClass(
            x3dom.nodeTypes.CustomAttributeNode,
            /**
             * Constructor for Threshold
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
                x3dom.nodeTypes.Threshold.superClass.call(this, ctx);
                /**
                 * Defines the upper bound for threashold,
                 * values higher than the upper bound will be hidden
                 * @var {x3dom.fields.SFFloat} upperBound
                 * @memberof x3dom.nodeTypes.Threashold
                 * @initvalue 0.0
                 * @field x3dom
                 * @instance
                 */
                this.addField_SFFloat(ctx, 'upperBound', 0.0);

                /**
                 * Defines the upper bound for threashold
                 * values lower than the lower bound will be hidden
                 * @var {x3dom.fields.SFFloat} lowerBound
                 * @memberof x3dom.nodeTypes.Threshold
                 * @initvalue 0.0
                 * @field x3dom
                 * @instance
                 */
                this.addField_SFFloat(ctx, 'lowerBound', 0.0);

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
                    this.addUniform("thresholdUpperBoundUniform",
                                    this.get("upperBound"),"float");
                    this.addUniform("thresholdLowerBoundUniform",
                                    this.get("lowerBound"),"float");
                    // Add the varying
                    this.addVarying("thresholdDataVarying","float");
                    // Add the shader
                    this.addVertexShaderPart(
                        "thresholdDataVarying = "+this.get("dataName")+";");
                    this.addFragmentShaderPart(
                        "if (thresholdDataVarying > thresholdUpperBoundUniform) {discard;}; "+
                            "if (thresholdDataVarying < thresholdLowerBoundUniform) {discard;}; ");

                },
                /**
                 * Functun call by setAttribute
                 */
                fieldChanged: function (fieldName) {
                    if (fieldName === "lowerBound" )
                        this.updateUniform(fieldName, "thresholdLowerBoundUniform");
                    else if(fieldName === 'upperBound')
                        this.updateUniform(fieldName, "thresholdUpperBoundUniform");
                    else if (fieldName === "dataName")
                        this.attributeNameChanged(fieldName);
                }
            }
        )
    );
}

exports.new_node = new_node;
