'use client';

import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableItemType {
    id: string;
    title: string;
    content?: React.ReactNode;
    actions?: React.ReactNode;
}

interface SortableListProps {
    items: SortableItemType[];
    onReorder: (newItems: SortableItemType[]) => void;
}

function SortableItemNode({ item }: { item: SortableItemType }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="p-4 mb-3 bg-card border border-border rounded-xl shadow-sm flex flex-col"
        >
            <div className="flex items-center gap-3">
                {/* DRAG HANDLE - Only this triggers the drag */}
                <div
                    className="text-muted-foreground cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                    {...attributes}
                    {...listeners}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                </div>

                <span className="font-semibold text-base flex-1">{item.title}</span>

                {item.actions && (
                    <div className="flex items-center gap-2">
                        {item.actions}
                    </div>
                )}
            </div>

            {item.content && (
                <div className="mt-4 ml-9 pt-4 border-t border-border">
                    {item.content}
                </div>
            )}
        </div>
    );
}

export function SortableList({ items, onReorder }: SortableListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires minimum 5px movement before dragging to allow clicking inside
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            // We manually cast the arrayMove result to maintain type
            onReorder(arrayMove(items, oldIndex, newIndex) as SortableItemType[]);
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col">
                    {items.map((item) => (
                        <SortableItemNode key={item.id} item={item} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
