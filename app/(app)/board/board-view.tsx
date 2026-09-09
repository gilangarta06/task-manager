"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Status } from "@prisma/client";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { reorderTask } from "@/app/actions";
import { TaskCard, type TaskCardData } from "@/components/task-card";
import { STATUS_ORDER, STATUS_LABEL } from "@/lib/workflow";

type BoardTask = TaskCardData & { id: string; order: number };

export function BoardView({ tasks }: { tasks: BoardTask[] }) {
  const [items, setItems] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const map = new Map<Status, BoardTask[]>();
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const task of [...items].sort((a, b) => a.order - b.order)) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [items]);

  const activeTask = items.find((t) => t.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const task = items.find((t) => t.id === active.id);
    if (!task) return;

    const overId = String(over.id);
    const overTask = items.find((t) => t.id === overId);
    const targetStatus: Status = overTask ? overTask.status : (overId as Status);
    if (!STATUS_ORDER.includes(targetStatus)) return;

    const siblings = items
      .filter((t) => t.status === targetStatus && t.id !== task.id)
      .sort((a, b) => a.order - b.order);

    let insertIndex = siblings.length;
    if (overTask && overTask.id !== task.id) {
      insertIndex = siblings.findIndex((t) => t.id === overTask.id);
      if (insertIndex < 0) insertIndex = siblings.length;
    }

    const before = siblings[insertIndex - 1];
    const after = siblings[insertIndex];
    let newOrder: number;
    if (!before && !after) newOrder = 0;
    else if (!before) newOrder = after.order - 1;
    else if (!after) newOrder = before.order + 1;
    else newOrder = (before.order + after.order) / 2;

    if (targetStatus === task.status && newOrder === task.order) return;

    const snapshot = items;
    setItems((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: targetStatus, order: newOrder } : t))
    );

    startTransition(async () => {
      try {
        await reorderTask(task.id, targetStatus, newOrder);
        if (targetStatus !== task.status) {
          toast.success(`${task.title} → ${STATUS_LABEL[targetStatus]}`);
        }
        router.refresh();
      } catch (error) {
        setItems(snapshot);
        toast.error(error instanceof Error ? error.message : "Gagal memindahkan tugas.");
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={columns.get(status) ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, tasks }: { status: Status; tasks: BoardTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-card/50 p-2 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <header className="mb-2 flex items-center justify-between px-1.5 py-1">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {STATUS_LABEL[status]}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-2 flex-col gap-2">
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 ? (
            <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">Tarik ke sini</p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ task }: { task: BoardTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}

export type { BoardTask };
