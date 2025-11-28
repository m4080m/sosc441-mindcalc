import random
import json

def get_neighbors(idx, size):
    """Get valid neighbors (up, down, left, right) for a given cell index."""
    r, c = divmod(idx, size)
    neighbors = []
    
    # Up
    if r > 0:
        neighbors.append((r - 1) * size + c)
    # Down
    if r < size - 1:
        neighbors.append((r + 1) * size + c)
    # Left
    if c > 0:
        neighbors.append(r * size + (c - 1))
    # Right
    if c < size - 1:
        neighbors.append(r * size + (c + 1))
    
    return neighbors

def count_chunks(selected_cells, size):
    """Count the number of connected components (chunks) in the selected cells."""
    if not selected_cells:
        return 0
    
    cell_set = set(selected_cells)
    visited = set()
    chunks = 0
    
    for cell in selected_cells:
        if cell not in visited:
            # BFS to find all connected cells
            chunks += 1
            queue = [cell]
            visited.add(cell)
            
            while queue:
                current = queue.pop(0)
                for neighbor in get_neighbors(current, size):
                    if neighbor in cell_set and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
    
    return chunks

def generate_grid_problem(size, pick, target_chunks, max_attempts=1000):
    """Generate a grid problem with exactly target_chunks chunks."""
    for attempt in range(max_attempts):
        selected = []
        remaining = list(range(size ** 2))
        random.shuffle(remaining)
        
        # Start with a random cell
        selected.append(remaining.pop(0))
        
        # Add cells to form chunks
        while len(selected) < pick:
            current_chunks = count_chunks(selected, size)
            
            if current_chunks < target_chunks:
                # Need more chunks - add a cell not adjacent to any selected cell
                non_adjacent = []
                for cell in remaining:
                    neighbors = get_neighbors(cell, size)
                    if not any(n in selected for n in neighbors):
                        non_adjacent.append(cell)
                
                if non_adjacent:
                    new_cell = random.choice(non_adjacent)
                    selected.append(new_cell)
                    remaining.remove(new_cell)
                else:
                    # No non-adjacent cells available, add any cell
                    new_cell = remaining.pop(0)
                    selected.append(new_cell)
            else:
                # Have enough or too many chunks - add adjacent cell to merge chunks
                adjacent = []
                for cell in remaining:
                    neighbors = get_neighbors(cell, size)
                    if any(n in selected for n in neighbors):
                        adjacent.append(cell)
                
                if adjacent:
                    new_cell = random.choice(adjacent)
                    selected.append(new_cell)
                    remaining.remove(new_cell)
                else:
                    # No adjacent cells available
                    new_cell = remaining.pop(0)
                    selected.append(new_cell)
        
        # Check if we have exactly the target number of chunks
        final_chunks = count_chunks(selected, size)
        if final_chunks == target_chunks:
            return selected
    
    # If we couldn't generate with exact chunks, return the closest attempt
    print(f"Warning: Could not generate exactly {target_chunks} chunks after {max_attempts} attempts")
    return selected

data = []
N = 30
SIZE = 4
PICK = 6
CHUNK = (4, 6)  # Single value or use (min, max) for range

for i in range(N):
    # If CHUNK is a tuple/list, pick a random value in that range
    if isinstance(CHUNK, (tuple, list)):
        target_chunks = random.randint(CHUNK[0], CHUNK[1])
    else:
        target_chunks = CHUNK
    
    problem = generate_grid_problem(SIZE, PICK, target_chunks)
    data.append(problem)
    
    # Visualize
    arr = [['.' for _ in range(SIZE)] for _ in range(SIZE)]
    for idx in problem:
        r, c = divmod(idx, SIZE)
        arr[r][c] = '#'
    
    chunks = count_chunks(problem, SIZE)
    print(f"Problem {i + 1} (Chunks: {chunks}):")
    for row in arr:
        print(' '.join(row))
    print()

with open('grid_problems.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)