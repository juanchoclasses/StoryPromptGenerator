const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Read the JSON file
const storyData = JSON.parse(fs.readFileSync('./stories/sql_select.json', 'utf8'));

// Create an in-memory database
const db = new sqlite3.Database(':memory:');

// Track test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to run a query and return results as array
function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to compare results
function compareResults(actual, expected, testName) {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  const passed = actualStr === expectedStr;
  
  results.tests.push({
    name: testName,
    passed,
    actual: actualStr,
    expected: expectedStr
  });
  
  if (passed) {
    results.passed++;
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Actual:   ${actualStr}`);
  }
}

async function validateQueries() {
  console.log('Setting up database...\n');
  
  // Create table
  await runQuery(`
    CREATE TABLE students (
      id INTEGER PRIMARY KEY,
      name TEXT,
      age INTEGER,
      major TEXT,
      gpa REAL
    )
  `);
  
  // Insert the data from the JSON file (Scene 2)
  await runQuery(`
    INSERT INTO students (id, name, age, major, gpa) VALUES
    (1, 'Alice', 20, 'Computer Science', 3.8),
    (2, 'Bob', 22, 'Mathematics', 3.5),
    (3, 'Carol', 19, 'Computer Science', 3.9),
    (4, 'David', 21, 'Physics', 3.2),
    (5, 'Eve', 20, 'Mathematics', 3.7),
    (6, 'Frank', 23, 'Computer Science', 3.4)
  `);
  
  console.log('Running validation tests...\n');
  
  // Test 1: SELECT * FROM students
  console.log('Test 1: SELECT * FROM students');
  const test1 = await runQuery('SELECT * FROM students');
  const expected1 = [
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 2, name: 'Bob', age: 22, major: 'Mathematics', gpa: 3.5 },
    { id: 3, name: 'Carol', age: 19, major: 'Computer Science', gpa: 3.9 },
    { id: 4, name: 'David', age: 21, major: 'Physics', gpa: 3.2 },
    { id: 5, name: 'Eve', age: 20, major: 'Mathematics', gpa: 3.7 },
    { id: 6, name: 'Frank', age: 23, major: 'Computer Science', gpa: 3.4 }
  ];
  compareResults(test1, expected1, 'SELECT * (all rows, all columns)');
  
  // Test 2: SELECT name, gpa FROM students
  console.log('\nTest 2: SELECT name, gpa FROM students');
  const test2 = await runQuery('SELECT name, gpa FROM students');
  const expected2 = [
    { name: 'Alice', gpa: 3.8 },
    { name: 'Bob', gpa: 3.5 },
    { name: 'Carol', gpa: 3.9 },
    { name: 'David', gpa: 3.2 },
    { name: 'Eve', gpa: 3.7 },
    { name: 'Frank', gpa: 3.4 }
  ];
  compareResults(test2, expected2, 'SELECT specific columns (name, gpa)');
  
  // Test 3: WHERE age = 20
  console.log('\nTest 3: SELECT * FROM students WHERE age = 20');
  const test3 = await runQuery('SELECT * FROM students WHERE age = 20');
  const expected3 = [
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 5, name: 'Eve', age: 20, major: 'Mathematics', gpa: 3.7 }
  ];
  compareResults(test3, expected3, 'WHERE age = 20');
  
  // Test 4: WHERE gpa > 3.5
  console.log('\nTest 4: SELECT * FROM students WHERE gpa > 3.5');
  const test4 = await runQuery('SELECT * FROM students WHERE gpa > 3.5');
  const expected4 = [
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 3, name: 'Carol', age: 19, major: 'Computer Science', gpa: 3.9 },
    { id: 5, name: 'Eve', age: 20, major: 'Mathematics', gpa: 3.7 }
  ];
  compareResults(test4, expected4, 'WHERE gpa > 3.5');
  
  // Test 5: WHERE with AND
  console.log('\nTest 5: SELECT * FROM students WHERE major = \'Computer Science\' AND gpa > 3.5');
  const test5 = await runQuery("SELECT * FROM students WHERE major = 'Computer Science' AND gpa > 3.5");
  const expected5 = [
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 3, name: 'Carol', age: 19, major: 'Computer Science', gpa: 3.9 }
  ];
  compareResults(test5, expected5, 'WHERE with AND (major=CS AND gpa>3.5)');
  
  // Test 6: ORDER BY gpa DESC
  console.log('\nTest 6: SELECT * FROM students ORDER BY gpa DESC');
  const test6 = await runQuery('SELECT * FROM students ORDER BY gpa DESC');
  const expected6 = [
    { id: 3, name: 'Carol', age: 19, major: 'Computer Science', gpa: 3.9 },
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 5, name: 'Eve', age: 20, major: 'Mathematics', gpa: 3.7 },
    { id: 2, name: 'Bob', age: 22, major: 'Mathematics', gpa: 3.5 },
    { id: 6, name: 'Frank', age: 23, major: 'Computer Science', gpa: 3.4 },
    { id: 4, name: 'David', age: 21, major: 'Physics', gpa: 3.2 }
  ];
  compareResults(test6, expected6, 'ORDER BY gpa DESC');
  
  // Test 7: ORDER BY with LIMIT
  console.log('\nTest 7: SELECT * FROM students ORDER BY gpa DESC LIMIT 3');
  const test7 = await runQuery('SELECT * FROM students ORDER BY gpa DESC LIMIT 3');
  const expected7 = [
    { id: 3, name: 'Carol', age: 19, major: 'Computer Science', gpa: 3.9 },
    { id: 1, name: 'Alice', age: 20, major: 'Computer Science', gpa: 3.8 },
    { id: 5, name: 'Eve', age: 20, major: 'Mathematics', gpa: 3.7 }
  ];
  compareResults(test7, expected7, 'ORDER BY gpa DESC LIMIT 3');
  
  // Test 8: DISTINCT major
  console.log('\nTest 8: SELECT DISTINCT major FROM students');
  const test8 = await runQuery('SELECT DISTINCT major FROM students ORDER BY major');
  const expected8 = [
    { major: 'Computer Science' },
    { major: 'Mathematics' },
    { major: 'Physics' }
  ];
  compareResults(test8, expected8, 'DISTINCT major');
  
  // Test 9: COUNT(*)
  console.log('\nTest 9: SELECT COUNT(*) AS total_students FROM students');
  const test9 = await runQuery('SELECT COUNT(*) AS total_students FROM students');
  const expected9 = [{ total_students: 6 }];
  compareResults(test9, expected9, 'COUNT(*)');
  
  // Test 10: AVG(gpa)
  console.log('\nTest 10: SELECT AVG(gpa) AS average_gpa FROM students');
  const test10 = await runQuery('SELECT ROUND(AVG(gpa), 2) AS average_gpa FROM students');
  const expected10 = [{ average_gpa: 3.58 }];
  compareResults(test10, expected10, 'AVG(gpa)');
  
  // Test 11: MAX and MIN
  console.log('\nTest 11: SELECT MAX(gpa) AS highest_gpa, MIN(gpa) AS lowest_gpa FROM students');
  const test11 = await runQuery('SELECT MAX(gpa) AS highest_gpa, MIN(gpa) AS lowest_gpa FROM students');
  const expected11 = [{ highest_gpa: 3.9, lowest_gpa: 3.2 }];
  compareResults(test11, expected11, 'MAX and MIN');
  
  // Test 12: GROUP BY
  console.log('\nTest 12: SELECT major, COUNT(*) AS num_students FROM students GROUP BY major');
  const test12 = await runQuery('SELECT major, COUNT(*) AS num_students FROM students GROUP BY major ORDER BY major');
  const expected12 = [
    { major: 'Computer Science', num_students: 3 },
    { major: 'Mathematics', num_students: 2 },
    { major: 'Physics', num_students: 1 }
  ];
  compareResults(test12, expected12, 'GROUP BY major with COUNT');
  
  // Test 13: GROUP BY with HAVING
  console.log('\nTest 13: SELECT major, COUNT(*) AS num_students FROM students GROUP BY major HAVING COUNT(*) > 1');
  const test13 = await runQuery('SELECT major, COUNT(*) AS num_students FROM students GROUP BY major HAVING COUNT(*) > 1 ORDER BY major');
  const expected13 = [
    { major: 'Computer Science', num_students: 3 },
    { major: 'Mathematics', num_students: 2 }
  ];
  compareResults(test13, expected13, 'GROUP BY with HAVING COUNT(*) > 1');
  
  // Test 14: Complex query
  console.log('\nTest 14: Complex query with WHERE, GROUP BY, HAVING, ORDER BY');
  const test14 = await runQuery(`
    SELECT major, ROUND(AVG(gpa), 2) AS avg_gpa, COUNT(*) AS num
    FROM students
    WHERE age >= 20
    GROUP BY major
    HAVING COUNT(*) > 1
    ORDER BY avg_gpa DESC
  `);
  const expected14 = [
    { major: 'Computer Science', avg_gpa: 3.60, num: 2 },
    { major: 'Mathematics', avg_gpa: 3.60, num: 2 }
  ];
  compareResults(test14, expected14, 'Complex query (WHERE age>=20, GROUP BY, HAVING, ORDER BY)');
  
  // Close database
  db.close();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All SQL queries produce the correct outputs!');
  } else {
    console.log('\n⚠️  Some queries did not produce expected results.');
  }
}

// Run validation
validateQueries().catch(err => {
  console.error('Error during validation:', err);
  process.exit(1);
});

