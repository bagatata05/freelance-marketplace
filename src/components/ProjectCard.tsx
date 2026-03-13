import React from 'react';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  imageUrl: string;
  likes: number;
  views: number;
  tags?: string[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  creatorName,
  creatorAvatar,
  imageUrl,
  likes,
  views,
  tags = []
}) => {
  return (
    <div className="group flex flex-col gap-3 animate-fade-in">
      {/* Thumbnail Container */}
      <Link to={`/jobs/${id}`} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 block">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <button className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full transition-colors text-white" aria-label="Save project">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
               </svg>
            </button>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg truncate drop-shadow-md">{title}</h3>
            {tags.length > 0 && (
              <div className="flex gap-2 mt-1 hidden group-hover:flex">
                {tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-xs text-white/90 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Info Container */}
      <div className="flex items-center justify-between px-1">
        <Link to={`/profile`} className="flex items-center gap-2 hover:underline group/creator">
          {creatorAvatar ? (
            <img src={creatorAvatar} alt={creatorName} className="w-6 h-6 rounded-full object-cover bg-gray-200" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
              {creatorName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-behance-text group-hover/creator:text-behance-blue truncate max-w-[120px]">
            {creatorName}
          </span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-behance-muted font-medium">
          <div className="flex items-center gap-1 hover:text-behance-text transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            {likes > 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
          </div>
          <div className="flex items-center gap-1 hover:text-behance-text transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {views > 1000 ? `${(views / 1000).toFixed(1)}k` : views}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
