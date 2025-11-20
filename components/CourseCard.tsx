import Link from 'next/link';

type Props = {
  id: number;
  title: string;
  summary?: string;
  imageUrl?: string;
}

export default function CourseCard({ id, title, summary, imageUrl }: Props) {
  const placeholderImage = `https://placehold.co/600x400/e2e8f0/4a5568?text=Course`;

  return (
    <Link href={`/courses/${id}`}>
      <a className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
        <img src={imageUrl || placeholderImage} alt={title} className="w-full h-48 object-cover" />
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          {summary && <p className="text-gray-600 text-sm mb-4">{summary}</p>}
        </div>
      </a>
    </Link>
  )
}
