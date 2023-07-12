import { describe, it, expect } from 'vitest'
import { isWhiteSpace, isAsciiLetter, isAsciiDigit } from './StringUtils'

describe('isWhiteSpace', () => {
  it('returns true for whitespace characters', () => {
    expect(isWhiteSpace(' ')).toBe(true)
    expect(isWhiteSpace('\n')).toBe(true)
    expect(isWhiteSpace('\t')).toBe(true)
  })

  it('returns false for non-whitespace characters', () => {
    expect(isWhiteSpace('a')).toBe(false)
    expect(isWhiteSpace('1')).toBe(false)
    expect(isWhiteSpace('@')).toBe(false)
  })
})

describe('isAsciiLetter', () => {
  it('returns true for ASCII letters', () => {
    expect(isAsciiLetter('a')).toBe(true)
    expect(isAsciiLetter('Z')).toBe(true)
    expect(isAsciiLetter('x')).toBe(true)
  })

  it('returns false for non-ASCII letters', () => {
    expect(isAsciiLetter('é')).toBe(false)
    expect(isAsciiLetter('中')).toBe(false)
    expect(isAsciiLetter('')).toBe(false)
  })

  it('returns false for non-letter characters', () => {
    expect(isAsciiLetter('1')).toBe(false)
    expect(isAsciiLetter('@')).toBe(false)
    expect(isAsciiLetter(' ')).toBe(false)
  })
})

describe('isDigit', () => {
  it('returns true for digits', () => {
    expect(isAsciiDigit('0')).toBe(true)
    expect(isAsciiDigit('5')).toBe(true)
    expect(isAsciiDigit('9')).toBe(true)
  })

  it('returns false for non-digits', () => {
    expect(isAsciiDigit('a')).toBe(false)
    expect(isAsciiDigit('@')).toBe(false)
    expect(isAsciiDigit(' ')).toBe(false)
  })
})
