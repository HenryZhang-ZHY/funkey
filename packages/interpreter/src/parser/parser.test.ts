import {assert, describe, expect, test} from 'vitest'
import {
    ArrayLiteral, AssignExpression,
    BooleanLiteral,
    CallExpression, DotExpression,
    Expression,
    ExpressionStatement, ForStatement,
    FunctionLiteral,
    Identifier,
    IfExpression, IndexExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement, MapLiteral,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
    StringLiteral
} from '../ast/ast'
import {Lexer} from '../lexer/lexer'
import {Parser} from './parser'
import {TokenType} from '../token/tokenType'

type LiteralExpressionValue = number | boolean | string
type Operator = string


describe('LetStatement', () => {
    test.each([
        {statement: 'let x = 5;', identifier: 'x', expression: 5},
        {statement: 'let flag = false;', identifier: 'flag', expression: false},
        {statement: 'let foo = bar;', identifier: 'foo', expression: 'bar'},
    ])('trivial statement: [$statement]', ({statement, identifier, expression}) => {
        const result = parseStatement(statement)

        assertLetStatement(result, identifier, expression)
    })


    test.each([
        {statement: 'let = 5', expected: TokenType.IDENT, actual: TokenType.ASSIGN},
        {statement: 'let x 5', expected: TokenType.ASSIGN, actual: TokenType.INT},
        {statement: 'let 5 5', expected: TokenType.IDENT, actual: TokenType.INT},
    ])(
        'should complain for missing $expected token when input is $statement',
        ({statement, expected, actual}) => {
            const errors = getParseErrors(statement)

            expect(errors[0]).toBe(`expected next token to be ${expected}, got ${actual} instead`)
        })

    function getParseErrors(input: string): string[] {
        const lexer = new Lexer(input)
        const parser = new Parser(lexer)
        parser.parseProgram()

        return parser.errors
    }
})

describe('ReturnStatement', () => {
    test.each([
        {statement: 'return 5;', expression: 5},
        {statement: 'return true;', expression: true},
        {statement: 'return x;', expression: 'x'}
    ])('[$statement] should return value:[$expression]', ({statement, expression}) => {
        const result = parseStatement(statement)

        assert(result instanceof ReturnStatement)
        assert(result.expression)
        assertLiteralExpression(result.expression, expression)
    })
})

describe('ForStatement', () => {
    test('normal', () => {
        const input = 'for (let i = 0; i < 10; let i = i + 1;) { print(i); }'

        const result = parseStatement(input)

        assert(result instanceof ForStatement)

        const initializationStatement = result.initializationStatement
        assert(initializationStatement instanceof LetStatement)
        assertLetStatement(initializationStatement, 'i', 0)

        const conditionStatement = result.conditionStatement
        assert(conditionStatement instanceof ExpressionStatement)
        assertInfixExpressionStatement(conditionStatement, 'i', '<', 10)

        const updateStatement = result.updateStatement
        assert(updateStatement instanceof LetStatement)
        expect(updateStatement.identifier.value).toBe('i')
        assertInfixExpression(updateStatement.expression!, 'i', '+', 1)
    })
})

describe('ExpressionStatement', () => {
    test.each([
        {statement: 'foo;', identifier: 'foo'},
        {statement: 'bar;', identifier: 'bar'},
        {statement: 'aJavaStyleVariableName;', identifier: 'aJavaStyleVariableName'}
    ])('identifier expression statement: [$statement]', ({statement, identifier}) => {
        const result = parseStatement(statement)

        assertIdentifierStatement(result, identifier)
    })

    test.each([
        {statement: 'true;', value: true},
        {statement: 'false;', value: false}
    ])('boolean literal expression statement: [$statement]', ({statement, value}) => {
        const result = parseStatement(statement)

        assertBooleanStatement(result, value)
    })

    test.each([
        {statement: '1234567;', value: 1234567},
        {statement: '0;', value: 0}
    ])('integer literal expression statement: [$statement]', ({statement, value}) => {
        const result = parseStatement(statement)

        assertIntegerStatement(result, value)
    })

    test.each([
        {statement: '"foo";', value: 'foo'},
        {statement: '"hello world";', value: 'hello world'}
    ])('string literal expression statement: [$statement]', ({statement, value}) => {
        const result = parseStatement(statement)

        assertStringStatement(result, value)
    })

    test.each([
        {statement: '[1, 2 * 2, 3 + 3]', value: ['1', '(2 * 2)', '(3 + 3)']},
        {statement: '[]', value: []},
    ])('array literal expression statement: [$statement]', ({statement, value}) => {
        const result = parseStatement(statement)

        assert(result instanceof ExpressionStatement)

        assert(result.expression)
        const expression = result.expression
        assert(expression instanceof ArrayLiteral)
        expect(expression.elements.map(x => `${x}`)).toEqual(value)
    })

    test('parse IndexExpression', () => {
        const statement = 'arr[1 + 1]'
        const result = parseStatement(statement)

        assert(result instanceof ExpressionStatement)

        assert(result.expression)
        const expression = result.expression
        assert(expression instanceof IndexExpression)
        assertIdentifierExpression(expression.left, 'arr')
        assertInfixExpression(expression.index, 1, '+', 1)
    })

    test('parse DotExpression', () => {
        const statement = 'a.b'
        const result = parseStatement(statement)

        assert(result instanceof ExpressionStatement)

        assert(result.expression)
        const expression = result.expression
        assert(expression instanceof DotExpression)
        assertIdentifierExpression(expression.left, 'a')
        assertIdentifierExpression(expression.right, 'b')
    })

    test('parse AssignExpression', () => {
        const statement = 'a = b'
        const result = parseStatement(statement)

        assert(result instanceof ExpressionStatement)

        assert(result.expression)
        const expression = result.expression
        assert(expression instanceof AssignExpression)
        assertIdentifierExpression(expression.left, 'a')
        assertIdentifierExpression(expression.right, 'b')
    })

    test.each([
        {statement: '!5;', operator: '!', value: 5},
        {statement: '-15;', operator: '-', value: 15},
        {statement: '!true;', operator: '!', value: true},
        {statement: '-foo;', operator: '-', value: 'foo'},
    ])(
        'prefix expression: statement:[$statement] => { operator:[$operator], value:[$value] }',
        ({statement, operator, value}) => {
            const parsedStatement = parseStatement(statement)

            assertPrefixExpressionStatement(parsedStatement, operator, value)
        })

    test.each([
        {statement: '5 + 5;', operator: '+', left: 5, right: 5},
        {statement: '5 - 5;', operator: '-', left: 5, right: 5},
        {statement: '5 * 5;', operator: '*', left: 5, right: 5},
        {statement: '5 / 5;', operator: '/', left: 5, right: 5},
        {statement: '5 > 5;', operator: '>', left: 5, right: 5},
        {statement: '5 < 5;', operator: '<', left: 5, right: 5},
        {statement: '5 == 5;', operator: '==', left: 5, right: 5},
        {statement: '5 !=5;', operator: '!=', left: 5, right: 5},
    ])(
        'infix expression: statement:[$statement] => { left:[$left], operator:[$operator], right:[$right] }',
        ({
             statement,
             left,
             operator,
             right
         }) => {
            const result = parseStatement(statement)

            assertInfixExpressionStatement(result, left, operator, right)
        })

    test.each([
        {
            statement: '-a * b',
            output: '((-a) * b)',
        },
        {
            statement: '!-a',
            output: '(!(-a))',
        },
        {
            statement: 'a + b + c',
            output: '((a + b) + c)',
        },
        {
            statement: 'a + b - c',
            output: '((a + b) - c)',
        },
        {
            statement: 'a * b * c',
            output: '((a * b) * c)',
        },
        {
            statement: 'a * b / c',
            output: '((a * b) / c)',
        },
        {
            statement: 'a + b / c',
            output: '(a + (b / c))',
        },
        {
            statement: 'a + b * c + d / e - f',
            output: '(((a + (b * c)) + (d / e)) - f)',
        },
        {
            statement: '5 > 4 == 3 < 4',
            output: '((5 > 4) == (3 < 4))',
        },
        {
            statement: '5 < 4 != 3 > 4',
            output: '((5 < 4) != (3 > 4))',
        },
        {
            statement: '3 + 4 * 5 == 3 * 1 + 4 * 5',
            output: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))',
        },
        {
            statement: 'true',
            output: 'true',
        },
        {
            statement: 'false',
            output: 'false',
        },
        {
            statement: '3 > 5 == false',
            output: '((3 > 5) == false)',
        },
        {
            statement: '3 < 5 == true',
            output: '((3 < 5) == true)',
        },
        {
            statement: '1 + (2 + 3) + 4',
            output: '((1 + (2 + 3)) + 4)',
        },
        {
            statement: '(5 + 5) * 2',
            output: '((5 + 5) * 2)',
        },
        {
            statement: '2 / (5 + 5)',
            output: '(2 / (5 + 5))',
        },
        {
            statement: '-(5 + 5)',
            output: '(-(5 + 5))',
        },
        {
            statement: '!(true == true)',
            output: '(!(true == true))',
        },
        {
            statement: 'a + add(b * c) + d',
            output: '((a + add((b * c))) + d)',
        },
        {
            statement: 'add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))',
            output: 'add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))',
        },
        {
            statement: 'add(a + b + c * d / f + g)',
            output: 'add((((a + b) + ((c * d) / f)) + g))',
        },
        {
            statement: 'a * [1, 2, 3, 4][b * c] * d',
            output: '((a * ([1, 2, 3, 4][(b * c)])) * d)',
        },
        {
            statement: 'add(a * b[2], b[1], 2 * [1, 2][1])',
            output: 'add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))',
        },
    ])('operator precedence parsing: input:[$statement], output:[$output]', ({statement, output}) => {
        const result = parseStatement(statement)

        expect(result.toString()).toBe(`${output};`)
    })
})

describe('IfExpression', () => {
    describe('single expression block', () => {
        test('if expression', () => {
            const input = 'if (x < y) { x }'

            const result = parseStatement(input)

            assert(result instanceof ExpressionStatement)

            const expression = result.expression
            assert(expression instanceof IfExpression)

            expect(expression.condition.toString()).toBe('(x < y)')
            expect(expression.consequence.toString()).toBe('x;')
        })

        test('if-else expression', () => {
            const input = 'if (x < y) { x } else { y }'

            const result = parseStatement(input)

            assert(result instanceof ExpressionStatement)

            const expression = result.expression
            assert(expression instanceof IfExpression)

            expect(expression.condition.toString()).toBe('(x < y)')
            expect(expression.consequence.toString()).toBe('x;')
            expect(expression.alternative!.toString()).toBe('y;')
        })
    })

    describe('multi expression block', () => {
        test('if expression', () => {
            const input = `
            if (a + b == 1) {
                a;
                b;    
            }
            `

            const result = parseStatement(input)

            assert(result instanceof ExpressionStatement)

            const expression = result.expression
            assert(expression instanceof IfExpression)

            expect(expression.condition.toString()).toBe('((a + b) == 1)')
            expect(expression.consequence.toString()).toBe('a;\nb;')
        })

        test('if-else expression', () => {
            const input = `
            if (a + b == 1) {
                a;
                b;    
            } else {
                b;
                a;
            }
            `

            const result = parseStatement(input)

            assert(result instanceof ExpressionStatement)

            const expression = result.expression
            assert(expression instanceof IfExpression)

            expect(expression.condition.toString()).toBe('((a + b) == 1)')
            expect(expression.consequence.toString()).toBe('a;\nb;')
            expect(expression.alternative!.toString()).toBe('b;\na;')
        })
    })
})

describe('FunctionLiteral', () => {
    test('basic', () => {
        const input = 'fn(x, y) { x + y; }'

        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof FunctionLiteral)

        expect(expression.parameters.map(x => x.value)).toEqual(['x', 'y'])

        const bodyStatement = expression.body.statements[0]
        assertInfixExpressionStatement(bodyStatement, 'x', '+', 'y')

        expect(result.toString()).toBe(`fn (x, y) {
\t(x + y);
};`)
    })

    test.each([
        {input: 'fn() {}', expectedParameters: []},
        {input: 'fn(a) {}', expectedParameters: ['a']},
        {
            input: 'fn(a, b, c, d) {}',
            expectedParameters: ['a', 'b', 'c', 'd']
        },
    ])('parse parameters for [$input]', ({input, expectedParameters}) => {
        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof FunctionLiteral)

        expect(expression.parameters.map(x => x.value)).toEqual(expectedParameters)
    })
})

describe('MapLiteral', () => {
    test('basic', () => {
        const input = '{"one": 1, "two": 2, "three": 3}'

        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof MapLiteral)

        const entries = [...expression.map.entries()]
        expect(entries.length).toBe(3)
        assertStringLiteralExpression(entries[0][0], 'one')
        assertIntegerLiteralExpression(entries[0][1], 1)
        assertStringLiteralExpression(entries[1][0], 'two')
        assertIntegerLiteralExpression(entries[1][1], 2)
        assertStringLiteralExpression(entries[2][0], 'three')
        assertIntegerLiteralExpression(entries[2][1], 3)
    })

    test('empty map', () => {
        const input = '{}'

        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof MapLiteral)

        const entries = [...expression.map.entries()]
        expect(entries.length).toBe(0)
    })
})

describe('CallExpression', () => {
    test('basic', () => {
        const input = 'add(1, 2 * 3, 4 + 5);'

        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof CallExpression)

        assertIdentifierExpression(expression.fn, 'add')

        assertIntegerLiteralExpression(expression.args[0], 1)
        assertInfixExpression(expression.args[1], 2, '*', 3)
        assertInfixExpression(expression.args[2], 4, '+', 5)
    })

    test('call immediately', () => {
        const input = 'fn (a, b) { a + b }(1, 2);'

        const result = parseStatement(input)

        assert(result instanceof ExpressionStatement)

        const expression = result.expression
        assert(expression instanceof CallExpression)

        const functionExpression = expression.fn
        assert(functionExpression instanceof FunctionLiteral)
        expect(functionExpression.parameters.map(x => x.value)).toEqual(['a', 'b'])
        assertInfixExpressionStatement(functionExpression.body.statements[0], 'a', '+', 'b')

        assertIntegerLiteralExpression(expression.args[0], 1)
        assertIntegerLiteralExpression(expression.args[1], 2)
    })
})

function parseStatement(statement: string) {
    const program = parseProgram(statement)

    return program.statements[0]
}

function parseProgram(input: string, expectedErrorCounts: number = 0): Program {
    const lexer = new Lexer(input)
    const parser = new Parser(lexer)

    const program = parser.parseProgram()

    expect(parser.errors.length).toBe(expectedErrorCounts)

    return program
}

function assertLetStatement(result: Statement, identifier: string, expression: LiteralExpressionValue) {
    assert(result instanceof LetStatement)

    expect(result.identifier.value).toBe(identifier)

    assert(result.expression)
    assertLiteralExpression(result.expression, expression)
}

function assertIdentifierStatement(statement: Statement, value: string) {
    assert(statement instanceof ExpressionStatement)

    assert(statement.expression)
    assertIdentifierExpression(statement.expression, value)
}

function assertIntegerStatement(statement: Statement, value: number) {
    assert(statement instanceof ExpressionStatement)

    assert(statement.expression)
    assertIntegerLiteralExpression(statement.expression, value)
}

function assertBooleanStatement(statement: Statement, value: boolean) {
    assert(statement instanceof ExpressionStatement)

    assert(statement.expression)
    assertBooleanLiteralExpression(statement.expression, value)
}

function assertStringStatement(statement: Statement, value: string) {
    assert(statement instanceof ExpressionStatement)

    assert(statement.expression)
    assertStringLiteralExpression(statement.expression, value)
}

function assertPrefixExpressionStatement(statement: Statement, operator: Operator, value: LiteralExpressionValue) {
    assert(statement instanceof ExpressionStatement)
    assert(statement.expression instanceof PrefixExpression)
    assertPrefixExpression(statement.expression, operator, value)
}

function assertPrefixExpression(expression: PrefixExpression, operator: Operator, value: LiteralExpressionValue) {
    expect(expression.operator).toBe(operator)
    assertLiteralExpression(expression.value, value)
}

function assertInfixExpressionStatement(statement: Statement, left: LiteralExpressionValue, operator: Operator, right: LiteralExpressionValue) {
    assert(statement instanceof ExpressionStatement)

    assert(statement.expression instanceof InfixExpression)
    assertInfixExpression(statement.expression, left, operator, right)
}

function assertInfixExpression(expression: Expression, left: LiteralExpressionValue, operator: Operator, right: LiteralExpressionValue) {
    assert(expression instanceof InfixExpression)

    assertLiteralExpression(expression.left, left)
    expect(expression.operator).toBe(operator)
    assertLiteralExpression(expression.right, right)
}

function assertLiteralExpression(expression: Expression, value: LiteralExpressionValue) {
    if (typeof value === 'number') {
        assertIntegerLiteralExpression(expression, value)
    } else if (typeof value === 'boolean') {
        assertBooleanLiteralExpression(expression, value)
    } else {
        assertIdentifierExpression(expression, value)
    }
}

function assertIntegerLiteralExpression(expression: Expression, value: number) {
    assert(expression instanceof IntegerLiteral)
    expect(expression.value).toBe(value)
}

function assertBooleanLiteralExpression(expression: Expression, value: boolean) {
    assert(expression instanceof BooleanLiteral)
    expect(expression.value).toBe(value)
}

function assertStringLiteralExpression(expression: Expression, value: string) {
    assert(expression instanceof StringLiteral)
    expect(expression.value).toBe(value)
}

function assertIdentifierExpression(expression: Expression, value: string) {
    assert(expression instanceof Identifier)
    expect(expression.value).toBe(value)
}
