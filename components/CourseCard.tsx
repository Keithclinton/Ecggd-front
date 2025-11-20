import Link from 'next/link';

type Props = {
  id: number;
  title: string;
  summary?: string;
  imageUrl?: string;
  onEnroll: (courseId: number) => void;
  enrolling: boolean;
}

export default function CourseCard({ id, title, summary, imageUrl, onEnroll, enrolling }: Props) {
  const placeholderImage = `https://placehold.co/600x400/e2e8f0/4a5568?text=Course`;

  const handleEnrollClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onEnroll(id);
  }

  return (
    <div className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
      <Link href={`/courses/${id}`}>
        <a>
          <img src={imageUrl || placeholderImage} alt={title} className="w-full h-48 object-cover" />
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            {summary && <p className="text-gray-600 text-sm mb-4">{summary}</p>}
          </div>
        </a>
      </Link>
      <div className="mt-auto p-6 pt-0">
        <button
          onClick={handleEnrollClick}
          disabled={enrolling}
          className={`w-full px-4 py-2 rounded font-semibold text-sm transition ${
            enrolling 
              ? 'bg-gray-400 text-gray-800 cursor-not-allowed' 
              : 'bg-brand-primary text-white hover:bg-brand-primary/90'
          }`}
        >
          {enrolling ? 'Enrolling...' : 'Enroll Now'}
        </button>
      </div>
    </div>
  )
}

