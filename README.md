# X3DOM Plugins

In my project I worked to created new nodes in x3dom.
I wanted to created some nodes that influence the geometry (color-map, threshold, clip-Plan)
I had two goals in mind:

1. Create a simple interface for the final users: The final node should works like any other x3dom node
2. Create a API that allow one to create a node in x3dom in an importable script (without touching x3dom source code)

My solution was to create a new node, named CustomAttributeNode where you can add shaders parts uniforms and varying. The data of the geometry are set using the x3dom node : FloatVertexAttribute.
Here an example of CustomAttributeNode to create a threshold node.
```html
<FloatVertexAttribute
   name="custom_data" numComponents="1" value="..."> </FloatVertexAttribute>
<CustomAttributeNode
   vertexShaderPartMain="v_data = custom_data;"
   fragmentShaderPartMain="if (v_data > u_max) {discard;};"
   >
  <Uniform
     name="u_max" value="0" type="float"></Uniform>
  <Varying
     name="v_data" type="float"></Varying>
</CustomAttributeNode>
```

The CustomAttributeNode is the entry point in x3dom code for my API.

The idea of the my API is to create a new node inherited from CustomAttributeNode and implement itself.

Example :
```javascript

x3dom.registerNodeType(
    "Threshold",
    "Custom",
    defineClass(
        x3dom.nodeTypes.CustomAttributeNode,
        // Constructor for Threshold
        function (ctx) {
            x3dom.nodeTypes.Threshold.superClass.call(this, ctx);
            /**
             * Defines the upper bound for threshold,
             * values higher than the upper bound will be hidden
             */
            this.addField_SFFloat(ctx, 'upperBound', 0.0);

            /**
             * Defines the upper bound for threshold
             * values lower than the lower bound will be hidden
             */
            this.addField_SFFloat(ctx, 'lowerBound', 0.0);

            /**
             * Defines the data associated to each vertices
             */
            this.addField_SFString(ctx, 'dataName', []);

        },
        {
            /**
             * Functun call in the creation of the nodes
             */
            nodeChanged: function(){
                // Add the unfiforms
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
             * Function call by setAttribute
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
```


* NOTE 1 : I an using the x3dom node Uniform, and it is not a good idea I will changes this to a custom node later.

* Note 2: In order to use FloatVertexAttribute, I needed the pull request x3dom/github-flavored-markdown#610 to use setAttribute on FloatVertexAttribute.

* NOTE 3 : I worked with npm, so I add the bundle with x3dom and my scripts. But It should work without npm.

* NOTE 4 : in the example I load binaries so a server is needed, use : python server.py