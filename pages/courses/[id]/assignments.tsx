// File: ./pages/courses/[id]/assignments.tsx (FIXED)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// 🌟 FIX APPLIED HERE: Changed the combined import to separate named (assignments) and default (submissions) imports
import { assignments } from '../../../lib/api'; 
import submissions from '../../../lib/api'; 
import RequireAuth from '../../../components/RequireAuth';

interface Assignment {
    id: number;
    title: string;
    description?: string;
    due_date?: string;
}

interface Submission {
    id: number;
    content: string;
    grade?: string;
    feedback?: string;
    created_at?: string;
}

export default function AssignmentsPage() {
    const router = useRouter();
    const { id } = router.query;
    const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissionList, setSubmissionList] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitContent, setSubmitContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            assignments.list(id as string)
                .then((res: { data: Assignment[] }) => setAssignmentList(res.data))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleSelectAssignment = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setLoading(true);
        submissions.list(id as string, assignment.id)
            .then((res: { data: Submission[] }) => setSubmissionList(res.data))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async () => {
        if (!selectedAssignment || !submitContent) return;
        setSubmitting(true);
        try {
            await submissions.submit(id as string, selectedAssignment.id, { content: submitContent });
            setSubmitContent('');
            // Refresh submissions
            submissions.list(id as string, selectedAssignment.id)
                .then((res: { data: Submission[] }) => setSubmissionList(res.data));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RequireAuth>
            <div className="max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Assignments</h1>
                {loading && <div>Loading...</div>}
                <div className="flex gap-8">
                    <div className="w-1/3">
                        <h2 className="font-semibold mb-2">Assignments</h2>
                        <ul>
                            {assignmentList.map(assignment => (
                                <li key={assignment.id}>
                                    <button
                                        className={`w-full text-left py-2 px-3 rounded ${selectedAssignment?.id === assignment.id ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleSelectAssignment(assignment)}
                                    >
                                        {assignment.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-2/3">
                        {selectedAssignment ? (
                            <div>
                                <h3 className="text-xl font-semibold mb-2">{selectedAssignment.title}</h3>
                                <p className="mb-4">{selectedAssignment.description}</p>
                                <div className="mb-4">
                                    <label className="block font-medium mb-1">Submit Assignment:</label>
                                    <textarea
                                        className="w-full border rounded p-2 mb-2"
                                        rows={4}
                                        value={submitContent}
                                        onChange={e => setSubmitContent(e.target.value)}
                                        placeholder="Enter your answer or upload file (coming soon)"
                                    />
                                    <button
                                        className="px-4 py-2 rounded bg-green-600 text-white"
                                        onClick={handleSubmit}
                                        disabled={submitting || !submitContent}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                                <h4 className="font-semibold mb-2">Your Submissions</h4>
                                <ul>
                                    {submissionList.map(sub => (
                                        <li key={sub.id} className="mb-2 border rounded p-2">
                                            <div><strong>Submitted:</strong> {sub.created_at}</div>
                                            <div><strong>Content:</strong> {sub.content}</div>
                                            {sub.grade && <div><strong>Grade:</strong> {sub.grade}</div>}
                                            {sub.feedback && <div><strong>Feedback:</strong> {sub.feedback}</div>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div>Select an assignment to view details and submit.</div>
                        )}
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}