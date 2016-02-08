# X3DOM Plugins

## Presentation
In my project I worked to created new nodes in x3dom, for scientific mesh visualisation and analysis.
I wanted to created some nodes that influence the geometry (color-map, threshold, clip-Plan).


I had two goals in mind:

1. Create a simple interface for the final users: The final node should works like any other x3dom node
2. Create a API that allow one to create a node in x3dom in an importable script (without touching x3dom source code)

**Example:**
```html
<TriangleSet>
  <Threshold
     upperBound="1" lowerBound="0" dataName="triSetData" > </Threshold>
  <FloatVertexAttribute
     name="triSetData" numComponents="1" value="..."> </FloatVertexAttribute>
  ...
</TriangleSet>
```
This allow one to easily change the bound or change the set of data only using setAttribute.


## Quick start

In order to try my example :

1. clone the repository

2. run : **python server.py**

3. open in browser [**http://localhost:8000/index.html**](http://localhost:8000/index.html)


## x3dom API

My solution was to create a new node: CustomAttributeNode.
This node is a generic node to add uniforms, varying and shader parts into x3dom.
The data of the geometry are set using the x3dom node : FloatVertexAttribute.

**Example of CustomAttributeNode to create a threshold node.**
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

## JavaScript API

The idea of the my API is to create a new node inherited from CustomAttributeNode.
I wrote some function to make the implementation of the node easier.

**Example :**
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
             * Function called in the creation of the nodes
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

## working with npm
install the packages with : **npm install**
use browserify with : **npm run build**
use watchify with : **npm run watch**
run server + watchify with : **npm run start**




## Notes

### x3dom
I here I used a custom version of x3dom, with the CustomAttributeNode implemented
I am also working on the top of a branch (pull request #610 ) in x3dom in order to use FloatVertexAttribute.

### Uniform node
In the CustomAttributeNode I used the x3dom node Uniform, I will changed it for a custom node.
