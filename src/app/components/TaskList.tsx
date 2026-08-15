'use client'

import { Task, Tag } from '@/app/lib/types'
import TaskItem from './TaskItem'
import styles from './TaskList.module.css'

interface Props {
  tasks: Task[]
  filter: string
  tags: Tag[]
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, description: string, dueDate?: string) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export default function TaskList({ tasks, filter, tags, onToggle, onEdit, onDelete, onRefresh }: Props) {
  if (tasks.length === 0) {
    const messages = {
      all: { title: 'Nenhuma tarefa', sub: 'Crie sua primeira tarefa ao lado.' },
      active: { title: 'Tudo em dia', sub: 'Não há tarefas pendentes.' },
      completed: { title: 'Nada concluído', sub: 'Complete uma tarefa para vê-la aqui.' },
    }
    const msg = messages[filter as keyof typeof messages] || messages.all

    return (
      <div className={styles.empty}>
        <div className={styles.emptySymbol}>◇</div>
        <p className={styles.emptyTitle}>{msg.title}</p>
        <p className={styles.emptySub}>{msg.sub}</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      <div className={styles.listHeader}>
        <span className={styles.listCount}>
          {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </div>
      <ul className={styles.items}>
        {tasks.map((task, index) => (
          <li
            key={task.id}
            className={styles.item}
            style={{ animationDelay: `${index * 0.04}s` }}
          >
            <TaskItem
              task={task}
              availableTags={tags}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onRefresh={onRefresh}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
