
class Environment {

    // Reset the environment
    clear() {

    }

    // Spawn a new cell in the environment
    spawn(cell) {

    }

    // The supplied cell vill give birth to a new cell.
    giveBirth(cell) {

    }

    // The supplied cell will be killed.
    kill(cell) {

    }

    // Process a combat between 2 cells. If combat already done, do nothing.
    fight(cell1, cell2) {

    }

    // Check if a cell is super adapted to it's environment
    isSuperAdapted(cell) {

    }

    // Check if a cell is adapted to it's environment
    isAdapted(cell) {

    }

    // Advance by one generation returning 2 arrays of born and dead cells.
    step() {

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

class IpdScore {

    constructor(cell) {
        this.cell = cell;
        this.fightCount = 0;
        this.winByStrategyCount = new Map(); // Map strategyName > int
        this.scoreByStrategyCount = new Map(); // Map strategyName > int
        this.winCount = 0;
        this.score = 0;
    }

    addScore(score, versusCell, versusScore) {
        this.fightCount ++;
        if (score) this.score += score;
        if (score > versusScore) this.winCount ++;

        let byStratCounter = (this.winByStrategyCount.get(versusCell.strategy.name) || 0);
        this.winByStrategyCount.set(versusCell.strategy.name, byStratCounter + 1);

        let byStratScore = (this.scoreByStrategyCount.get(versusCell.strategy.name) || 0);
        this.scoreByStrategyCount.set(versusCell.strategy.name, byStratScore + versusScore);
    }

    isGreaterThan(otherScore) {
        if (!otherScore) return true;
        if (this.score > otherScore.score) return true; // The highest score win
        if (this.fightCount > otherScore.fightCount) return true; // The veteran win

        return false;
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
        //let key = Helper.cellKey(cell1.c, cell1.r) + '_' + Helper.cellKey(cell2.strategy.name); // Do only one fight by strategy.
        return key;
    }

    static initArena() {
        let spacing = 10;
        let baseDiameter = 2;

        let stratCounts = strategies.length;
        let replicaCounts = stratCounts * 2// * (stratCounts);
        let alpha = 2 * Math.PI / replicaCounts;

        let arenaDiameter = spacing * replicaCounts / (2 * Math.PI);

        /*
        for (let i = 0; i < stratCounts; i++) {
            for (let j = 0; j < stratCounts - 1; j++) {
                let x = Math.ceil(Math.cos((i + j * (stratCounts)) * alpha) * arenaDiameter);
                let y = Math.ceil(Math.sin((i + j * (stratCounts)) * alpha) * arenaDiameter);
                
                for (let dx = Math.floor(-baseDiameter/2) ; dx <= baseDiameter/2; dx ++) {
                    for (let dy = Math.floor(-baseDiameter/2) ; dy <= baseDiameter/2; dy ++) {
                        let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                        if(dist <= baseDiameter/2) {
                            let cell = new Cell(x + dx, y + dy, strategies[(i + j) % strategies.length]);
                            environment.spawn(cell);
                        }
                    }
                }
            }
        }
        */

        for (let k = 0; k < replicaCounts; k++) {
            let x = Math.ceil(Math.cos(k * alpha) * arenaDiameter);
            let y = Math.ceil(Math.sin(k * alpha) * arenaDiameter);

            let indice = Math.floor(k / strategies.length);
            let position = (indice+1) * strategies.length - (indice) * (Math.round((strategies.length) * 1 / 2)) + (k%strategies.length) * Math.pow(-1, indice) - Math.floor(indice*3/2);
            console.debug('k:', k, 'indice:', indice, 'position:', position);

            for (let dx = Math.floor(-baseDiameter/2) ; dx <= baseDiameter/2; dx ++) {
                for (let dy = Math.floor(-baseDiameter/2) ; dy <= baseDiameter/2; dy ++) {
                    let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    if(dist <= baseDiameter/2) {
                        
                        let cell = new Cell(x + dx, y + dy, strategies[position % strategies.length]);
                        environment.spawn(cell);
                    }
                }
            }
        }
    }
}

export const COOPERATE = 'COOPERATE';
export const DEFECT = 'DEFECT';
//const NEIGHBORHOOD = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const NEIGHBORHOOD = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]; // 8 surronding boxes from 12 oclock

// Tous les combats sont "reversibles". On ne joue que "la moitié" des combats.
class IteratedPrisonersDilemmaEnvironment {

    constructor(roundCount, boundary) {
        this.roundCount = roundCount;
        this.livings = new Map(); // Map of living cell : cellKey > Cell
        this.neigborhoodsMap = new Map(); // Map of neighbor cells : cellKey > [[neighborCellsLvl0], [neighborCellsLvl1], ...]
        this.fightsDone = new Set(); // Set of fightKey
        this.scoreboard = new Map(); // Map of score : cellKey > Score
        this.leaderboard = []; // Array of Cell
        this.fightResultCacheDisabled = false;
        this.fightResultCache = new Map(); // Map of fitht result : strat1;strat2 > [counter, counter]
        this.boundary = boundary;
    }

    // Reset the environment
    clear() {
        this.livings = new Map();
        this.fightsDone = new Set();
        this.scoreboard = new Map();
        this.leaderboard = [];

        Helper.initArena();
    }

    spawn(cell) {
        //console.debug('Spawning new Cell:', cell.key());

        let key = cell.key();
        if (this.livings.has(key)) {
            throw new Error('Trying to spawn a cell on a living cell !');
        }

        this.livings.set(key, cell);
    }

    // Return the neighborhoods keys of a cell : an array of levels neighbors discribed by their cellKey.
    neigborhoodsKeys(cell) {
        let cellKey = cell.key();
        if (this.neigborhoodsMap.has(cellKey)) {
            return this.neigborhoodsMap.get(cellKey);
        }

        let neighborhood = [];
        let distancesToCenter = [];
        for (let [dc, dr] of NEIGHBORHOOD) {
            let nr = cell.r + dr;
            let nc = cell.c + dc;
            let midDistanceToCenter = Math.sqrt(Math.pow(cell.c, 2) + Math.pow(cell.r, 2));
            let distanceToCenter = Math.sqrt(Math.pow(nc, 2) + Math.pow(nr, 2));
            let reducedDistanceToCenter = 3 + distanceToCenter - midDistanceToCenter;
            //distancesToCenter.push([reducedDistanceToCenter, distanceToCenter, nc, nr]);
            distancesToCenter.push([reducedDistanceToCenter, distanceToCenter, nc, nr]);
        }
        distancesToCenter.sort();

        for (let [reduced, dist, nc, nr] of distancesToCenter) {
            if (this.boundary > 0 && (nc > this.boundary || nc < -this.boundary | nr > this.boundary || nr < -this.boundary)) {
                // neighboor outside of boundaries.
            } else {
                let ncellKey = Helper.cellKey(nc, nr);
                neighborhood.push(ncellKey);
            }
        }

        let neighborhoods = [neighborhood];
        this.neigborhoodsMap.set(cellKey, neighborhoods);
        //console.debug('neighborhoods:', neighborhoods);
        return neighborhoods;
    }

    // A cell give birth to some Cells, returning the new cells. Do not spwn any cell.
    giveBirth(cell) {
        let babies = [];
        let [neighborhood] = this.neigborhoodsKeys(cell);
        for (let neighborKey of neighborhood) {
            if (this.livings.has(neighborKey)) {
                // neighbor is alive. Do not give birth here.
                //console.debug('someone is living here !');
            } else {
                // neighbor is not alive. Give birth here.
                let nCell = Helper.parseCell(neighborKey);
                //console.debug('neighborKey:', neighborKey, 'nCell:', nCell);
                let baby = new Cell(nCell.c, nCell.r, cell.strategy);
                //console.debug('A new baby:', baby);
                babies.push(baby);
                break;
            }
        }

        //console.debug('Giving birth to cell:', cell, 'with babies:', babies);
        return babies;
    }

    kill(cell) {
        let key = cell.key();
        this.livings.delete(key);
    }

    // Process a combat between 2 cells. If combat already done, do nothing.
    fight(cell1, cell2) {
        let fightKey = Helper.fightKey(cell1, cell2);
        if (this.fightsDone.has(fightKey)) return;

        let strategy1Counter = 0;
        let strategy2Counter = 0;

        let fightingStratsKey = cell1.strategy.name + ';' + cell2.strategy.name;
        if (!this.fightResultCache.has(fightingStratsKey) || this.fightResultCacheDisabled) {
            // Do the fight anc cache it's results.
            //console.debug('FIGHT: ', cell1.key(), 'vs', cell2.key());

            let strategy1 = cell1.strategy;
            let strategy2 = cell2.strategy;
            
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
            
            //console.debug('Cell1 get', strategy1Counter, 'points ; Cell2 get', strategy2Counter, 'points.');

            this.fightResultCache.set(fightingStratsKey, [strategy1Counter, strategy2Counter]);
        } else {
         [strategy1Counter, strategy2Counter] = this.fightResultCache.get(fightingStratsKey);
        }

        let score1 = (this.scoreboard.get(cell1.key()) || new IpdScore(cell1))
        score1.addScore(strategy1Counter, cell2, strategy2Counter);
        this.scoreboard.set(cell1.key(), score1);

        let score2 = (this.scoreboard.get(cell2.key()) || new IpdScore(cell2))
        score2.addScore(strategy2Counter, cell1, strategy1Counter);
        this.scoreboard.set(cell2.key(), score2);

        // Fights are symetric so add 2 fights to set of done fights.
        this.fightsDone.add(Helper.fightKey(cell1, cell2));
        // FIXME: With only one fight by strategy, fight are no more symetric.
        this.fightsDone.add(Helper.fightKey(cell2, cell1));
    }

    isDying(cell) {
        let score = this.scoreboard.get(cell.key());
        if (!score) return true;
        let [neighborhood] = this.neigborhoodsKeys(cell);
        let sameStratCount = 0;
        let localTotalScore = score.score;
        let neighborByStratCountMap = new Map();
        for (let i = 0; i < neighborhood.length; i++) {
            let neighborKey = neighborhood[i];
            if (this.livings.has(neighborKey)) {
                let neighbor = this.livings.get(neighborKey);
                if (cell.strategy.name === neighbor.strategy.name) {
                    sameStratCount ++;
                }

                let count = neighborByStratCountMap.get(neighbor.strategy.name) || 0;
                neighborByStratCountMap.set(neighbor.strategy.name, count + 1);
            }

            let nScore = this.scoreboard.get(neighborKey);
            if (nScore) localTotalScore += nScore.score;
        }

        //console.debug('sameStratCount: ', sameStratCount);
        if (sameStratCount === 0) return true; // Die if alone.

        let neighborByStratCounts = Array.from(neighborByStratCountMap.values());

        // Die if a strategie cumul more point than our strategy.
        let badScoreVersusStrat = false;
        neighborByStratCountMap.forEach((neighborCount, strat, map) => {
            //if (sameStratCount <= neighborCount) {
                // if more foes than firends.
                //return score.score < localTotalScore/(neighborhood.length + 1); // Die if score < mean.
                badScoreVersusStrat = badScoreVersusStrat || score.scoreByStrategyCount.get(cell.strategy.name) < score.scoreByStrategyCount.get(strat);
            //}
        });
        if (badScoreVersusStrat) return true;

        //console.debug('neighborByStratCounts:', neighborByStratCounts);
        for (let i = 0; i < neighborByStratCounts.length; i++) {
            if (sameStratCount < neighborByStratCounts[i]) {
                // if more foes than firends.

                return score.score < localTotalScore/(neighborhood.length + 1); // Die if score < mean.
            }
        }

        //console.debug('score: ', score.score, '/', localTotalScore);
        return score.score < localTotalScore/(neighborhood.length + 1) * 8/10; // Die if score < 2/3 of mean score.
    }

    isGivingBirth(cell) {
        let score = this.scoreboard.get(cell.key());
        if (!score) return false;
        let [neighborhood] = this.neigborhoodsKeys(cell);
        let sameStratCount = 0;
        let localTotalScore = score.score;
        for (let i = 0; i < neighborhood.length; i++) {
            let neighborKey = neighborhood[i];
            if (this.livings.has(neighborKey)) {
                let neighbor = this.livings.get(neighborKey);
                if (cell.strategy === neighbor.strategy) {
                    sameStratCount ++;
                }
            }

            let nScore = this.scoreboard.get(neighborKey);
            if (nScore) localTotalScore += nScore.score;
        }
        return sameStratCount > 2 && score.score >= localTotalScore/(neighborhood.length + 1); // Give birth if good score and there is 2 cells
    }

    // Check if a cell is adapted to it's environment
    isAdapted(cell) {
        let score = this.scoreboard.get(cell.key());
        if (!score) return false;
        let [neighborhood] = this.neigborhoodsKeys(cell);
        for (let neighborKey of neighborhood) {
            let nScore = this.scoreboard.get(neighborKey);
        }


        if (this.scoreboard.has(cell.key())) {
            let score = this.scoreboard.get(cell.key());
            
            //return score.winCount > 4 || score.score > 8 * 1 * this.roundCount;
            //return score.score > 8 * 1 * this.roundCount;
            //return score > 8 * 1 * this.roundCount;
            //return score.score > score.fightCount * 1 * this.roundCount * 7 / 6;
            //return score.score > score.fightCount * 1 * this.roundCount * 15 / 12;

            if (score.fightCount <= 1 ) return true;

            let dc, dr, nc, nr, ncellKey;
            let level = 0;
            for ([dc, dr] of NEIGHBORHOOD) {
                nr = cell.r + dr;
                nc = cell.c + dc;
                ncellKey = Helper.cellKey(nc, nr);
                let ncellScore = this.scoreboard.get(ncellKey);
                //console.debug('ncellScore:', ncellScore);
                if (ncellScore && score.isGreaterThan(ncellScore)) {
                    level++;
                }
            }

            //console.debug('cell:', cell.key(), 'fights:', score.fightCount, 'rank:', rank);
            return level > score.fightCount - 2;
        } else {
            throw new Error('Cell do not have a score !');
        }
    }

    step() {
        let self = this;
        let givingBirths = [];
        let births = [];
        let deaths = [];
        this.fightsDone = new Set();
        this.scoreboard = new Map();
        this.leaderboard = [];
        this.fightResultCache = new Map();

        let dr, dc, nr, nc, ncell, neighbor;
        this.livings.forEach((cell, key, map) => {
            for ([dc, dr] of NEIGHBORHOOD) {
                nr = cell.r + dr;
                nc = cell.c + dc;
                ncell = Helper.cellKey(nc, nr);
                if (this.livings.has(ncell)) {
                    // neighbor is alive. Fight against it !
                    neighbor = this.livings.get(ncell);
                } else {
                    // neighbor is not alive. Treat it as a dummy random.
                    neighbor = new Cell(nc, nr, RANDOM_STRATEGY);
                }

                self.fight(cell, neighbor);
            }
        });

        /*
        console.info('livings: ', this.livings);
        this.scoreboard.forEach((score, cellKey, map) => {
            let key = cell.key();
            if (!self.livings.has(key)) {
                map.delete(cell);
            } else {
                self.leaderboard.push([score, key]);
            }
        });
        console.info('scoreboard: ', this.scoreboard);
        */

        //let orderedScores = new Array(this.scoreboard.values).sort().reverse();

        // FIXME: le leaderbord n'est pas ordonné numériquement ainsi !
        //this.leaderboard.sort().reverse();
        //console.info('leaderboard: ', this.leaderboard);

        let babiesByParentMap = new Map();
        let parentsByBabyMap = new Map(); // Map of babyCellKey > [concurrentsParentCell]
        this.livings.forEach((cell, key, map) => {
            if (self.isDying(cell)) {
                deaths.push(cell);
            } else
            if (self.isGivingBirth(cell)) {
                givingBirths.push(cell);
                let babies = this.giveBirth(cell);
                if (babies) {
                    babiesByParentMap.set(cell, babies);
                    babies.forEach(baby => {
                        let babyKey = baby.key();
                        let concurrentParrents;
                        if (!parentsByBabyMap.has(babyKey)) {
                            concurrentParrents = [];
                            parentsByBabyMap.set(babyKey, concurrentParrents);
                        } else {
                            concurrentParrents = parentsByBabyMap.get(babyKey);
                        }
                        concurrentParrents.push(cell);
                    });
                }
            }
            
            
        });

        parentsByBabyMap.forEach((concurrentParrents, babyKey, map) => {
            // The parent with higher score win the baby cell !
            let highestScore;
            let winningCell;
            concurrentParrents.forEach(cell => {
                let score = this.scoreboard.get(cell.key());
                if (score.isGreaterThan(highestScore)) {
                    highestScore = score;
                    winningCell = cell;
                }
            });
            let babies = babiesByParentMap.get(winningCell);
            babies.forEach(baby => {
                this.spawn(baby);
                births.push(baby);
            });
        });

        deaths.forEach(cell => this.kill(cell));

        console.info('births:', births);
        console.info('deaths:', deaths);

        return [births, deaths];
    }

}

export const environment = new IteratedPrisonersDilemmaEnvironment(100, 30);

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
    this.color = 'pink';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber == 0) return COOPERATE;
        return otherPlays[roundNumber - 1];
    }
    
}

const BAD_DONNANT_STRATEGY = new BadDonnantStrategy()
function BadDonnantStrategy() {
    this.name = 'BadDonnantStrategy';
    this.color = 'purple';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber == 0) return DEFECT;
        return otherPlays[roundNumber - 1];
    }
    
}

const DOUBLE_DONNANT_STRATEGY = new DoubleDonnantStrategy()
function DoubleDonnantStrategy() {
    this.name = 'DoubleDonnantStrategy';
    this.color = 'grey';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber < 2) return COOPERATE;
        if (otherPlays[roundNumber - 1] == DEFECT && otherPlays[roundNumber - 2] == DEFECT) return DEFECT;
        return COOPERATE;
    }
    
}

const PER_CD_STRATEGY = new PerCDStrategy()
function PerCDStrategy() {
    this.name = 'PerCDStrategy';
    this.color = 'yellow';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber % 2 == 0) return COOPERATE;
        return COOPERATE;
    }
    
}

const PER_CCD_STRATEGY = new PerCCDStrategy()
function PerCCDStrategy() {
    this.name = 'PerCCDStrategy';
    this.color = 'lightgreen';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber % 3 < 2) return COOPERATE;
        return DEFECT;
    }
    
}

const PER_DDC_STRATEGY = new PerDDCStrategy()
function PerDDCStrategy() {
    this.name = 'PerDDCStrategy';
    this.color = 'orange';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        if (roundNumber % 3 < 2) return DEFECT;
        return COOPERATE;
    }
    
}

const RANDOM_STRATEGY = new RandomStrategy()
function RandomStrategy() {
    let self = this;
    this.name = 'RandomStrategy';
    this.color = 'white';

    this.plays = [];
    for(let i = 0; i < environment.roundCount; i++) {
        if (Math.random() * 2 < 2) {
            self.plays.push(COOPERATE);
        } else {
            self.plays.push(DEFECT);
        }
    }

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        //return self.plays[roundNumber];
        if (Math.random() * 2 < 2) return COOPERATE;
        return DEFECT;
    }
}

const VOID_STRATEGY = new VoidStrategy()
function VoidStrategy() {
    this.name = 'VoidStrategy';
    this.color = 'black';

    // Return the move of the strategy
    this.play = function(roundNumber, myPlays, otherPlays, roundCount) {
        throw new Error('This strategy should not play !');
    }
}

//const strategies = [DEFECTIVE_STRATEGY, COOPERATIVE_STRATEGY];
//const strategies = [DEFECTIVE_STRATEGY, COOPERATIVE_STRATEGY,  DONNANT_DONNANT_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CCD_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_DDC_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY, DONNANT_DONNANT_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY, BAD_DONNANT_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY, PER_DDC_STRATEGY, DONNANT_DONNANT_STRATEGY];
const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CCD_STRATEGY, DOUBLE_DONNANT_STRATEGY, PER_DDC_STRATEGY, DONNANT_DONNANT_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY, PER_DDC_STRATEGY];
//const strategies = [COOPERATIVE_STRATEGY, DEFECTIVE_STRATEGY, PER_CD_STRATEGY, PER_CCD_STRATEGY, PER_DDC_STRATEGY, DONNANT_DONNANT_STRATEGY, DEFECTIVE_STRATEGY];
Helper.initArena();