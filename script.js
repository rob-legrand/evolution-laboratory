/*jslint bitwise: true, browser: true, indent: 3 */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';
   var advanceGeneration, averageOrganism, bettingAndBluffingRadio, cellHeight, cellValues, cellWidth, chooseIndexProbabilistically, competitionAndCooperationRadio, cultureAndConventionRadio, fixPayoffs, gameAgent, gameOptionsArea, gamePayoff, gamePlayedSelect, genesOnChromosomeSelect, highestColorLevel, highestGeneValue, interactionNeighborDownCheckbox, interactionNeighborLeftCheckbox, interactionNeighborLeftDownCheckbox, interactionNeighborLeftUpCheckbox, interactionNeighborRightCheckbox, interactionNeighborRightDownCheckbox, interactionNeighborRightUpCheckbox, interactionNeighborSelfCheckbox, interactionNeighborUpCheckbox, numAllowedStrats, numCellsTall, numCellsWide, numColorBits, numColorLevels, numColorLevelsPerGene, numGeneValues, numGenesOnChromosome, numRoundsPerEncounter, oldCellValues, payoffBest, payoffBestSelect, payoffCellCCCol, payoffCellCCRow, payoffCellCDCol, payoffCellCDRow, payoffCellDCCol, payoffCellDCRow, payoffCellDDCol, payoffCellDDRow, payoffNextBest, payoffNextBestSelect, payoffNextWorst, payoffNextWorstSelect, payoffPunishment, payoffReward, payoffSucker, payoffTemptation, payoffWorst, payoffWorstSelect, playAuction, playGame, playMatchup, playPoker, playTalk, populationCanvas, populationContext, populationSizeSelect, randomizePopulation, redrawPopulation, reproductionMeans, reproductionMeansSelect, reproductionSelection, reproductionSelectionSelect, resizeCanvas, resizePopulation, roundsPerEncounterSelect, valuationAndVerityRadio;

   populationCanvas = document.getElementById('population');
   populationContext = populationCanvas && populationCanvas.getContext && populationCanvas.getContext('2d');
   if (!populationContext) {
      document.getElementById('instructions').innerHTML = 'Your browser does not seem to support the <code>&lt;canvas&gt;</code> element correctly.&nbsp; Please use a recent version of a standards-compliant browser such as <a href="http://www.opera.com/">Opera</a>, <a href="http://www.google.com/chrome/">Chrome</a> or <a href="http://www.getfirefox.com/">Firefox</a>.';
      window.alert('Your browser does not seem to support the <canvas> element correctly.\nPlease use a recent version of a standards-compliant browser such as Opera, Chrome or Firefox.');
      return;
   }

   resizeCanvas = function () {
      populationCanvas.width = Math.floor(Math.min(window.innerHeight * 8 / 9, window.innerWidth * 8 / 9) / 420) * 420;
      populationCanvas.height = populationCanvas.width;
   };
   resizeCanvas();

   numColorBits = 8;
   numColorLevels = 1 << numColorBits;
   highestColorLevel = numColorLevels - 1;
   competitionAndCooperationRadio = document.getElementById('competition-and-cooperation-evolution-type');
   bettingAndBluffingRadio = document.getElementById('betting-and-bluffing-evolution-type');
   valuationAndVerityRadio = document.getElementById('valuation-and-verity-evolution-type');
   cultureAndConventionRadio = document.getElementById('culture-and-convention-evolution-type');
   populationSizeSelect = document.getElementById('population-size');
   roundsPerEncounterSelect = document.getElementById('rounds-per-encounter');
   gameOptionsArea = document.getElementById('game-options-area');
   payoffBestSelect = document.getElementById('payoff-best');
   payoffNextBestSelect = document.getElementById('payoff-nextbest');
   payoffNextWorstSelect = document.getElementById('payoff-nextworst');
   payoffWorstSelect = document.getElementById('payoff-worst');
   gamePlayedSelect = document.getElementById('game-played');
   payoffCellCCRow = document.getElementById('payoff-cell-cc-row');
   payoffCellCCCol = document.getElementById('payoff-cell-cc-col');
   payoffCellCDRow = document.getElementById('payoff-cell-cd-row');
   payoffCellCDCol = document.getElementById('payoff-cell-cd-col');
   payoffCellDCRow = document.getElementById('payoff-cell-dc-row');
   payoffCellDCCol = document.getElementById('payoff-cell-dc-col');
   payoffCellDDRow = document.getElementById('payoff-cell-dd-row');
   payoffCellDDCol = document.getElementById('payoff-cell-dd-col');
   interactionNeighborLeftDownCheckbox = document.getElementById('interaction-neighbor-left-down');
   interactionNeighborLeftCheckbox = document.getElementById('interaction-neighbor-left');
   interactionNeighborLeftUpCheckbox = document.getElementById('interaction-neighbor-left-up');
   interactionNeighborUpCheckbox = document.getElementById('interaction-neighbor-up');
   interactionNeighborRightUpCheckbox = document.getElementById('interaction-neighbor-right-up');
   interactionNeighborRightCheckbox = document.getElementById('interaction-neighbor-right');
   interactionNeighborRightDownCheckbox = document.getElementById('interaction-neighbor-right-down');
   interactionNeighborDownCheckbox = document.getElementById('interaction-neighbor-down');
   interactionNeighborSelfCheckbox = document.getElementById('interaction-neighbor-self');
   genesOnChromosomeSelect = document.getElementById('genes-on-chromosome');
   reproductionSelectionSelect = document.getElementById('reproduction-selection');
   reproductionMeansSelect = document.getElementById('reproduction-means');
   numAllowedStrats = 256;

   Array.prototype.peek = function (fromTop) {
      return this.slice(fromTop ? -1 - fromTop : -1)[0];
   };

   resizePopulation = function (newNumCellsWide, newNumCellsTall) {
      var cellX, cellY;
      numCellsWide = newNumCellsWide;
      cellWidth = populationCanvas.width / numCellsWide;
      numCellsTall = newNumCellsTall;
      cellHeight = populationCanvas.height / numCellsTall;

      // initialize cell values
      cellValues = [];
      oldCellValues = [];
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         cellValues[cellX] = [];
         oldCellValues[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY] = {red: 0, green: 0, blue: 0, dot: false};
            oldCellValues[cellX][cellY] = {red: 0, green: 0, blue: 0, dot: false};
         }
      }
   };

   randomizePopulation = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = Math.floor(Math.random() * numGeneValues);
            cellValues[cellX][cellY].green = Math.floor(Math.random() * numGeneValues);
            cellValues[cellX][cellY].blue = Math.floor(Math.random() * numGeneValues);
         }
      }
   };

   averageOrganism = function () {
      var averageCellValue, cellX, cellY;
      averageCellValue = {red: 0, green: 0, blue: 0, dot: false};
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            averageCellValue.red += cellValues[cellX][cellY].red;
            averageCellValue.green += cellValues[cellX][cellY].green;
            averageCellValue.blue += cellValues[cellX][cellY].blue;
         }
      }
      averageCellValue.red /= numCellsWide * numCellsTall;
      averageCellValue.green /= numCellsWide * numCellsTall;
      averageCellValue.blue /= numCellsWide * numCellsTall;
      return averageCellValue;
   };

   redrawPopulation = function () {
      var averageCellValue, averageOrganismElement, cellX, cellY, farthestFromAverage;
      averageOrganismElement = document.getElementById('average-organism');
      averageCellValue = {red: 0, green: 0, blue: 0, dot: false};

      if (!numCellsWide || !numCellsTall) {
         return;
      }

      // draw cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            if (numRoundsPerEncounter < 2) {
               populationContext.fillStyle = 'rgb(' + Math.floor(cellValues[cellX][cellY].blue * numColorLevelsPerGene * 0.8) + ', ' +
                                             Math.floor(cellValues[cellX][cellY].blue * numColorLevelsPerGene * 0.9) + ', ' +
                                             cellValues[cellX][cellY].blue * numColorLevelsPerGene + ')';
            } else {
               populationContext.fillStyle = 'rgb(' + cellValues[cellX][cellY].red * numColorLevelsPerGene + ', ' +
                                             cellValues[cellX][cellY].green * numColorLevelsPerGene + ', ' +
                                             cellValues[cellX][cellY].blue * numColorLevelsPerGene + ')';
            }
            populationContext.fillRect(cellX * cellWidth, cellY * cellHeight, cellWidth, cellHeight);
         }
      }

      // display average organism
      averageCellValue = averageOrganism();
      averageOrganismElement.style.backgroundColor = 'rgb(' + Math.round(averageCellValue.red * numColorLevelsPerGene) + ', ' +
                                                     Math.round(averageCellValue.green * numColorLevelsPerGene) + ', ' +
                                                     Math.round(averageCellValue.blue * numColorLevelsPerGene) + ')';
      farthestFromAverage = (averageCellValue.red + averageCellValue.green + averageCellValue.blue) * numColorLevelsPerGene > highestColorLevel ? 0 : highestColorLevel;
      averageOrganismElement.style.color = 'rgb(' + farthestFromAverage + ', ' + farthestFromAverage + ', ' + farthestFromAverage + ')';
      averageOrganismElement.innerHTML = '<div>' + (averageCellValue.blue * 100 / highestGeneValue).toFixed(2) + '% blue</div>' +
                                         '<div>' + (averageCellValue.green * 100 / highestGeneValue).toFixed(2) + '% green</div>' +
                                         '<div>' + (averageCellValue.red * 100 / highestGeneValue).toFixed(2) + '% red</div>';
   };

   gameAgent = function (organism, historyFocal, historyOpponent) {
      if (historyOpponent.length > 0) {
         if (historyOpponent.peek() > highestGeneValue / 2) {
            return Math.floor(Math.random() * highestGeneValue) < organism.green ? highestGeneValue : 0;
         }
         return Math.floor(Math.random() * highestGeneValue) < organism.red ? highestGeneValue : 0;
      }
      return Math.floor(Math.random() * highestGeneValue) < organism.blue ? highestGeneValue : 0;
   };

   chooseIndexProbabilistically = function (scores) {
      var lowestScore, randNum, totalAdjScore, whichCell;
      lowestScore = Number.POSITIVE_INFINITY;
      totalAdjScore = 0;
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
      randNum = Math.random() * totalAdjScore;
      for (whichCell = 0; whichCell < scores.length; whichCell += 1) {
         if (randNum < scores[whichCell]) {
            return whichCell;
         }
         randNum -= scores[whichCell];
      }
   };

   gamePayoff = function (focal, opponent) {
      // interpolate as if probabilities:
      return (focal * opponent * payoffReward + focal * (highestGeneValue - opponent) * payoffSucker + (highestGeneValue - focal) * opponent * payoffTemptation + (highestGeneValue - focal) * (highestGeneValue - opponent) * payoffPunishment) / highestGeneValue / highestGeneValue;
   };

   playGame = function (agent0, agent1, numRounds) {
      var history, strat, totals, whichRound;
      history = [[], []];
      strat = [];
      totals = [0, 0];
      for (whichRound = 0; whichRound < numRounds; whichRound += 1) {
         strat[0] = gameAgent(agent0, history[0], history[1]);
         strat[1] = gameAgent(agent1, history[1], history[0]);
         history[0].push(strat[0]);
         history[1].push(strat[1]);
         totals[0] += gamePayoff(strat[0], strat[1]);
         totals[1] += gamePayoff(strat[1], strat[0]);
      }
      return totals;
   };

   playPoker = function (agent0, agent1, numRounds) {
      // level of blue is how likely to bet (or how much to bet) when you have a 3 card
      // level of green is how likely to bet (or how much to bet) when you have a 2 card
      // level of red is how likely to bet (or how much to bet) when you have a 1 card
      // maybe have a 4 card; always bet maximum with it
      // ante is always 1
      // allow user to choose constant bet amount?
      // allow user to choose number of hands played per matchup?
      var minBetAmount, bet0, bet1, card0, card1, maxBetAmount, numCards, strat0, strat1, totals, whichCard, whichRound;
      numCards = 4;
      minBetAmount = 1;
      maxBetAmount = 4;
      totals = [0, 0];
      strat0 = [agent0.red, agent0.green, agent0.blue];
      strat1 = [agent1.red, agent1.green, agent1.blue];
      for (whichCard = 3; whichCard < numCards; whichCard += 1) {
         strat0[whichCard] = highestGeneValue;
         strat1[whichCard] = highestGeneValue;
      }
      for (whichRound = 0; whichRound < numRounds; whichRound += 1) {
         card0 = Math.floor(Math.random() * numCards);
         card1 = Math.floor(Math.random() * numCards);
         // use color as probability of raising bet incrementally:
         bet0 = minBetAmount;
         while (bet0 < maxBetAmount && Math.floor(Math.random() * highestGeneValue) < strat0[card0]) {
            bet0 += 1;
         }
         bet1 = minBetAmount;
         while (bet1 < maxBetAmount && Math.floor(Math.random() * highestGeneValue) < strat1[card1]) {
            bet1 += 1;
         }
         if (bet0 > bet1) {
            totals[0] += bet1;
            totals[1] -= bet1;
         } else if (bet0 < bet1) {
            totals[0] -= bet0;
            totals[1] += bet0;
         } else if (card0 > card1) {
            totals[0] += bet0;
            totals[1] -= bet1;
         } else if (card0 < card1) {
            totals[0] -= bet0;
            totals[1] += bet1;
         }
      }
      return totals;
   };

   playAuction = function (agent0, agent1, numRounds) {
      var blueResourceValue, greenResourceValue, onlyWinnerPays, payLosingBid, redResourceValue, totals;
      redResourceValue = 1 * highestGeneValue / 5;
      greenResourceValue = 2 * highestGeneValue / 5;
      blueResourceValue = 3 * highestGeneValue / 5;
      onlyWinnerPays = false;
      payLosingBid = true;
      totals = [0, 0];
      if (agent0.red > agent1.red) {
         totals[0] -= payLosingBid ? agent1.red : agent0.red;
         totals[1] -= onlyWinnerPays ? 0 : agent1.red;
         totals[0] += redResourceValue;
      } else if (agent0.red < agent1.red) {
         totals[0] -= onlyWinnerPays ? 0 : agent0.red;
         totals[1] -= payLosingBid ? agent0.red : agent1.red;
         totals[1] += redResourceValue;
      } else {
         totals[0] -= ((payLosingBid ? agent1.red : agent0.red) + (onlyWinnerPays ? 0 : agent0.red)) / 2;
         totals[1] -= ((payLosingBid ? agent0.red : agent1.red) + (onlyWinnerPays ? 0 : agent1.red)) / 2;
         totals[0] += redResourceValue / 2;
         totals[1] += redResourceValue / 2;
      }
      if (agent0.green > agent1.green) {
         totals[0] -= payLosingBid ? agent1.green : agent0.green;
         totals[1] -= onlyWinnerPays ? 0 : agent1.green;
         totals[0] += greenResourceValue;
      } else if (agent0.green < agent1.green) {
         totals[0] -= onlyWinnerPays ? 0 : agent0.green;
         totals[1] -= payLosingBid ? agent0.green : agent1.green;
         totals[1] += greenResourceValue;
      } else {
         totals[0] -= ((payLosingBid ? agent1.green : agent0.green) + (onlyWinnerPays ? 0 : agent0.green)) / 2;
         totals[1] -= ((payLosingBid ? agent0.green : agent1.green) + (onlyWinnerPays ? 0 : agent1.green)) / 2;
         totals[0] += greenResourceValue / 2;
         totals[1] += greenResourceValue / 2;
      }
      if (agent0.blue > agent1.blue) {
         totals[0] -= payLosingBid ? agent1.blue : agent0.blue;
         totals[1] -= onlyWinnerPays ? 0 : agent1.blue;
         totals[0] += blueResourceValue;
      } else if (agent0.blue < agent1.blue) {
         totals[0] -= onlyWinnerPays ? 0 : agent0.blue;
         totals[1] -= payLosingBid ? agent0.blue : agent1.blue;
         totals[1] += blueResourceValue;
      } else {
         totals[0] -= ((payLosingBid ? agent1.blue : agent0.blue) + (onlyWinnerPays ? 0 : agent0.blue)) / 2;
         totals[1] -= ((payLosingBid ? agent0.blue : agent1.blue) + (onlyWinnerPays ? 0 : agent1.blue)) / 2;
         totals[0] += blueResourceValue / 2;
         totals[1] += blueResourceValue / 2;
      }
      return totals;
   };

   playTalk = function (agent0, agent1, numRounds) {
      // calculate pR = R / (R + G + B), etc.
      // in comparing two organisms, compare pR, etc.
      //    give organism with higher pR: 3 * 255 - R + B
      //    give organism with lower pR: 255 - R + B
      var blue0, blue1, green0, green1, red0, red1, rewardPerWin, totals;
      totals = [0, 0];
      rewardPerWin = 2 * highestGeneValue;
      totals[0] += agent0.green + 2 * agent0.blue;
      totals[1] += agent1.green + 2 * agent1.blue;
      red0 = agent0.red * (agent1.red + agent1.green + agent1.blue);
      red1 = agent1.red * (agent0.red + agent0.green + agent0.blue);
      green0 = agent0.green * (agent1.red + agent1.green + agent1.blue);
      green1 = agent1.green * (agent0.red + agent0.green + agent0.blue);
      blue0 = agent0.blue * (agent1.red + agent1.green + agent1.blue);
      blue1 = agent1.blue * (agent0.red + agent0.green + agent0.blue);
      if (red0 > red1) {
         totals[0] += 2 * rewardPerWin;
      } else if (red0 < red1) {
         totals[1] += 2 * rewardPerWin;
      } else {
         totals[0] += rewardPerWin;
         totals[1] += rewardPerWin;
      }
      if (green0 > green1) {
         totals[0] += 2 * rewardPerWin;
      } else if (green0 < green1) {
         totals[1] += 2 * rewardPerWin;
      } else {
         totals[0] += rewardPerWin;
         totals[1] += rewardPerWin;
      }
      if (blue0 > blue1) {
         totals[0] += 2 * rewardPerWin;
      } else if (blue0 < blue1) {
         totals[1] += 2 * rewardPerWin;
      } else {
         totals[0] += rewardPerWin;
         totals[1] += rewardPerWin;
      }
      return totals;
   };

   playTalk = function (agent0, agent1, numRounds) {
      var confused, distances, numUnderstoodWords, totals, wordHeard, wordSaid;
      numUnderstoodWords = 0;
      distances = [
         [(agent0.red - agent1.red) * (agent0.red - agent1.red), (agent0.red - agent1.green) * (agent0.red - agent1.green), (agent0.red - agent1.blue) * (agent0.red - agent1.blue)],
         [(agent0.green - agent1.red) * (agent0.green - agent1.red), (agent0.green - agent1.green) * (agent0.green - agent1.green), (agent0.green - agent1.blue) * (agent0.green - agent1.blue)],
         [(agent0.blue - agent1.red) * (agent0.blue - agent1.red), (agent0.blue - agent1.green) * (agent0.blue - agent1.green), (agent0.blue - agent1.blue) * (agent0.blue - agent1.blue)]
      ];
      totals = [0, 0];
      for (wordSaid = 0; wordSaid < distances.length; wordSaid += 1) {
         confused = false;
         for (wordHeard = 0; wordHeard < distances.length; wordHeard += 1) {
            if (wordSaid !== wordHeard && distances[wordSaid][wordSaid] >= distances[wordSaid][wordHeard]) {
               confused = true;
            }
         }
         if (!confused) {
            numUnderstoodWords += 1;
            totals[0] += 1; // success making yourself understood
            totals[1] += 1; // success understanding the other
         }
         confused = false;
         for (wordHeard = 0; wordHeard < distances.length; wordHeard += 1) {
            if (wordSaid !== wordHeard && distances[wordSaid][wordSaid] >= distances[wordHeard][wordSaid]) {
               confused = true;
            }
         }
         if (!confused) {
            numUnderstoodWords += 1;
            totals[0] += 1; // success understanding the other
            totals[1] += 1; // success making yourself understood
         }
      }
      return totals;
   };

   advanceGeneration = function () {
      var bestCellValue, bestCellValues, bestScore, cellScore, cellScores, cellX, cellXLeft, cellXRight, cellY, cellYDown, cellYUp, chosenCellValue, localCells, localCellValues, mask, mutationProbability, numEncountersPerMatchup, points, scores, tempCellValues, whichCell, whichGene;
      cellScores = [];
      tempCellValues = cellValues;
      cellValues = oldCellValues;
      oldCellValues = tempCellValues;

      numEncountersPerMatchup = 1;
      mutationProbability = 0.002;

      // initialize scores and mutate some cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         cellScores[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellScores[cellX][cellY] = 0;
            for (whichGene = 0; whichGene < numGenesOnChromosome; whichGene += 1) {
               if (Math.random() < mutationProbability) {
                  oldCellValues[cellX][cellY].red ^= 1 << whichGene;
               }
               if (Math.random() < mutationProbability) {
                  oldCellValues[cellX][cellY].green ^= 1 << whichGene;
               }
               if (Math.random() < mutationProbability) {
                  oldCellValues[cellX][cellY].blue ^= 1 << whichGene;
               }
            }
         }
      }

      // interaction in pairs
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellXRight = (cellX + 1) % numCellsWide;
            cellYUp = (cellY + numCellsTall - 1) % numCellsTall;
            cellYDown = (cellY + 1) % numCellsTall;
            if (interactionNeighborRightUpCheckbox.checked) {
               points = playMatchup(oldCellValues[cellX][cellY], oldCellValues[cellXRight][cellYUp], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYUp] += points[1];
            }
            if (interactionNeighborRightCheckbox.checked) {
               points = playMatchup(oldCellValues[cellX][cellY], oldCellValues[cellXRight][cellY], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellY] += points[1];
            }
            if (interactionNeighborRightDownCheckbox.checked) {
               points = playMatchup(oldCellValues[cellX][cellY], oldCellValues[cellXRight][cellYDown], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYDown] += points[1];
            }
            if (interactionNeighborDownCheckbox.checked) {
               points = playMatchup(oldCellValues[cellX][cellY], oldCellValues[cellX][cellYDown], numRoundsPerEncounter);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellX][cellYDown] += points[1];
            }
            if (interactionNeighborSelfCheckbox.checked) {
               points = playMatchup(oldCellValues[cellX][cellY], oldCellValues[cellX][cellY], numRoundsPerEncounter);
               cellScores[cellX][cellY] += (points[0] + points[1]) / 2;
            }
         }
      }

      // calculate new cell values
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
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
               localCellValues.push(oldCellValues[localCells[whichCell][0]][localCells[whichCell][1]]);
               if (cellScore > bestScore) {
                  bestCellValues = [oldCellValues[localCells[whichCell][0]][localCells[whichCell][1]]];
                  bestScore = cellScore;
               } else if (cellScore === bestScore) {
                  bestCellValues.push(oldCellValues[localCells[whichCell][0]][localCells[whichCell][1]]);
               }
            }

            bestCellValue = bestCellValues[Math.floor(Math.random() * bestCellValues.length)];

            if (reproductionMeans === 'asexual') {
               if (reproductionSelection === 'deterministic') {
                  // asexual; best always gets picked
                  cellValues[cellX][cellY].red = bestCellValue.red;
                  cellValues[cellX][cellY].green = bestCellValue.green;
                  cellValues[cellX][cellY].blue = bestCellValue.blue;
               } else {
                  // asexual; better tend to get picked
                  chosenCellValue = localCellValues[chooseIndexProbabilistically(scores)];
                  cellValues[cellX][cellY].red = chosenCellValue.red;
                  cellValues[cellX][cellY].green = chosenCellValue.green;
                  cellValues[cellX][cellY].blue = chosenCellValue.blue;
               }
            } else if (reproductionMeans === 'sexualchromosome') {
               if (reproductionSelection === 'deterministic') {
                  // sexual at chromosome level; best always gets picked
                  cellValues[cellX][cellY].red = Math.random() < 0.5 ? oldCellValues[cellX][cellY].red : bestCellValue.red;
                  cellValues[cellX][cellY].green = Math.random() < 0.5 ? oldCellValues[cellX][cellY].green : bestCellValue.green;
                  cellValues[cellX][cellY].blue = Math.random() < 0.5 ? oldCellValues[cellX][cellY].blue : bestCellValue.blue;
               } else {
                  // sexual at chromosome level; better tend to get picked
                  cellValues[cellX][cellY].red = localCellValues[chooseIndexProbabilistically(scores)].red;
                  cellValues[cellX][cellY].green = localCellValues[chooseIndexProbabilistically(scores)].green;
                  cellValues[cellX][cellY].blue = localCellValues[chooseIndexProbabilistically(scores)].blue;
               }
            } else if (reproductionMeans === 'sexualgene') {
               if (reproductionSelection === 'deterministic') {
                  // sexual at gene level; best always gets picked
                  mask = Math.floor(Math.random() * numGeneValues);
                  cellValues[cellX][cellY].red = mask & oldCellValues[cellX][cellY].red | ~mask & bestCellValue.red;
                  mask = Math.floor(Math.random() * numGeneValues);
                  cellValues[cellX][cellY].green = mask & oldCellValues[cellX][cellY].green | ~mask & bestCellValue.green;
                  mask = Math.floor(Math.random() * numGeneValues);
                  cellValues[cellX][cellY].blue = mask & oldCellValues[cellX][cellY].blue | ~mask & bestCellValue.blue;
               } else {
                  // sexual at gene level; better tend to get picked
                  cellValues[cellX][cellY].red = 0;
                  cellValues[cellX][cellY].green = 0;
                  cellValues[cellX][cellY].blue = 0;
                  for (whichGene = 0; whichGene < numGenesOnChromosome; whichGene += 1) {
                     cellValues[cellX][cellY].red |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].red;
                     cellValues[cellX][cellY].green |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].green;
                     cellValues[cellX][cellY].blue |= 1 << whichGene & localCellValues[chooseIndexProbabilistically(scores)].blue;
                  }
               }
            } else {
               if (reproductionSelection === 'deterministic') {
                  // sexual with blending; best always gets picked
                  if (oldCellValues[cellX][cellY].red > bestCellValue.red) {
                     cellValues[cellX][cellY].red = Math.floor(Math.random() * (oldCellValues[cellX][cellY].red - bestCellValue.red + 1)) + bestCellValue.red;
                  } else {
                     cellValues[cellX][cellY].red = Math.floor(Math.random() * (bestCellValue.red - oldCellValues[cellX][cellY].red + 1)) + oldCellValues[cellX][cellY].red;
                  }
                  if (oldCellValues[cellX][cellY].green > bestCellValue.green) {
                     cellValues[cellX][cellY].green = Math.floor(Math.random() * (oldCellValues[cellX][cellY].green - bestCellValue.green + 1)) + bestCellValue.green;
                  } else {
                     cellValues[cellX][cellY].green = Math.floor(Math.random() * (bestCellValue.green - oldCellValues[cellX][cellY].green + 1)) + oldCellValues[cellX][cellY].green;
                  }
                  if (oldCellValues[cellX][cellY].blue > bestCellValue.blue) {
                     cellValues[cellX][cellY].blue = Math.floor(Math.random() * (oldCellValues[cellX][cellY].blue - bestCellValue.blue + 1)) + bestCellValue.blue;
                  } else {
                     cellValues[cellX][cellY].blue = Math.floor(Math.random() * (bestCellValue.blue - oldCellValues[cellX][cellY].blue + 1)) + oldCellValues[cellX][cellY].blue;
                  }
               } else {
                  // sexual with blending; better tend to get picked
                  chosenCellValue = localCellValues[chooseIndexProbabilistically(scores)];
                  if (oldCellValues[cellX][cellY].red > chosenCellValue.red) {
                     cellValues[cellX][cellY].red = Math.floor(Math.random() * (oldCellValues[cellX][cellY].red - chosenCellValue.red + 1)) + chosenCellValue.red;
                  } else {
                     cellValues[cellX][cellY].red = Math.floor(Math.random() * (chosenCellValue.red - oldCellValues[cellX][cellY].red + 1)) + oldCellValues[cellX][cellY].red;
                  }
                  chosenCellValue = localCellValues[chooseIndexProbabilistically(scores)];
                  if (oldCellValues[cellX][cellY].green > chosenCellValue.green) {
                     cellValues[cellX][cellY].green = Math.floor(Math.random() * (oldCellValues[cellX][cellY].green - chosenCellValue.green + 1)) + chosenCellValue.green;
                  } else {
                     cellValues[cellX][cellY].green = Math.floor(Math.random() * (chosenCellValue.green - oldCellValues[cellX][cellY].green + 1)) + oldCellValues[cellX][cellY].green;
                  }
                  chosenCellValue = localCellValues[chooseIndexProbabilistically(scores)];
                  if (oldCellValues[cellX][cellY].blue > chosenCellValue.blue) {
                     cellValues[cellX][cellY].blue = Math.floor(Math.random() * (oldCellValues[cellX][cellY].blue - chosenCellValue.blue + 1)) + chosenCellValue.blue;
                  } else {
                     cellValues[cellX][cellY].blue = Math.floor(Math.random() * (chosenCellValue.blue - oldCellValues[cellX][cellY].blue + 1)) + oldCellValues[cellX][cellY].blue;
                  }
               }
            }
         }
      }
   };

   competitionAndCooperationRadio.onclick = function () {
      if (playMatchup !== playGame) {
         playMatchup = playGame;
         document.getElementById('page-title').innerHTML = 'Evolution laboratory: Competition and cooperation';
         gameOptionsArea.style.display = '';
      }
   };
   if (competitionAndCooperationRadio.checked) {
      competitionAndCooperationRadio.onclick();
   }

   bettingAndBluffingRadio.onclick = function () {
      if (playMatchup !== playPoker) {
         playMatchup = playPoker;
         document.getElementById('page-title').innerHTML = 'Evolution laboratory: Betting and bluffing';
         gameOptionsArea.style.display = 'none';
      }
   };
   if (bettingAndBluffingRadio.checked) {
      bettingAndBluffingRadio.onclick();
   }

   valuationAndVerityRadio.onclick = function () {
      if (playMatchup !== playAuction) {
         playMatchup = playAuction;
         document.getElementById('page-title').innerHTML = 'Evolution laboratory: Valuation and verity';
         gameOptionsArea.style.display = 'none';
      }
   };
   if (valuationAndVerityRadio.checked) {
      valuationAndVerityRadio.onclick();
   }

   cultureAndConventionRadio.onclick = function () {
      if (playMatchup !== playTalk) {
         playMatchup = playTalk;
         document.getElementById('page-title').innerHTML = 'Evolution laboratory: Culture and convention';
         gameOptionsArea.style.display = 'none';
      }
   };
   if (cultureAndConventionRadio.checked) {
      cultureAndConventionRadio.onclick();
   }

   populationSizeSelect.onchange = function () {
      var populationSize;
      populationSize = parseInt(populationSizeSelect.options[populationSizeSelect.selectedIndex].value, 10);
      resizePopulation(populationSize, populationSize);
      randomizePopulation();
      redrawPopulation();
   };

   roundsPerEncounterSelect.onchange = function () {
      numRoundsPerEncounter = parseInt(roundsPerEncounterSelect.options[roundsPerEncounterSelect.selectedIndex].value, 10);
      redrawPopulation();
   };
   roundsPerEncounterSelect.onchange();

   fixPayoffs = function () {
      var gamePlayed, payoffs;
      payoffs = [
         parseInt(payoffBestSelect.options[payoffBestSelect.selectedIndex].value, 10),
         parseInt(payoffNextBestSelect.options[payoffNextBestSelect.selectedIndex].value, 10),
         parseInt(payoffNextWorstSelect.options[payoffNextWorstSelect.selectedIndex].value, 10),
         parseInt(payoffWorstSelect.options[payoffWorstSelect.selectedIndex].value, 10)
      ];
      gamePlayed = gamePlayedSelect.options[gamePlayedSelect.selectedIndex].value;

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
      reproductionSelection = reproductionSelectionSelect.options[reproductionSelectionSelect.selectedIndex].value;
   };
   reproductionSelectionSelect.onchange();

   reproductionMeansSelect.onchange = function () {
      reproductionMeans = reproductionMeansSelect.options[reproductionMeansSelect.selectedIndex].value;
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

   document.getElementById('reset-to-average').onclick = function () {
      var averageCellValue, cellX, cellY;
      averageCellValue = averageOrganism();
      averageCellValue.red = Math.floor(averageCellValue.red + 0.5);
      averageCellValue.green = Math.floor(averageCellValue.green + 0.5);
      averageCellValue.blue = Math.floor(averageCellValue.blue + 0.5);
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = averageCellValue.red;
            cellValues[cellX][cellY].green = averageCellValue.green;
            cellValues[cellX][cellY].blue = averageCellValue.blue;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-000000').onclick = function () {
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

   document.getElementById('reset-to-0000ff').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = 0;
            cellValues[cellX][cellY].green = 0;
            cellValues[cellX][cellY].blue = highestGeneValue;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-00ffff').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = 0;
            cellValues[cellX][cellY].green = highestGeneValue;
            cellValues[cellX][cellY].blue = highestGeneValue;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-00ff00').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = 0;
            cellValues[cellX][cellY].green = highestGeneValue;
            cellValues[cellX][cellY].blue = 0;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-ff0000').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = highestGeneValue;
            cellValues[cellX][cellY].green = 0;
            cellValues[cellX][cellY].blue = 0;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-ff00ff').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = highestGeneValue;
            cellValues[cellX][cellY].green = 0;
            cellValues[cellX][cellY].blue = highestGeneValue;
         }
      }
      redrawPopulation();
   };

   document.getElementById('reset-to-ffffff').onclick = function () {
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

   document.getElementById('reset-to-ffff00').onclick = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY].red = highestGeneValue;
            cellValues[cellX][cellY].green = highestGeneValue;
            cellValues[cellX][cellY].blue = 0;
         }
      }
      redrawPopulation();
   };

   document.getElementById('advance').onclick = function () {
      advanceGeneration();
      redrawPopulation();
   };

   document.getElementById('snapshot').addEventListener('click', function () {
      window.open(populationCanvas.toDataURL(), 'Population snapshot');
   }, false);

   (function () {
      var mousedownFunc, mousemoveFunc, mouseupFunc;

      mousedownFunc = function () {
         advanceGeneration();
         redrawPopulation();
         document.addEventListener('mousemove', mousemoveFunc, false);
         document.addEventListener('mouseup', mouseupFunc, false);
      };

      mousemoveFunc = function () {
         advanceGeneration();
         redrawPopulation();
      };

      mouseupFunc = function () {
         document.removeEventListener('mousemove', mousemoveFunc, false);
         document.removeEventListener('mouseup', mouseupFunc, false);
      };

      populationCanvas.addEventListener('mousedown', mousedownFunc, false);
   }());

}, false);
