/*jslint browser: true, vars: true, indent: 3 */

var startPopulation = function () {
   'use strict';

   var populationCanvas = document.getElementById('population');
   var populationContext = populationCanvas && populationCanvas.getContext && populationCanvas.getContext('2d');
   if (!populationContext) {
      document.getElementById('instructions').innerHTML = 'Your browser does not seem to support the <code>&lt;canvas&gt;</code> element correctly.&nbsp; Please use a recent version of a standards-compliant browser such as <a href="http://www.opera.com/">Opera</a>, <a href="http://www.google.com/chrome/">Chrome</a> or <a href="http://www.getfirefox.com/">Firefox</a>.';
      window.alert('Your browser does not seem to support the <canvas> element correctly.\nPlease use a recent version of a standards-compliant browser such as Opera, Chrome or Firefox.');
      return;
   }

   var numCellsWide, cellWidth, numCellsTall, cellHeight;
   var cellValues, cellValueColors, numCellValues;
   var numColorLevels = 256;
   var interactionNeighborLeftDownCheckbox = document.getElementById('interaction-neighbor-left-down');
   var interactionNeighborLeftCheckbox = document.getElementById('interaction-neighbor-left');
   var interactionNeighborLeftUpCheckbox = document.getElementById('interaction-neighbor-left-up');
   var interactionNeighborUpCheckbox = document.getElementById('interaction-neighbor-up');
   var interactionNeighborRightUpCheckbox = document.getElementById('interaction-neighbor-right-up');
   var interactionNeighborRightCheckbox = document.getElementById('interaction-neighbor-right');
   var interactionNeighborRightDownCheckbox = document.getElementById('interaction-neighbor-right-down');
   var interactionNeighborDownCheckbox = document.getElementById('interaction-neighbor-down');
   var interactionNeighborSelfCheckbox = document.getElementById('interaction-neighbor-self');
   var selectionNeighborLeftDownCheckbox = document.getElementById('selection-neighbor-left-down');
   var selectionNeighborLeftCheckbox = document.getElementById('selection-neighbor-left');
   var selectionNeighborLeftUpCheckbox = document.getElementById('selection-neighbor-left-up');
   var selectionNeighborUpCheckbox = document.getElementById('selection-neighbor-up');
   var selectionNeighborRightUpCheckbox = document.getElementById('selection-neighbor-right-up');
   var selectionNeighborRightCheckbox = document.getElementById('selection-neighbor-right');
   var selectionNeighborRightDownCheckbox = document.getElementById('selection-neighbor-right-down');
   var selectionNeighborDownCheckbox = document.getElementById('selection-neighbor-down');
   var selectionNeighborSelfCheckbox = document.getElementById('selection-neighbor-self');
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
            cellValues[cellX][cellY] = 0;
            cellValues[cellX][cellY] = {red: 0, green: 0, blue: 0};
         }
      }
   };
   resizePopulation(105, 105);

   var randomizePopulation = function () {
      var cellX, cellY;
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellValues[cellX][cellY] = Math.floor(Math.random() * numCellValues);
            cellValues[cellX][cellY] = {red: Math.floor(Math.random() * numColorLevels),
                                        green: Math.floor(Math.random() * numColorLevels),
                                        blue: Math.floor(Math.random() * numColorLevels)};
         }
      }
   };

   var redrawPopulation = function () {
      var cellX, cellY;

      // fill canvas background to match page background
      populationContext.fillStyle = '#ddeeff';
      populationContext.fillRect(0, 0, populationCanvas.width, populationCanvas.height);

      // draw cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            populationContext.fillStyle = cellValueColors[cellValues[cellX][cellY]];
            populationContext.fillStyle = 'rgb(' + cellValues[cellX][cellY].red + ', ' + cellValues[cellX][cellY].green + ', ' + cellValues[cellX][cellY].blue + ')';
            populationContext.fillRect(cellX * cellWidth, cellY * cellHeight, cellWidth, cellHeight);
         }
      }
   };

   var agentReactor = function (genes, historyFocal, historyOpponent) {
      if (historyOpponent.length > 0) {
         if (historyOpponent.peek() === 0) {
            return Math.floor(Math.random() * (numColorLevels - 1)) < genes.green ? 0 : 1;
         }
         return Math.floor(Math.random() * (numColorLevels - 1)) < genes.red ? 0 : 1;
      }
      return Math.floor(Math.random() * (numColorLevels - 1)) < genes.blue ? 0 : 1;
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

   var ipdPayoffs = function (strat1, strat2) {
      var cooperatePayoff = 5;
      var defectPayoff = 4;
      return strat1 === 0 ? strat2 === 0 ? [cooperatePayoff, cooperatePayoff] : [0, cooperatePayoff + defectPayoff] : strat2 === 0 ? [cooperatePayoff + defectPayoff, 0] : [defectPayoff, defectPayoff]; // PD
//    return strat1 === 0 ? strat2 === 0 ? [cooperatePayoff, cooperatePayoff] : [defectPayoff, cooperatePayoff + defectPayoff] : strat2 === 0 ? [cooperatePayoff + defectPayoff, defectPayoff] : [0, 0]; // chicken
   };

   var playIpd = function (agent0, agent1, numRounds) {
      var payoffs, whichRound;
      var history = [[], []];
      var strat = [];
      var totals = [0, 0];
      for (whichRound = 0; whichRound < numRounds; whichRound += 1) {
         strat[0] = agentReactor(agent0, history[0], history[1]);
         strat[1] = agentReactor(agent1, history[1], history[0]);
         history[0].push(strat[0]);
         history[1].push(strat[1]);
         payoffs = ipdPayoffs(strat[0], strat[1]);
         totals[0] += payoffs[0];
         totals[1] += payoffs[1];
      }
      return totals;
   };

   var advanceGenerationGame = function () {
      var bestCellValues, bestScore, cellScore, cellX, cellXLeft, cellXRight, cellY, cellYDown, cellYUp, localCells, points, whichCell;
      var cellScores = [];
      var newCellValues = [];
      var numRounds = 20;

      // initialize scores and mutate some cells
      for (cellX = 0; cellX < numCellsWide; cellX += 1) {
         cellScores[cellX] = [];
         for (cellY = 0; cellY < numCellsTall; cellY += 1) {
            cellScores[cellX][cellY] = 0;
            if (Math.random() < 1 / (numCellsTall + numCellsWide)) {
               cellValues[cellX][cellY].red = Math.floor(Math.random() * numColorLevels);
            } else {
               cellValues[cellX][cellY].red += Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1;
            }
            if (Math.random() < 1 / (numCellsTall + numCellsWide)) {
               cellValues[cellX][cellY].green = Math.floor(Math.random() * numColorLevels);
            } else {
               cellValues[cellX][cellY].green += Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1;
            }
            if (Math.random() < 1 / (numCellsTall + numCellsWide)) {
               cellValues[cellX][cellY].blue = Math.floor(Math.random() * numColorLevels);
            } else {
               cellValues[cellX][cellY].blue += Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1;
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
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellYUp], numRounds);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYUp] += points[1];
            }
            if (interactionNeighborRightCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellY], numRounds);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellY] += points[1];
            }
            if (interactionNeighborRightDownCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellXRight][cellYDown], numRounds);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellXRight][cellYDown] += points[1];
            }
            if (interactionNeighborDownCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellX][cellYDown], numRounds);
               cellScores[cellX][cellY] += points[0];
               cellScores[cellX][cellYDown] += points[1];
            }
            if (interactionNeighborSelfCheckbox.checked) {
               points = playIpd(cellValues[cellX][cellY], cellValues[cellX][cellY], numRounds);
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
            for (whichCell = 0; whichCell < localCells.length; whichCell += 1) {
               cellScore = cellScores[localCells[whichCell][0]][localCells[whichCell][1]];
               if (cellScore > bestScore) {
                  bestCellValues = [cellValues[localCells[whichCell][0]][localCells[whichCell][1]]];
                  bestScore = cellScore;
               } else if (cellScore === bestScore) {
                  bestCellValues.push(cellValues[localCells[whichCell][0]][localCells[whichCell][1]]);
               }
            }
            var b = bestCellValues[Math.floor(Math.random() * bestCellValues.length)];
            newCellValues[cellX][cellY] = {red: b.red, green: b.green, blue: b.blue};
         }
      }

      // make new cell values current cell values
      cellValues = newCellValues;
   };

   (function () {
      if (advanceGeneration !== advanceGenerationGame) {
         advanceGeneration = advanceGenerationGame;
         resizePopulation(84, 84);
         resizePopulation(42, 42);
         cellValueColors = ['#999999', '#00ff00', '#000000', '#00ffff', '#0000ff', '#ffff00', '#ff0000', '#ffffff', '#ff00ff'];
         numCellValues = cellValueColors.length;
         randomizePopulation();
         redrawPopulation();
      }
   }());

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

   document.getElementById('selection-moore-neighborhood').onclick = function () {
      selectionNeighborLeftDownCheckbox.checked = true;
      selectionNeighborLeftCheckbox.checked = true;
      selectionNeighborLeftUpCheckbox.checked = true;
      selectionNeighborUpCheckbox.checked = true;
      selectionNeighborRightUpCheckbox.checked = true;
      selectionNeighborRightCheckbox.checked = true;
      selectionNeighborRightDownCheckbox.checked = true;
      selectionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('selection-hex-neighborhood').onclick = function () {
      selectionNeighborLeftDownCheckbox.checked = true;
      selectionNeighborLeftCheckbox.checked = true;
      selectionNeighborLeftUpCheckbox.checked = false;
      selectionNeighborUpCheckbox.checked = true;
      selectionNeighborRightUpCheckbox.checked = true;
      selectionNeighborRightCheckbox.checked = true;
      selectionNeighborRightDownCheckbox.checked = false;
      selectionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('selection-vonneumann-neighborhood').onclick = function () {
      selectionNeighborLeftDownCheckbox.checked = false;
      selectionNeighborLeftCheckbox.checked = true;
      selectionNeighborLeftUpCheckbox.checked = false;
      selectionNeighborUpCheckbox.checked = true;
      selectionNeighborRightUpCheckbox.checked = false;
      selectionNeighborRightCheckbox.checked = true;
      selectionNeighborRightDownCheckbox.checked = false;
      selectionNeighborDownCheckbox.checked = true;
   };

   document.getElementById('selection-obliquevonneumann-neighborhood').onclick = function () {
      selectionNeighborLeftDownCheckbox.checked = true;
      selectionNeighborLeftCheckbox.checked = false;
      selectionNeighborLeftUpCheckbox.checked = true;
      selectionNeighborUpCheckbox.checked = false;
      selectionNeighborRightUpCheckbox.checked = true;
      selectionNeighborRightCheckbox.checked = false;
      selectionNeighborRightDownCheckbox.checked = true;
      selectionNeighborDownCheckbox.checked = false;
   };

   document.getElementById('randomize').onclick = function () {
      randomizePopulation();
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
      };
   };
};
