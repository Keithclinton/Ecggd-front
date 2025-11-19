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
		attempts.list(id as string, quiz.id)
			.then((res: { data: Attempt[] }) => setAttemptList(res.data))
			.finally(() => setLoading(false));
	};

	const handleStartAttempt = async () => {
		if (!selectedQuiz) return;
		setLoading(true);
		const res = await attempts.start(id as string, selectedQuiz.id);
		setActiveAttempt(res.data);
		setLoading(false);
	};

	const handleSubmitAnswers = async () => {
		if (!selectedQuiz || !activeAttempt) return;
		setSubmitting(true);
		await attempts.submit(id as string, selectedQuiz.id, activeAttempt.id, { answers });
		setSubmitting(false);
		// Refresh attempt list
		attempts.list(id as string, selectedQuiz.id)
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
										<h4 className="font-semibold mb-2">Quiz Attempt</h4>
										{/* Placeholder for questions UI */}
										<div className="mb-2">(Questions UI to be implemented)</div>
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
