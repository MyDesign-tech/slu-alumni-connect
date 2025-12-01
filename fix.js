const fs = require('fs');
const path = 'c:/Users/madhu/Dheeraj/slu-alumni-connect/src/app/mentorship/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the structure - add missing </div> closings and fix the hasActiveFilters closing
// The issue is after the Clear button (line ~1076), we need to close:
// 1. </div> for "flex gap-2"  
// 2. </div> for "flex flex-wrap gap-2"
// Then advanced filters and active filters are siblings in the outer div

const oldCode = \                            )}
                          </div>

                        {/* Advanced Filters Row */}\;

const newCode = \                            )}
                          </div>
                        </div>

                        {/* Advanced Filters Row */}\;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    console.log('Fix 1: Added missing </div> after Clear button');
} else {
    console.log('Pattern 1 not found');
}

// Also fix the hasActiveFilters closing - it should end with )} not </div>
const oldCode2 = \                        </div>
                      </div>
                    )}\;

const newCode2 = \                        </div>
                      )}
                      </div>
                    )}\;

if (content.includes(oldCode2)) {
    content = content.replace(oldCode2, newCode2);
    console.log('Fix 2: Fixed hasActiveFilters closing');
} else {
    console.log('Pattern 2 not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
