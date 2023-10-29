import {Lexer} from '../lexer/lexer'
import {Parser} from '../parser/parser'
import {evaluate} from '../evaluator/evaluator'

export function run(input: string): string{
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  return evaluate(program).inspect
}
