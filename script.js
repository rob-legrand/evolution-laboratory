/*jslint bitwise: true, vars: true, browser: true, indent: 3 */

var startPopulation = function () {
   'use strict';

   var populationCanvas = document.getElementById('population');
   var populationContext = populationCanvas && populationCanvas.getContext && populationCanvas.getContext('2d');
   if (!populationContext) {
      document.getElementById('instructions').innerHTML = 'Your browser does not seem to support the <code>&lt;canvas&gt;</code> element correctly.&nbsp; Please use a recent version of a standards-compliant browser such as <a href="http://www.opera.com/">Opera</a>, <a href="http://www.google.com/chrome/">Chrome</a> or <a href="http://www.getfirefox.com/">Firefox</a>.';
      window.alert('Your browser does not seem to support the <canvas> element correctly.\nPlease use a recent version of a standards-compliant browser such as Opera, Chrome or Firefox.');
      return;
   }
   populationCanvas.width = 840;
   populationCanvas.height = 840;

   var numCellsWide, cellWidth, numCellsTall, cellHeight;
   var cellValues;
   var numColorBits = 8;
   var numColorLevels = 1 << numColorBits;
   var highestColorLevel = numColorLevels - 1;
   var numRoundsPerEncounter;
   var payoffBest, payoffNextBest, payoffNextWorst, payoffWorst;
   var payoffReward, payoffSucker, payoffTemptation, payoffPunishment;
   var numGenesOnChromosome, numGeneValues, highestGeneValue, numColorLevelsPerGene;
   var reproductionSelection, reproductionMeans;
   var populationSizeSelect = document.getElementById('population-size');
   var roundsPerEncounterSelect = document.getElementById('rounds-per-encounter');
   var payoffBestSelect = document.getElementById('payoff-best');
   var payoffNextBestSelect = document.getElementById('payoff-nextbest');
   var payoffNextWorstSelect = document.getElementById('payoff-nextworst');
   var payoffWorstSelect = document.getElementById('payoff-worst');
   var gamePlayedSelect = document.getElementById('game-played');
   var payoffCellCCRow = document.getElementById('payoff-cell-cc-row');
   var payoffCellCCCol = document.getElementById('payoff-cell-cc-col');
   var payoffCellCDRow = document.getElementById('payoff-cell-cd-row');
   var payoffCellCDCol = document.getElementById('payoff-cell-cd-col');
   var payoffCellDCRow = document.getElementById('payoff-cell-dc-row');
   var payoffCellDCCol = document.getElementById('payoff-cell-dc-col');
   var payoffCellDDRow = document.getElementById('payoff-cell-dd-row');
   var payoffCellDDCol = document.getElementById('payoff-cell-dd-col');
   var interactionNeighborLeftDownCheckbox = document.getElementById('interaction-neighbor-left-down');
   var interactionNeighborLeftCheckbox = document.getElementById('interaction-neighbor-left');
   var interactionNeighborLeftUpCheckbox = document.getElementById('interaction-neighbor-left-up');
   var interactionNeighborUpCheckbox = document.getElementById('interaction-neighbor-up');
   var interactionNeighborRightUpCheckbox = document.getElementById('interaction-neighbor-right-up');
   var interactionNeighborRightCheckbox = document.getElementById('interaction-neighbor-right');
   var interactionNeighborRightDownCheckbox = document.getElementById('interaction-neighbor-right-down');
   var interactionNeighborDownCheckbox = document.getElementById('interaction-neighbor-down');
   var interactionNeighborSelfCheckbox = document.getElementById('interaction-neighbor-self');
   var genesOnChromosomeSelect = document.getElementById('genes-on-chromosome');
   var reproductionSelectionSelect = document.getElementById('reproduction-selection');
   var reproductionMeansSelect = document.getElementById('reproduction-means');
   var advanceGeneration = null;

   Array.prototype.peek = function (fromTop) {
      return fromTop ? this[this.length - fromTop - 1] : this[this.length - 1];
   };

   var resizePopulation = function (newNumCellsWide, newNumCellsTall) {
      var cellX, cellY;
      numCellsWide = newNumCellsWide;
      cellWidth = populationCanvas.width / numCellsWide;
      numCellsTall = newNumCellsTall;
      cellHeight = populationCanvas.height / numCellsTall;

      // initialize cell values
      cellValues = [];
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         cellValues[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY] = {red: 0, green: 0, blue: 0, dot: false};
         }
      }
   };

   var randomizePopulation = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = Math.floor(Math.random() * numGeneValues);
            cellValues[cellX][cellY].green = Math.floor(Math.random() * numGeneValues);
            cellValues[cellX][cellY].blue = Math.floor(Math.random() * numGeneValues);
         }
      }
   };

   var redrawPopulation = function () {
      var cellX, cellY, farthestFromAverage;
      var averageOrganismElement = document.getElementById('average-organism');
      var averageCellValue = {red: 0, green: 0, blue: 0, dot: 0};

      // draw cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            populationContext.fillStyle = 'rgb(' + cellValues[cellX][cellY].red * numColorLevelsPerGene + ', ' +
                                                   cellValues[cellX][cellY].green * numColorLevelsPerGene + ', ' +
                                                   cellValues[cellX][cellY].blue * numColorLevelsPerGene + ')';
            populationContext.fillRect(cellX * cellWidth, cellY * cellHeight, cellWidth, cellHeight);
            if (cellValues[cellX][cellY].dot) {
               populationContext.beginPath();
               populationContext.arc((cellX + 0.5) * cellWidth, (cellY + 0.5) * cellHeight, (cellWidth + cellHeight) / 16, 0, 2 * Math.PI, false);
               populationContext.fillStyle = 'rgb(0, 0, 0)';
               populationContext.fill();
               populationContext.beginPath();
               populationContext.arc((cellX + 0.5) * cellWidth, (cellY + 0.5) * cellHeight, (cellWidth + cellHeight) / 20, 0, 2 * Math.PI, false);
               populationContext.fillStyle = 'rgb(255, 255, 255)';
               populationContext.fill();
            }
         }
      }

      // display average organism
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            averageCellValue.red += cellValues[cellX][cellY].red;
            averageCellValue.green += cellValues[cellX][cellY].green;
            averageCellValue.blue += cellValues[cellX][cellY].blue;
            if (cellValues[cellX][cellY].dot) {
               averageCellValue.dot += 1;
            }
         }
      }
      averageCellValue.red /= numCellsWide * numCellsTall;
      averageCellValue.green /= numCellsWide * numCellsTall;
      averageCellValue.blue /= numCellsWide * numCellsTall;
      averageCellValue.dot /= numCellsWide * numCellsTall;
      averageOrganismElement.style.backgroundColor = 'rgb(' + Math.round(averageCellValue.red * numColorLevelsPerGene) + ', ' +
                                                      Math.round(averageCellValue.green * numColorLevelsPerGene) + ', ' +
                                                      Math.round(averageCellValue.blue * numColorLevelsPerGene) + ')';
      farthestFromAverage = 2 * (averageCellValue.red + averageCellValue.green + averageCellValue.blue) * numColorLevelsPerGene > 3 * highestColorLevel ? 0 : highestColorLevel;
      averageOrganismElement.style.color = 'rgb(' + farthestFromAverage + ', ' + farthestFromAverage + ', ' + farthestFromAverage + ')';
      averageOrganismElement.innerHTML = '<div>C on first move: ' + (averageCellValue.blue * 100 / highestGeneValue).toFixed(2) + '%</div>' +
                                 '<div>C after other&rsquo;s C: ' + (averageCellValue.green * 100 / highestGeneValue).toFixed(2) + '%</div>' +
                                 '<div>C after other&rsquo;s D: ' + (averageCellValue.red * 100 / highestGeneValue).toFixed(2) + '%</div>';
   };

   var agentReactor = function (organism, historyFocal, historyOpponent) {
      if (historyOpponent.length > 0) {
         if (historyOpponent.peek() === 0) {
            return Math.floor(Math.random() * highestGeneValue) < organism.green ? 0 : 1;
         }
         return Math.floor(Math.random() * highestGeneValue) < organism.red ? 0 : 1;
      }
      return Math.floor(Math.random() * highestGeneValue) < organism.blue ? 0 : 1;
   };

   var agentRandom = function (historyFocal, historyOpponent) {
      return Math.random() < 0.5 ? 0 : 1;
   };

   var agentAlwaysCooperate = function (historyFocal, historyOpponent) {
      return 0;
   };

   var agentAlwaysDefect = function (historyFocal, historyOpponent) {
      return 1;
   };

   var agentNiceTitForTat = function (historyFocal, historyOpponent) {
      if (historyOpponent.length > 0) {
         return historyOpponent.peek();
      }
      return 0;
   };

   var agentNastyTitForTat = function (historyFocal, historyOpponent) {
      if (historyOpponent.length > 0) {
         return historyOpponent.peek();
      }
      return 1;
   };

   var agentNicePavlov = function (historyFocal, historyOpponent) {
      if (historyFocal.length > 0 && historyOpponent.length > 0) {
         return historyFocal.peek() === historyOpponent.peek() ? 0 : 1;
      }
      return 0;
   };

   var agentNastyPavlov = function (historyFocal, historyOpponent) {
      if (historyFocal.length > 0 && historyOpponent.length > 0) {
         return historyFocal.peek() === historyOpponent.peek() ? 0 : 1;
      }
      return 1;
   };

   var agentNiceDelayedPavlov = function (historyFocal, historyOpponent) {
      if (historyFocal.length > 1 && historyOpponent.length > 0) {
         return historyFocal.peek(1) === historyOpponent.peek() ? 0 : 1;
      }
      if (historyOpponent.length > 0) {
         return historyOpponent.peek();
      }
      return 0;
   };

   var agentNastyDelayedPavlov = function (historyFocal, historyOpponent) {
      if (historyFocal.length > 1 && historyOpponent.length > 0) {
         return historyFocal.peek(1) === historyOpponent.peek() ? 0 : 1;
      }
      if (historyOpponent.length > 0) {
         return 1 - historyOpponent.peek();
      }
      return 1;
   };

   var agentFuncs = [];
   agentFuncs.push(agentRandom);
   agentFuncs.push(agentAlwaysCooperate);
   agentFuncs.push(agentAlwaysDefect);
   agentFuncs.push(agentNiceTitForTat);
   agentFuncs.push(agentNastyTitForTat);
   agentFuncs.push(agentNicePavlov);
   agentFuncs.push(agentNastyPavlov);
   agentFuncs.push(agentNiceDelayedPavlov);
   agentFuncs.push(agentNastyDelayedPavlov);

   var gamePayoff = function (self, other) {
      return self === 0 ? other === 0 ? payoffReward : payoffSucker : other === 0 ? payoffTemptation : payoffPunishment;
   };

   var playIpd = function (agent0, agent1, numRounds) {
      var whichRound;
      var history = [[], []];
      var strat = [];
      var totals = [0, 0];
      for (whichRound = 0; whichRound < numRounds; whichRound += 1) {
         strat[0] = agentReactor(agent0, history[0], history[1]);
         strat[1] = agentReactor(agent1, history[1], history[0]);
         history[0].push(strat[0]);
         history[1].push(strat[1]);
         totals[0] += gamePayoff(strat[0], strat[1]);
         totals[1] += gamePayoff(strat[1], strat[0]);
      }
      return totals;
   };

   var chooseIndexProbabilistically = function (scores) {
      var whichCell, randNum;
      var totalAdjScore = 0;
      var lowestScore = Number.POSITIVE_INFINITY;
      for (whichCell = 0; whichCell < scores.length; whichCell += 1) {
         if (scores[whichCell] < lowestScore) {
            lowestScore = scores[whichCell];
         }
      }
      for (whichCell = 0; whichCell < scores.length; whichCell += 1) {
         scores[whichCell] -= lowestScore;
         totalAdjScore += scores[whichCell];
      }
      if (totalAdjScore <= 0) {
         return Math.floor(Math.random() * scores.length);
      }
      randNum = Math.floor(Math.random() * totalAdjScore);
      for (whichCell = 0; whichCell < scores.length; whichCell += 1) {
         if (randNum < scores[whichCell]) {
            return whichCell;
         }
         randNum -= scores[whichCell];
      }
      return null;
   };

   var advanceGenerationGame = function () {
      var bestCellValue, bestCellValues, bestScore, cellScore, cellX, cellXLeft, cellXRight, cellY, cellYDown, cellYUp, localCells, localCellValues, mask, points, scores, whichCell, whichGene;
      var cellScores = [];
      var newCellValues = [];

      var numEncountersPerMatchup = 1;
      var mutationProbability = 0.002;

      // initialize scores and mutate some cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         cellScores[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellScores[cellX][cellY] = 0;
            for (whichGene = 0; whichGene < numGenesOnChromosome; whichGene += 1) {
               if (Math.random() < mutationProbability) {
                  cellValues[cellX][cellY].red ^= 1 << whichGene;
               }
               if (Math.random() < mutationProbability) {
                  cellValues[cellX][cellY].green ^= 1 << whichGene;
               }
               if (Math.random() < mutationProbability) {
                  cellValues[cellX][cellY].blue ^= 1 << whichGene;
               }
            }
         }
      }

      // play IPD in pairs
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellXRight = (cellX + 1) % numCellsWide;
            cellYUp = (cellY + numCellsTall - 1) % numCellsTall;
            cellYDown = (cellY + 1) % numCellsTall;
            if (interactionNeighborRightUpCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellYUp], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYUp] += points[1];
            }
            if (interactionNeighborRightCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellY], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellY] += points[1];
            }
            if (interactionNeighborRightDownCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellYDown], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYDown] += points[1];
            }
            if (interactionNeighborDownCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellX][cellYDown], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellX][cellYDown] += points[1];
            }
            if (interactionNeighborSelfCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellX][cellY], numRoundsPerEncounter);
               cellScores[cellX][cellY] += (points[0] + points[1]) / 2;
            }
         }
      }

      // calculate new cell values
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         newCellValues[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellXLeft = (cellX + numCellsWide - 1) % numCellsWide;
            cellXRight = (cellX + 1) % numCellsWide;
            cellYUp = (cellY + numCellsTall - 1) % numCellsTall;
            cellYDown = (cellY + 1) % numCellsTall;
            localCells = [
               [cellXLeft, cellYDown],
               [cellXLeft, cellY],
               [cellX, cellYUp],
               [cellXRight, cellYUp],
               [cellXRight, cellY],
               [cellX, cellYDown],
               [cellX, cellY]
            ];
            bestScore = Number.NEGATIVE_INFINITY;
            scores = [];
            localCellValues = [];
            for (whichCell = 0; whichCell < localCells.length; whichCell += 1) {
               cellScore = cellScores[localCells[whichCell][0]][localCells[whichCell][1]];
               scores.push(cellScore);
               localCellValues.push(cellValues[localCells[whichCell][0]][localCells[whichCell][1]]);
               if (cellScore > bestScore) {
                  bestCellValues = [cellValues[localCells[whichCell][0]][localCells[whichCell][1]]];
                  bestScore = cellScore;
               } else if (cellScore === bestScore) {
                  bestCellValues.push(cellValues[localCells[whichCell][0]][localCells[whichCell][1]]);
               }
            }

            bestCellValue = bestCellValues[Math.floor(Math.random() * bestCellValues.length)];
            newCellValues[cellX][cellY] = {};

            if (reproductionMeans === 'asexual') {
               if (reproductionSelection === 'deterministic') {
                  // asexual; best always gets picked
                  newCellValues[cellX][cellY].red = bestCellValue.red;
                  newCellValues[cellX][cellY].green = bestCellValue.green;
                  newCellValues[cellX][cellY].blue = bestCellValue.blue;
                  newCellValues[cellX][cellY].dot = bestCellValue.dot;
               } else {
                  // asexual; better tend to get picked
                  var chosenCellValue = localCellValues[chooseIndexProbabilistically(scores)];
                  newCellValues[cellX][cellY].red = chosenCellValue.red;
                  newCellValues[cellX][cellY].green = chosenCellValue.green;
                  newCellValues[cellX][cellY].blue = chosenCellValue.blue;
                  newCellValues[cellX][cellY].dot = chosenCellValue.dot;
               }
            } else if (reproductionMeans === 'sexualchromosome') {
               if (reproductionSelection === 'deterministic') {
                  // sexual at chromosome level; best always gets picked
                  newCellValues[cellX][cellY].red = Math.random() < 0.5 ? cellValues[cellX][cellY].red : bestCellValue.red;
                  newCellValues[cellX][cellY].green = Math.random() < 0.5 ? cellValues[cellX][cellY].green : bestCellValue.green;
                  newCellValues[cellX][cellY].blue = Math.random() < 0.5 ? cellValues[cellX][cellY].blue : bestCellValue.blue;
                  newCellValues[cellX][cellY].dot = Math.random() < 0.5 ? cellValues[cellX][cellY].dot : bestCellValue.dot;
               } else {
                  // sexual at chromosome level; better tend to get picked
                  newCellValues[cellX][cellY].red = localCellValues[chooseIndexProbabilistically(scores)].red;
                  newCellValues[cellX][cellY].green = localCellValues[chooseIndexProbabilistically(scores)].green;
                  newCellValues[cellX][cellY].blue = localCellValues[chooseIndexProbabilistically(scores)].blue;
                  newCellValues[cellX][cellY].dot = localCellValues[chooseIndexProbabilistically(scores)].dot;
               }
            } else {
               if (reproductionSelection === 'deterministic') {
                  // sexual at gene level; best always gets picked
                  mask = Math.floor(Math.random() * numGeneValues);
                  newCellValues[cellX][cellY].red = mask & cellValues[cellX][cellY].red | ~mask & bestCellValue.red;
                  mask = Math.floor(Math.random() * numGeneValues);
                  newCellValues[cellX][cellY].green = mask & cellValues[cellX][cellY].green | ~mask & bestCellValue.green;
                  mask = Math.floor(Math.random() * numGeneValues);
                  newCellValues[cellX][cellY].blue = mask & cellValues[cellX][cellY].blue | ~mask & bestCellValue.blue;
                  newCellValues[cellX][cellY].dot = Math.random() < 0.5 ? cellValues[cellX][cellY].dot : bestCellValue.dot;
               } else {
                  // sexual at gene level; better tend to get picked
                  newCellValues[cellX][cellY].red = 0;
                  newCellValues[cellX][cellY].green = 0;
                  newCellValues[cellX][cellY].blue = 0;
                  for (whichGene = 0; whichGene < numGenesOnChromosome; whichGene += 1) {
                     newCellValues[cellX][cellY].red |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].red;
                     newCellValues[cellX][cellY].green |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].green;
                     newCellValues[cellX][cellY].blue |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].blue;
                  }
                  newCellValues[cellX][cellY].dot = localCellValues[chooseIndexProbabilistically(scores)].dot;
               }
            }
         }
      }

      // make new cell values current cell values
      cellValues = newCellValues;
   };
   advanceGeneration = advanceGenerationGame;

   populationSizeSelect.onchange = function () {
      var populationSize = parseInt(populationSizeSelect.options[populationSizeSelect.selectedIndex].value, 10);
      resizePopulation(populationSize, populationSize);
      randomizePopulation();
      redrawPopulation();
   };

   roundsPerEncounterSelect.onchange = function () {
      numRoundsPerEncounter = parseInt(roundsPerEncounterSelect.options[roundsPerEncounterSelect.selectedIndex].value, 10);
   };
   roundsPerEncounterSelect.onchange();

   var fixPayoffs = function () {
      var payoffs = [parseInt(payoffBestSelect.options[payoffBestSelect.selectedIndex].value, 10),
                     parseInt(payoffNextBestSelect.options[payoffNextBestSelect.selectedIndex].value, 10),
                     parseInt(payoffNextWorstSelect.options[payoffNextWorstSelect.selectedIndex].value, 10),
                     parseInt(payoffWorstSelect.options[payoffWorstSelect.selectedIndex].value, 10)];
      var gamePlayed = gamePlayedSelect.options[gamePlayedSelect.selectedIndex].value;

      payoffs.sort(function (a, b) {
         return b - a;
      });
      payoffBest = payoffs[0];
      payoffNextBest = payoffs[1];
      payoffNextWorst = payoffs[2];
      payoffWorst = payoffs[3];
      payoffBestSelect.selectedIndex = 9 - payoffBest;
      payoffNextBestSelect.selectedIndex = 9 - payoffNextBest;
      payoffNextWorstSelect.selectedIndex = 9 - payoffNextWorst;
      payoffWorstSelect.selectedIndex = 9 - payoffWorst;

      if (gamePlayed === 'prisonersdilemma') {
         payoffReward = payoffNextBest;
         payoffSucker = payoffWorst;
         payoffTemptation = payoffBest;
         payoffPunishment = payoffNextWorst;
      } else if (gamePlayed === 'chicken') {
         payoffReward = payoffNextBest;
         payoffSucker = payoffNextWorst;
         payoffTemptation = payoffBest;
         payoffPunishment = payoffWorst;
      } else if (gamePlayed === 'leader') {
         payoffReward = payoffNextWorst;
         payoffSucker = payoffNextBest;
         payoffTemptation = payoffBest;
         payoffPunishment = payoffWorst;
      } else if (gamePlayed === 'battleofthesexes') {
         payoffReward = payoffNextWorst;
         payoffSucker = payoffBest;
         payoffTemptation = payoffNextBest;
         payoffPunishment = payoffWorst;
      } else if (gamePlayed === 'staghunt') {
         payoffReward = payoffBest;
         payoffSucker = payoffWorst;
         payoffTemptation = payoffNextBest;
         payoffPunishment = payoffNextWorst;
      } else if (gamePlayed === 'harmony') {
         payoffReward = payoffBest;
         payoffSucker = payoffNextWorst;
         payoffTemptation = payoffNextBest;
         payoffPunishment = payoffWorst;
      } else if (gamePlayed === 'deadlock') {
         payoffReward = payoffNextWorst;
         payoffSucker = payoffWorst;
         payoffTemptation = payoffBest;
         payoffPunishment = payoffNextBest;
      }
      payoffCellCCRow.innerHTML = payoffReward;
      payoffCellCCCol.innerHTML = payoffReward;
      payoffCellCDRow.innerHTML = payoffSucker;
      payoffCellCDCol.innerHTML = payoffTemptation;
      payoffCellDCRow.innerHTML = payoffTemptation;
      payoffCellDCCol.innerHTML = payoffSucker;
      payoffCellDDRow.innerHTML = payoffPunishment;
      payoffCellDDCol.innerHTML = payoffPunishment;
   };
   payoffBestSelect.onchange = fixPayoffs;
   payoffNextBestSelect.onchange = fixPayoffs;
   payoffNextWorstSelect.onchange = fixPayoffs;
   payoffWorstSelect.onchange = fixPayoffs;
   gamePlayedSelect.onchange = fixPayoffs;
   fixPayoffs();

   interactionNeighborLeftDownCheckbox.onclick = function () {
      interactionNeighborRightUpCheckbox.checked = interactionNeighborLeftDownCheckbox.checked;
   };

   interactionNeighborLeftCheckbox.onclick = function () {
      interactionNeighborRightCheckbox.checked = interactionNeighborLeftCheckbox.checked;
   };

   interactionNeighborLeftUpCheckbox.onclick = function () {
      interactionNeighborRightDownCheckbox.checked = interactionNeighborLeftUpCheckbox.checked;
   };

   interactionNeighborUpCheckbox.onclick = function () {
      interactionNeighborDownCheckbox.checked = interactionNeighborUpCheckbox.checked;
   };

   interactionNeighborRightUpCheckbox.onclick = function () {
      interactionNeighborLeftDownCheckbox.checked = interactionNeighborRightUpCheckbox.checked;
   };

   interactionNeighborRightCheckbox.onclick = function () {
      interactionNeighborLeftCheckbox.checked = interactionNeighborRightCheckbox.checked;
   };

   interactionNeighborRightDownCheckbox.onclick = function () {
      interactionNeighborLeftUpCheckbox.checked = interactionNeighborRightDownCheckbox.checked;
   };

   interactionNeighborDownCheckbox.onclick = function () {
      interactionNeighborUpCheckbox.checked = interactionNeighborDownCheckbox.checked;
   };

   document.getElementById('interaction-hex-neighborhood').onclick = function () {
      interactionNeighborLeftDownCheckbox.checked = true;
      interactionNeighborLeftCheckbox.checked = true;
      interactionNeighborLeftUpCheckbox.checked = false;
      interactionNeighborUpCheckbox.checked = true;
      interactionNeighborRightUpCheckbox.checked = true;
      interactionNeighborRightCheckbox.checked = true;
      interactionNeighborRightDownCheckbox.checked = false;
      interactionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('interaction-moore-neighborhood').onclick = function () {
      interactionNeighborLeftDownCheckbox.checked = true;
      interactionNeighborLeftCheckbox.checked = true;
      interactionNeighborLeftUpCheckbox.checked = true;
      interactionNeighborUpCheckbox.checked = true;
      interactionNeighborRightUpCheckbox.checked = true;
      interactionNeighborRightCheckbox.checked = true;
      interactionNeighborRightDownCheckbox.checked = true;
      interactionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('interaction-vonneumann-neighborhood').onclick = function () {
      interactionNeighborLeftDownCheckbox.checked = false;
      interactionNeighborLeftCheckbox.checked = true;
      interactionNeighborLeftUpCheckbox.checked = false;
      interactionNeighborUpCheckbox.checked = true;
      interactionNeighborRightUpCheckbox.checked = false;
      interactionNeighborRightCheckbox.checked = true;
      interactionNeighborRightDownCheckbox.checked = false;
      interactionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('interaction-obliquevonneumann-neighborhood').onclick = function () {
      interactionNeighborLeftDownCheckbox.checked = true;
      interactionNeighborLeftCheckbox.checked = false;
      interactionNeighborLeftUpCheckbox.checked = true;
      interactionNeighborUpCheckbox.checked = false;
      interactionNeighborRightUpCheckbox.checked = true;
      interactionNeighborRightCheckbox.checked = false;
      interactionNeighborRightDownCheckbox.checked = true;
      interactionNeighborDownCheckbox.checked = false;
   };

   reproductionSelectionSelect.onchange = function () {
      reproductionSelection = parseInt(reproductionSelectionSelect.options[reproductionSelectionSelect.selectedIndex].value, 10);
   };
   reproductionSelectionSelect.onchange();

   reproductionMeansSelect.onchange = function () {
      reproductionMeans = parseInt(reproductionMeansSelect.options[reproductionMeansSelect.selectedIndex].value, 10);
   };
   reproductionMeansSelect.onchange();

   genesOnChromosomeSelect.onchange = function () {
      var cellX, cellY, newHighestGeneValue;
      numGenesOnChromosome = parseInt(genesOnChromosomeSelect.options[genesOnChromosomeSelect.selectedIndex].value, 10);
      numGeneValues = 1 << numGenesOnChromosome;
      newHighestGeneValue = numGeneValues - 1;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = Math.round(cellValues[cellX][cellY].red * newHighestGeneValue / highestGeneValue);
            cellValues[cellX][cellY].green = Math.round(cellValues[cellX][cellY].green * newHighestGeneValue / highestGeneValue);
            cellValues[cellX][cellY].blue = Math.round(cellValues[cellX][cellY].blue * newHighestGeneValue / highestGeneValue);
         }
      }
      highestGeneValue = newHighestGeneValue;
      numColorLevelsPerGene = highestColorLevel / highestGeneValue;
      redrawPopulation();
   };
   genesOnChromosomeSelect.onchange();
   populationSizeSelect.onchange();

   document.getElementById('randomize').onclick = function () {
      randomizePopulation();
      redrawPopulation();
   };

   document.getElementById('reset-cooperate').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = highestGeneValue;
            cellValues[cellX][cellY].green = highestGeneValue;
            cellValues[cellX][cellY].blue = highestGeneValue;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-defect').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = 0;
            cellValues[cellX][cellY].green = 0;
            cellValues[cellX][cellY].blue = 0;
         }
      }
      redrawPopulation();
   };

   document.getElementById('advance').onclick = function () {
      advanceGeneration();
      redrawPopulation();
   };

   populationCanvas.onmousedown = function () {
      advanceGeneration();
      redrawPopulation();
      document.onmousemove = function () {
         advanceGeneration();
         redrawPopulation();
      };
      document.onmouseup = function () {
         document.onmousemove = null;
         document.onmouseup = null;
      };
   };
};
