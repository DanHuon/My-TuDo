'use client'

import { Tag } from '@/app/lib/types'
import TagItem from './TagItem'
import styles from './TaskList.module.css'

interface Props {
  tags: Tag[]
  onEdit: (id: string, name: string, description: string) => void
  onDelete: (id: string) => void
}

export default function TagList({ tags, onEdit, onDelete }: Props) {
  if (tags.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptySymbol}>◄</div>
        <p className={styles.emptyTitle}>Nenhuma tag</p>
        <p className={styles.emptySub}>Crie sua primeira tag ao lado.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      <div className={styles.listHeader}>
        <span className={styles.listCount}>
          {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
        </span>
      </div>
      <ul className={styles.items}>
        {tags.map((tag, index) => (
          <li
            key={tag.id}
            className={styles.item}
            style={{ animationDelay: `${index * 0.04}s` }}
          >
            <TagItem
              tag={tag}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
