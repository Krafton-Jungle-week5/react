const MAX_TIMELINE_ENTRIES = 12;

let nextTimelineId = 1;

export function createInitialTimeline() {
  return [
    createTimelineEntry(
      'system',
      'Runtime ready',
      'The root App now records what happens after user input, from state updates to post-commit effects.',
    ),
  ];
}

export function createTimelineEntry(kind, title, detail) {
  return {
    id: `timeline-${nextTimelineId++}`,
    kind,
    title,
    detail,
  };
}

export function pushTimelineEntry(currentTimeline, entry) {
  return [entry, ...currentTimeline].slice(0, MAX_TIMELINE_ENTRIES);
}

export function describeAction(action, nextGame, result) {
  if (action.type === 'square') {
    if (!action.accepted) {
      return `Square ${action.index + 1} was ignored because the cell was already filled or the round had already ended.`;
    }

    return `Square ${action.index + 1} accepted. Step ${nextGame.stepIndex} is now active and ${nextGame.xIsNext ? 'X' : 'O'} will play next${result.winner ? ` after ${result.winner} won.` : result.isDraw ? ' after a draw.' : '.'}`;
  }

  if (action.type === 'reset-board') {
    return 'A fresh board snapshot was created while the score stayed in the root state.';
  }

  if (action.type === 'reset-score') {
    return 'The whole root state was replaced with a new initial game object.';
  }

  return `Jumped to history step ${action.stepIndex}. The root state recalculated whose turn comes next.`;
}

export function describeCommit(game, result, moveCount) {
  return `Render committed with ${moveCount} filled squares. Winner: ${result.winner || 'none'}, draw: ${result.isDraw ? 'yes' : 'no'}, current step: ${game.stepIndex}.`;
}

export function describeEffectSync(xIsNext, result) {
  const title = result.winner
    ? `Tic-Tac-Toe - ${result.winner} won`
    : result.isDraw
      ? 'Tic-Tac-Toe - Draw'
      : `Tic-Tac-Toe - ${xIsNext ? 'X' : 'O'} turn`;

  return `useEffect synchronized the browser title to "${title}".`;
}
