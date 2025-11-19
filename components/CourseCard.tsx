type Props = {
  title: string
  description?: string
}

export default function CourseCard({ title, description }: Props) {
  return (
    <div className="border rounded p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
    </div>
  )
}
