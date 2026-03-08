# Why Courses Might Not Show as a List / Completed Not on Tech Tree

## 1. Course list never appears (Onboarding step 2)

**What the code does**
- On "Continue" you go to step 2 and call `loadCourses()`.
- `loadCourses()` requests `/api/courses?prefix=CS` (and other prefixes for your major). The client only uses **`response.data`** as the list of courses.
- The server forwards the Nebula response as-is: `res.json(data)`. So the client expects the Nebula API to return an object with a **`data`** property that is an array of courses.

**Why the list can be empty**
- **Nebula response shape** – If Nebula returns something other than `{ data: [...] }` (e.g. array at top level, or a different wrapper), then `response.data` is undefined and the list stays empty even though the request “succeeds.”
- **Nebula request fails** – Missing/invalid `NEBULA_API_KEY`, wrong URL, or Nebula returning 4xx/5xx. The server then sends 502 with `{ error: "..." }`. The client’s `request()` throws and you see “Could not load courses from Nebula API” and no list.
- **`limit` query param** – The Nebula Swagger doc for `GET /course` does **not** list a `limit` parameter (only `offset`, `subject_prefix`, etc.). Sending `limit=400` might be ignored or cause an error depending on the API. If it causes 400, you get the same 502 and error message as above.
- **Proxy / server not running** – If the backend isn’t running or Vite’s proxy isn’t used, `/api/courses` fails and you get a network error; again no list.

**Fix applied**
- Server: normalize the course list response so the client always receives **`{ data: array }`** (using Nebula’s `data` if present, or treating the body as the array if it’s already an array).
- Client: when building the list, use **either** `response.data` **or** `response` if it’s an array, so both shapes work.

---

## 2. Completed courses don’t show on the tech tree

**What the code does**
- Planner loads the user with `getUser(userName)` and courses with `getCourses(prefix)` for each major prefix.
- It builds the graph with `buildGraph(courses, userData.completedCourses, plannedIds)`.
- Each node’s status is “completed” only if that course’s **normalized** ID is in `userData.completedCourses`. The graph builder normalizes both the course IDs from Nebula and the `completedCourses` array.

**Why completed might not show**
- **No courses at all** – If the course list is empty (same causes as in §1), then `courses` is empty, so `buildGraph` creates zero nodes. Then nothing can appear as “completed.”
- **User profile missing `completedCourses`** – If the stored user (MongoDB or in-memory) doesn’t have `completedCourses` (e.g. created before that field existed, or a bug), then `userData.completedCourses` is undefined. The graph builder uses `(completedCourses || [])`, so every node is treated as not completed.
- **ID mismatch (before normalization)** – If transcript/onboarding stored IDs in one form (e.g. `"CS1337"`) and Nebula returned another (e.g. `"CS 1337"`), the old code required exact string match, so nodes wouldn’t be marked completed. The **normalizeCourseId** logic is there to fix this; both stored completed list and graph IDs are normalized so they align.

**Fix applied**
- Ensure the **course list** is loaded (via the response normalization above).
- Ensure the backend **always returns `completedCourses`** from GET user (default to `[]` when missing) so the graph builder always gets an array.
- Rely on **normalized IDs** everywhere so transcript/onboarding completed list and tech tree nodes use the same canonical IDs.

---

## 3. Quick checks

- **Browser Network tab**: For “Mark completed courses,” check the request to `/api/courses?prefix=...`. Inspect the response body: is there a `data` array with course objects?
- **Console**: Any failed fetch or 502 for `/api/courses` or `/api/users/...`?
- **Backend**: Is the server running on the port your client proxies to (e.g. 3001)? Is `NEBULA_API_KEY` set in `server/.env`?
- **User document**: After saving from onboarding, does GET `/api/users/YourName` return a `completedCourses` array?
