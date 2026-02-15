#!/bin/bash
# Fix all merge conflict markers by taking the master version (after =======)

for file in $(grep -r "<<<<<<< HEAD" src/ 2>/dev/null | cut -d: -f1 | sort -u); do
  echo "Fixing: $file"
  
  # Use sed to remove conflict markers and keep only the master version
  # This removes lines from <<<<<<< HEAD to ======= (inclusive)
  # and removes the >>>>>>> line
  sed -i '' '
    /^<<<<<<< HEAD$/,/^=======$/d
    /^>>>>>>> /d
  ' "$file"
  
  echo "  ✓ Fixed"
done

echo ""
echo "Summary: Fixed all conflict markers"
grep -r "<<<<<<< HEAD" src/ 2>/dev/null | wc -l | xargs echo "Remaining conflicts:"
