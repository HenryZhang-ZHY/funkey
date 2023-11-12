import {Lexer} from '../lexer/lexer'
import {Parser} from '../parser/parser'
import {Environment, evaluate} from '../evaluator/evaluator'
import {F_BuiltinFunction, F_Null, F_Object} from '../object/f_Object'

export function run(input: string, environment: Environment | undefined = undefined): void {
    const lexer = new Lexer(input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    evaluate(program, environment)
}


export function runWithPrint(input: string, print: (...args: F_Object[]) => void): void {
    const environment = new Environment()
    const builtInPrint = new F_BuiltinFunction(
        'print',
        (...args: F_Object[]) => {
            print(...args)
            return F_Null.Instance
        })
    environment.declareAndSetVariable('print', builtInPrint)

    run(input, environment)
}