# devfactools

## Overview

This project consists of all the [AngularJS](http://angularjs.org/) custom directives, services and vendor libraries.

## Getting Started

### Development Dependencies 

The following dependencies are needed to run the project.

[Node](http://nodejs.org) version v0.10.28, 
[bower](http://bower.io) version 1.3.4

### Dependencies

[AngularJS](http://angularjs.org/) version 1.2.0,
[browserify](http://browserify.org) version 4.1.5, 
[browserify-shim](https://github.com/thlorenz/browserify-shim) version 3.5.0
[signature_pad](https://github.com/szimek/signature_pad) version v1.3.2

### Install dependencies 

`npm` has been preconfigures to automatically run `bower` to install all the dependencies and development-dependencies we can simply do:

```
npm install
```

### Create a build

We need to create a browserify bundled code in order to run the application. This can be done by simply running the following code in the command line:

```
browserify . -d -o bundle.js
```

Once the `bundle.js` file is created you can include it in the html file.
```
<script src="bundle.js"></script>
```
You also need to include the css stylesheet in your project.
```
<link rel="stylesheet" type="text/css" href="css/devfactools.css">
```
### Directives

This projects consists of the following directives:

1. **dropdown** - Used for settings panel dropdown in an app.
2. **signaturePad**  - Used to capture signature on a touch based device and store it in the model as a base64 encoded string.
3. **modal** - A simple pop-over modal.
4. **itemList** - Directive to recursively list mutli-level object hierarchy, delete a particular object from the hierarchy or add a boolean flag to exclude the object. 
5. **moveParentOnFocus** - Directive to animate scrolling an input container to the top of the parent container on focus. 
6. **typeAhead** - A simple typeahead directive that searches the model for the typed id and displays, atmost, top five items matching the criteria, if a match is found. 

### Demo

Please refer to the (Demo)[http://amalwankar.github.io/Javascript-Angular/Demo.html] for example of each directives mentioned above. You can also find individual demos for each of the directives. 



