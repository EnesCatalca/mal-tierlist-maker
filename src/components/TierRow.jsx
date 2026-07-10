import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import AnimeCard from './AnimeCard'

export default function TierRow({ tierId, label, color, malIds, animeMap, canDelete, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: tierId })

  return (
    <div className="flex min-h-[140px] border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Tier label */}
      <div
        className="flex items-center justify-center w-16 shrink-0 font-bold text-xl text-gray-900 border-r border-gray-200 dark:border-gray-700 relative group"
        style={{ backgroundColor: color }}
      >
        {label}
        {canDelete && (
          <button
            onClick={() => onDelete(tierId)}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/30 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            title="Tieri sil"
          >
            ×
          </button>
        )}
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 tier-scroll transition-colors duration-150 ${
          isOver
            ? 'bg-indigo-50 dark:bg-indigo-950'
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        <SortableContext items={malIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 p-2 min-h-[140px] min-w-max items-start">
            {malIds.map((id) => (
              <AnimeCard key={id} malId={id} anime={animeMap[id]} />
            ))}
            {malIds.length === 0 && (
              <div className="flex items-center self-center text-gray-300 dark:text-gray-600 text-sm pl-2 select-none">
                Buraya sürükle
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
