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
    MOD = '%',

    LT = '<',
    LTE = '<=',
    GT = '>',
    GTE = '>=',
    EQ = '==',
    NOT_EQ = '!=',

    DOT = '.',

    COMMA = ',',
    COLON = ':',
    SEMICOLON = ';',

    LPAREN = '(',
    RPAREN = ')',
    LBRACKET = '[',
    RBRACKET = ']',
    LBRACE = '{',
    RBRACE = '}',

    FUNCTION = 'FUNCTION',
    LET = 'LET',
    IF = 'IF',
    ELSE = 'ELSE',
    RETURN = 'RETURN',
    FOR = 'FOR',
}
