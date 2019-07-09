(function(){
    /**
     * C4Game - Connect four game object
     * @class
     * @requires C4UI3D.js
     * @requires C4Logic.js
     * @requires decision.js
     */
    function C4Game() {
        var nPlayers, connectN, nCols, nRows, currentPlayer;
        var connectFourLogic, connectFourUI, testLogic;
        var waitForUserInput;
        var humanPlayers, winner;
        /**
         * @function newGame - reset state and start a new game
         *
         * @param  {Object} prefs - game settings from user input
         * @return {void}
         */
        function newGame(prefs) {
            if(connectFourUI) {
                connectFourUI.stopGameLoop();
            }

            nPlayers = prefs.nPlayers;
            connectN = prefs.connectN;
            nCols = prefs.nCols;
            nRows = prefs.nRows;

            connectFourLogic = new C4Logic(nCols, nRows, nPlayers, connectN);
            connectFourUI = new C4UI3D(nCols, nRows, nPlayers);
            currentPlayer = 1;

            connectFourUI.reset();
            connectFourUI.newToken(currentPlayer - 1);
            connectFourLogic.init();

            waitForUserInput = true;
            humanPlayers = [1];
            winner = [];

            connectFourUI.startGameLoop();
            // resetPush();
        }

        /**
         * @function getNextPlayer
         *
         * @param  {number} current_player - current player
         * @return {number} - next player
         */
        function getNextPlayer(current_player) {
            var current = current_player ? current_player : currentPlayer;
            return current >= nPlayers ? 1 : current + 1;
        }


        /**
         * insert - insert token
         *
         * @param  {number} idx - index of column to insert token into
         * @return {Boolean} - true if move was legal and token was inserted successfully
         *                   - false otherwise
         */
         function insert(idx) {
            waitForUserInput = false;
            var options = connectFourLogic.getOptions();
            // if legal move
            if(options.indexOf(idx) >= 0) {
                // animate move
                connectFourUI.insertToken(connectFourLogic.getFreeSlotRow(idx), idx);
                winner = connectFourLogic.insert(currentPlayer, idx);
                // if tie game
                if(connectFourLogic.getOptions().length == 0) {
                    winningAnimation.call(this);
                    displayEnd(-1);
                    return true;
                }
                // if player won
                else if(winner.length > 0) {
                    // start animation
                    winningAnimation.call(this);
                    displayEnd(currentPlayer - 1);
                    return true;
                }
                // if game continues
                else {
                    currentPlayer = getNextPlayer();
                    // next token
                    setTimeout(function() {
                        connectFourUI.newToken(currentPlayer - 1);
                    }, 666);
                } // close getOptions.lenght == 0
                return true;
            }
            // if illegal move
            else {
                console.log('illegal move');
                waitForUserInput = true;
                return false;
            }   // close if(insertRow === false)
        };

        function winningAnimation() {
            setTimeout(function() {
                connectFourUI.highlightMatch(winner);
            }, 1000);
            setTimeout(function() {
                document.getElementById('game-container').classList.remove('playing');
            }, 5000);
        }


        /**
         * decideMC - performs monte carlo algorithm in a web worker
         *
         * @return {type}  description
         */
        function decideMC() {
            var worker = new Worker('js/decision.js');
            worker.addEventListener('message', function(e) {
                var moves = JSON.parse(e.data);
                for (var i = 0; i < moves.length; i++) {
                    if(insert(moves[i]) == true) {
                        return;
                    }
                }
            });
            worker.addEventListener('error', function(e) {
                console.log('error in ', e.filename, ' at line ', e.lineno);
                console.log(e.message);
                // perform random move
                var options = connectFourLogic.getOptions();
                if(insert(options[Math.floor(Math.random() * options.length)]) == true) {
                    return;
                } else {
                    console.error('FATAL ERROR');
                }
            });

            var params = {
                nCols : nCols,
                nRows : nRows,
                nPlayers : nPlayers,
                connectN : connectN,
                field : connectFourLogic.getState(),
                currentPlayer : currentPlayer
            };
            worker.postMessage(JSON.stringify(params));
        }

        // EventListeners
        var canvas = document.getElementById('grid-container');
        canvas.onmousemove = function(e) {
            if(waitForUserInput) {
                var currX = e.pageX-canvas.getBoundingClientRect().x;
                connectFourUI.setMousePos((currX - canvas.offsetWidth * 0.5) / canvas.offsetWidth * 4);
                var current = connectFourUI.getCurrentColumn();
                connectFourUI.highLightSpot(current);
            }
        };
        canvas.onclick = function() {
            if(waitForUserInput) {
                insert(connectFourUI.getCurrentColumn());
            }
        };

        // support touch devices
        canvas.ontouchmove = function(e) {
            if(waitForUserInput) {
                var currX = e.changedTouches[0].pageX-canvas.getBoundingClientRect().x;
                connectFourUI.setMousePos((currX - canvas.offsetWidth * 0.5) / canvas.offsetWidth * 4);
                var current = connectFourUI.getCurrentColumn();
                connectFourUI.highLightSpot(current);
            }
        }.bind(this);

        // var touchStart = [];
        // canvas.ontouchstart = function(e) {
        //     touchStart = e.targetTouches[0].pageY;
        // }
        // canvas.ontouchend = function(e) {
        //     if(Math.abs(touchStart - e.targetTouches[0].pageY) > 60) {
        //         if(waitForUserInput) {
        //             insert(connectFourUI.getCurrentColumn());
        //         }
        //     };
        // }

        // listen for 'nexttoken' event from C4UI3D object
        canvas.addEventListener('nexttoken', function() {
            if(humanPlayers.indexOf(currentPlayer) < 0) {
                decideMC();
            } else {
                waitForUserInput = true;
            }
        });

        document.addEventListener('keydown', function(e) {
            if(waitForUserInput) {
                var key = e.keyCode;
                var nextCol = connectFourUI.getCurrentColumn();
                if(key == 37) { // arrow left
                    nextCol--;
                } else if(key == 39) {  // arrow right
                    nextCol++;
                } else if(key == 13 || key == 40) { // return | arrow down
                    insert(connectFourUI.getCurrentColumn());
                    return;
                }
                if(nextCol < 0) {
                    nextCol = 0;
                } else if(nextCol >= nCols) {
                    nextCol = nCols - 1;
                }
                connectFourUI.setHoverColumn(nextCol);
                connectFourUI.highLightSpot(nextCol);
            }
        });

        // New Game button
        document.getElementById('btn_newGame').addEventListener('click', function() {
            var inputs = document.getElementById('prefs');
            var prefs = {};
            for(var i = 0; i < inputs.length; i++) {
                prefs[inputs[i].name] = +inputs[i].value;
            }
            newGame(prefs);
            document.getElementById('game-container').classList.add('playing');
        });

        function displayEnd(num) {
            setTimeout(function() {
                connectFourUI.newText(num);
            }, 2000);
        }
    }
    new C4Game();
})();
