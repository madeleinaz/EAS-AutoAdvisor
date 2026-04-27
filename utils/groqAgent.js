import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { GROQ_API_KEY } from '@env';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// vision model — handles images and pdfs
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// text model — used for first year students with no file
const TEXT_MODEL = 'llama-3.3-70b-versatile';

// sends messages to groq and returns raw text response
const callGroq = async (messages, model) => {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, max_tokens: 4000, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

// compresses and converts image to base64 — large images fail the groq vision api
const convertImageToBase64 = async (uri) => {
  const compressed = await manipulateAsync(
    uri,
    [{ resize: { width: 1500 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: 'base64',
  });

  return base64;
};

// reads any file as base64 — used for pdfs since groq does not support file uploads
const readFileAsBase64 = async (uri) => {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
};

const buildMessages = async (fileUri, fileType, catalogData) => {

  if ((fileType === 'pdf' || fileType === 'image') && !fileUri) {
    throw new Error('No file was received. Please try uploading again.');
  }

  const systemPrompt = `You are an academic advisor for the University of North Georgia Computer Science program.
You will be given a student transcript and course data scraped live from the UNG catalog website.
Return ONLY a valid JSON object  no extra text, no markdown, no backticks.

THE UNG CS DEGREE STRUCTURE (120 total credit hours):

AREA A — Communication and Quantitative Skills (9 hrs):
- ENGL 1101 English Composition I (3 hrs)
- ENGL 1102 English Composition II (3 hrs)
- MATH 1450 Calculus I (3 hrs counted here, 1 hr carries to Area F)

AREA B — Institutional Options (7 hrs):
- Modern Language: any non-English course numbered 1001 or 1002 e.g. SPAN 1001 (3-4 hrs)
- Global Course: ANTH 1102, PHIL 2200, GEOG 1101, HIST 1111, POLS 2301 etc. (3-4 hrs)

AREA C — Humanities, Fine Arts, Ethics (6 hrs):
- Literature (3 hrs): any ENGL 2xxx literature course
- Fine Arts or Philosophy (3 hrs): COMM 1110, PHIL 2010, MUSC 1100, ARTS 1100, THEA 1100 etc.

AREA D — Math, Science and Technology (11 hrs):
- Lab Science Sequence (8 hrs): two paired lab science courses e.g. BIOL 1107K + BIOL 1108K
- Math component (3 hrs): satisfied by MATH 1450 — do not double count with Area A

AREA E — Social Sciences (6 hrs):
- Behavioral Science (3 hrs): PSYC 1101, SOCI 1101, ANTH 1102, or ECON 2105
- Social Science (3 hrs): GEOG 1101, HIST 1111, HIST 1112, POLS 2301, or HIST 2111/2112 if not used for Citizenship

CITIZENSHIP (3 hrs):
- One of: HIST 2111, HIST 2112, or POLS 1101
- Cannot be double counted in Area E

AREA F — Field of Study (18 hrs):
- CSCI 1301 Computer Science I (4 hrs)
- CSCI 1302 Computer Science II (4 hrs)
- CSCI 2150 Computer Ethics and Social Issues (3 hrs)
- MATH 2510 Introduction to Discrete Mathematics (3 hrs)
- Select ONE of: CSCI 2220, CSCI 2520, or MATH 2460 (3-4 hrs)
- 1 hr carryover from MATH 1450

MAJOR REQUIREMENTS (39 hrs):
Required courses — must complete ALL 8:
- CSCI 3100 Computer Organization/Architecture (3 hrs)
- CSCI 3200 Data Structures and Analysis of Algorithms (3 hrs)
- CSCI 3300 Software Engineering (3 hrs)
- CSCI 3410 Databases (3 hrs)
- CSCI 3510 Networking and Communications (3 hrs)
- CSCI 4100 Operating Systems and File Organization (3 hrs)
- CSCI 4200 Programming Languages (3 hrs)
- CSCI 4950 Senior Project (3 hrs)
Plus 15 hrs of CSCI 3xxx/4xxx electives (at least 5 upper level CSCI courses of the student's choice)

FREE ELECTIVES (21 hrs):
- Any courses the student chooses — typically 5 to 7 courses
- Often used for a minor, concentration, or personal interests
- Common CSCI elective choices: CSCI 4800 Artificial Intelligence, CSCI 4840 Machine Learning,
  CSCI 3050 Information Security, CSCI 3660 Mobile Application Development,
  CSCI 4350 Design/Analysis of Algorithms, CSCI 3000 Web Programming,
  CSCI 3450 Intelligent Systems, CSCI 4300 Theory of Computation,
  CSCI 4700 Human-Computer Interaction, CSCI 4750 Data Modeling

VALID CSCI ELECTIVE COURSES (3xxx/4xxx level) — only suggest courses from this list:
CSCI 3000 Web Programming
CSCI 3050 Information Security
CSCI 3250 Computer Security
CSCI 3350 Computer Forensics
CSCI 3450 Intelligent Systems
CSCI 3550 Management of Information Security
CSCI 3600 Computer Graphics
CSCI 3660 Mobile Application Development
CSCI 3710 Advanced Programming
CSCI 3800 Introduction to UNIX
CSCI 4250 Reverse Engineering
CSCI 4300 Theory of Computation
CSCI 4350 Design/Analysis of Algorithms
CSCI 4400 Advanced Software Engineering
CSCI 4450 Secure Software Development
CSCI 4500 Data Communications
CSCI 4600 Parallel Processing
CSCI 4650 Network Security
CSCI 4700 Human-Computer Interaction
CSCI 4750 Data Modeling
CSCI 4800 Artificial Intelligence
CSCI 4810 Digital Information Processing
CSCI 4830 Cloud Computing Security
CSCI 4840 Machine Learning
CSCI 4860 Bioinformatics
CSCI 4870 Blockchain Application Development

ACADEMIC RULES:
- A course counts toward credit hours ONCE regardless of how many times taken
- Grade of W = withdrawn, does not count
- Grade of D in any CSCI course does not count toward CS requirements
- Never recommend retaking a passed course
- One course cannot satisfy two different areas

REMAINING ARRAY RULES:
- List each missing required CS course (CSCI 3100 through CSCI 4950) as its own entry
- List each missing IMPACTS area as its own SEPARATE entry — never group multiple areas together
- For CSCI 3xxx/4xxx electives add ONE entry: { "code": "CSCI-ELEC", "name": "15 credit hours of upper-level CSCI electives needed (approximately 5 courses) — e.g. CSCI 4800 Artificial Intelligence, CSCI 4840 Machine Learning, CSCI 3660 Mobile Application Development" }
- For free electives add ONE entry: { "code": "ELECTIVE", "name": "X credit hours of free electives (approximately Y courses) — use these for a minor, concentration, or personal interests" }
- Free elective hours = 21 minus any free elective hours already completed — NEVER more than 21
- Do NOT list an area as remaining if the student has clearly completed it

ELECTIVE CALCULATION:
- CSCI 3xxx/4xxx electives (15 hrs) are part of MAJOR REQUIREMENTS — not free electives
- Free electives are a separate bucket capped at exactly 21 hrs
- Do NOT subtract completed hours from 120 to calculate electives — that is always wrong
- Free electives already completed are any courses that do not fall into Areas A-F, Major Requirements, or Citizenship

NOTES FORMAT — return a string with four sections separated by ||SECTION||:
CREDIT HOURS: [X of 120 hours completed, Y hours remaining]
||SECTION||
NEXT STEPS:
Complete:
- CSCI 3200 Data Structures and Analysis of Algorithms
- CSCI 3300 Software Engineering
(list all remaining required CS courses)
IMPACTS Still Needed:
- 3 hrs Area C Literature (e.g. ENGL 2131 American Literature I)
- 3 hrs Area B Modern Language (e.g. SPAN 1001 Elementary Spanish I)
(list only the missing IMPACTS areas — skip completed ones)
||SECTION||
COURSE SEQUENCING: [give specific CS-focused sequencing advice — explain WHY courses should be taken in a certain order in terms of how they build on each other for a CS student. For example: "CSCI 3200 Data Structures should be taken before CSCI 4100 Operating Systems because OS concepts rely heavily on understanding data structures." For non-CS requirements like lab sciences and languages, frame them practically: "Complete your lab science sequence early to free up later semesters for upper-level CS courses which require more focus" or "Take your language requirement in your first or second year when your CS course load is lighter." Never say a general education course builds foundational knowledge for CS — instead explain the scheduling benefit of completing it early. Keep advice specific and practical for a CS student.]
||SECTION||
FEEDBACK: [2-3 sentences of honest practical feedback on the student's progress, GPA trend if visible, whether on track or behind, and one specific actionable suggestion]

GRADUATION CHECK — set readyToGraduate to true ONLY IF:
- All 8 required CS courses completed with passing grades
- At least 5 CSCI 3xxx/4xxx elective courses completed (15 hrs)
- All Areas A through F completed
- Citizenship requirement completed
- Total credit hours are 120 or more

CRITICAL — RECOMMENDED ARRAY MUST HAVE 4 TO 5 COURSES:
- Always return exactly 4 to 5 courses in the recommended array — never fewer
- Include a mix: 1-2 required CS courses + 1 IMPACTS course still needed + 1-2 CSCI elective suggestions
- Only suggest electives from the VALID CSCI ELECTIVE COURSES list above
- Example of a good recommended array for a sophomore:
  CSCI 3200 Data Structures, BIOL 1108K Principles of Biology II, ENGL 2131 American Literature I, CSCI 4800 Artificial Intelligence, SPAN 1001 Elementary Spanish I
- Never return just 1 course in the recommended array — that is always wrong
- If the student has very few courses remaining still return 4-5 by filling with elective suggestions

Return ONLY this JSON structure:
{
  "completed": [{ "code": "CSCI 1301", "name": "Computer Science I" }],
  "remaining": [
    { "code": "CSCI 3200", "name": "Data Structures and Analysis of Algorithms" },
    { "code": "IMPACTS", "name": "3 hrs — Area C Literature (e.g. ENGL 2131 American Literature I)" },
    { "code": "CSCI-ELEC", "name": "15 credit hours of upper-level CSCI electives needed (approximately 5 courses) — e.g. CSCI 4800 Artificial Intelligence, CSCI 4840 Machine Learning" },
    { "code": "ELECTIVE", "name": "21 credit hours of free electives (approximately 7 courses) — use for a minor, concentration, or personal interests" }
  ],
  "recommended": [{ "code": "CSCI 3200", "name": "Data Structures and Analysis of Algorithms" }],
  "readyToGraduate": false,
  "notes": "CREDIT HOURS: ... ||SECTION|| NEXT STEPS: Complete:\n- ...\nIMPACTS Still Needed:\n- ... ||SECTION|| COURSE SEQUENCING: ... ||SECTION|| FEEDBACK: ...",
  "fullText": "Plain text version of full report."
}

Course data scraped live from UNG catalog — use ONLY these exact codes and names:
Required CS courses: ${JSON.stringify(catalogData.csCourses)}
Full catalog: ${JSON.stringify(catalogData.verifiedCourseList)}`;

  // first year — no file needed
  if (fileType === 'firstyear') {
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `This is a first year CS student at UNG with no completed courses yet.
Return ONLY a valid JSON object with no extra text, no markdown, no backticks.
Set completed to an empty array.
Set remaining to all required CS courses, all IMPACTS areas as separate entries, CSCI electives entry, and free electives entry.
Set recommended to a realistic first semester: ENGL 1101, MATH 1450, CSCI 1301, POLS 1101, and BIOL 1107K.
Set readyToGraduate to false.
Set notes using CREDIT HOURS, NEXT STEPS, COURSE SEQUENCING, FEEDBACK format separated by ||SECTION||.
Set fullText to a plain text version of the report.`,
      },
    ];
  }

  // image transcript — compress then send via vision api
  if (fileType === 'image') {
    const base64Data = await convertImageToBase64(fileUri);
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'This is a student transcript image. Read every single course listed including all general education courses — course code, name, credit hours, and grade. Include ALL courses in the completed array not just CS courses. Return the advisement JSON.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Data}` },
          },
        ],
      },
    ];
  }

  // pdf — groq does not support file uploads like openai
  // read the pdf as base64 and send as a data uri to the vision model
  if (fileType === 'pdf') {
    const base64Data = await readFileAsBase64(fileUri);
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'This is a student transcript PDF. Read every single course on all pages including all general education courses — course code, name, credit hours, and grade. Include ALL courses in the completed array not just CS courses. Return the advisement JSON.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:application/pdf;base64,${base64Data}` },
          },
        ],
      },
    ];
  }
};

export const analyzeTranscript = async (fileUri, fileType, catalogData, studentName) => {
  try {
    const messages = await buildMessages(fileUri, fileType, catalogData);

    // use text model for first year, vision model for image and pdf
    const model = fileType === 'firstyear' ? TEXT_MODEL : VISION_MODEL;

    const rawText = await callGroq(messages, model);
    console.log('raw groq response:', rawText?.substring(0, 200));

    const cleanText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const report = JSON.parse(cleanText);

    // attach student name to report
    report.studentName = studentName ?? 'Student';
    return report;

  } catch (error) {
    console.log('full error:', error);
    throw new Error('Groq analysis failed: ' + error.message);
  }
};