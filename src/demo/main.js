import { FunctionComponent, h, useEffect, useMemo, useState } from '../index.js';
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
import './styles.css';

function App() {
  const [game, setGame] = useState(createInitialGameState);
  const board = getCurrentBoard(game);

  const result = useMemo(() => calculateResult(board), [board]);
  const moveCount = useMemo(() => getMoveCount(board), [board]);
  const statusText = useMemo(() => {
    if (result.winner) {
      return `${result.winner} wins the round.`;
    }

    if (result.isDraw) {
      return 'Draw game. Reset the board or jump to an earlier move.';
    }

    return `${game.xIsNext ? 'X' : 'O'} turn. Choose a square.`;
  }, [game.xIsNext, result.isDraw, result.winner]);

  useEffect(() => {
    document.title = result.winner
      ? `Tic-Tac-Toe - ${result.winner} won`
      : result.isDraw
        ? 'Tic-Tac-Toe - Draw'
        : `Tic-Tac-Toe - ${game.xIsNext ? 'X' : 'O'} turn`;
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
        h('p', { class: 'eyebrow' }, 'React2 Demo'),
        h('h1', { class: 'hero-title' }, 'Tic-Tac-Toe Playground'),
        h(
          'p',
          { class: 'hero-description' },
          'One root state object drives the whole game. Child components stay stateless and only receive props, which makes the custom hooks runtime easier to follow.',
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
            {
              class: 'primary-button',
              onClick: () => setGame((current) => resetBoard(current)),
              type: 'button',
            },
            'Reset Board',
          ),
          h(
            'button',
            {
              class: 'ghost-button',
              onClick: () => setGame(createInitialGameState()),
              type: 'button',
            },
            'Reset Score',
          ),
        ),
      ),
      h(
        'aside',
        { class: 'side-panel' },
        h(ScoreCard, { score: game.score }),
        h(GuideCard, { playedMoves: game.history.length - 1 }),
        h(HistoryCard, {
          history: game.history,
          stepIndex: game.stepIndex,
          onJump: (stepIndex) => setGame((current) => jumpToMove(current, stepIndex)),
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
    h('p', { class: 'status-caption' }, `${moveCount} squares are filled in the current round.`),
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

function GuideCard({ playedMoves }) {
  return h(
    'section',
    { class: 'info-card' },
    h('p', { class: 'panel-kicker' }, 'Runtime Notes'),
    h(
      'ul',
      { class: 'guide-list' },
      h('li', {}, 'All state lives in the root App component as a single game object.'),
      h('li', {}, 'Child components stay pure and only receive props from the root.'),
      h('li', {}, 'Winner detection and move count stay derived with useMemo.'),
      h('li', {}, `The board has committed ${playedMoves} move${playedMoves === 1 ? '' : 's'} so far.`),
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
