def x():
    0+''

try:
    x()
except:
    import sys
    ei = sys.exc_info()[2].tb_lineno
    print(ei)
    print(ei[2].tb_lineno)