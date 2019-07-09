
/**
 * @file This contains the C4Logic object
 * @author Carlo Thomsen 2019
 */

/**
 * C4Logic - implements the logic of 'connect four'
 * @class
 * @param  {number} nCols - number of columns
 * @param  {number} nRows - number of rows
 * @param  {number} nPlayer - number of players
 * @param  {number} connectN - number of tokens to connect
 * @return {L4Logic} - Object containing the logic of connect four
 */
function C4Logic(nCols, nRows, nPlayer, connectN) {
    var field = [];

    /**
     * @function init - set this object to initial state
     */
    this.init = function() {
        field = [];
        for(let i = 0; i < nRows; i++) {
            let row = [];
            for(let j = 0; j < nCols; j++) {
                row.push(0);
            }
            field.push(row);
        }
    };

    /**
     * @function clone2DArray
     *      - create deep copy of tow dimensional array
     * @param  {Array} a
     *      - array to be copied
     * @return {Array}
     *      - clone of a
     */
    function clone2DArray( a ) {
        return a.map(function(arr) { return arr.slice(); });
    }

    /**
     * @function getState
     *      - provide clone of this objects field variable
     * @return {Array}  - clone of this objects field variable
     */
    this.getState = function() {
        return clone2DArray( field );
    };

    /**
     * @function setState
     *      - set this objects field variable
     * @param  {Array} a
     *      - value to set field to
     */
    this.setState = function( a ) {
        field = clone2DArray( a );
    };

    /**
     * @function clipColIdx
     *      - clip a number to the range 0 - nCols
     * @param  {number} num
     *      - value to clip
     * @return {number}
     *      - clipped value
     */
    function clipColIdx(num) {
        if(num < 0) {
            return 0;
        } else if(num >= nCols) {
            return nCols - 1;
        } else {
            return num;
        }
    }

    /**
     * @function detectVictory
     *      - check wheter last move lead to a victory
     * @param  {number} col
     *      - column of last inserted token
     * @param {Array} state (optional)
     *      - two dimensional array of the game board dimensions to process on,
     *        without changing inner state of the object
     * @return {Array}
     *      - contains list of coordinates of winning tokens and [] otherwise
     */
    this.detectVictory = function(col, state) {
        var board = state || field;

        // get row index of last inserted token
        var row;
        for(row = nRows - 1; row >= 0; row--) {
            if(board[row][col] != 0) {
                break;
            }
        }
        // get player
        var player = board[row][col];

        // check vertical (only downwards)
        if(row >= connectN - 1) {
            var connectedTokens = [];
            for(var i = 0; i < connectN; i++) {
                if(board[row - i][col] == player) {
                    connectedTokens[i] = [row - i, col];
                } else {
                    break;
                }
            }
            if(connectedTokens.length >= connectN) {
                return connectedTokens;
            }
        }

        // check horizontal
        connectedTokens = [];
        var startHorizontal = col - (connectN - 1);
        var endHorizontal = col + (connectN - 1);
        for(i = clipColIdx(startHorizontal); i <= clipColIdx(endHorizontal); i++) {
            if(board[row][i] == player) {
                connectedTokens.push([row, i]);
                if(connectedTokens.length >= connectN) {
                    return connectedTokens;
                }
            } else {
                connectedTokens = [];
            }
        }

        // check diagonal to right top
        connectedTokens = [];
        var startVertical = row - (connectN - 1);
        var endVertical = row + (connectN - 1);
        var j;

        for(i = startVertical, j = startHorizontal; i <= endVertical; i++, j++) {
            if(i >= 0 && i < nRows && j >= 0 && j < nCols) {
                if(board[i][j] == player) {
                    connectedTokens.push([i, j]);
                    if(connectedTokens.length >= connectN) {
                        return connectedTokens;
                    }
                } else {
                    connectedTokens = [];
                }
            }
        }

        // check diagonal to left top
        connectedTokens = [];
        for(i = startVertical, j = endHorizontal; i <= endVertical; i++, j--) {
            if(i >= 0 && i < nRows && j >= 0 && j < nCols) {
                if(board[i][j] == player) {
                    connectedTokens.push([i, j]);
                    if(connectedTokens.length >= connectN) {
                        return connectedTokens;
                    }
                } else {
                    connectedTokens = [];
                }
            }
        }
        return [];
    }.bind(this);

    /**
     * @function insert
     *      - add token to field
     * @param  {number} player
     *      - player inserting token ( count from 1 )
     * @param  {number} column
     *      - column index token is inserted to
     * @param {Array} state (optional)
     *      - two dimensional array of the game board dimensions to process on,
     *        without changing inner state of the object
     * @return {Array}
     *      - [] if game continues
     * @return {Array}
     *      - [[x1, y1], … , [xn, yn]] coordinates of winning tokens
     */
    this.insert = function(player, column, state) {
        var board = state || field;
        var row = this.getFreeSlotRow(column, state);
        board[row][column] = player;
        return this.detectVictory( column, state );
    }.bind(this);


    /**
     * @function getFreeSlotRow
     *      - get the next free row of a column
     * @param  {number} column
     *      - index of column to check
     * @param  {Array} state (optional)
     *      - two dimensional array of the game board dimensions to process on,
     *        without changing inner state of the object
     * @return {number}
     *      - index of row to fill up nextTwo
     *      - -1 if column is full
     */
    this.getFreeSlotRow = function(column, state) {
        var board = state || field;
        for(var i = 0; i < board.length; i++) {
            if(board[i][column] == 0) {
                return i;
            }
        }
        return -1;
    };


    /**
     * @function isTie
     *      - check wheter the board is full
     * @deprecated
     *      - use 'getOptions().length >= 0' instead
     * @return {bool}
     *      - true if no more moves are possible
     */
    this.isTie = () => {
        return !field[field.length - 1].some(function(a) { return a == 0; });
    };

    /**
     * @function getOptions
     *      - description
     * @param {Array} state (optional)
     *      - two dimensional array of the game board dimensions to process on,
     *        without changing inner state of the object
     * @return {Array}
     *      - column indexes of possible moves
     *      - [] if tie game
     */
    this.getOptions = function(state) {
        var board = state || field;
        var upperRow = board[board.length - 1];
        var res = [];
        for(var i = 0; i < upperRow.length; i++) {
            if(upperRow[i] == 0) {
                res.push(i);
            }
        }
        return res;
    };

    /**
     * @function play
     *      - simulate game with random moves
     * @param  {number} player
     *      - beginning player
     * @param  {Array} state (optional)
     *      - two dimensional array of the game board dimensions to process on,
     *        without changing inner state of the object
     * @return {Array}
     *      - [winning player, [ coordinates of winning tokens in the form of [x, y]]]
     */
    this.play = function(player, state) {
        var winningTokens = false;
        var options = this.getOptions( state );
        while(options.length > 0) {
            winningTokens = this.insert( player, options[Math.floor(Math.random() * options.length)], state );
            if(winningTokens.length > 0) {
                return [player, winningTokens];
            }
            player = player == nPlayer ? 1 : player + 1;
            options = this.getOptions( state );
        }
        if(options.length == 0) {
            return [0, []];
        }
    }.bind(this);

    this.init();
}
