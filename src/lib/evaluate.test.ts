import { evaluate } from './evaluate'

test('all correct', () => {
  expect(evaluate('crane', 'crane').map(l => l.state)).toEqual(
    ['correct', 'correct', 'correct', 'correct', 'correct']
  )
})

test('all absent', () => {
  expect(evaluate('butts', 'crane').map(l => l.state)).toEqual(
    ['absent', 'absent', 'absent', 'absent', 'absent']
  )
})

test('present but wrong position', () => {
  // 'acres' vs 'crane': a(0)=present, c(1)=present, r(2)=present, e(3)=present, s(4)=absent
  const result = evaluate('acres', 'crane')
  expect(result[0].state).toBe('present') // a present (in target at idx 2)
  expect(result[1].state).toBe('present') // c present (in target at idx 0)
  expect(result[2].state).toBe('present') // r present (in target at idx 1)
  expect(result[3].state).toBe('present') // e present (in target at idx 4)
  expect(result[4].state).toBe('absent')  // s absent
})

test('duplicate letter - only as many present/correct as in target', () => {
  // target 'crane' has one 'r'; guess 'error' has three 'r's
  const result = evaluate('error', 'crane')
  const rStates = result.filter(l => l.letter === 'r').map(l => l.state)
  const nonAbsent = rStates.filter(s => s !== 'absent')
  expect(nonAbsent.length).toBe(1)
})
