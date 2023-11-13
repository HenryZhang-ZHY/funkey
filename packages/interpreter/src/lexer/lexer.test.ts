import {describe, test, expect} from 'vitest'
import {Lexer} from './lexer'
import {Token} from '../token/token'
import {TokenType} from '../token/tokenType'

describe('nextToken', () => {
    test.each([
        {input: 'let', expectedToken: new Token(TokenType.LET, 'let', 0, 0)},
        {input: 'for', expectedToken: new Token(TokenType.FOR, 'for', 0, 0)},
        {input: '%', expectedToken: new Token(TokenType.MOD, '%', 0, 0)},
        {input: '>=', expectedToken: new Token(TokenType.GTE, '>=', 0, 0)},
        {input: '<=', expectedToken: new Token(TokenType.LTE, '<=', 0, 0)},
    ])(
        'Token should be $expectedToken.type, $expectedToken.literal',
        ({input, expectedToken}) => {
            const lexer = new Lexer(input)

            const token = lexer.nextToken()

            expect(token.type).toBe(expectedToken.type)
            expect(token.literal).toBe(expectedToken.literal)
        })

    test('input is \'5;\'', () => {
        const lexer = new Lexer('5;')

        const [token1, token2] = [lexer.nextToken(), lexer.nextToken()]

        expect(token1.type).toBe(TokenType.INT)
        expect(token1.literal).toBe('5')

        expect(token2.type).toBe(TokenType.SEMICOLON)
        expect(token2.literal).toBe(';')
    })

    test.each([
        {input: '"foo"', result: 'foo'},
        {input: '"hello world"', result: 'hello world'}
    ])('parse string [$input]', ({input, result}) => {
        const lexer = new Lexer(input)

        const token = lexer.nextToken()

        expect(token.type).toBe(TokenType.STRING)
        expect(token.literal).toBe(result)
    })
})

describe('tokenize program', () => {
    const input = `let five = 5;
  let ten = 10;
  
  let add = fn(x, y) {
    x + y;
  };
  
  let result = add(five, ten);
  !-/*5;
  5 < 10 > 5;
  
  if (5 < 10) {
    return true;
  } else {
    return false;
  }
  
  10 == 10;
  10 != 9;
  [1, 2];
  a.b;
  {"foo": "bar"};
`


    const expectedTokenSecquence = [
        new Token(TokenType.LET, 'let', 1, 1),
        new Token(TokenType.IDENT, 'five', 1, 5),
        new Token(TokenType.ASSIGN, '=', 1, 10),
        new Token(TokenType.INT, '5', 1, 12),
        new Token(TokenType.SEMICOLON, ';', 1, 13),
        new Token(TokenType.LET, 'let', 2, 3),
        new Token(TokenType.IDENT, 'ten', 2, 7),
        new Token(TokenType.ASSIGN, '=', 2, 11),
        new Token(TokenType.INT, '10', 2, 13),
        new Token(TokenType.SEMICOLON, ';', 2, 15),
        new Token(TokenType.LET, 'let', 4, 3),
        new Token(TokenType.IDENT, 'add', 4, 7),
        new Token(TokenType.ASSIGN, '=', 4, 11),
        new Token(TokenType.FUNCTION, 'fn', 4, 13),
        new Token(TokenType.LPAREN, '(', 4, 15),
        new Token(TokenType.IDENT, 'x', 4, 16),
        new Token(TokenType.COMMA, ',', 4, 17),
        new Token(TokenType.IDENT, 'y', 4, 19),
        new Token(TokenType.RPAREN, ')', 4, 20),
        new Token(TokenType.LBRACE, '{', 4, 22),
        new Token(TokenType.IDENT, 'x', 5, 5),
        new Token(TokenType.PLUS, '+', 5, 7),
        new Token(TokenType.IDENT, 'y', 5, 9),
        new Token(TokenType.SEMICOLON, ';', 5, 10),
        new Token(TokenType.RBRACE, '}', 6, 3),
        new Token(TokenType.SEMICOLON, ';', 6, 4),
        new Token(TokenType.LET, 'let', 8, 3),
        new Token(TokenType.IDENT, 'result', 8, 7),
        new Token(TokenType.ASSIGN, '=', 8, 14),
        new Token(TokenType.IDENT, 'add', 8, 16),
        new Token(TokenType.LPAREN, '(', 8, 19),
        new Token(TokenType.IDENT, 'five', 8, 20),
        new Token(TokenType.COMMA, ',', 8, 24),
        new Token(TokenType.IDENT, 'ten', 8, 26),
        new Token(TokenType.RPAREN, ')', 8, 29),
        new Token(TokenType.SEMICOLON, ';', 8, 30),
        new Token(TokenType.BANG, '!', 9, 3),
        new Token(TokenType.MINUS, '-', 9, 4),
        new Token(TokenType.SLASH, '/', 9, 5),
        new Token(TokenType.ASTERISK, '*', 9, 6),
        new Token(TokenType.INT, '5', 9, 7),
        new Token(TokenType.SEMICOLON, ';', 9, 8),
        new Token(TokenType.INT, '5', 10, 3),
        new Token(TokenType.LT, '<', 10, 5),
        new Token(TokenType.INT, '10', 10, 7),
        new Token(TokenType.GT, '>', 10, 10),
        new Token(TokenType.INT, '5', 10, 12),
        new Token(TokenType.SEMICOLON, ';', 10, 13),
        new Token(TokenType.IF, 'if', 12, 3),
        new Token(TokenType.LPAREN, '(', 12, 6),
        new Token(TokenType.INT, '5', 12, 7),
        new Token(TokenType.LT, '<', 12, 9),
        new Token(TokenType.INT, '10', 12, 11),
        new Token(TokenType.RPAREN, ')', 12, 13),
        new Token(TokenType.LBRACE, '{', 12, 15),
        new Token(TokenType.RETURN, 'return', 13, 5),
        new Token(TokenType.TRUE, 'true', 13, 12),
        new Token(TokenType.SEMICOLON, ';', 13, 16),
        new Token(TokenType.RBRACE, '}', 14, 3),
        new Token(TokenType.ELSE, 'else', 14, 5),
        new Token(TokenType.LBRACE, '{', 14, 10),
        new Token(TokenType.RETURN, 'return', 15, 5),
        new Token(TokenType.FALSE, 'false', 15, 12),
        new Token(TokenType.SEMICOLON, ';', 15, 17),
        new Token(TokenType.RBRACE, '}', 16, 3),
        new Token(TokenType.INT, '10', 18, 3),
        new Token(TokenType.EQ, '==', 18, 5),
        new Token(TokenType.INT, '10', 18, 9),
        new Token(TokenType.SEMICOLON, ';', 18, 11),
        new Token(TokenType.INT, '10', 19, 3),
        new Token(TokenType.NOT_EQ, '!=', 19, 5),
        new Token(TokenType.INT, '9', 19, 9),
        new Token(TokenType.SEMICOLON, ';', 19, 10),
        new Token(TokenType.LBRACKET, '[', 20, 3),
        new Token(TokenType.INT, '1', 20, 4),
        new Token(TokenType.COMMA, ',', 20, 5),
        new Token(TokenType.INT, '2', 20, 7),
        new Token(TokenType.RBRACKET, ']', 20, 8),
        new Token(TokenType.SEMICOLON, ';', 20, 9),
        new Token(TokenType.IDENT, 'a', 21, 3),
        new Token(TokenType.DOT, '.', 21, 4),
        new Token(TokenType.IDENT, 'b', 21, 5),
        new Token(TokenType.SEMICOLON, ';', 21, 6),
        new Token(TokenType.LBRACE, '{', 22, 3),
        new Token(TokenType.STRING, 'foo', 22, 6),
        new Token(TokenType.COLON, ':', 22, 9),
        new Token(TokenType.STRING, 'bar', 22, 13),
        new Token(TokenType.RBRACE, '}', 22, 16),
        new Token(TokenType.SEMICOLON, ';', 22, 17),
        new Token(TokenType.EOF, '', 23, 1),
    ]

    expectedTokenSecquence.forEach((item, index) => {
        test(`Token should be (${item.type}, ${item.literal}) at index:[${index}]`, () => {
            const lexer = new Lexer(input)
            for (let i = 0; i < index; i++) {
                lexer.nextToken()
            }

            expect(lexer.nextToken()).toStrictEqual(item)
        })
    })
})

