// File: ./pages/courses/[id]/quizzes.tsx (FINAL CORRECTED VERSION)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { quizzes, attempts } from '../../../lib/api';
import RequireAuth from '../../../components/RequireAuth';

interface Quiz {
    id: number;
    title: string;
    description?: string;
}

interface Attempt {
    id: number;
    status: string;
    score?: number;
    answers?: any;
}

export default function QuizzesPage() {
    const router = useRouter();
    const { id } = router.query;
    const [quizList, setQuizList] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [attemptList, setAttemptList] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
    const [answers, setAnswers] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            quizzes.list(id as string)
                .then((res: { data: Quiz[] }) => setQuizList(res.data))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleSelectQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setLoading(true);
        // 🌟 FIX 1: attempts.list only needs quiz.id, remove id as string
        attempts.list(quiz.id)
            .then((res: { data: Attempt[] }) => setAttemptList(res.data))
            .finally(() => setLoading(false));
    };

    const handleStartAttempt = async () => {
        if (!selectedQuiz) return;
        setLoading(true);
        // 🌟 FIX 2: attempts.start only needs selectedQuiz.id, remove id as string
        // NOTE: If attempts.start does not exist in lib/api, this will fail next. 
        // I assume you added it along with the other required functions.
        const res = await attempts.start(selectedQuiz.id);
        setActiveAttempt(res.data);
        setLoading(false);
    };

    const handleSubmitAnswers = async () => {
        if (!selectedQuiz || !activeAttempt) return;
        setSubmitting(true);
        // 🌟 FIX 3: attempts.submit only needs activeAttempt.id and payload, remove id and selectedQuiz.id
        // NOTE: The signature defined in the last step was: submit: (attemptId, payload) 
        // We will adjust based on the current assumption of the payload being the last argument.
        await attempts.submit(activeAttempt.id, { answers });
        setSubmitting(false);
        
        // Refresh attempt list (Fix 1 applied here as well)
        attempts.list(selectedQuiz.id)
            .then((res: { data: Attempt[] }) => setAttemptList(res.data));
        setActiveAttempt(null);
        setAnswers({});
    };

    return (
        <RequireAuth>
            <div className="max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Quizzes</h1>
                {loading && <div>Loading...</div>}
                <div className="flex gap-8">
                    <div className="w-1/3">
                        <h2 className="font-semibold mb-2">Quizzes</h2>
                        <ul>
                            {quizList.map(quiz => (
                                <li key={quiz.id}>
                                    <button
                                        className={`w-full text-left py-2 px-3 rounded ${selectedQuiz?.id === quiz.id ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleSelectQuiz(quiz)}
                                    >
                                        {quiz.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-2/3">
                        {selectedQuiz ? (
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{selectedQuiz.title}</h3>
                                <p className="mb-4">{selectedQuiz.description}</p>
                                <button
                                    className="px-4 py-2 rounded bg-blue-600 text-white mb-4"
                                    onClick={handleStartAttempt}
                                    disabled={!!activeAttempt}
                                >
                                    Start New Attempt
                                </button>
                                {activeAttempt ? (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Quiz Attempt (ID: {activeAttempt.id})</h4>
                                        {/* Placeholder for questions UI */}
                                        <div className="mb-2">(Questions UI to be implemented)</div>
                                        {/* Placeholder for setting answers */}
                                        <p className='text-sm text-gray-500'>Note: Answers state is currently empty: {JSON.stringify(answers)}</p>
                                        <button
                                            className="px-4 py-2 rounded bg-green-600 text-white"
                                            onClick={handleSubmitAnswers}
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Answers'}
                                        </button>
                                    </div>
                                ) : null}
                                <h4 className="font-semibold mb-2">Your Attempts</h4>
                                <ul>
                                    {attemptList.map(attempt => (
                                        <li key={attempt.id} className="mb-2 border rounded p-2">
                                            <div><strong>Status:</strong> {attempt.status}</div>
                                            {attempt.score !== undefined && <div><strong>Score:</strong> {attempt.score}</div>}
                                            {/* You might add a button here to view attempt details */}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div>Select a quiz to view details and start an attempt.</div>
                        )}
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}