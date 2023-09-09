export enum TokenType {
    ILLEGAL = 'ILLEGAL',
    EOF = 'EOF',

    IDENT = 'IDENT',
    INT = 'INT',
    TRUE = 'TRUE',
    FALSE = 'FALSE',
    STRING = 'STRING',

    ASSIGN = '=',
    PLUS = '+',
    MINUS = '-',
    BANG = '!',
    ASTERISK = '*',
    SLASH = '/',

    LT = '<',
    GT = '>',
    EQ = '==',
    NOT_EQ = '!=',

    COMMA = ',',
    SEMICOLON = ';',

    LPAREN = '(',
    RPAREN = ')',
    LBRACE = '{',
    RBRACE = '}',

    FUNCTION = 'FUNCTION',
    LET = 'LET',
    IF = 'IF',
    ELSE = 'ELSE',
    RETURN = 'RETURN',
}
