import { FunctionComponent, h, useEffect, useMemo, useState } from '../nonfiber/index.js';
import {
  calculateResult,
  createInitialGameState,
  getCurrentBoard,
  getMoveCount,
  jumpToMove,
  resetBoard,
  playMove,
} from '../tic-tac-toe/model.js';
import {
  createInitialTimeline,
  createTimelineEntry,
  appendTimelineEntry,
  describeAction,
  describeCommit,
  describeEffectSync,
  startTimeline,
} from '../tic-tac-toe/timeline.js';
import '../demo/styles.css';

function App() {
  const [game, setGame] = useState(createInitialGameState);
  const [timeline, setTimeline] = useState(createInitialTimeline);
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
    setTimeline((currentTimeline) =>
      appendTimelineEntry(
        currentTimeline,
        createTimelineEntry('render', 'Render committed', describeCommit(game, result, moveCount)),
      ),
    );
  }, [game, moveCount, result]);

  useEffect(() => {
    document.title = result.winner
      ? `Non-Fiber Tic-Tac-Toe - ${result.winner} won`
      : result.isDraw
        ? 'Non-Fiber Tic-Tac-Toe - Draw'
        : `Non-Fiber Tic-Tac-Toe - ${game.xIsNext ? 'X' : 'O'} turn`;

    setTimeline((currentTimeline) =>
      appendTimelineEntry(
        currentTimeline,
        createTimelineEntry('effect', 'Effect synchronized', describeEffectSync(game.xIsNext, result)),
      ),
    );
  }, [game.xIsNext, result]);

  const applyGameAction = (action, nextGame) => {
    if (nextGame === game) {
      setTimeline(
        startTimeline(
          createTimelineEntry('action', 'Input ignored', describeAction({ ...action, accepted: false }, game, result)),
        ),
      );
      return;
    }

    const nextBoard = getCurrentBoard(nextGame);
    const nextResult = calculateResult(nextBoard);

    setTimeline(
      startTimeline(
        createTimelineEntry(
          'action',
          action.type === 'square' ? `Square ${action.index + 1} clicked` : action.title,
          describeAction({ ...action, accepted: true }, nextGame, nextResult),
        ),
        createTimelineEntry(
          'state',
          'Root state queued',
          `The root App scheduled a new game snapshot. Next step: ${nextGame.stepIndex}, next turn: ${nextGame.xIsNext ? 'X' : 'O'}.`,
        ),
      ),
    );

    setGame(nextGame);
  };

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
          'This non-fiber entry uses the same root-state timeline to show how the runtime behaves after input, without relying on a separate fiber layer.',
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
          onSquareClick: (index) => applyGameAction({ type: 'square', index }, playMove(game, index)),
          winningLine: result.winningLine,
        }),
        h(
          'div',
          { class: 'button-row' },
          h(
            'button',
            { class: 'primary-button', onClick: () => applyGameAction({ type: 'reset-board', title: 'Board reset requested' }, resetBoard(game)), type: 'button' },
            'Reset Board',
          ),
          h(
            'button',
            { class: 'ghost-button', onClick: () => applyGameAction({ type: 'reset-score', title: 'Full reset requested' }, createInitialGameState()), type: 'button' },
            'Reset Score',
          ),
        ),
      ),
      h(
        'aside',
        { class: 'side-panel' },
        h(ScoreCard, { score: game.score }),
        h(RuntimeCard, { playedMoves: game.history.length - 1 }),
        h(RuntimeTimelineCard, { timeline }),
        h(TimeTravelCard, {
          history: game.history,
          onJump: (stepIndex) =>
            applyGameAction(
              { type: 'jump', stepIndex, title: `Jumped to move ${stepIndex}` },
              jumpToMove(game, stepIndex),
            ),
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

function RuntimeCard({ playedMoves }) {
  return h(
    'section',
    { class: 'info-card' },
    h('p', { class: 'panel-kicker' }, 'Architecture'),
    h(
      'ul',
      { class: 'guide-list' },
      h('li', {}, 'The whole game stays in one root state object.'),
      h('li', {}, 'Child components stay stateless and render only from props.'),
      h('li', {}, 'The runtime timeline records action, queued state, render commit, and effect sync.'),
      h('li', {}, `The board has committed ${playedMoves} move${playedMoves === 1 ? '' : 's'} so far.`),
    ),
  );
}

function RuntimeTimelineCard({ timeline }) {
  return h(
    'section',
    { class: 'info-card history-card' },
    h('p', { class: 'panel-kicker' }, 'Runtime Timeline'),
    h('h3', { class: 'history-title' }, 'Internal Flow'),
    h(
      'div',
      { class: 'timeline-list' },
      ...timeline.map((entry) =>
        h(
          'article',
          {
            class: `timeline-entry is-${entry.kind}`,
            'data-key': entry.id,
          },
          h('strong', { class: 'timeline-title' }, entry.title),
          h('p', { class: 'timeline-detail' }, entry.detail),
        ),
      ),
    ),
  );
}

function TimeTravelCard({ history, onJump, stepIndex }) {
  return h(
    'section',
    { class: 'info-card history-card' },
    h('p', { class: 'panel-kicker' }, 'Time Travel'),
    h('h3', { class: 'history-title' }, 'Board Snapshots'),
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
          index === 0 ? 'Go to game start' : `Go to move ${index}`,
        ),
      ),
    ),
  );
}

const container = document.querySelector('#app');
const app = new FunctionComponent(App);

app.mount(container);
