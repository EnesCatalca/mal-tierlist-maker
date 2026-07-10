export default function AnimeCardDisplay({ anime, isDragging }) {
  return (
    <div
      className={`flex flex-col items-center w-20 shrink-0 cursor-grab select-none transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div className="w-20 h-[112px] rounded overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
        {anime?.image_url ? (
          <img
            src={anime.image_url}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px] text-center px-1">
            Yükleniyor...
          </div>
        )}
      </div>
      <p
        className="mt-1 text-center text-[10px] leading-tight text-gray-700 dark:text-gray-200 w-20"
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}
        title={anime?.title}
      >
        {anime?.title}
      </p>
    </div>
  )
}
