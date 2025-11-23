import random
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict, Iterable

@dataclass(frozen=True)
class AdditionProblem:
    a: int
    b: int
    carry_count: int

    def __str__(self) -> str:
        return f"{self.a} + {self.b}"

def digits3(n: int) -> Tuple[int, int, int]:
    """3자리 수를 (백, 십, 일)로 분해."""
    if not (100 <= n <= 999):
        raise ValueError("n must be a 3-digit number")
    h = n // 100
    t = (n // 10) % 10
    o = n % 10
    return h, t, o

def count_carries(a: int, b: int) -> int:
    """a + b를 오른쪽에서 왼쪽으로 더할 때 발생하는 캐리(받아올림) 횟수."""
    if not (100 <= a <= 999 and 100 <= b <= 999):
        raise ValueError("a, b must be 3-digit numbers")

    carry = 0
    carry_count = 0
    for _ in range(3):  # 일, 십, 백 자리
        da = a % 10
        db = b % 10
        s = da + db + carry
        if s >= 10:
            carry = 1
            carry_count += 1
        else:
            carry = 0
        a //= 10
        b //= 10
    return carry_count

def generate_three_digit_numbers(
    allowed_digits: Iterable[int] = range(1, 9)
) -> List[int]:
    """각 자리가 allowed_digits 안에 있는 3자리 수 전체 생성."""
    allowed_digits = list(allowed_digits)
    nums = []
    for h in allowed_digits:
        for t in allowed_digits:
            for o in allowed_digits:
                n = 100 * h + 10 * t + o
                nums.append(n)
    return nums

def build_problem_pool(
    numbers: List[int],
    max_carry: int = 2
) -> Dict[int, List[AdditionProblem]]:
    """
    캐리 개수별(0..max_carry)로 문제 풀을 만든다.
    캐리 개수가 max_carry보다 크면 버린다.
    """
    buckets: Dict[int, List[AdditionProblem]] = {k: [] for k in range(max_carry + 1)}
    for i, a in enumerate(numbers):
        # a + b와 b + a를 중복으로 만들지 않기 위해 b는 numbers[i:]만 사용
        for b in numbers[i:]:
            c = count_carries(a, b)
            if c <= max_carry:
                buckets[c].append(AdditionProblem(a, b, c))
    return buckets

def make_one_set(
    buckets: Dict[int, List[AdditionProblem]],
    target_per_carry: Dict[int, int],
    rng: random.Random
) -> List[AdditionProblem]:
    """
    캐리 개수별 목표 개수에 맞춰 한 세트를 샘플링한다.
    (세트들 사이에서는 같은 문제가 다시 나올 수 있음)
    """
    problems: List[AdditionProblem] = []
    for carry_val, target in target_per_carry.items():
        pool = buckets.get(carry_val, [])
        if len(pool) < target:
            raise ValueError(
                f"Not enough problems for carry={carry_val}: "
                f"need {target}, have {len(pool)}"
            )
        problems.extend(rng.sample(pool, target))
    # 최종 문제 순서 섞기
    rng.shuffle(problems)
    return problems

def generate_sets(
    n_sets: int = 3,
    allowed_digits: Iterable[int] = range(1, 9),
    target_per_carry: Dict[int, int] = None,
    seed: int = 42
) -> List[List[AdditionProblem]]:
    """
    3자리 + 3자리 덧셈 세트를 여러 개 생성.
    - n_sets: 생성할 세트 개수
    - allowed_digits: 각 자리에 허용할 숫자 (기본 1~8)
    - target_per_carry: 캐리 개수별 목표 문제 수
      예: {0: 5, 1: 10, 2: 5}  -> 한 세트당 20문항
    """
    if target_per_carry is None:
        # 기본값: 0캐리 5개, 1캐리 10개, 2캐리 5개
        target_per_carry = {0: 5, 1: 10, 2: 5}

    rng = random.Random(seed)

    numbers = generate_three_digit_numbers(allowed_digits)
    max_carry = max(target_per_carry.keys())
    buckets = build_problem_pool(numbers, max_carry=max_carry)

    sets: List[List[AdditionProblem]] = []
    for _ in range(n_sets):
        s = make_one_set(buckets, target_per_carry, rng)
        sets.append(s)
    return sets

if __name__ == "__main__":
    # 세트 3개 생성 예시
    sets = generate_sets(
        n_sets=3,
        allowed_digits=range(1, 10),             # 각 자리 1~8
        target_per_carry={0: 5, 1: 5, 2: 5, 3: 5},  # 한 세트 20문항
        seed=42
    )

    # 세트별로 묶어서 JSON 데이터 만들기
    json_data = []
    for set_idx, problems in enumerate(sets, start=1):
        problems_list = [
            {
                "a": p.a,              # 왼쪽 수
                "b": p.b,              # 오른쪽 수
                "diff": p.carry_count  # 난이도 = 캐리 개수
            }
            for p in problems
        ]
        json_data.append({
            "set": set_idx,
            "problems": problems_list
        })

    # 파일로 저장
    output_path = "addition_sets.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"저장 완료: {output_path}")
