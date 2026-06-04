# AutoAdvisor

An AI-powered academic advising mobile app for University of North Georgia Computer Science students. AutoAdvisor live-scrapes the UNG course catalog, accepts an uploaded transcript (image or PDF), and uses a vision-capable LLM to return a personalized advisement report.

## What it does

1. **Live catalog scrape** — fetches the UNG CS program page and IMPACTS core requirements page at runtime, extracting current course codes and names via regex
2. **Transcript upload** — student uploads a transcript as an image or PDF (or selects "First Year" for no transcript)
3. **AI analysis** — sends the transcript + scraped catalog to Groq's API using Llama 4 Scout (vision model for images/PDFs) or Llama 3.3 70B (text model for first-year path)
4. **Structured report** — returns a parsed JSON report with:
   - Completed courses
   - Remaining requirements broken out by degree area (Areas A–F, Citizenship, Major Requirements, CSCI electives, free electives)
   - 4–5 recommended next courses (mix of required CS, IMPACTS gaps, and elective suggestions)
   - Graduation readiness check
   - Course sequencing advice and feedback

## Degree structure covered

Full UNG CS degree (120 credit hours):
- IMPACTS Areas A–F + Citizenship requirement
- 8 required CS core courses (CSCI 3100 through CSCI 4950)
- 15 hours of CSCI 3xxx/4xxx electives
- 21 hours of free electives

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | React Native, Expo |
| Language | JavaScript |
| AI | Groq API — Llama 4 Scout 17B (vision), Llama 3.3 70B (text) |
| Catalog | Live web scrape of UNG catalog (fetch + regex) |
| File handling | expo-file-system, expo-image-manipulator |

## Screens

- **Home** — upload transcript or select first-year mode, enter student name
- **Process** — scrapes catalog + runs AI analysis with loading state
- **Results** — displays completed courses, remaining requirements, recommended courses, graduation status, and full advisement notes

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. Start the app:
   ```bash
   npx expo start
   ```
