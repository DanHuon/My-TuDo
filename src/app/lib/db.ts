import Dexie, { Table } from 'dexie';
import { Task, Tag } from './types';

export interface DBItem {
  id: string;
  type: string; // 'task' | 'tag' | 'movie' | 'note', etc.
  status: string; // 'active' | 'completed' | etc.
  isDeleted: number; // 0 for false, 1 for true (IndexedDB indexes numbers better)
  createdAt: string;
  updatedAt: string;
  payload: any; // Freeform object for specific item data
}

export class MyTuDoDatabase extends Dexie {
  items!: Table<DBItem, string>;
  gc_cache!: Table<import('./types').GcEvent, string>;

  constructor() {
    super('MyTuDoDB');
    this.version(1).stores({
      // Indexes for generic querying
      items: 'id, type, status, isDeleted, updatedAt, [type+isDeleted]'
    });
    this.version(2).stores({
      gc_cache: 'id, calendarId, start, end, updatedAt'
    });
  }
}

export const db = new MyTuDoDatabase();

// Hooks to notify useSync.ts about local changes
db.items.hook('creating', function () {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dexie-local-change'));
  }
});
db.items.hook('updating', function () {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dexie-local-change'));
  }
});
db.items.hook('deleting', function () {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dexie-local-change'));
  }
});

// --- Adapters for UI (Generic Item <-> Specific Type) ---

export const itemToTask = (item: DBItem): Task => {
  return {
    id: item.id,
    title: item.payload.title || '',
    description: item.payload.description || null,
    completed: item.status === 'completed',
    dueDate: item.payload.dueDate || null,
    rrule: item.payload.rrule || null,
    eventId: item.payload.eventId || null,
    completedDates: item.payload.completedDates || [],
    reminders: item.payload.reminders || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.payload.tags || [],
  };
};

export const itemToTag = (item: DBItem): Tag => {
  return {
    id: item.id,
    name: item.payload.name || '',
    description: item.payload.description || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

// --- CRUD Operations ---

// Generic Add
export const addItem = async (type: string, status: string, payload: any) => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.items.add({
    id,
    type,
    status,
    isDeleted: 0,
    createdAt: now,
    updatedAt: now,
    payload,
  });
  return id;
};

// Generic Soft Delete
export const softDeleteItem = async (id: string) => {
  const now = new Date().toISOString();
  await db.items.update(id, {
    isDeleted: 1,
    updatedAt: now,
  });
};

// --- Task Specific CRUD ---

export const getTasks = async (): Promise<Task[]> => {
  const items = await db.items.where({ type: 'task', isDeleted: 0 }).toArray();
  // Sort by createdAt descending (newest first) usually, but we can just map and return
  return items.map(itemToTask).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addTask = async (title: string, description?: string, dueDate?: string, rrule?: string, eventId?: string, reminders?: {method: 'email'|'popup', minutes: number}[]) => {
  await addItem('task', 'active', {
    title,
    description: description || null,
    dueDate: dueDate || null,
    rrule: rrule || null,
    eventId: eventId || null,
    reminders: reminders || [],
    completedDates: [],
    tags: []
  });
};

export const editTask = async (id: string, title: string, description: string, dueDate?: string, rrule?: string, eventId?: string, reminders?: {method: 'email'|'popup', minutes: number}[], completedDates?: string[]) => {
  const item = await db.items.get(id);
  if (!item) return;
  const now = new Date().toISOString();
  await db.items.update(id, {
    updatedAt: now,
    payload: {
      ...item.payload,
      title,
      description: description || null,
      dueDate: dueDate || null,
      rrule: rrule !== undefined ? rrule : item.payload.rrule,
      eventId: eventId !== undefined ? eventId : item.payload.eventId,
      reminders: reminders !== undefined ? reminders : item.payload.reminders,
      completedDates: completedDates !== undefined ? completedDates : item.payload.completedDates,
    }
  });
};

export const toggleTask = async (id: string) => {
  const item = await db.items.get(id);
  if (!item) return;

  const now = new Date().toISOString();
  
  if (item.payload.rrule) {
    // It's a recurring task. Instead of marking the template as completed,
    // we log today's date in completedDates.
    const todayStr = now.split('T')[0];
    const completedDates = item.payload.completedDates || [];
    
    // Toggle logic for the instance: if already completed today, uncomplete it.
    let newCompletedDates;
    if (completedDates.includes(todayStr)) {
      newCompletedDates = completedDates.filter((d: string) => d !== todayStr);
    } else {
      newCompletedDates = [...completedDates, todayStr];
    }
    
    await db.items.update(id, {
      updatedAt: now,
      payload: {
        ...item.payload,
        completedDates: newCompletedDates
      }
    });
  } else {
    // Normal task
    const newStatus = item.status === 'completed' ? 'active' : 'completed';
    await db.items.update(id, {
      status: newStatus,
      updatedAt: now,
    });
  }
};

export const deleteTask = async (id: string) => {
  await softDeleteItem(id);
};

export const toggleTaskTag = async (taskId: string, tagId: string) => {
  const taskItem = await db.items.get(taskId);
  const tagItem = await db.items.get(tagId);
  
  if (!taskItem || !tagItem) return;

  const currentTags: Tag[] = taskItem.payload.tags || [];
  const hasTag = currentTags.some(t => t.id === tagId);
  
  let newTags;
  if (hasTag) {
    newTags = currentTags.filter(t => t.id !== tagId);
  } else {
    newTags = [...currentTags, itemToTag(tagItem)];
  }

  await db.items.update(taskId, {
    updatedAt: new Date().toISOString(),
    payload: {
      ...taskItem.payload,
      tags: newTags
    }
  });
};

export const autoTagTask = async (taskId: string): Promise<boolean> => {
  // Mock IA logic
  await new Promise(resolve => setTimeout(resolve, 500));
  const tags = await getTags();
  if (tags.length === 0) return false;
  
  const randomTag = tags[Math.floor(Math.random() * tags.length)];
  const taskItem = await db.items.get(taskId);
  if (!taskItem) return false;

  const currentTags: Tag[] = taskItem.payload.tags || [];
  if (currentTags.some(t => t.id === randomTag.id)) return true;

  await db.items.update(taskId, {
    updatedAt: new Date().toISOString(),
    payload: {
      ...taskItem.payload,
      tags: [...currentTags, randomTag]
    }
  });
  return true;
};

// --- Tag Specific CRUD ---

export const getTags = async (): Promise<Tag[]> => {
  const items = await db.items.where({ type: 'tag', isDeleted: 0 }).toArray();
  return items.map(itemToTag).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addTag = async (name: string, description: string) => {
  await addItem('tag', 'active', {
    name,
    description: description || null
  });
};

export const editTag = async (id: string, name: string, description: string) => {
  const item = await db.items.get(id);
  if (!item) return;
  const now = new Date().toISOString();
  await db.items.update(id, {
    updatedAt: now,
    payload: {
      ...item.payload,
      name,
      description: description || null,
    }
  });

  // Since it's NoSQL, we must also update this tag in all tasks that embed it
  const tasks = await db.items.where({ type: 'task', isDeleted: 0 }).toArray();
  for (const t of tasks) {
    const currentTags: Tag[] = t.payload.tags || [];
    if (currentTags.some(tag => tag.id === id)) {
      const updatedTags = currentTags.map(tag => tag.id === id ? { ...tag, name, description, updatedAt: now } : tag);
      await db.items.update(t.id, {
        payload: { ...t.payload, tags: updatedTags }
      });
    }
  }
};

export const deleteTag = async (id: string) => {
  await softDeleteItem(id);

  // Remove tag from all tasks that embed it
  const tasks = await db.items.where({ type: 'task', isDeleted: 0 }).toArray();
  for (const t of tasks) {
    const currentTags: Tag[] = t.payload.tags || [];
    if (currentTags.some(tag => tag.id === id)) {
      const updatedTags = currentTags.filter(tag => tag.id !== id);
      await db.items.update(t.id, {
        payload: { ...t.payload, tags: updatedTags }
      });
    }
  }
};

// --- Memory Specific CRUD ---

export const itemToMemory = (item: DBItem): import('./types').Memory => {
  return {
    id: item.id,
    title: item.payload.title || '',
    content: item.payload.content || '',
    tags: item.payload.tags || [],
    useMarkdown: item.payload.useMarkdown || false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const getMemories = async (): Promise<import('./types').Memory[]> => {
  const items = await db.items.where({ type: 'memory', isDeleted: 0 }).toArray();
  return items.map(itemToMemory).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const addMemory = async (title: string, content: string, tags?: Tag[], useMarkdown?: boolean) => {
  await addItem('memory', 'active', {
    title,
    content,
    tags: tags || [],
    useMarkdown: useMarkdown || false
  })
}

export const editMemory = async (id: string, title: string, content: string, tags?: Tag[], useMarkdown?: boolean) => {
  const item = await db.items.get(id);
  if (!item) return;
  await db.items.update(id, {
    updatedAt: new Date().toISOString(),
    payload: {
      ...item.payload,
      title,
      content,
      tags: tags || item.payload.tags || [],
      useMarkdown: useMarkdown !== undefined ? useMarkdown : item.payload.useMarkdown
    }
  })
}

export const deleteMemory = async (id: string) => {
  await softDeleteItem(id)
}

// --- Entertainment Specific CRUD ---

export const itemToEntertainment = (item: DBItem): import('./types').Entertainment => {
  return {
    id: item.id,
    title: item.payload.title || '',
    originalTitle: item.payload.originalTitle || null,
    category: item.payload.category || 'movie',
    watchStatus: item.payload.watchStatus || 'plan',
    posterUrl: item.payload.posterUrl || null,
    coverUrl: item.payload.coverUrl || null,
    synopsis: item.payload.synopsis || null,
    startDate: item.payload.startDate || null,
    endDate: item.payload.endDate || null,
    cast: item.payload.cast || [],
    externalProviderId: item.payload.externalProviderId || null,
    externalRating: item.payload.externalRating || null,
    progress: item.payload.progress || {
      currentEpisode: null,
      totalEpisodes: null,
      currentSeason: null,
      totalSeasons: null
    },
    rating: item.payload.rating || {
      overall: null
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export const getEntertainments = async (): Promise<import('./types').Entertainment[]> => {
  const items = await db.items.where({ type: 'entertainment', isDeleted: 0 }).toArray();
  return items.map(itemToEntertainment).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const addEntertainment = async (payload: Omit<import('./types').Entertainment, 'id' | 'createdAt' | 'updatedAt'>) => {
  await addItem('entertainment', 'active', payload)
}

export const editEntertainment = async (id: string, payload: Partial<Omit<import('./types').Entertainment, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const item = await db.items.get(id);
  if (!item) return;
  await db.items.update(id, {
    updatedAt: new Date().toISOString(),
    payload: {
      ...item.payload,
      ...payload
    }
  })
}

export const deleteEntertainment = async (id: string) => {
  await softDeleteItem(id)
}

// --- Google Calendar Cache Operations ---
export const getGcEvents = async (): Promise<import('./types').GcEvent[]> => {
  return await db.gc_cache.toArray()
}

export const putGcEvents = async (events: import('./types').GcEvent[]) => {
  await db.gc_cache.bulkPut(events)
}

export const clearGcEvents = async () => {
  await db.gc_cache.clear()
}
