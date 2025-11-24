import random
import json

data = []
N = 30
SIZE = 5
PICK = 8

for i in range(N):
    data.append(random.sample(range(SIZE ** 2), PICK))
    arr = [['.' for _ in range(SIZE)] for _ in range(SIZE)]
    for idx in data[-1]:
        r, c = divmod(idx, SIZE)
        arr[r][c] = '#'
    print(f"Problem {i + 1}:")
    for row in arr:
        print(' '.join(row))
    print()

with open('grid_problems.json', 'w') as f:
    json.dump(data, f, indent=2)