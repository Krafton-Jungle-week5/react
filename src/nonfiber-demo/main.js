import { FunctionComponent, h, useEffect, useMemo, useState } from '../nonfiber/index.js';
import {
  buildHistoryLabel,
  calculateResult,
  createInitialGameState,
  getCurrentBoard,
  getMoveCount,
  jumpToMove,
  resetBoard,
  playMove,
} from '../tic-tac-toe/model.js';
import '../demo/styles.css';

function App() {
  const [game, setGame] = useState(createInitialGameState);
  const board = getCurrentBoard(game);

  const result = useMemo(() => calculateResult(board), [board]);
  const moveCount = useMemo(() => getMoveCount(board), [board]);
  const statusText = useMemo(() => {
    if (result.winner) {
      return `${result.winner} wins this round.`;
    }

    if (result.isDraw) {
      return 'Draw game. Reset the board or jump to an earlier move.';
    }

    return `${game.xIsNext ? 'X' : 'O'} turn. Pick an empty square.`;
  }, [game.xIsNext, result.isDraw, result.winner]);

  useEffect(() => {
    document.title = result.winner
      ? `Non-Fiber Tic-Tac-Toe - ${result.winner} won`
      : result.isDraw
        ? 'Non-Fiber Tic-Tac-Toe - Draw'
        : `Non-Fiber Tic-Tac-Toe - ${game.xIsNext ? 'X' : 'O'} turn`;
  }, [game.xIsNext, result.isDraw, result.winner]);

  return h(
    'main',
    { class: 'page-shell' },
    h(
      'section',
      { class: 'hero-panel' },
      h(
        'div',
        { class: 'hero-copy' },
        h('p', { class: 'eyebrow' }, 'Hooks Without Fiber'),
        h('h1', { class: 'hero-title' }, 'Tic-Tac-Toe'),
        h(
          'p',
          { class: 'hero-description' },
          'This page uses the exact same root-state model as the main demo, but it is wired through the nonfiber entry to show that the hooks runtime works without a separate fiber layer.',
        ),
      ),
      h(StatusPanel, {
        moveCount,
        statusText,
        winner: result.winner,
        xIsNext: game.xIsNext,
      }),
    ),
    h(
      'section',
      { class: 'game-layout' },
      h(
        'section',
        { class: 'board-panel' },
        h(
          'div',
          { class: 'section-heading' },
          h(
            'div',
            {},
            h('p', { class: 'panel-kicker' }, 'Board'),
            h('h2', { class: 'section-title' }, statusText),
          ),
          h(
            'div',
            { class: 'move-pill' },
            'Moves',
            h('strong', {}, `${moveCount}/9`),
          ),
        ),
        h(Board, {
          board,
          onSquareClick: (index) => setGame((current) => playMove(current, index)),
          winningLine: result.winningLine,
        }),
        h(
          'div',
          { class: 'button-row' },
          h(
            'button',
            { class: 'primary-button', onClick: () => setGame((current) => resetBoard(current)), type: 'button' },
            'Reset Board',
          ),
          h(
            'button',
            { class: 'ghost-button', onClick: () => setGame(createInitialGameState()), type: 'button' },
            'Reset Score',
          ),
        ),
      ),
      h(
        'aside',
        { class: 'side-panel' },
        h(ScoreCard, { score: game.score }),
        h(RuntimeCard, { playedMoves: game.history.length - 1, moveCount }),
        h(HistoryCard, {
          history: game.history,
          onJump: (stepIndex) => setGame((current) => jumpToMove(current, stepIndex)),
          stepIndex: game.stepIndex,
        }),
      ),
    ),
  );
}

function StatusPanel({ moveCount, statusText, winner, xIsNext }) {
  const badgeClass = winner
    ? 'status-badge is-win'
    : xIsNext
      ? 'status-badge is-x'
      : 'status-badge is-o';
  const badgeText = winner || (xIsNext ? 'X TURN' : 'O TURN');

  return h(
    'div',
    { class: 'status-card' },
    h('span', { class: badgeClass }, badgeText),
    h('strong', { class: 'status-title' }, statusText),
    h('p', { class: 'status-caption' }, `${moveCount} squares are currently filled.`),
  );
}

function Board({ board, onSquareClick, winningLine }) {
  return h(
    'section',
    { class: 'board-grid' },
    ...board.map((value, index) =>
      h(Square, {
        index,
        isWinning: winningLine.includes(index),
        onClick: () => onSquareClick(index),
        value,
      }),
    ),
  );
}

function Square({ index, isWinning, onClick, value }) {
  const className = [
    'square-button',
    value ? `is-${value.toLowerCase()}` : '',
    isWinning ? 'is-winning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return h(
    'button',
    {
      'aria-label': `square-${index + 1}`,
      class: className,
      onClick,
      type: 'button',
    },
    value || '',
  );
}

function ScoreCard({ score }) {
  return h(
    'section',
    { class: 'info-card' },
    h('p', { class: 'panel-kicker' }, 'Score'),
    h(
      'div',
      { class: 'score-grid' },
      h(ScoreItem, { label: 'X Wins', value: score.x }),
      h(ScoreItem, { label: 'O Wins', value: score.o }),
      h(ScoreItem, { label: 'Draws', value: score.draws }),
    ),
  );
}

function ScoreItem({ label, value }) {
  return h(
    'article',
    { class: 'score-item' },
    h('span', { class: 'score-label' }, label),
    h('strong', { class: 'score-value' }, String(value)),
  );
}

function RuntimeCard({ playedMoves, moveCount }) {
  return h(
    'section',
    { class: 'info-card' },
    h('p', { class: 'panel-kicker' }, 'Architecture'),
    h(
      'ul',
      { class: 'guide-list' },
      h('li', {}, 'The whole game stays in one root state object.'), 
      h('li', {}, 'Child components stay stateless and render only from props.'),
      h('li', {}, 'State changes schedule rerenders through runtime.js and patch the DOM through vdom.js.'),
      h('li', {}, `The current history stack has ${playedMoves + 1} snapshot${playedMoves === 0 ? '' : 's'} after ${moveCount} played moves.`),
    ),
  );
}

function HistoryCard({ history, onJump, stepIndex }) {
  return h(
    'section',
    { class: 'info-card history-card' },
    h('p', { class: 'panel-kicker' }, 'Time Travel'),
    h('h3', { class: 'history-title' }, 'Move History'),
    h(
      'div',
      { class: 'history-list' },
      ...history.map((board, index) =>
        h(
          'button',
          {
            class: index === stepIndex ? 'history-button is-active' : 'history-button',
            onClick: () => onJump(index),
            type: 'button',
          },
          buildHistoryLabel(history, index),
        ),
      ),
    ),
  );
}

const container = document.querySelector('#app');
const app = new FunctionComponent(App);

app.mount(container);
