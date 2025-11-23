// File: ./pages/courses/[id]/lessons.tsx (FINAL FIX)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { lessons, resources } from '../../../lib/api'; 
import RequireAuth from '../../../components/RequireAuth';

type Lesson = {
    id: number;
    title: string;
    content: string;
    course: number;
};

type Resource = {
    id: number;
    title: string;
    link: string;
    lesson: number;
};

export default function LessonsPage() {
    const router = useRouter();
    const { id } = router.query;
    const [lessonList, setLessonList] = useState<Lesson[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [resourceList, setResourceList] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            lessons.list(id as string)
                .then((res: { data: Lesson[] }) => setLessonList(res.data))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleSelectLesson = (lesson: Lesson) => {
        setSelectedLesson(lesson);
        setLoading(true);
        
        // 🌟 FIX APPLIED: Removed the course ID (id) argument. 
        // resources.list only expects the lesson ID argument.
        resources.list(lesson.id)
            .then((res: { data: Resource[] }) => setResourceList(res.data))
            .finally(() => setLoading(false));
        // Mark lesson as viewed for progress
        // You might have a line like this commented out or removed if not using it:
        // lessons.markViewed(id as string, lesson.id); 
    };

    return (
        <RequireAuth>
            <div className="max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Lessons</h1>
                {loading && <div>Loading...</div>}
                <div className="flex gap-8">
                    <div className="w-1/3">
                        <h2 className="font-semibold mb-2">Lessons</h2>
                        <ul>
                            {lessonList.map(lesson => (
                                <li key={lesson.id}>
                                    <button
                                        className={`w-full text-left py-2 px-3 rounded ${selectedLesson?.id === lesson.id ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleSelectLesson(lesson)}
                                    >
                                        {lesson.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-2/3">
                        {selectedLesson ? (
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{selectedLesson.title}</h3>
                                <div className="prose mb-4" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                                
                                <h4 className="font-semibold mb-2">Resources</h4>
                                <ul>
                                    {resourceList.map(resource => (
                                        <li key={resource.id} className="mb-1">
                                            <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {resource.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div>Select a lesson to view content and resources.</div>
                        )}
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}