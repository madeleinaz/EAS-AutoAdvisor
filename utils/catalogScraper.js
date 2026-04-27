// base urls for the two UNG catalog pages specified in the assignment
const CS_PROGRAM_URL = 'https://catalog.ung.edu/preview_program.php?catoid=39&poid=7413&returnto=1465';
const CORE_IMPACTS_URL = 'https://catalog.ung.edu/preview_program.php?catoid=39&poid=7370';

// fetches raw html from a given url
const fetchPage = async (url) => {
  const response = await fetch(url);
  const html = await response.text();
  return html;
};

// scrapes both course code AND name from raw html
// looks for patterns like "CSCI 3410 - Databases" in the page content
const extractCoursesWithNames = (html) => {
  // this pattern matches "CSCI 3410 - Databases" or "CSCI 3410 - Databases and Information Systems"
  const coursePattern = /([A-Z]{2,4}\s\d{4})\s*[-–]\s*([^\n<(]+)/g;
  const courses = {};
  let match;

  while ((match = coursePattern.exec(html)) !== null) {
    const code = match[1].trim();
    const name = match[2].trim()
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\\"/g, '')
        .replace(/"\s*onClick.*$/g, '')
        .replace(/\\?\s*onClick.*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // only store first occurrence — avoids duplicates from repeated mentions
    if (!courses[code] && name.length > 2 && name.length < 80) {
      courses[code] = name;
    }
  }

  return courses;
};

// main function called by ProcessScreen
export const fetchCatalogRequirements = async () => {
  try {
    // fetch both pages at the same time for speed
    const [csProgramHtml, coreImpactsHtml] = await Promise.all([
      fetchPage(CS_PROGRAM_URL),
      fetchPage(CORE_IMPACTS_URL),
    ]);

    // scrape codes and names from both pages
    const csCoursesMap = extractCoursesWithNames(csProgramHtml);
    const coreCoursesMap = extractCoursesWithNames(coreImpactsHtml);

    // merge both maps — CS program takes priority for any overlapping codes
    const allCoursesMap = { ...coreCoursesMap, ...csCoursesMap };

    // build array of { code, name } objects for OpenAI
    const verifiedCourseList = Object.entries(allCoursesMap).map(([code, name]) => ({
      code,
      name,
    }));

    // keep plain arrays for backward compatibility
    const csCourses = Object.keys(csCoursesMap);
    const coreCourses = Object.keys(coreCoursesMap);
    const allRequired = [...new Set([...csCourses, ...coreCourses])];

    console.log('scraped courses with names:', verifiedCourseList.slice(0, 5));
    console.log('total courses found:', verifiedCourseList.length);
  
    return {
      csCourses,
      coreCourses,
      allRequired,
      verifiedCourseList,
    };

  } catch (error) {
    throw new Error('Failed to fetch UNG catalog: ' + error.message);
  }
};