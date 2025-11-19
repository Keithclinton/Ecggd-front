import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { lessons, resources } from '../../../lib/api';
import RequireAuth from '../../../components/RequireAuth';

type Lesson = {
	id: number;
	title: string;
	description?: string;
	completed?: boolean;
};

type Resource = {
	id: number;
	name: string;
	type: 'video' | 'file' | 'external' | string;
	url: string;
	viewed?: boolean;
};

export default function LessonViewer() {
	const router = useRouter();
	const { id } = router.query;
	const [lessonList, setLessonList] = useState<Lesson[]>([]);
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [resourceList, setResourceList] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState<{[lessonId: number]: boolean}>({});

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
		resources.list(id as string, lesson.id)
			.then((res: { data: Resource[] }) => setResourceList(res.data))
			.finally(() => setLoading(false));
		// Mark lesson as viewed for progress
		setProgress(prev => ({ ...prev, [lesson.id]: true }));
	};

	return (
		<RequireAuth>
			<div className="max-w-4xl mx-auto py-8">
				<h1 className="text-2xl font-bold mb-4">Lesson Viewer</h1>
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
										{progress[lesson.id] && (
											<span className="ml-2 text-green-600 text-xs">(Viewed)</span>
										)}
									</button>
								</li>
							))}
						</ul>
					</div>
					<div className="w-2/3">
						{selectedLesson ? (
							<div>
								<h3 className="text-xl font-semibold mb-2">{selectedLesson.title}</h3>
								<p className="mb-4">{selectedLesson.description}</p>
								<h4 className="font-semibold mb-2">Resources</h4>
								<ul>
									{resourceList.map(resource => (
										<li key={resource.id} className="mb-2">
											<ResourceItem resource={resource} />
										</li>
									))}
								</ul>
							</div>
						) : (
							<div>Select a lesson to view details and resources.</div>
						)}
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}

function ResourceItem({ resource }: { resource: Resource }) {
	// Improved rendering by type
	switch (resource.type) {
		case 'video':
			return (
				<div>
					<div className="font-medium mb-1">{resource.name}</div>
					<video src={resource.url} controls className="w-full rounded border" />
				</div>
			);
		case 'file':
			return (
				<div>
					<div className="font-medium mb-1">{resource.name}</div>
					<a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download File</a>
				</div>
			);
		case 'external':
			return (
				<div>
					<div className="font-medium mb-1">{resource.name}</div>
					<a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Link</a>
				</div>
			);
		default:
			return (
				<div>
					<div className="font-medium mb-1">{resource.name}</div>
					<a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Resource</a>
				</div>
			);
	}
}
