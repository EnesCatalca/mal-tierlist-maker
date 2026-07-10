import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AnimeCardDisplay from './AnimeCardDisplay'

export default function AnimeCard({ malId, anime }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: malId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AnimeCardDisplay anime={anime} isDragging={isDragging} />
    </div>
  )
}
