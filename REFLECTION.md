# Reflection

**Name / Andrew ID:** Veronica Pak / vpak

**Recitation group members (Task 2):** slaman, rsucgang, sanjithag, tcherian

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

The Wordle property "returns exactly 5 colors" passes on the correct implementation but kills none of the mutants. It is still valid because the spec says matchGuess "returns five colors, one per position of guess", so any correct implementation must satisfy it. It would catch an implementation that builds the result by adding a color only when a letter matches (adding G for a green and Y for a yellow but never adding B), which would return G Y instead of G Y B B B.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

The original Wordle generator drew letters only from the full alphabet A-Z, which made the singlePass mutant flaky. Its bug only appears when the guess repeats a letter that the secret has fewer copies of, and with 26 letters two random words rarely share repeated letters, so some runs never produced such an input. This was fixed by having the generator pick either a word from the small alphabet ABC, which almost always has repeated, shared letters, or a word from the full alphabet.

Before (full alphabet only, npm run mutants:wordle -- --repeat 30):

```
  ~ singlePass     flaky: killed in 29/30 runs  by: never credits a letter more times than the secret contains it; swapping secret and guess keeps the same color counts
      Counterexample: ["AAAAR","AAARR"]
      AssertionError: expected 2 to be less than or equal to 1
```

After (ABC or full alphabet, npm run mutants:wordle -- --repeat 30):

```
  ✔ singlePass     killed  by: never credits a letter more times than the secret contains it; swapping secret and guess keeps the same color counts
      Counterexample: ["CBBAA","AAAAA"]
      AssertionError: expected 4 to be less than or equal to 2
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ greensOnly     killed  by: rearranging the secret gives no blacks
      Counterexample: [["AAAAD","ADAAA"]]
      AssertionError: expected [ 'G', 'B', 'G', 'G', 'B' ] to not include 'B'
```

With secret `AAAAD` and guess `ADAAA`, positions 0, 2, and 3 are green, which leaves the secret's `A` at position 1 and `D` at position 4 unused. The spec says a letter is yellow if it occurs elsewhere in the secret and that occurrence hasn't been used by a green or an earlier yellow, so the guess's `D` (position 1) and `A` (position 4) should both be yellow, giving `G Y G G Y`. The `greensOnly` mutant never reports yellow, so it marks both as black even though every letter of the guess is in the secret.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

The formatDuration function that I wrote for my TUI toast notification feature formats response time in milliseconds into the "Took Xm Ys" text shown on the toast notification when OpenCode finishes responding.

Property 1 (invariant): the output is always either "Xs" with X less than 60, or "Xm Ys" with Y between 0 and 59, so it never shows something like "60s" or "1m 60s".

Property 2 (algebraic, round-trip): parsing the output back into seconds (minutes times 60 plus seconds) gives the input rounded to the nearest second, and negative inputs give "0s".

A naive generator that picks integers uniformly from the full range would almost always produce enormous durations, so it would rarely exercise the seconds-only format or the boundary where rounding pushes a duration from the seconds-only format into the minutes format, which is where off-by-one bugs are most likely. The generator I'd need would be weighted toward small durations around that one-minute boundary, while still including negative durations (which can come from clock skew), durations that aren't whole seconds so rounding is tested, and occasional large durations.
