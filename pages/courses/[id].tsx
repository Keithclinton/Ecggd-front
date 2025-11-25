import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import RequireAuth from '../../components/RequireAuth';
import Link from 'next/link';

// Define the basic structure for Course and Course Content
type Lesson = {
  id: number;
  title: string;
  order: number;
  content: string; // Assuming this contains HTML content
};

type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
};

type Course = {
  id: number;
  shortname: string;
  fullname: string;
  summary: string;
  modules: CourseModule[];
  // Assume other fields like teacher, duration, etc.
};

// --- Helper component for Module/Lesson Navigation ---
const CourseNavigation = ({ course, activeLessonId, onLessonClick }: {
  course: Course;
  activeLessonId: number | null;
  onLessonClick: (lesson: Lesson) => void;
}) => (
  <nav className="space-y-6">
    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 sticky top-0 bg-white z-10">
      Course Outline
    </h2>
    {course.modules.sort((a, b) => a.order - b.order).map((module) => (
      <div key={module.id} className="group">
        <h3 className="text-lg font-semibold text-gray-700 p-2 rounded-md bg-gray-100/50 group-hover:bg-gray-100 transition duration-150 cursor-pointer">
          Module {module.order}: {module.title}
        </h3>
        <ul className="mt-2 space-y-1 pl-4 border-l border-gray-200">
          {module.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
            const isActive = activeLessonId === lesson.id;
            return (
              <li 
                key={lesson.id} 
                onClick={() => onLessonClick(lesson)}
                className={`p-2 rounded-md text-sm cursor-pointer transition duration-150 ${
                  isActive 
                    ? 'bg-brand-secondary text-white font-medium shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-primary'
                }`}
              >
                <span className="mr-2 font-mono text-xs opacity-70">L{lesson.order}</span>
                {lesson.title}
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const courseId = id ? parseInt(id as string, 10) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  // State for the content being displayed in the main area
  const [activeContent, setActiveContent] = useState<{
    type: 'summary' | 'lesson';
    title: string;
    content: string;
    lessonId: number | null;
  }>({
    type: 'summary',
    title: '',
    content: '',
    lessonId: null,
  });

  // Function to find the first lesson and set it as active content
  const findAndSetInitialContent = useMemo(() => {
    return (fetchedCourse: Course) => {
      // Sort modules and lessons to find the very first one
      const sortedModules = fetchedCourse.modules.sort((a, b) => a.order - b.order);
      const firstModule = sortedModules[0];
      
      if (firstModule && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons.sort((a, b) => a.order - b.order)[0];
        setActiveContent({
          type: 'lesson',
          title: firstLesson.title,
          content: firstLesson.content,
          lessonId: firstLesson.id,
        });
      } else {
        // Fallback to course summary if no lessons exist
        setActiveContent({
          type: 'summary',
          title: `${fetchedCourse.fullname} - Course Overview`,
          content: fetchedCourse.summary,
          lessonId: null,
        });
      }
    };
  }, []);


  useEffect(() => {
    if (!courseId) return;

    async function fetchCourseData() {
      setLoading(true);
      setError('');
      try {
        // 1. CRITICAL: Check Enrollment Status
        // This API call checks if the currently logged-in user is enrolled in this course ID
        const enrollmentRes = await api.get(`/enrollments/check/?course=${courseId}`);
        
        if (enrollmentRes.status === 200 && enrollmentRes.data.is_enrolled) {
          setIsEnrolled(true);

          // 2. Fetch Course Details (only if authorized/enrolled)
          const courseRes = await api.get(`/courses/${courseId}/`);
          const fetchedCourse = courseRes.data as Course;
          
          setCourse(fetchedCourse);
          
          // Set the initial active content (first lesson or summary)
          findAndSetInitialContent(fetchedCourse);
          
        } else {
          // Redirect if not enrolled
          setIsEnrolled(false);
          router.push('/'); 
          setError('You are not assigned to this course. Redirecting to dashboard.');
        }

      } catch (err: any) {
        const status = err.response?.status;
        if (status === 404 || status === 403) {
          setError('Course not found or access denied. Redirecting to dashboard.');
          router.push('/');
        } else {
          setError(err.message || 'Failed to load course data.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, router, findAndSetInitialContent]); // Added findAndSetInitialContent to dependencies

  // Handler for clicking a lesson in the navigation
  const handleLessonClick = (lesson: Lesson) => {
    setActiveContent({
      type: 'lesson',
      title: lesson.title,
      content: lesson.content,
      lessonId: lesson.id,
    });
  };
  
  // Handler for clicking the course title to show the summary
  const handleSummaryClick = () => {
    if (course) {
      setActiveContent({
        type: 'summary',
        title: `${course.fullname} - Course Overview`,
        content: course.summary,
        lessonId: null,
      });
    }
  };


  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <Spinner size={50} />
        </div>
      </RequireAuth>
    );
  }

  // Enrollment/Error handling remains the same (redirects to '/')
  if (error && !isEnrolled) {
    return (
      <RequireAuth>
        <div className="min-h-screen p-8 text-center bg-red-50 text-red-700">
          <p className="font-semibold">{error}</p>
          <Link href="/" className="text-brand-primary underline mt-2 inline-block">Go to Dashboard</Link>
        </div>
      </RequireAuth>
    );
  }
  if (!course || !isEnrolled) {
    // This block should rarely be hit due to router.push above, but serves as a final guard
    return (
      <RequireAuth>
        <div className="min-h-screen p-8 text-center text-gray-600 bg-gray-50">
          <h1 className="text-2xl font-bold mt-10">Access Denied</h1>
          <p>You must be enrolled in this course to view its content.</p>
          <Link href="/" className="text-brand-primary underline mt-4 inline-block">Return to My Courses</Link>
        </div>
      </RequireAuth>
    );
  }

  // Render Course Content with dual-pane layout
  return (
    <RequireAuth>
      {/* Set the height of the container to prevent footer from being hidden by sticky nav */}
      <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
        
        {/* Left Panel: Course Navigation (Sticky) */}
        <div className="w-1/4 min-w-[300px] max-w-[400px] bg-white shadow-xl p-6 sticky top-0 h-[calc(100vh-4rem)] overflow-y-auto hidden md:block">
          <h1 
            className="text-2xl font-extrabold text-brand-primary cursor-pointer hover:opacity-80 transition mb-6"
            onClick={handleSummaryClick}
          >
            {course.shortname || course.fullname}
          </h1>
          <CourseNavigation 
            course={course} 
            activeLessonId={activeContent.lessonId} 
            onLessonClick={handleLessonClick} 
          />
        </div>

        {/* Right Panel: Main Content Area */}
        <main className="flex-grow p-4 md:p-10 max-w-full lg:max-w-[75%]">
          <div className="bg-white p-6 md:p-10 rounded-xl shadow-lg border border-gray-100">
            
            <Link href="/" className="text-sm font-medium text-brand-secondary hover:text-brand-primary transition mb-4 block">
              &larr; Back to My Courses
            </Link>

            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 border-b pb-2">
              {activeContent.title}
            </h2>
            
            {activeContent.type === 'summary' && (
              <div className="text-gray-600 space-y-4 prose max-w-none">
                <p className="italic text-lg text-brand-secondary">Course Summary</p>
                {/* Display summary as paragraphs */}
                {activeContent.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {activeContent.type === 'lesson' && (
              <div className="text-gray-700 space-y-6 prose max-w-none">
                <p className="text-sm text-gray-500 font-medium">
                  Lesson: {activeContent.title}
                </p>
                {/*                   IMPORTANT: This line assumes lesson.content is sanitized HTML from the backend.
                  In a real application, you must ensure the content is safe before using dangerouslySetInnerHTML.
                */}
                <div dangerouslySetInnerHTML={{ __html: activeContent.content }} />
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}