// Semester change detection via response headers
// Intercepts all fetch calls and checks X-Semester-Id header

let semesterChangeCallback: (() => void) | null = null;
let ignoreNextChange = false;

export function initSemesterGuard(onSemesterChange: () => void) {
  semesterChangeCallback = onSemesterChange;

  const originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const response = await originalFetch(...args);
    
    // Only check for authenticated API calls
    const url = args[0]?.toString() || '';
    if (!url.includes('/api/')) {
      return response;
    }

    const semesterId = response.headers.get('X-Semester-Id');
    
    if (semesterId) {
      const storedSemesterId = localStorage.getItem('current_semester_id');
      
      if (storedSemesterId && storedSemesterId !== semesterId) {
        // Semester changed! Notify the app (unless admin just changed it)
        if (semesterChangeCallback && !ignoreNextChange) {
          semesterChangeCallback();
        }
        ignoreNextChange = false; // Reset flag
      }
      
      // Update stored semester ID
      localStorage.setItem('current_semester_id', semesterId);
    }
    
    return response;
  };
}

// Call this when admin changes semester to prevent showing modal to themselves
export function ignoreSemesterChange() {
  ignoreNextChange = true;
}

export function clearSemesterGuard() {
  localStorage.removeItem('current_semester_id');
}
