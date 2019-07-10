
/**
 * @file This contains the C4Logic object
 * @author thomsound 2019
 */

/**
 * C4UI3D - Connect four GUI using threejs
 * @class
 * @requires three.min.js
 * @requires OBJLoader.js
 * @requires 'c4_token v1.obj'
 *
 * @param  {number} nCols    number of columns
 * @param  {number} nRows    number of rows
 * @param  {number} nPlayers number of players
 */
function C4UI3D(nCols, nRows, nPlayers) {

    // VARIABLES
    // dom
    var canvas = document.getElementById('grid-container');
    var gc = document.getElementById('game-container');
    // constant
    var dotsPerGrid = 2.5;
    var fieldRadius = 130;
    var gridWidth = 17;
    var fieldWidth = (nCols - 1) * gridWidth;
    var startYPos = (nRows + 1.5) * gridWidth;
    // public
    var colors = [];
    // dynamic
    var mousePos = 0;
    var currentToken = 0;
    var stepSize = { x : 5, y : 2.5, z : 2.5 };
    // counter
    var i, j;
    // current timeout (chaos animation)
    var chaosAnimation;
    // current keyframe
    var frame;

    // EVENTS
    var nextTokenEvent = document.createEvent('Event');
    nextTokenEvent.initEvent('nexttoken', true, true);

    // SCENE
    var scene = new THREE.Scene();
    // add edges
    function createEdges() {
        function createSphere() {
            var geometry = new THREE.SphereGeometry( 0.7, 16, 16 );
            var material = new THREE.MeshBasicMaterial( {color: 0xffffff, transparent: true, opacity: 0.4} );
            var sphere = new THREE.Mesh( geometry, material );
            return sphere;
        }

        var nDots = nRows * dotsPerGrid;
        var distanceDots = gridWidth / dotsPerGrid;
        var sphereXPos = fieldWidth * 0.5 + 0.75 * gridWidth;
        var sphereZNeg = Math.sqrt(sphereXPos*sphereXPos+fieldRadius*fieldRadius) - fieldRadius;

        var line = function(xPos) {
            var s = [];
            for (i = 0; i < nDots; i++) {
                var sphere = createSphere();
                sphere.position.y = (i-1)  * distanceDots;
                sphere.position.x = xPos;
                sphere.position.z = -sphereZNeg - 3;
                s[i] = sphere;
                scene.add(sphere);
            }
            return s;
        }
        var spheresLeft = line(-sphereXPos);
        var spheresRight = line(sphereXPos);
    } // close createEdges
    createEdges();

    // create spots
    var spots = [];
    function createSpots() {
        function createSpot() {
            var geometry = new THREE.CircleGeometry( 6, 64 );
            geometry.rotateX(-1.57079632679);
            var material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.3 } );
            var circle = new THREE.Mesh( geometry, material );
            circle.position.y =  -12;
            return circle;
        }
        for(i = 0; i < nCols; i++) {
            var x = i * gridWidth - nCols * gridWidth * 0.5 + 0.5 * gridWidth;
            var spot = createSpot();
            spot.position.x = x;
            var zNeg = Math.sqrt(x*x+fieldRadius*fieldRadius) - fieldRadius;
            spot.position.z = -zNeg - 5;
            spots[i] = spot;
            scene.add(spot);
        }
    } // close createSpots
    createSpots();

    // create token
    var loader = new THREE.OBJLoader();
    var env = this;
    var tokens = [];
    this.newToken = function(player) {
        // token material
        var tokenMaterial = new THREE.MeshPhongMaterial( { color: colors[player] } );
        // load object from .obj-file
        loader.load(
            'obj/c4_token v1.obj',
            // onload
            function( object ) {
                // set material for all child elements
                object.traverse( function( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.material = tokenMaterial;
                    }
                } );
                // set initial position
                object.position.x = getPosFromMouse();
                object.position.y = startYPos;
                // store obj in collection
                tokens.push([object, { x : null, y : startYPos, z : 0 }]);
                currentToken = tokens.length - 1;

                // highlight the coresponding column indicating spot
                var pos = object.position.x + fieldWidth * 0.5 + 0.5 * gridWidth;
                var col = Math.floor(pos / gridWidth);
                env.highLightSpot(col);
                // add to scene
                scene.add( object );
                // send event to trigger next players move
                canvas.dispatchEvent(nextTokenEvent);
            },

        	// onprogress
        	function ( xhr ) {
        		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        	},

        	// onerror
        	function ( err ) {
                console.log(err);
        	}
        ); // close loader.load
    }; // close newToken

    var fontLoader = new THREE.FontLoader();
    fontLoader.load(
        'fonts/Arial Rounded MT Bold_Regular.json',
        (fnt) => font = fnt
    );
    this.newText = function( player ) {
        var msg = player < 0 ? 'T i e  G a m e !' : 'P l a y e r  ' + (player + 1)  + '  w i n s !';
        var msgColor = player < 0 ? '#ddd' : colors[player];

    	var geometry = new THREE.TextGeometry( msg, {
    		font: font,
    		size: 17,
    		height: 2,
    		curveSegments: 8,
    		bevelEnabled: true,
    		bevelThickness: 1.5,
    		bevelSize: 1.5,
    		bevelOffset: -0.5,
    		bevelSegments: 22
    	} );
        var textMaterial = new THREE.MeshPhongMaterial( { color: msgColor } );
        var textMesh = new THREE.Mesh(geometry, textMaterial);

        geometry.computeBoundingBox();
        var centerOffset = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
        var ratio = gc.offsetWidth / gc.offsetHeight;
        var scaleToSmallScreen = ratio < 1.2 ? 100 : 0;
        textMesh.position.x = centerOffset;
        textMesh.position.y = startYPos - 12 + scaleToSmallScreen * 0.5;
        textMesh.position.z = -30 - scaleToSmallScreen;

        scene.add( textMesh );
    };

    // CAMERA
    var camera = new THREE.PerspectiveCamera( 65, gc.offsetWidth / gc.offsetHeight, 0.1, 1000 );
    camera.position.y = 0.5 * startYPos;
    function setCameraZPos() {
        var ratio = gc.offsetWidth / gc.offsetHeight;
        if(ratio < 0.8) {
            camera.position.z = startYPos * (1 + 0.8 - ratio) * (1 + 0.8 - ratio);
        } else {
            camera.position.z = startYPos;
        }
    }
    setCameraZPos();

    // LIGHT
    // ambient
    var ambientLight = new THREE.AmbientLight( 0xff9200, 0.5 ); // args (color, intensity)
    scene.add( ambientLight );
    // directional
    var directionalLight = new THREE.DirectionalLight( 0xffeedd, 1.4 );
    directionalLight.position.set( 3, 30, 15);
    scene.add( directionalLight );

    // RENDERER
    var renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true } );
    renderer.setSize( gc.offsetWidth, gc.offsetHeight);
    renderer.setClearColor( 0x000000, 0.5 );

    // ANIMATIONS

    /**
    * @function moveTokenToDestination
    *   - animate path to destination position according to the values in the stepSize object
    * @param {number} idx
    *   - number defining the index of the token in 'tokens'
    * @param {string} axis
    *   - string defining the cartesian axis to move along
    * @return {undefined}
    */
    function moveTokenToDestination(idx, axis) {
        var delta = tokens[idx][1][axis] - tokens[idx][0].position[axis];
        if(Math.abs(delta) < stepSize[axis]) {
            tokens[idx][0].position[axis] = tokens[idx][1][axis];
        } else {
            // move one stepSize['x'] ... to the right direction
            if(delta < 0) {
                tokens[idx][0].position[axis] -= stepSize[axis];
            } else {
                tokens[idx][0].position[axis] += stepSize[axis];
            }
        }
    }


    /**
     * insertToken - animate token being inserted into the board
     *
     * @param  {number} rowIdx - index of destination row
     * @param  {number} colIdx - index of destination column
     * @return {undefined}
     */
    this.insertToken = function(rowIdx, colIdx) {
        var tokenX = colIdx * gridWidth - nCols * gridWidth * 0.5 + 0.5 * gridWidth;
        var zNeg = Math.sqrt(tokenX*tokenX+fieldRadius*fieldRadius) - fieldRadius;
        tokens[currentToken][1]['x'] = tokenX;
        tokens[currentToken][1]['y'] = rowIdx * gridWidth;
        tokens[currentToken][1]['z'] = -zNeg;
        tokens[currentToken][0].rotation.y = Math.asin(tokenX / fieldRadius);
        tokens[currentToken][2] = { row: colIdx, col: rowIdx };
    };


    /**
     * highlightMatch - animate winning tokens
     *
     * @param  {Array} coords
     *      - nested Array holding the coordinates of
     *        the winning tokens [[col1, row1], [col2, row2], ...]
     * @return {undefined}
     */
    this.highlightMatch = function(coords) {
        stepSize.z = 0.33;
        var res = [];
        for(i = 0; i < tokens.length; i++) {
            for(j = 0; j < coords.length; j++) {
                if(tokens[i][2].row == coords[j][1] && tokens[i][2].col == coords[j][0]) {
                    res.push(i);
                }
            }
        }

        for(i = 0; i < tokens.length; i++) {
            if(res.indexOf(i) < 0) {
                tokens[i][1].z -= 25;
                tokens[i][0].children[0].material.opacity = 0.8;
                var objColor = tokens[i][0].children[0].material.color;
                objColor.r *= 0.3;
                objColor.g *= 0.3;
                objColor.b *= 0.3;
            }
        }
        chaosAnimation = setTimeout(function() {
            stepSize.z = 2.5;
            chaos(res);
        }, 1500);
    };   // close highlightMatch

    function chaos(res) {
        for(var i = 0; i < tokens.length; i++) {
            if(res.indexOf(i) < 0) {
                var p = Math.floor(Math.random() * 3);
                if(p == 0) {
                    tokens[i][1].x = Math.random() * window.innerHeight - 0.5 * window.innerHeight;
                } else if( p == 1) {
                    tokens[i][1].y = Math.random() * window.innerHeight - 0.5 * window.innerHeight;
                } else {
                    tokens[i][1].z = Math.random() * startYPos * 2 - startYPos;
                }
            }
        }
        chaosAnimation = setTimeout(function() { chaos(res); }, Math.random() * 1000 + 300);
    }

    this.highLightSpot = function(col) {
        for(var i = 0; i < spots.length; i++) {
            if(i == col) {
                spots[i].material.opacity = 0.4;
            } else {
                spots[i].material.opacity = 0.1;
            }
        }
    };

    function setHoverToken(idx) {
        var pos = getPosFromMouse();
        tokens[idx][0].position.x = pos;
        var zNeg = Math.sqrt(pos*pos+fieldRadius*fieldRadius) - fieldRadius;
        tokens[idx][0].rotation.y = Math.asin(pos / fieldRadius);
        tokens[idx][0].position.z = -zNeg;
        tokens[idx][1].z = -zNeg;
    }

    function getPosFromMouse() {
        var pos = mousePos * fieldWidth * 0.5;
        var fieldWidthHalf = fieldWidth * 0.5;
        if(pos < -fieldWidthHalf) {
            pos = -fieldWidthHalf;
        } else if (pos > fieldWidthHalf ) {
            pos = fieldWidthHalf ;
        }
        return pos;
    }

    this.setHoverColumn = function(idx) {
        // set x in currentToken to the according value
        var tokenX = idx * gridWidth - nCols * gridWidth * 0.5 + 0.5 * gridWidth;
        var zNeg = Math.sqrt(tokenX*tokenX+fieldRadius*fieldRadius) - fieldRadius;
        tokens[currentToken][1]['x'] = tokenX;
        tokens[currentToken][1]['z'] = -zNeg;
        tokens[currentToken][0].rotation.y = Math.asin(tokenX / fieldRadius);
    };

    this.getCurrentColumn = function() {
        var obj = tokens[currentToken][0];
        var pos = obj.position.x + fieldWidth * 0.5 + 0.5 * gridWidth;
        var col = Math.floor(pos / gridWidth);
        return col;
    };


    // update
    function update() {
        for(var i = 0; i < tokens.length; i++) {
            if(tokens[i][1]['x'] == null) {
                setHoverToken(i);
            } else {
                moveTokenToDestination(i, 'x');
            }
            moveTokenToDestination(i, 'y');
            moveTokenToDestination(i, 'z');
        }
    };

    this.stopGameLoop = function() {
        window.cancelAnimationFrame(frame);
    };

    this.startGameLoop = function() {
        GameLoop();
    };

    // run game loop (update, render, repeat)
    var GameLoop = function() {
        frame = window.requestAnimationFrame( GameLoop );
        update();
        renderer.render( scene, camera );
    };

    this.reset = function() {
        if(chaosAnimation) {
            clearTimeout(chaosAnimation);
        }
        stepSize.z = 2.5;
        // remove all tokens from the scene
        for(var i = 0; i < tokens.length; i++) {
            scene.remove(tokens[i][0]);
        }

        // set new token colours
        var colorOffset = new Date().getMinutes() * 3;
        for(i = 0; i < nPlayers; i++) {
            colors[i] = 'hsl(' + ((360 / nPlayers * i) + colorOffset) + ', 64%, 36%);';
        }
    }.bind(this);

    this.setMousePos = function(sth) {
        mousePos = sth;
    };
    this.getMousePos = function() {
        return mousePos;
    };

    window.addEventListener('resize', function() {
        var width = gc.offsetWidth;
        var height = gc.offsetHeight;
        renderer.setSize( width, height);
        camera.aspect = width / height;
        setCameraZPos();
        camera.updateProjectionMatrix();
    });
}   // close C4UI3D
