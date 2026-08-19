export interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  tags?: Tag[]
}

export interface Tag {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  tasks?: Task[]
}

export interface Memory {
  id: string
  title: string
  content: string
  tags?: Tag[]
  useMarkdown: boolean
  createdAt: string
  updatedAt: string
}

export interface Entertainment {
  id: string
  title: string
  originalTitle?: string | null
  category: 'movie' | 'series' | 'anime' | 'manga' | 'book' | 'game'
  watchStatus: 'plan' | 'in_progress' | 'completed' | 'dropped'
  posterUrl?: string | null
  coverUrl?: string | null
  synopsis?: string | null
  startDate?: string | null
  endDate?: string | null
  cast?: string[]
  externalProviderId?: string | null
  externalRating?: number | null
  progress: {
    currentEpisode: number | null
    totalEpisodes: number | null
    currentSeason: number | null
    totalSeasons: number | null
  }
  rating: {
    overall: number | null
    seasons?: {
      [seasonNumber: string]: {
        average: number | null
        episodes?: {
          [episodeNumber: string]: number | null
        }
      }
    }
  }
  createdAt: string
  updatedAt: string
}
