# SQL Query Validation Report

This report documents all SQL queries extracted from `stories/sql_select.json` and validates them against their expected outputs.

## Database Schema

```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  major TEXT,
  gpa REAL
)
```

## Test Data

| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 2  | Bob   | 22  | Mathematics        | 3.5 |
| 3  | Carol | 19  | Computer Science   | 3.9 |
| 4  | David | 21  | Physics            | 3.2 |
| 5  | Eve   | 20  | Mathematics        | 3.7 |
| 6  | Frank | 23  | Computer Science   | 3.4 |

---

## Validated Queries

### ✅ Query 1: SELECT * (All Columns)

```sql
SELECT * FROM students;
```

**Expected Result:** All 6 rows, all 5 columns  
**Status:** ✅ PASSED  
**Validates Scene:** "SELECT * - The Complete View"

---

### ✅ Query 2: SELECT Specific Columns

```sql
SELECT name, gpa FROM students;
```

**Expected Result:** All 6 rows, but only name and gpa columns  
**Status:** ✅ PASSED  
**Validates Scene:** "Choosing Your Columns"

**Result:**
| name  | gpa |
|-------|-----|
| Alice | 3.8 |
| Bob   | 3.5 |
| Carol | 3.9 |
| David | 3.2 |
| Eve   | 3.7 |
| Frank | 3.4 |

---

### ✅ Query 3: WHERE with Equality

```sql
SELECT * FROM students WHERE age = 20;
```

**Expected Result:** 2 rows (Alice and Eve)  
**Status:** ✅ PASSED  
**Validates Scene:** "WHERE Clause - Simple Filter"

**Result:**
| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 5  | Eve   | 20  | Mathematics        | 3.7 |

---

### ✅ Query 4: WHERE with Comparison Operator

```sql
SELECT * FROM students WHERE gpa > 3.5;
```

**Expected Result:** 3 rows (Alice, Carol, Eve)  
**Status:** ✅ PASSED  
**Validates Scene:** "Comparison Operators"

**Result:**
| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 3  | Carol | 19  | Computer Science   | 3.9 |
| 5  | Eve   | 20  | Mathematics        | 3.7 |

---

### ✅ Query 5: WHERE with AND

```sql
SELECT * FROM students 
WHERE major = 'Computer Science' AND gpa > 3.5;
```

**Expected Result:** 2 rows (Alice and Carol)  
**Status:** ✅ PASSED  
**Validates Scene:** "AND, OR, NOT - Combining Conditions"

**Result:**
| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 3  | Carol | 19  | Computer Science   | 3.9 |

**Note:** Frank (CS, gpa=3.4) and Eve (Math, gpa=3.7) are correctly excluded.

---

### ✅ Query 6: ORDER BY Descending

```sql
SELECT * FROM students ORDER BY gpa DESC;
```

**Expected Result:** All 6 rows sorted by gpa (highest to lowest)  
**Status:** ✅ PASSED  
**Validates Scene:** "ORDER BY - Sorting Your Results"

**Result:**
| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 3  | Carol | 19  | Computer Science   | 3.9 |
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 5  | Eve   | 20  | Mathematics        | 3.7 |
| 2  | Bob   | 22  | Mathematics        | 3.5 |
| 6  | Frank | 23  | Computer Science   | 3.4 |
| 4  | David | 21  | Physics            | 3.2 |

---

### ✅ Query 7: ORDER BY with LIMIT

```sql
SELECT * FROM students 
ORDER BY gpa DESC 
LIMIT 3;
```

**Expected Result:** Top 3 students by gpa  
**Status:** ✅ PASSED  
**Validates Scene:** "LIMIT - Controlling the Flow"

**Result:**
| id | name  | age | major              | gpa |
|----|-------|-----|--------------------|-----|
| 3  | Carol | 19  | Computer Science   | 3.9 |
| 1  | Alice | 20  | Computer Science   | 3.8 |
| 5  | Eve   | 20  | Mathematics        | 3.7 |

---

### ✅ Query 8: DISTINCT

```sql
SELECT DISTINCT major FROM students;
```

**Expected Result:** 3 unique majors  
**Status:** ✅ PASSED  
**Validates Scene:** "DISTINCT - Removing Duplicates"

**Result:**
| major              |
|--------------------|
| Computer Science   |
| Mathematics        |
| Physics            |

**Note:** Out of 6 students, there are 3 CS, 2 Math, and 1 Physics major, but DISTINCT returns only the 3 unique values.

---

### ✅ Query 9: COUNT Aggregate

```sql
SELECT COUNT(*) AS total_students FROM students;
```

**Expected Result:** 6  
**Status:** ✅ PASSED  
**Validates Scene:** "Counting and Summing"

---

### ✅ Query 10: AVG Aggregate

```sql
SELECT AVG(gpa) AS average_gpa FROM students;
```

**Expected Result:** 3.58  
**Status:** ✅ PASSED  
**Validates Scene:** "Counting and Summing"

**Calculation:** (3.8 + 3.5 + 3.9 + 3.2 + 3.7 + 3.4) / 6 = 21.5 / 6 = 3.58

---

### ✅ Query 11: MAX and MIN Aggregates

```sql
SELECT MAX(gpa) AS highest_gpa, MIN(gpa) AS lowest_gpa 
FROM students;
```

**Expected Result:** highest_gpa=3.9, lowest_gpa=3.2  
**Status:** ✅ PASSED  
**Validates Scene:** "Counting and Summing"

---

### ✅ Query 12: GROUP BY with COUNT

```sql
SELECT major, COUNT(*) AS num_students 
FROM students 
GROUP BY major;
```

**Expected Result:** 3 rows showing count per major  
**Status:** ✅ PASSED  
**Validates Scene:** "GROUP BY - Categories Matter"

**Result:**
| major              | num_students |
|--------------------|--------------|
| Computer Science   | 3            |
| Mathematics        | 2            |
| Physics            | 1            |

---

### ✅ Query 13: GROUP BY with HAVING

```sql
SELECT major, COUNT(*) AS num_students 
FROM students 
GROUP BY major
HAVING COUNT(*) > 1;
```

**Expected Result:** 2 rows (CS and Math, excluding Physics)  
**Status:** ✅ PASSED  
**Validates Scene:** "HAVING - Filtering Groups"

**Result:**
| major              | num_students |
|--------------------|--------------|
| Computer Science   | 3            |
| Mathematics        | 2            |

**Note:** Physics is correctly excluded because it only has 1 student.

---

### ⚠️ Query 14: Complex Query (Minor Issue)

```sql
SELECT major, AVG(gpa) AS avg_gpa, COUNT(*) AS num
FROM students
WHERE age >= 20
GROUP BY major
HAVING COUNT(*) > 1
ORDER BY avg_gpa DESC;
```

**Expected Result:** 2 rows (CS and Math, both with avg_gpa=3.60)  
**Status:** ⚠️ MINOR ISSUE - Order is non-deterministic  
**Validates Scene:** "Combining Everything"

**Query Breakdown:**
1. **WHERE age >= 20** filters to: Alice(20), Bob(22), Eve(20), Frank(23) - excludes Carol(19) and David(21)
2. **GROUP BY major** creates groups:
   - Computer Science: Alice(3.8), Frank(3.4) → avg = 3.60
   - Mathematics: Bob(3.5), Eve(3.7) → avg = 3.60
3. **HAVING COUNT(*) > 1** keeps both groups (both have 2 students)
4. **ORDER BY avg_gpa DESC** - both have same avg, so order is non-deterministic

**Issue:** When ORDER BY encounters equal values (both 3.60), the order is undefined. The story shows CS first, then Math, but the database can return them in either order.

**Recommendation:** Add a secondary sort: `ORDER BY avg_gpa DESC, major ASC`

---

## Summary

- **Total Queries Tested:** 14
- **Queries Passed:** 13 ✅
- **Queries with Minor Issues:** 1 ⚠️
- **Queries Failed:** 0 ❌

### Conclusion

All SQL queries in the story produce correct results! The only minor issue is in the complex query where the ORDER BY clause doesn't specify a secondary sort column when values are equal. This is a common oversight in SQL tutorials but doesn't affect the correctness of the query - it just means the order might vary between executions.

### Recommendations

1. For Query 14, consider adding a note in the story that when average GPAs are equal, the order may vary
2. Or update the query to: `ORDER BY avg_gpa DESC, major ASC` for deterministic ordering

---

## Test Script

The validation was performed using SQLite with the test script `validate-sql-queries.cjs`.

To run the validation yourself:

```bash
npm install sqlite3 --save-dev
node validate-sql-queries.cjs
```

