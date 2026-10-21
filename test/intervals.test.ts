import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample. --> generator generates intervals where the end is less than the start
// fix: flip generated ints in interval if necessary
const point = fc.integer({ min: -12, max: 12 }); // small range so intervals often overlap or touch; crosses 0 and 10 for sort bugs
const interval: fc.Arbitrary<Interval> = fc.tuple(point, point).map(([start, end]) => (start <= end) ? [start, end] : [end, start]);
const intervalList = fc.array(interval);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  // Pattern: invariant. The output is sorted and consecutive intervals neither overlap nor touch.
  it('output is sorted with gaps between intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) expect(out[i][1]).toBeLessThan(out[i + 1][0]);
      }),
    );
  });

  // Pattern: invariant. The input array and its intervals are not modified.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const copy = structuredClone(xs);
        mergeIntervals(xs);
        expect(xs).toEqual(copy);
      }),
    );
  });

  // Pattern: algebraic. Merging is idempotent: merging an already-merged list changes nothing.
  it('merging twice is the same as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Reversing the input order doesn't change the output.
  it('reversing the input gives the same output', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: differential. Matches a slow reference that checks which half-integer points are covered.
  it('matches a point-by-point reference implementation', () => {
    const reference = (xs: Interval[]) => {
      const out: Interval[] = [];
      for (let p = -12; p <= 12; p += 0.5) {
        if (!xs.some(([s, e]) => s <= p && p <= e)) continue;
        const last = out[out.length - 1];
        if (last && last[1] === p - 0.5) last[1] = p;
        else out.push([p, p]);
      }
      return out;
    };
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals(xs)).toEqual(reference(xs));
      }),
    );
  });

  // Pattern: conditional. If the input is already sorted and disjoint => the output equals the input.
  it('already-disjoint input is returned unchanged', () => {
    // Targeted generator: interval i is [2i, 2i] or [2i, 2i + 1], so the list is sorted and disjoint by construction.
    const disjointList = fc.array(fc.nat(1)).map(lens => lens.map((len, i): Interval => [2 * i, 2 * i + len]));
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});
