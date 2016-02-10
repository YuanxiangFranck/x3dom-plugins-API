# X3DOM Plugins

## Presentation

During my internship, I worked on the creation of x3dom-based tools
for mesh data visualization and analysis. I wanted to create new DOM
nodes that integrate nicely in a standard x3dom tree, namely
iso-color, threshold, clip-plane.

I had two goals in mind:

1. create an x3dom plugin API that allows one to create new DOM nodes
   which extend x3dom functionality;
2. keep a simple x3dom-like interface for the final users.


**Example:**

Following example illustrates the usage of such plugins. The relevant
markup looks like:

```html
<TriangleSet>
  <Coordinate point="..."> </Coordinate>
  <Normal vector="..."> </Normal>
  <Threshold
     upperBound="1" lowerBound="0" dataName="triSetData" > </Threshold>
  <IsoColor
     max="1" min="0" dataName="triSetData" > </IsoColor>
  <FloatVertexAttribute
     name="triSetData" numComponents="1" value="..."> </FloatVertexAttribute>
  <FloatVertexAttribute
     name="other_set_of_data" numComponents="1" value="..."> </FloatVertexAttribute>
  ...
</TriangleSet>
```

The **Threshold** and **IsoColor** nodes work like any x3dom node:
they react to any attribute change using DOM's node **setAttribute**
method. This makes it easy to use HTML widgets like sliders / buttons
to drive the plugin's parameters.


## Quick start

Example and live demonstration on:
[**http://yuanxiangfranck.github.io/x3dom-plugins-API/**](http://yuanxiangfranck.github.io/x3dom-plugins-API/)

In order to run the example :

1. clone and move into the repository

2. run : **python server.py**

3. open in browser [**http://localhost:8000/index.html**](http://localhost:8000/index.html)


## X3Dom API

The goal is to create custom nodes that affect the rendering based on
data (positions, pressure, temperature...). A idea is to manipulate
the shaders, since it gives low-level manipulation on the 3d
rendering.  That allow give more freedom and efficiency in the
creation of the nodes.

X3Dom has a native node to write shaders : ComposedShader node.  The
problem of this node is it overwrite the shaders written by x3dom DOM
nodes. For example, nodes like ClipPlane are disabled with a
ComposedShader node in the DOM. Another example is image texturing,
the computation of the color from texture coordinate should be written
within the ComposedShader.

In order to add shaders to the generated shaders without overwriting
it I created a new node: CustomAttributeNode.  This node is a generic
node to add uniforms, varying and shader parts into x3dom.  The data
of the geometry are set using the x3dom node : FloatVertexAttribute.


###Example of CustomAttributeNode to create a threshold node.

```html
<CustomAttributeNode
   vertexShaderPartMain="v_data = custom_data;"
   fragmentShaderPartMain="if (v_data > u_max) {discard;};"
   >
  <Uniform
     name="u_max" value="0" type="float"></Uniform>
  <Varying
     name="v_data" type="float"></Varying>
</CustomAttributeNode>
<FloatVertexAttribute
   name="custom_data" numComponents="1" value="...">
</FloatVertexAttribute>
```

The CustomAttributeNode is the entry point in x3dom for the javascript
API.



## JavaScript API

The idea of the my API is to create a new node inherited from
CustomAttributeNode.  I wrote some functions to make the
implementation of the node easier.

###Example: creation of the threshold node##
```javascript
// some code for npm ...
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
            this.addField_SFString(ctx, 'dataName', "");

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
// some code for npm ...
```

#### Link to the sources of the plugins:

* [threshold.js](https://github.com/YuanxiangFranck/x3dom-plugins-API/blob/master/threshold.js)
* [color-map.js](https://github.com/YuanxiangFranck/x3dom-plugins-API/blob/master/color-map.js)

#### To add the plugins, after loading x3dom add the load the plugins :
```javascript
x3dom = require('./lib/x3dom.debug.js').initX3dom();
require('./threshold.js').new_node(x3dom);
```


## Working with npm

I worked with npm and use a trick to add x3dom, but with small
modifications it should work without it.

* install the packages: **npm install**

* build the bundle with browserify: **npm run build**

* use watchify: **npm run watch**

* run server : **npm run server**

* run server + watchify: **npm run start**


## Comments

### X3Dom fork

I used a custom version of x3dom, with the CustomAttributeNode
implemented. The x3dom fork with CustomAttributeNode is available in
the link below:

[https://github.com/YuanxiangFranck/x3dom/tree/x3dom_plugins](https://github.com/YuanxiangFranck/x3dom/tree/x3dom_plugins)


The branch with the CustomAttributeNode
([x3dom_plugins](https://github.com/YuanxiangFranck/x3dom/tree/x3dom_plugins))
in based on another branch
([pull request #610](https://github.com/x3dom/x3dom/pull/610)) in
x3dom in order to use FloatVertexAttribute.


### Uniform node

In the CustomAttributeNode I used the x3dom node Uniform, I will
changed it for a custom node.

### New examples

I am currently working of the creation of new nodes (Clip Plane) with the API.

## Authors and Contributors

This project was a prototype created by
[YuanxiangFranck](https://github.com/YuanxiangFranck/) intern at
[Logilab](https://www.logilab.fr/). This work is a part of the
[Open Dream Kit project](http://opendreamkit.org/).

Dates : December 2015 / February 2016

![](./other/logilab.png)

