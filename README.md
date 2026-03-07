# CometPath: UTD AI Degree Planner

## Hackathon: HackAI 2026 (March 7-8, UTD ECSW)
## Tracks: Dallas AI (Sponsor) + Nebula Labs (Sponsor) + Data Science/ML (Mini) + General
## MLH: Best Use of Gemini API + Best Use of MongoDB Atlas

---

## WHAT WE'RE BUILDING

An AI-powered degree planning tool for UTD students, visualized as an interactive tech tree (think Civilization/Age of Empires research tree). Students select their major and mark completed courses. The app pulls real UTD data from the Nebula Labs API and renders their entire degree as a navigable DAG where completed courses are "researched," available courses glow as unlockable, and future courses are grayed out behind prerequisite gates. An AI advisor (Gemini API) analyzes their academic history, recommends optimal next semesters, surfaces professor comparisons using grade distribution data, and powers a "What-If" mode for exploring major switches.

The focus is convenience and clarity. A student should be able to see their entire degree path at a glance, understand exactly what they can take next and why, and get smart recommendations without digging through CourseBook manually.

---

## TRACK ALIGNMENT

**Dallas AI** requires:
- Personalized next-step learning recommendations with reasons -> AI advisor recommends courses based on student profile
- Use learner history and background -> student inputs completed courses, the system infers strengths/gaps
- Generate practice scenarios and data -> stretch: AI generates prep questions for upcoming courses
- Visual map of learning -> the tech tree IS the visual map
- Point to helpful external sources (YouTube snippets, etc.) -> link out to relevant resources per course

**Nebula Labs** requires:
- Use the Nebula API with real campus data -> CourseBook, grades, professors, scheduling
- Build something that helps UTD students -> degree planning is high-utility
- Open source friendly, innovation, real-world impact

**Data Science/ML Mini Track:**
- Recommendation engine on structured data (grade distributions, prereq graph analysis, schedule optimization)

---

## TECH STACK

- Frontend: React (Vite) + React Flow (DAG/tech-tree) + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB Atlas (free tier, user profiles + saved plans)
- AI: Google Gemini API (recommendations, What-If, professor insights)
- Data: Nebula Labs API
- Deploy: Vercel (frontend) + Railway or Render (backend)

---

## NEBULA API QUICK REFERENCE

```
Base: https://api.utdnebula.com
Key: AIzaSyB2zQIwK0gowd-Pkum4SHVzRVK7-PrwlUY
Header: x-api-key: AIzaSyB2zQIwK0gowd-Pkum4SHVzRVK7-PrwlUY
Docs: https://api.utdnebula.com/swagger/index.html
Raw data backup: https://drive.google.com/drive/folders/15JF9qEUZJMOR-OBfeKms1k8lPPze9F5-?usp=sharing
```

Explore the Swagger docs FIRST to understand endpoints and response shapes. The raw Google Drive data is a fallback if API is slow or limited.

---

## MONGODB SCHEMA

```javascript
// Users collection
{
  _id: ObjectId,
  name: String,
  major: String,               // "Computer Science", "Cognitive Science", etc.
  completedCourses: [String],  // ["CS1337", "MATH2414", "CGS2301"]
  plannedSemesters: [{         // saved semester plans
    semester: String,          // "Fall 2026"
    courses: [String]
  }],
  createdAt: Date
}
```

---

## PHASE 1: SKELETON (Hours 0-3)
**Deliverable: App boots, Nebula data flows, user can input their profile**

1. Scaffold project:
   - `npm create vite@latest client -- --template react`
   - Install: `tailwindcss`, `@xyflow/react`, `react-router-dom`, `dagre`
   - `mkdir server && npm init -y`
   - Install: `express`, `cors`, `dotenv`, `mongodb`

2. Server endpoints (proxy Nebula API, keeps key server-side):
   - `GET /api/courses?prefix=CS` -> courses by department
   - `GET /api/course/:id` -> single course with prereqs
   - `GET /api/grades/:courseId` -> grade distribution data
   - `GET /api/professors/:courseId` -> professor info + per-professor grades

3. MongoDB connection in server, basic user routes:
   - `POST /api/users` -> create/update user profile
   - `GET /api/users/:id` -> retrieve saved profile

4. Client onboarding page:
   - Form: name, major (dropdown of UTD majors)
   - Course checklist: fetch all courses for selected major, user checks off completed ones
   - Save to MongoDB, redirect to planner view

5. Verify end-to-end: user submits profile -> data saves -> planner page loads with course list

**File structure:**
```
comet-path/
  client/
    src/
      App.jsx
      pages/
        Onboarding.jsx         # profile setup
        Planner.jsx            # main tech tree view
      components/
        TechTree.jsx           # React Flow DAG wrapper
        CourseNode.jsx         # custom node component
        CoursePanel.jsx        # slide-out detail panel on click
        AdvisorPanel.jsx       # AI recommendations sidebar
        WhatIfModal.jsx        # major switch analysis
        SemesterPlan.jsx       # draggable semester builder
      utils/
        api.js                 # fetch helpers
        graphBuilder.js        # converts Nebula data -> nodes + edges
        layoutEngine.js        # dagre auto-layout
  server/
    index.js
    routes/
      courses.js               # Nebula proxy
      users.js                 # user CRUD
      ai.js                    # Gemini API
    .env                       # NEBULA_API_KEY, MONGODB_URI, GEMINI_API_KEY
```

---

## PHASE 2: THE TECH TREE (Hours 3-9)
**Deliverable: Interactive prerequisite DAG renders with real Nebula data, styled like a tech tree**

This is the centerpiece. The entire project lives or dies on this visualization.

### 2a. Graph construction (graphBuilder.js)

Convert Nebula course data into React Flow nodes and edges:

```javascript
// Node structure
{
  id: "CS3341",
  type: "courseNode",       // custom node type
  data: {
    courseId: "CS3341",
    name: "Probability & Statistics",
    prefix: "CS",
    creditHours: 3,
    status: "available",    // "completed" | "available" | "locked" | "planned"
    avgGPA: 2.87,           // from grade distribution
    topProfessor: "Smith",  // highest avg GPA professor
  },
  position: { x: 0, y: 0 } // filled by dagre
}

// Edge structure
{
  id: "CS1337-CS3341",
  source: "CS1337",
  target: "CS3341",
  animated: true,           // animated edges for "available" targets
  style: { stroke: "#666" }
}
```

Status logic:
- COMPLETED: course is in user's completedCourses array -> green node
- AVAILABLE: ALL prerequisites are in completedCourses -> blue/glowing node
- PLANNED: user has added to a semester plan -> yellow node
- LOCKED: some prerequisites not yet completed -> gray node, shows lock icon

### 2b. Layout (layoutEngine.js)

Use dagre to auto-position nodes in a top-down tree:

```javascript
import dagre from 'dagre';

export function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: 220, height: 90 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => ({
    ...n,
    position: { x: g.node(n.id).x, y: g.node(n.id).y }
  }));
}
```

### 2c. Custom CourseNode component

Style it like a tech-tree tile:
- Rounded rectangle with colored left border (department color: CS=blue, MATH=red, CGS=purple, etc.)
- Course number (bold, top) + short name (below)
- Small badge: credit hours
- Status indicator: checkmark (completed), pulse/glow (available), lock icon (locked), clock (planned)
- Subtle background color shift by status (green tint completed, blue tint available, gray locked)

### 2d. CoursePanel (detail slide-out on click)

When a node is clicked, a panel slides in from the right with:
- Full course name + description
- Grade distribution bar chart (A/B/C/D/F/W percentages from Nebula)
- Professor comparison table: each professor who taught it, their section's avg GPA
- Next semester availability: is it offered? Which sections? What times?
- Prerequisites listed (raw string from Nebula as fallback)
- "Add to Plan" button -> adds to a semester in the semester builder
- Links to external resources (Dallas AI requirement): generate a YouTube search link for the course topic, link to RateMyProfessor for the listed professors

### 2e. Prerequisite parsing

UTD prereqs are messy ("C or better in CS 1337 AND Co-req MATH 2414"). Hackathon strategy:
- Regex: extract all course IDs matching pattern /[A-Z]{2,4}\s?\d{4}/g
- Treat extracted courses as AND prerequisites (good enough for 90% of cases)
- Display raw prereq string in the detail panel for the edge cases
- Do NOT build a full boolean parser. Not worth the time.

### 2f. Navigation features

- Minimap in corner (React Flow built-in)
- Zoom to fit on load
- Department color legend
- Filter buttons: show all / show available only / show by department
- Search bar: type a course number, camera pans to that node

---

## PHASE 3: AI ADVISOR (Hours 9-15)
**Deliverable: Gemini-powered recommendations, What-If mode, professor insights**

This is the Dallas AI track's core requirement: personalized recommendations with reasoning.

### 3a. Course recommendations

Server endpoint: `POST /api/ai/recommend`

Prompt template:
```
You are a UTD academic advisor AI. A student has the following profile:
- Major: {major}
- Completed courses: {completedCourses}
- Courses with prerequisites met (available now): {availableCourses}
- Grade distribution data for available courses: {gradeData}

Recommend 4-5 courses for next semester. For each recommendation, provide:
1. Course ID and name
2. Why this course now (prerequisite chain progress, graduation timeline, workload balance)
3. Which professor to take it with and why (based on grade data)
4. Difficulty estimate (based on average GPA)

Return as JSON array: [{ courseId, name, reasoning, recommendedProfessor, professorReasoning, difficulty }]
```

Display: AdvisorPanel sidebar showing recommendation cards. Clicking one highlights the node on the tech tree and scrolls to it.

### 3b. What-If mode

Server endpoint: `POST /api/ai/whatif`

Input: currentMajor, completedCourses, targetMajor
Logic:
1. Fetch degree requirements for both majors from Nebula
2. Compute: which completed courses count toward new major, which are lost, what new courses are needed
3. Send summary to Gemini for natural language explanation

Display: WhatIfModal overlay showing:
- Credit overlap count: "38 of your 54 credits transfer"
- Courses lost (red list) vs courses kept (green list)
- New courses needed (blue list)
- Estimated extra semesters
- Gemini's plain-English summary

### 3c. Professor insights (stretch, do if time allows)

For any course node, AI generates a professor comparison:
"Based on grade data, Prof A's sections average a 3.1 GPA with lower withdrawal rates. Prof B averages 2.6 but covers more advanced topics based on the course description."

### 3d. External resources (Dallas AI requirement)

For each course, auto-generate links:
- YouTube search: `https://www.youtube.com/results?search_query=UTD+{courseNumber}+{courseName}`
- RateMyProfessor: `https://www.ratemyprofessors.com/search/professors?q={professorName}`
- Display these in the CoursePanel detail view

---

## PHASE 4: SEMESTER BUILDER (Hours 15-19)
**Deliverable: Drag courses from the tree into semester slots, save plans**

This is the convenience feature that makes the tool actually useful beyond visualization.

### 4a. SemesterPlan component

Below or beside the tech tree, show a semester timeline:
- Horizontal row of semester columns: "Fall 2026", "Spring 2027", etc.
- User can click "Add to Plan" on any available course node -> it drops into the next open semester slot
- Or drag directly from the tree (stretch: React DnD)
- Each semester shows: total credit hours, estimated difficulty (avg of course GPAs)
- Warning if credit hours exceed 18 or fall below 12

### 4b. Plan validation

- Check that planned courses respect prerequisite ordering (can't plan CS3345 before CS3341 if it's a prereq)
- Warn if a planned course isn't offered in that semester (using Nebula scheduling data)
- Show total semesters to graduation

### 4c. Save/load plans

- Save semester plan to MongoDB under user profile
- Load on return (via user ID in URL or simple name lookup)

---

## PHASE 5: POLISH + DEMO (Hours 19-24)

1. Loading states, error handling, empty states
2. Visual polish:
   - Department color coding on nodes
   - Smooth status transitions (course goes from "available" glow to "planned" yellow on add)
   - Clean typography and spacing
   - Dark mode or light mode, pick one and make it look good
3. Responsive enough to look good on a projector
4. Deploy:
   - Frontend: Vercel (`npx vercel` from client/)
   - Backend: Railway or Render with env vars
   - MongoDB Atlas already cloud-hosted
5. README.md with:
   - Project summary
   - Track alignment (Dallas AI, Nebula Labs, Data Science/ML, General)
   - MLH notes (Gemini API, MongoDB Atlas)
   - Setup instructions + screenshots
6. Demo script (2-3 minutes):
   a. Onboarding: select "Computer Science", check off ~25-30 completed courses
   b. Tech tree renders: green completed nodes, glowing available nodes, gray locked
   c. Click a course node: show grade distribution, professor comparison, external links
   d. Open AI advisor: show personalized recommendations with reasoning
   e. Demo What-If: "What if I switch to Cognitive Science?"
   f. Semester builder: add recommended courses to Fall 2026 plan
   g. Show credit hour total and graduation timeline

---

## PRIORITY TRIAGE

**MUST SHIP (protect these no matter what):**
- Tech tree visualization with real Nebula data (this IS the project)
- Course node click -> detail panel with grade distributions + professor info
- AI recommendations via Gemini with reasoning (Dallas AI core requirement)
- External resource links per course (Dallas AI requirement)

**SHOULD SHIP (do if on schedule):**
- What-If major switch mode
- Semester builder with plan saving
- Professor comparison insights
- Search/filter on the tree

**CUT IF BEHIND:**
- Drag-and-drop into semester slots (use buttons instead)
- Course availability checking against Nebula scheduling
- Complex prereq boolean parsing (regex course IDs is enough)
- Dark mode toggle
- Animations and particle effects on nodes
- Mobile responsiveness
- Cloud deploy (demo locally if needed)
