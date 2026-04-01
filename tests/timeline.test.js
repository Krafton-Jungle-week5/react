import {
  createInitialTimeline,
  createTimelineEntry,
  appendTimelineEntry,
  describeAction,
  describeCommit,
  describeEffectSync,
  startTimeline,
} from '../src/tic-tac-toe/timeline.js';

describe('runtime timeline helpers', () => {
  it('starts with a ready entry', () => {
    const timeline = createInitialTimeline();

    expect(timeline).toHaveLength(1);
    expect(timeline[0].title).toBe('Runtime ready');
  });

  it('restarts the timeline for the current action and appends later phases in order', () => {
    const first = createTimelineEntry('system', 'Older', 'first');
    const second = createTimelineEntry('action', 'Newer', 'second');
    const third = createTimelineEntry('render', 'Committed', 'third');

    expect(startTimeline(first, second).map((entry) => entry.title)).toEqual(['Older', 'Newer']);
    expect(appendTimelineEntry(startTimeline(first, second), third).map((entry) => entry.title)).toEqual([
      'Older',
      'Newer',
      'Committed',
    ]);
  });

  it('describes accepted square clicks and root state queueing in readable language', () => {
    const nextGame = {
      stepIndex: 3,
      xIsNext: false,
    };
    const result = {
      winner: null,
      isDraw: false,
    };

    expect(describeAction({ type: 'square', index: 4, accepted: true }, nextGame, result)).toContain('Square 5 accepted');
    expect(describeCommit({ stepIndex: 3 }, result, 3)).toContain('Render committed with 3 filled squares');
    expect(describeEffectSync(false, result)).toContain('Tic-Tac-Toe - O turn');
  });
});
