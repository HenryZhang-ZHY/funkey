import {describe, test, expect} from 'vitest'
import {Lexer} from './lexer.ts'
import {Token} from '../token/token.ts'
import {TokenType} from '../token/tokenType.ts'

describe('nextToken', () => {
    test.each([
        {input: 'let', expectedToken: new Token(TokenType.LET, 'let')}
    ])(
        'Token should be $expectedToken.type, $expectedToken.literal',
        ({input, expectedToken}) => {
            const lexer = new Lexer(input)

            const token = lexer.nextToken()

            expect(token.type).toBe(expectedToken.type)
            expect(token.literal).toBe(expectedToken.literal)
        })

    test(`input is '5;'`, () => {
        const lexer = new Lexer('5;')

        const [token1, token2] = [lexer.nextToken(), lexer.nextToken()]

        expect(token1.type).toBe(TokenType.INT)
        expect(token1.literal).toBe('5')

        expect(token2.type).toBe(TokenType.SEMICOLON)
        expect(token2.literal).toBe(';')
    })

    test.each([
        {input: `"foo"`, result: 'foo'},
        {input: `"hello world"`, result: 'hello world'}
    ])
    ('parse string [$input]', ({input, result}) => {
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
`;


    const expectedTokenSecquence = [
        new Token(TokenType.LET, 'let'),
        new Token(TokenType.IDENT, 'five'),
        new Token(TokenType.ASSIGN, '='),
        new Token(TokenType.INT, '5'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.LET, 'let'),
        new Token(TokenType.IDENT, 'ten'),
        new Token(TokenType.ASSIGN, '='),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.LET, 'let'),
        new Token(TokenType.IDENT, 'add'),
        new Token(TokenType.ASSIGN, '='),
        new Token(TokenType.FUNCTION, 'fn'),
        new Token(TokenType.LPAREN, '('),
        new Token(TokenType.IDENT, 'x'),
        new Token(TokenType.COMMA, ','),
        new Token(TokenType.IDENT, 'y'),
        new Token(TokenType.RPAREN, ')'),
        new Token(TokenType.LBRACE, '{'),
        new Token(TokenType.IDENT, 'x'),
        new Token(TokenType.PLUS, '+'),
        new Token(TokenType.IDENT, 'y'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.RBRACE, '}'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.LET, 'let'),
        new Token(TokenType.IDENT, 'result'),
        new Token(TokenType.ASSIGN, '='),
        new Token(TokenType.IDENT, 'add'),
        new Token(TokenType.LPAREN, '('),
        new Token(TokenType.IDENT, 'five'),
        new Token(TokenType.COMMA, ','),
        new Token(TokenType.IDENT, 'ten'),
        new Token(TokenType.RPAREN, ')'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.BANG, '!'),
        new Token(TokenType.MINUS, '-'),
        new Token(TokenType.SLASH, '/'),
        new Token(TokenType.ASTERISK, '*'),
        new Token(TokenType.INT, '5'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.INT, '5'),
        new Token(TokenType.LT, '<'),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.GT, '>'),
        new Token(TokenType.INT, '5'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.IF, 'if'),
        new Token(TokenType.LPAREN, '('),
        new Token(TokenType.INT, '5'),
        new Token(TokenType.LT, '<'),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.RPAREN, ')'),
        new Token(TokenType.LBRACE, '{'),
        new Token(TokenType.RETURN, 'return'),
        new Token(TokenType.TRUE, 'true'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.RBRACE, '}'),
        new Token(TokenType.ELSE, 'else'),
        new Token(TokenType.LBRACE, '{'),
        new Token(TokenType.RETURN, 'return'),
        new Token(TokenType.FALSE, 'false'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.RBRACE, '}'),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.EQ, '=='),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.INT, '10'),
        new Token(TokenType.NOT_EQ, '!='),
        new Token(TokenType.INT, '9'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.LBRACKET, '['),
        new Token(TokenType.INT, '1'),
        new Token(TokenType.COMMA, ','),
        new Token(TokenType.INT, '2'),
        new Token(TokenType.RBRACKET, ']'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.IDENT, 'a'),
        new Token(TokenType.DOT, '.'),
        new Token(TokenType.IDENT, 'b'),
        new Token(TokenType.SEMICOLON, ';'),
        new Token(TokenType.EOF, ''),
    ]

    expectedTokenSecquence.forEach((item, index) => {
        test(`Token should be (${item.type}, ${item.literal}) at index:[${index}]`, () => {
            const lexer = new Lexer(input)
            for (let i = 0; i < index; i++) {
                lexer.nextToken()
            }

            const {type, literal} = lexer.nextToken()

            const {type: expectedType, literal: expectedLiteral} = item
            expect(type).toBe(expectedType)
            expect(literal).toBe(expectedLiteral)
        })
    })
})

