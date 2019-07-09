(function () {
    importScripts('C4Logic.js');
    this.tester;
    this.params;

    this.getNextPlayer = function(current_player) {
        return current_player >= this.params.nPlayers ? 1 : current_player + 1;
    }.bind(this);

    // helper decideMC
    // only works for tow players
    this.winOnNextTwo = function (testField, player) {
        var res = [];
        var options = this.tester.getOptions(testField);
        for (var m = 0; m < options.length; m++) {
            this.tester.setState(testField);
            this.tester.insert(player, options[m]);
            if(this.tester.getFreeSlotRow(options[m]) > 0) {
                var winningTokens = this.tester.insert(this.getNextPlayer(player), options[m]);
                if(winningTokens.length > 0) {
                    res.push([options[m], false]);
                }
            }
        }
        return res;
    }.bind(this);


    // helper decideMC
    // returns [] if no winning possibilities where found
    // returns [col_idx, ...]
    this.winOnNext = function (testField, player) {
        var winningCols = [];
        var options = this.tester.getOptions(testField);
        for (var m = 0; m < options.length; m++) {
            this.tester.setState(testField);
            var winner = this.tester.insert(player, options[m]);
            if(winner.length > 0) {
                winningCols.push(options[m]);
            }
        }
        return winningCols;
    }.bind(this);
    // make computer decision
    this.decideMC = function() {
        var moves = [];

        // if someone could winn the next move
        // choose that column to either win
        // or prevent s.o. else from winning
        for(i = 1; i <= this.params.nPlayers; i++) {
            var winningCols = this.winOnNext(this.params.field, i);
            if(winningCols.length > 0) {
                for(var j = 0; j < winningCols.length; j++) {
                    if(i == this.params.currentPlayer) {
                        moves.unshift(winningCols[j]);
                    } else {
                        moves.push(winningCols[j]);
                    }
                }
            }
        }


        // check if s.o. could win within the next two moves
        // choose column if player would win
        // avoid it otherwise
        var append = [];
        var nextTwo = this.winOnNextTwo(this.params.field, this.params.currentPlayer);
        if(nextTwo.length > 0) {
            for(i = 0; i < nextTwo.length; i++) {
                if(nextTwo[i][1]) {
                    moves.push(nextTwo[i][0]);
                } else {
                    append.push(nextTwo[i][0]);
                }
            }
        }

        // Monte Carlo
        var results = [];
        var options = this.tester.getOptions(this.params.field);
        for (var m = 0; m < options.length; m++) {
            var rTmp = [];
            for(var n = 0; n <= this.params.nPlayers; n++) {
                rTmp.push(0);
            }
            for (var i = 0; i < 2000; i++) {
                this.tester.setState(this.params.field);
                this.tester.insert(this.params.currentPlayer, options[m]);
                var winner = this.tester.play(this.getNextPlayer(this.params.currentPlayer))[0];
                rTmp[winner]++;
            }
            results[m] = [options[m], rTmp];
        }
        // sort from best to worst case
        results.sort(function(a, b) {
            return b[1][this.params.currentPlayer] - a[1][this.params.currentPlayer];
        });
        // extract indexes
        var resIdxs = results.map(function(a) {return a[0];});
        // remove more important values
        for(i = 0; i < append.length; i++) {
            var rmIdx = resIdxs.indexOf(append[i]);
            if(rmIdx >= 0) {
                resIdxs = resIdxs.slice(0, rmIdx).concat(resIdxs.slice(rmIdx+1));
            }
        }
        for(i = 0; i < moves.length; i++) {
            rmIdx = resIdxs.indexOf(moves[i]);
            if(rmIdx >= 0) {
                resIdxs = resIdxs.slice(0, rmIdx).concat(resIdxs.slice(rmIdx+1));
            }
        }
        // put it together
        moves = moves.concat(resIdxs).concat(append);

        return moves;
    }.bind(this);

    self.addEventListener('message', function(e) {
        this.params = JSON.parse(e.data);
        this.tester = new C4Logic(params.nCols, params.nRows, params.nPlayers, params.connectN)
        this.tester.setState(params.field);
        var result = this.decideMC();

        self.postMessage(JSON.stringify(result));
        self.close();
    }.bind(this));
})();
