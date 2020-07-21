
function Environment() {

    // Reset the environment
    this.clear = function() {

    }

    // Spawn a new cell in the environment
    this.spawn = function(cell) {

    }

    // The supplied cell vill give birth to a new cell.
    this.giveBirth = function(cell) {

    }

    // The supplied cell will be killed.
    this.kill = function(cell) {

    }

    // Process a combat between 2 strategies. If combat already done, do nothing.
    this.fight = function(strategy1, strategy2) {

    }

    // Check if a cell is super adapted to it's environment
    this.isSuperAdapted = function(cell, neighborhood) {

    }

    // Check if a cell is adapted to it's environment
    this.isAdapted = function(cell, neighborhood) {

    }

    // Advance by one generation returning 2 arrays of born and dead cells.
    this.step = function() {

    }

}

function Strategy() {

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {

    }
}

class Cell {

    constructor(c, r, strategy) {
        this.c = c;
        this.r = r;
        this.strategy = strategy;
        this.alive = true;
    }

    key() {
        return Helper.cellKey(this.c, this.r);
    }

    static parse(cellString) {
        return Helper.parseCell(cellString);
    }
}

class Helper {

    static cellKey(c, r) {
        return c + ';' + r; //+ ';' + cell.strategy.name
    }

    static parseCell(cellString) {
        //const [r, c, strategy] = cellString.split(';')
        //return {r:parseInt(r, 10), c:parseInt(c, 10), strategy: strategy}
        const [c, r] = cellString.split(';');
        return {r:parseInt(r, 10), c:parseInt(c, 10)};
    }

    static fightKey(cell1, cell2) {
        let key = Helper.cellKey(cell1.c, cell1.r) + '_' + Helper.cellKey(cell2.c, cell2.r);
        return key;
    }
}

export const COOPERATE = 'COOPERATE';
export const DEFECT = 'DEFECT';
//const NEIGHBORHOOD = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const NEIGHBORHOOD = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]; // 8 surronding boxes from 12 oclock

// Tous les combats sont "reversibles". On ne joue que "la moitié" des combats.
class IteratedPrisonersDilemmaEnvironment {

    constructor(roundCount) {
        this.roundCount = roundCount;
        this.livings = new Map(); // Map of living cell : cellKey > Cell
        this.fightsDone = new Set(); // Set of fightKey
        this.scoreboard = new Map(); // Map of score : Cell > int
        this.leaderboard = []; // Array of Cell
    }

    // Reset the environment
    clear() {
        this.livings = new Map();
        this.fightsDone = new Set();
        this.scoreboard = new Map();
        this.leaderboard = [];
    }

    spawn(cell) {
        //console.debug('Spawning new Cell:', cell.key());
        let key = cell.key();
        this.livings.set(key, cell);
    }

    // A cell give birth to some Cells, returning the new cells.
    giveBirth(cell) {
        let dr, dc, nr, nc, ncellKey, baby
        // Give birth in the first place in the neighborhood
        for ([dc, dr] of NEIGHBORHOOD) {
            nr = cell.r + dr;
            nc = cell.c + dc;
            ncellKey = Helper.cellKey(nc, nr);
            if (this.livings.has(ncellKey)) {
                // neighbor is alive. Do not give birth here.
                //console.debug('someone is living here !');
                continue;
            } else {
                // neighbor is not alive. Give birth here.
                baby = new Cell(nc, nr, cell.strategy);
                //this.spawn(baby);
                return [baby];
            }
        }
    }

    kill(cell) {
        let key = cell.key();
        this.livings.delete(key);
    }

    step() {
        let self = this;
        let givingBirths = [];
        let births = [];
        let deaths = [];
        this.fightsDone = new Set();
        this.scoreboard = new Map();
        this.leaderboard = [];

        let dr, dc, nr, nc, ncell, neighbor, babies;
        this.livings.forEach((cell, key, map) => {
            for ([dr, dc] of NEIGHBORHOOD) {
                nr = cell.r + dr;
                nc = cell.c + dc;
                ncell = Helper.cellKey(nc, nr);
                if (this.livings.has(ncell)) {
                    // neighbor is alive. Fight against it !
                    neighbor = this.livings.get(ncell);
                } else {
                    // neighbor is not alive. Treat it as a dummy random.
                    neighbor = new Cell(nc, nr, RANDOM_STRATEGY)
                }

                self.fight(cell, neighbor);
            }
        });

        console.info('livings: ', this.livings);

        this.scoreboard.forEach((score, cell, map) => {
            let key = cell.key();
            if (!self.livings.has(key)) {
                map.delete(cell);
            } else {
                self.leaderboard.push([score, key]);
            }
        });

        console.info('scoreboard: ', this.scoreboard);

        // FIXME: le leaderbord n'est pas ordonné numériquement ainsi !
        //this.leaderboard.sort().reverse();
        //console.info('leaderboard: ', this.leaderboard);

        this.livings.forEach((cell, key, map) => {
            if (self.isAdapted(cell)) {
                givingBirths.push(cell);
            } else {
                deaths.push(cell);
            }
        });

        givingBirths.forEach(cell => {
            babies = this.giveBirth(cell)
            if (babies) {
                babies.forEach(cell => births.push(cell));
            }
        });
        deaths.forEach(cell => this.kill(cell));

        console.info('births:', births);
        console.info('deaths:', deaths);

        return [births, deaths];
    }

    // Process a combat between 2 cells. If combat already done, do nothing.
    fight(cell1, cell2) {
        if (this.fightsDone.has(Helper.fightKey(cell1, cell2))) return;

        //console.debug('FIGHT: ', cell1.key(), 'vs', cell2.key());

        let strategy1 = cell1.strategy;
        let strategy2 = cell2.strategy;
        let strategy1Counter = 0;
        let strategy2Counter = 0;
        let strategy1Plays = [];
        let strategy2Plays = [];
        for (let i = 0; i < this.roundCount; i++) {
            let play1 = strategy1.play(i, strategy1Plays, strategy2Plays, this.roundCount);
            let play2 = strategy2.play(i, strategy2Plays, strategy1Plays, this.roundCount);

            strategy1Plays.push(play1);
            strategy2Plays.push(play2);

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
        
        console.debug('Cell1 get', strategy1Counter, 'points ; Cell2 get', strategy2Counter, 'points.');
        this.scoreboard.set(cell1, (this.scoreboard.get(cell1) || 0) + strategy1Counter);
        this.scoreboard.set(cell2, (this.scoreboard.get(cell2) || 0) + strategy2Counter);

        // Fights are symetric so add 2 fights to set of done fights.
        this.fightsDone.add(Helper.fightKey(cell1, cell2));
        this.fightsDone.add(Helper.fightKey(cell2, cell1));
    }

    // Check if a cell is super adapted to it's environment
    isSuperAdapted(cell) {
        if (self.scoreboard.has(cell)) {
            let score = this.scoreboard.get(cell);
            return score > 8 * 4 * this.roundCount
        } else {
            throw new Error('Cell do not have a score !');
        }
    }

    // Check if a cell is adapted to it's environment
    isAdapted(cell) {
        if (this.scoreboard.has(cell)) {
            let score = this.scoreboard.get(cell);
            //return score > 8 * 2 * this.roundCount * 3 / 4
            return score > 8 * 2 * this.roundCount;
        } else {
            throw new Error('Cell do not have a score !');
        }
    }

}

const COOPERATIVE_STRATEGY = new CooperativeStrategy()
function CooperativeStrategy() {
    this.name = 'CooperativeStrategy';
    this.color = 'forestgreen';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        return COOPERATE;
    }
}

const DEFECTIVE_STRATEGY = new DefectiveStrategy()
function DefectiveStrategy() {
    this.name = 'DefectiveStrategy';
    this.color = 'red';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        return DEFECT;
    }
}

const DONNANT_DONNANT_STRATEGY = new DonnantDonnantStrategy()
function DonnantDonnantStrategy() {
    this.name = 'DonnantDonnantStrategy';
    this.color = 'lightblue';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber == 0) return COOPERATE;
        return otherPlays[roundNumber - 1];
    }
    
}

const RANDOM_STRATEGY = new RandomStrategy()
function RandomStrategy() {
    this.name = 'RandomStrategy';
    this.color = 'white';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (Math.random() * 2 > 1) return COOPERATE;
        return DEFECT;
    }
    
}

export const environment = new IteratedPrisonersDilemmaEnvironment(100);

let cellA = new Cell(-5, 0, COOPERATIVE_STRATEGY);
environment.spawn(cellA);

let cellB = new Cell(0, 0, DEFECTIVE_STRATEGY);
environment.spawn(cellB);

let cellC = new Cell(5, 0, DONNANT_DONNANT_STRATEGY);
environment.spawn(cellC);