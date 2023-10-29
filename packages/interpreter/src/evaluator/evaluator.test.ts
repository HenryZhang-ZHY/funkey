import {Lexer} from '../lexer/lexer'
import {Parser} from '../parser/parser'
import {evaluate as evalCore, EvaluatingError} from './evaluator'
import {F_Array, F_Boolean, F_Function, F_Integer, F_Map, F_Null, F_Object, F_String} from '../object/f_Object'
import {assert, describe, expect, test} from 'vitest'

describe('evaluate Integer', () => {
    test.each([
        {input: '10', result: 10},
        {input: '999', result: 999}
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate Boolean', () => {
    test.each([
        {input: 'true', result: true},
        {input: 'false', result: false}
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Boolean)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate String', () => {
    test.each([
        {input: '"foo"', result: 'foo'},
        {input: '"lorem string"', result: 'lorem string'}
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_String)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate Array', () => {
    test.each([
        {input: '[1, 2 + 2, 3 * 3]', result: [1, 4, 9]},
        {
            input: `
        let q = 1;
        [q]`,
            result: [1]
        },
        {input: '[]', result: []}
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Array)
        expect(evaluated.elements.map(x => x.inspect)).toEqual(result.map(x => x.toString()))
    })
})

describe('evaluate Map', () => {
    test('basic', () => {
        const evaluated = evaluate('{"a": 1, "b"+"c": 2}')

        assert(evaluated instanceof F_Map)
        expect(evaluated.get(new F_String('a'))).toEqual(new F_Integer(1))
        expect(evaluated.get(new F_String('bc'))).toEqual(new F_Integer(2))
    })
})

describe('evaluate PreFixExpression', () => {
    test.each([
        {input: '!true', result: false},
        {input: '!false', result: true},
        {input: '!!true', result: true},
        {input: '!!false', result: false},
        {input: '!5', result: false},
        {input: '!!5', result: true},
        {input: '!0', result: true},
        {input: '!!0', result: false},
    ])('bang: evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Boolean)
        expect(evaluated.value).toBe(result)
    })

    test.each([
        {input: '0', result: 0},
        {input: '-0', result: -0},
        {input: '-5', result: -5},
        {input: '-10000', result: -10000},
    ])('minus: evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate InFixExpression', () => {
    test.each([
        {input: '1 < 2', result: true},
        {input: '1 > 2', result: false},
        {input: '1 < 1', result: false},
        {input: '1 > 1', result: false},
        {input: '1 == 1', result: true},
        {input: '1 != 1', result: false},
        {input: '1 == 2', result: false},
        {input: '1 != 2', result: true},
        {input: '(1 < 2) == true', result: true},
        {input: '(1 < 2) == false', result: false},
        {input: '(1 > 2) == true', result: false},
        {input: '(1 > 2) == false', result: true},
        {input: '"foo" == "foo"', result: true},
        {input: '"hello" == "world"', result: false},
        {input: '"hello" + " world" == "hello world"', result: true},
    ])('boolean operator: evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Boolean)
        expect(evaluated.value).toBe(result)
    })

    test.each([
        {input: '5', result: 5},
        {input: '10', result: 10},
        {input: '-5', result: -5},
        {input: '-10', result: -10},
        {input: '5 + 5 + 5 + 5 - 10', result: 10},
        {input: '2 * 2 * 2 * 2 * 2', result: 32},
        {input: '-50 + 100 + -50', result: 0},
        {input: '5 * 2 + 10', result: 20},
        {input: '5 + 2 * 10', result: 25},
        {input: '20 + 2 * -10', result: 0},
        {input: '50 / 2 * 2 + 10', result: 60},
        {input: '2 * (5 + 10)', result: 30},
        {input: '3 * 3 * 3 + 10', result: 37},
        {input: '3 * (3 * 3) + 10', result: 37},
        {input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', result: 50},
    ])('number operator: evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })

    test.each([
        {input: '"hello" + " world"', result: 'hello world'},
        {input: '"a" + "b" + "c"', result: 'abc'},
    ])('string operator: evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_String)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate IndexExpression', () => {
    test.each([
        {input: '[1, 2 + 2, 3 * 3][0]', result: 1},
        {input: '[1, 2 + 2, 3 * 3][1 * 1]', result: 4},
        {input: '[1, 2 + 2, 3 * 3][1 + 1]', result: 9},
        {input: 'let i = 0; [1][i];', result: 1},
        {input: 'let myArray = [1, 2, 3]; myArray[2];', result: 3},
        {input: 'let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];', result: 6},
        {input: 'let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]', result: 2,},
        {input: 'let myMap = {"a": 1, "b"+"c": 2}; myMap["a"]', result: 1,},
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate DotExpression', () => {
    test.each([
        {input: 'let myMap = {"a": 1, "b"+"c": 2}; myMap.a', result: 1,},
        {input: 'let myMap = {"a": 1, "b"+"c": 2}; myMap.bc', result: 2,},
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

describe('evaluate IfExpression', () => {
    test.each([
        {input: 'if (true) { 10 }', result: 10},
        {input: 'if (false) { 10 }', result: null},
        {input: 'if (1) { 10 }', result: 10},
        {input: 'if (1 < 2) { 10 }', result: 10},
        {input: 'if (1 > 2) { 10 }', result: null},
        {input: 'if (1 > 2) { 10 } else { 20 }', result: 20},
        {input: 'if (1 < 2) { 10 } else { 20 }', result: 10},
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        if (result) {
            assert(evaluated instanceof F_Integer)
            expect(evaluated.value).toBe(result)
        } else {
            expect(evaluated).toBe(F_Null.Instance)
        }
    })
})

describe('evaluate ReturnStatement', () => {
    test.each([
        {input: 'return 10;', result: 10},
        {input: 'return 10; 9;', result: 10},
        {input: 'return 2 * 5; 9;', result: 10},
        {input: '9; return 2 * 5; 9;', result: 10},
        {
            input: `if (10 > 1) {
                        if (10 > 1) {
                            return 10;
                        }
                        return 1;
                    }
        `, result: 10
        },
        {
            input: `if (10 > 1) {
                        if (10 < 1) {
                            return 10;
                        }
                        return 1;
                    }
        `, result: 1
        },
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

describe('error handling', () => {
    test.each([
        {input: '5 + true;', expectedErrorMessage: 'type mismatch: Integer + Boolean'},
        {input: '5 + true; 5;', expectedErrorMessage: 'type mismatch: Integer + Boolean'},
        {input: '-true', expectedErrorMessage: 'unknown operator: -Boolean'},
        {input: 'true + false;', expectedErrorMessage: 'unknown operator: Boolean + Boolean'},
        {input: '"hello" - " world"', expectedErrorMessage: 'unknown operator: String - String'},
        {input: '5; true + false; 5', expectedErrorMessage: 'unknown operator: Boolean + Boolean',},
        {input: 'if (10 > 1) { true + false; }', expectedErrorMessage: 'unknown operator: Boolean + Boolean'},
        {
            input: `if (10 > 1) {
                        if (10 > 1) {
                            return true + false;
                        }
                        return 1;
                    }`,
            expectedErrorMessage: 'unknown operator: Boolean + Boolean'
        },
        {
            input: 'foo',
            expectedErrorMessage: 'identifier not found: foo'
        },
        {input: 'len(1)', expectedErrorMessage: 'argument to `len` not supported, got Integer'},
        {input: 'len("one", "two")', expectedErrorMessage: 'wrong number of arguments. got=2, want=1'}
    ])('evaluate [$input] should get error: [$expectedErrorMessage]', ({input, expectedErrorMessage}) => {
        let errorMessage
        try {
            evaluate(input)
        } catch (error) {
            assert(error instanceof EvaluatingError)
            assert(error.innerError)

            errorMessage = error.innerError.message
        }

        expect(errorMessage).toBe(expectedErrorMessage)
    })
})

describe('variable binding', () => {
    test.each([
        {input: 'let a = 5; a;', result: 5},
        {input: 'let a = 5 * 5; a;', result: 25},
        {input: 'let a = 5; let b = a; b;', result: 5},
        {input: 'let a = 5; let b = a; let c = a + b + 5; c;', result: 15},
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })

    test('function definition', () => {
        const input = 'fn(x) {x + 2};'

        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Function)
        expect(evaluated.parameters.map(x => x.value)).toEqual(['x'])
        expect(evaluated.body.toString()).toBe('(x + 2);')
        expect(evaluated.environment).not.toBeNull()
    })
})

describe('evaluate Function call', () => {
    test.each([
        {input: 'let identity = fn(x) { x; }; identity(5);', result: 5},
        {input: 'let identity = fn(x) { return x; }; identity(5);', result: 5},
        {input: 'let double = fn(x) { x * 2; }; double(5);', result: 10},
        {input: 'let add = fn(x, y) { x + y; }; add(5, 5);', result: 10},
        {input: 'let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));', result: 20},
        {input: 'fn(x) { x; }(5)', result: 5},
        {input: 'let i = 5; fn(a) { let i = a; }(10); i;', result: 5},
        {
            input: `
        let newAdder = fn(x) {
            fn(y) { x + y };
        };
        let addTwo = newAdder(2);
        addTwo(2);
        `, result: 4
        },
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })

    test.each([
        {input: 'len("")', result: 0},
        {input: '"".length', result: 0},
        {input: 'len("four")', result: 4},
        {input: '"four".length', result: 4},
        {input: 'len("hello world")', result: 11},
        {input: '"hello world".length', result: 11},
    ])('evaluate [$input] should get [$result]', ({input, result}) => {
        const evaluated = evaluate(input)

        assert(evaluated instanceof F_Integer)
        expect(evaluated.value).toBe(result)
    })
})

function evaluate(input: string): F_Object {
    const lexer = new Lexer(input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    return evalCore(program)
}