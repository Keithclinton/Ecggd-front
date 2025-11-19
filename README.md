# CCGD LMS — Frontend (Next.js + TypeScript + Tailwind)

This is a starter frontend scaffold for the College of Career Guidance and Development LMS. It includes:

- Next.js + TypeScript
- Tailwind CSS
- Axios API client wired to `NEXT_PUBLIC_API_BASE_URL`
- Basic pages: Home, Login
- Reusable components: Header, Footer, CourseCard

## Quick setup (Windows PowerShell)

1. Install dependencies

```powershell
cd c:\Eccgd-Front
npm install
```

2. Copy env example and set API base URL

```powershell
cp .env.example .env.local
# Edit .env.local and confirm NEXT_PUBLIC_API_BASE_URL is set
```

3. Run dev server

```powershell
npm run dev
```

Open http://localhost:3000

## Notes & next steps

- Auth currently stores a temporary token in localStorage. For production, prefer httpOnly cookies or a secure refresh-token flow.
- Tailwind is configured and brand colors are in `tailwind.config.js` and `styles/globals.css`.
- To integrate your full API flows I will inspect the Swagger you provided and wire the list courses, course detail, and lesson endpoints.

If you want me to continue now I can:
- Inspect the Swagger docs and map endpoints to UI screens
- Implement the courses list and course detail pages
- Add token refresh logic and better error handling

Reply with which additional pages to prioritise (Courses list, Course details, Lesson viewer, Enrollment, Profile, Admin CRUD).