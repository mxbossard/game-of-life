
function Environment() {

    // Process a combat between 2 strategies. If combat already done, do nothing.
    this.fight = function(strategy1, strategy2) {

    }

    // Check if a cell is adapted to it's environment
    this.isAdapted = function(cell, neighborhood) {

    }

    // Check if a cell is super adapted to it's environment
    this.isSuperAdapted = function(cell, neighborhood) {

    }

    // Check if a cell is not adapted to it's environment
    this.isNotAdapted = function(cell, neighborhood) {

    }

}

function Strategy() {

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {

    }
}

export const COOPERATE = 'COOPERATE';
export const DEFECT = 'DEFECT';
const NEIGHBORHOOD = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

// FIXME: Est-ce que les combats sont reversible ? si oui il ne faut jouer que "la moitié" des combats.
function IteratedPrisonersDilemmaEnvironment(roundCount) {
    let self = this;
    self.livings = new Map();
    self.fightsDone = new Set();
    self.scoreboard = new Map();

    this.step = function() {
        self.fightsDone = new Set();
        self.scoreboard = new Map();

        let dr, dc, nr, nc, neighbor;
        livings.forEach((value, key, map) => {
            for ([dr, dc] of NEIGHBORHOOD) {
                nr = cell.r + dr;
                nc = cell.c + dc;
                ncell = this.stringify({r:nr, c:nc})
                if (livings.has(ncell)) {
                    // neighbor is alive. Fight against it !
                    neighbor = livings.get(ncell);
                } else {
                    // neighbor is not alive. Treat it as a dummy random.
                    neighbor = new Cell(nc, nr, new RandomStrategy())
                }

                self.fight(value, neighbor);
            }
        });
    }

    // Process a combat between 2 cells. If combat already done, do nothing.
    this.fight = function(cell1, cell2) {
        if (self.fightsDone.has(cell1.stringify() + '_' + cell2.stringify())) return;

        let strategy1 = cell1.strategy;
        let strategy2 = cell2.strategy;
        let strategy1Counter = 0;
        let strategy2Counter = 0;
        for (let i = 0; i < self.roundCount; i++) {
            let play1 = strategy1.play();
            let play2 = strategy2.play();

            if (play1 == COOPERATE && play2 == COOPERATE) {
                // 3 points for everyone
                strategy1Counter += 3;
                strategy2Counter += 3;
            } else if (play1 == COOPERATE && play2 == DEFECT) {
                // 0 point for strategy1 ; 5 points for strategy 2
                strategy2Counter += 5;
            } else if (play1 == DEFECT && play2 == COOPERATE) {
                // 5 points for strategy1 ; 0 point for strategy 2
                strategy1Counter += 5;
            } else if (play1 == DEFECT && play2 == DEFECT) {
                // 1 point for strategy1 ; 1 point for strategy 2
                strategy1Counter += 1;
                strategy2Counter += 1;
            } else {
                throw new Error('Not supported play [', + play1 + ' ; ' + play2 + '] for strategies [' + strategy1.name + ' ; ' + strategy2.name + '] !');
            }
        }
        
        self.scoreboard.set(cell1, self.scoreboard.get(cell1) + strategy1Counter);
        self.scoreboard.set(cell2, self.scoreboard.get(cell2) + strategy2Counter);

        // Fights are symetric so add 2 fights to set of done fights.
        self.fightsDone.add(cell1.stringify() + '_' + cell2.stringify());
        self.fightsDone.add(cell2.stringify() + '_' + cell1.stringify());
    }

    // Check if a cell is adapted to it's environment
    this.isAdapted = function(cell) {
        
    }

    // Check if a cell is super adapted to it's environment
    this.isSuperAdapted = function(cell) {

    }

    // Check if a cell is not adapted to it's environment
    this.isNotAdapted = function(cell, neighborhood) {

    }
}

function CooperativeStrategy() {
    this.name = 'CooperativeStrategy';
    this.color = 'forestgreen';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        return COOPERATE;
    }
}

function DefectiveStrategy() {
    this.name = 'DefectiveStrategy';
    this.color = 'red';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        return DEFECT;
    }
}

function DonnantDonnantStrategy() {
    this.name = 'DonnantDonnantStrategy';
    this.color = 'lightblue';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber == 0) return COOPERATE;
        return otherPlays[roundNumber - 1];
    }
    
}

function RandomStrategy() {
    this.name = 'RandomStrategy';
    this.color = 'white';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (Math.random() * 2 > 1) return COOPERATE;
        return DEFECT;
    }
    
}

export const ENVIRONMENT = new IteratedPrisonersDilemmaEnvironment();

