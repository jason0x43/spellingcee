import { afterEach, describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Classify from '../../../src/routes/app/classify/index.svelte';

describe('classify', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with no words', () => {
    const { getByTestId } = render(Classify, { words: [] });
    const word = getByTestId('word');
    expect(word).toBeDefined();
    expect(word.textContent).toEqual('?');
  });

  it('renders with words', () => {
    const { getByTestId } = render(Classify, {
      words: [['bar', 1], ['foo']]
    });
    const word = getByTestId('word');
    expect(word).toBeDefined();
    // should equal the first unrated word
    expect(word.textContent).toEqual('foo');
  });
});
