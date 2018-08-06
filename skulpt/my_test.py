import ast

try:
    ast.parse('1\n1 1 11\n2')
except SyntaxError as e:
    print("LINE:", e.lineno)