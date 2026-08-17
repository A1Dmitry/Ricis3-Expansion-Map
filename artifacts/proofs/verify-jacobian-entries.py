import sympy as sp
x, y, z = sp.symbols('x y z')
P = (1+x*y)**3*z + y**2*(1+x*y)*(4+3*x*y)
Q = y + 3*x*(1+x*y)**2*z + 3*x*y**2*(4+3*x*y)
R = 2*x - 3*x**2*y - x**3*z
entries = [
    3*y*(1+x*y)**2*z + y**3*(7+6*x*y),
    3*x*(1+x*y)**2*z + 2*y*(1+x*y)*(4+3*x*y) + x*y**2*(7+6*x*y),
    (1+x*y)**3,
    3*(1+x*y)**2*z + 6*x*y*(1+x*y)*z + 12*y**2 + 18*x*y**3,
    1 + 6*x**2*(1+x*y)*z + 24*x*y + 27*x**2*y**2,
    3*x*(1+x*y)**2,
    2 - 6*x*y - 3*x**2*z,
    -3*x**2,
    -x**3,
]
expected = [sp.diff(P,x),sp.diff(P,y),sp.diff(P,z),sp.diff(Q,x),sp.diff(Q,y),sp.diff(Q,z),sp.diff(R,x),sp.diff(R,y),sp.diff(R,z)]
for i,(got,want) in enumerate(zip(entries,expected),1):
    assert sp.expand(got-want) == 0, (i, sp.expand(got-want))
J=sp.Matrix(3,3,entries)
assert sp.expand(J.det()+2) == 0
print('all_entries_match_derivatives=True')
print('determinant=-2')
