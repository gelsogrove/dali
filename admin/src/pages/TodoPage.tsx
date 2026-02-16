import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquare, Trash2, Loader2, Search, GripVertical, Sparkles, Clock3, Check, Wand2, Paperclip, FileIcon, X, Download } from 'lucide-react';
import TrixEditor from '@/components/TrixEditor';

type TodoItem = {
  id: number;
  title: string;
  description: string;
  author: string;
  status: 'todo' | 'nicetohave' | 'in_progress' | 'done';
  priority: number;
  attachments: Attachment[];
  comments: Comment[];
};

type Attachment = {
  id: number;
  title: string;
  filename: string;
  url: string;
  mime_type?: string;
  size_bytes?: number;
};

type Comment = {
  id: number;
  author: string;
  content: string;
  created_at: string;
};

const statusColumns = [
  { key: 'todo', label: 'Backlog', color: 'bg-amber-50', accent: 'border-amber-200', dot: 'bg-amber-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-sky-50', accent: 'border-sky-200', dot: 'bg-sky-500' },
  { key: 'done', label: 'Complete', color: 'bg-emerald-50', accent: 'border-emerald-200', dot: 'bg-emerald-600' },
  { key: 'nicetohave', label: 'Nice to Have', color: 'bg-fuchsia-50', accent: 'border-fuchsia-200', dot: 'bg-fuchsia-600' },
] as const;

export default function TodoPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [newTask, setNewTask] = useState({ title: '', author: '', description: '' });
  const [activeEditor, setActiveEditor] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [editDraft, setEditDraft] = useState<TodoItem | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const { data } = useQuery<{ success: boolean; data: { items: TodoItem[] } }>({
    queryKey: ['todos', search],
    queryFn: async () => {
      const res = await api.get(`/todos?q=${encodeURIComponent(search)}`);
      return res.data;
    },
  });

  const items = useMemo(() => data?.data?.items || [], [data]);
  const [localItems, setLocalItems] = useState<TodoItem[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    if (!selectedItem) {
      setEditDraft(null);
      return;
    }
    const fresh = items.find((i) => i.id === selectedItem.id) || selectedItem;
    setSelectedItem(fresh);
    setEditDraft({ ...fresh });
  }, [items, selectedItem]);

  const createMutation = useMutation({
    mutationFn: async () => {
      setCreateError(null);
      const nextPriority = items.length;
      await api.post('/todos', { ...newTask, priority: nextPriority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTask({ title: '', author: '', description: '' });
      setActiveEditor('');
      setOpenModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Save failed';
      setCreateError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<TodoItem> & { id: number }) => {
      await api.put(`/todos/${payload.id}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; priority: number; status: string }[]) => {
      await api.post('/todos/reorder', { items });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/todos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ id, content, author }: { id: number; content: string; author: string }) =>
      api.post(`/todos/${id}/comments`, { content, author }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const { original, filename, url, mime_type, size } = res.data.data;
        await api.post(`/todos/${id}/attachments`, {
          title: original,
          filename,
          url,
          mime_type,
          size_bytes: size,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ todoId, attachmentId }: { todoId: number; attachmentId: number }) =>
      api.delete(`/todos/${todoId}/attachments/${attachmentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const grouped = useMemo(() => {
    const base: Record<string, TodoItem[]> = {
      todo: [],
      nicetohave: [],
      in_progress: [],
      done: [],
    };
    localItems.forEach((i) => {
      const key = base[i.status] ? i.status : 'todo';
      base[key].push(i);
    });
    Object.keys(base).forEach((k) => base[k] = base[k].sort((a, b) => a.priority - b.priority));
    return base;
  }, [localItems]);

  const findContainer = (id: number | string | null | undefined) => {
    if (!id && id !== 0) return undefined;
    if (typeof id === 'string' && ['todo', 'nicetohave', 'in_progress', 'done'].includes(id)) return id;
    return Object.keys(grouped).find((k) => grouped[k].some((i) => i.id === id));
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer =
      active.data?.current?.sortable?.containerId ||
      active.data?.current?.containerId ||
      findContainer(active.id as number);
    const overContainer =
      over.data?.current?.sortable?.containerId ||
      over.data?.current?.containerId ||
      findContainer(over.id as number);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setLocalItems((prev) => {
      const byCol: Record<string, TodoItem[]> = {
        todo: [],
        nicetohave: [],
        in_progress: [],
        done: [],
      };
      prev.forEach((item) => {
        const key = byCol[item.status] ? item.status : 'todo';
        byCol[key].push(item);
      });

      const activeIndex = byCol[activeContainer].findIndex((i) => i.id === active.id);
      const overIndex = byCol[overContainer].findIndex((i) => i.id === over.id);
      if (activeIndex < 0) return prev;

      const [moved] = byCol[activeContainer].splice(activeIndex, 1);
      const insertAt = overIndex >= 0 ? overIndex : byCol[overContainer].length;
      byCol[overContainer].splice(insertAt, 0, { ...moved, status: overContainer as TodoItem['status'] });

      const next: TodoItem[] = [];
      Object.keys(byCol).forEach((k) => {
        byCol[k].forEach((item, idx) => next.push({ ...item, priority: idx, status: k as TodoItem['status'] }));
      });
      return next;
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer =
      active.data?.current?.sortable?.containerId ||
      active.data?.current?.containerId ||
      findContainer(active.id as number);
    const overContainer =
      over.data?.current?.sortable?.containerId ||
      over.data?.current?.containerId ||
      findContainer(over.id as number);

    if (!activeContainer || !overContainer) return;

    setLocalItems((prev) => {
      const byCol: Record<string, TodoItem[]> = {
        todo: [],
        nicetohave: [],
        in_progress: [],
        done: [],
      };
      prev.forEach((item) => {
        const key = byCol[item.status] ? item.status : 'todo';
        byCol[key].push(item);
      });

      if (activeContainer === overContainer) {
        const oldIndex = byCol[activeContainer].findIndex((i) => i.id === active.id);
        const newIndex = byCol[overContainer].findIndex((i) => i.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return prev;
        byCol[activeContainer] = arrayMove(byCol[activeContainer], oldIndex, newIndex);
      } else {
        const oldIndex = byCol[activeContainer].findIndex((i) => i.id === active.id);
        const newIndex = byCol[overContainer].findIndex((i) => i.id === over.id);
        if (oldIndex < 0) return prev;
        const [moved] = byCol[activeContainer].splice(oldIndex, 1);
        byCol[overContainer].splice(newIndex >= 0 ? newIndex : byCol[overContainer].length, 0, {
          ...moved,
          status: overContainer as TodoItem['status'],
        });
      }

      const next: TodoItem[] = [];
      Object.keys(byCol).forEach((k) => {
        byCol[k].forEach((item, idx) => next.push({ ...item, priority: idx, status: k as TodoItem['status'] }));
      });

      const payload: { id: number; priority: number; status: string }[] = next.map((i) => ({
        id: i.id,
        priority: i.priority,
        status: i.status,
      }));
      reorderMutation.mutate(payload);
      return next;
    });
  };

  const handleSaveDetails = () => {
    if (!editDraft) return;
    updateMutation.mutate({
      id: editDraft.id,
      title: editDraft.title,
      author: editDraft.author,
      description: editDraft.description,
      status: editDraft.status,
    });
    setSelectedItem(null);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!selectedItem) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          uploadAttachmentMutation.mutate({ id: selectedItem.id, file });
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-50 text-xs font-semibold uppercase tracking-[0.2em]">
              <Sparkles className="h-4 w-4" /> Mini Trello
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Sprint Board</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">Drag & drop, editable cards</span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">Move cards between columns, open to update title, author, status, description.</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-2 top-3" />
              <Input
                className="pl-8 w-64"
                placeholder="Search by title or author"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New card</DialogTitle>
                  <DialogDescription>Enter title, author, and description in rich text.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {createError && (
                    <div className="rounded-md border border-red-300 bg-red-50 text-red-700 text-sm px-3 py-2">
                      {createError}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Author</Label>
                      <Input value={newTask.author} onChange={(e) => setNewTask((p) => ({ ...p, author: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <TrixEditor
                      value={activeEditor}
                      onChange={(html) => {
                        setActiveEditor(html);
                        setNewTask((p) => ({ ...p, description: html }));
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-2 text-slate-500"><Wand2 className="h-4 w-4" /> New cards start in Backlog.</div>
                    <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newTask.title.trim() || !newTask.author.trim()}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-6 pb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full overflow-x-auto">
              <div className="flex gap-4 min-w-[1000px]">
                {statusColumns.map((col) => (
                  <KanbanColumn
                    key={col.key}
                    col={col}
                    items={grouped[col.key]}
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(v) => !v && setSelectedItem(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto" onPaste={handlePaste}>
          {editDraft && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-slate-900/10 text-slate-900 border-slate-200">{editDraft.author || 'Anon'}</Badge>
                    <Badge variant="outline">{statusColumns.find((s) => s.key === editDraft.status)?.label}</Badge>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> id {editDraft.id}</span>
                  </div>
                  <Input
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <Label>Author</Label>
                  <Input
                    value={editDraft.author}
                    onChange={(e) => setEditDraft((p) => (p ? { ...p, author: e.target.value } : p))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <TrixEditor
                  value={editDraft.description || ''}
                  onChange={(html) => setEditDraft((p) => (p ? { ...p, description: html } : p))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editDraft.comments.map((c) => (
                    <div key={c.id} className="bg-muted/40 px-3 py-2 rounded text-sm border border-muted">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{c.author}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">{c.content}</div>
                    </div>
                  ))}
                </div>
                <CommentForm onSubmit={(content, author) => selectedItem && addCommentMutation.mutate({ id: selectedItem.id, content, author })} />
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedItem) {
                        uploadAttachmentMutation.mutate({ id: selectedItem.id, file });
                        e.target.value = ''; // Reset to allow same file selection
                      }
                    }}
                    disabled={uploadAttachmentMutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs bg-slate-100"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAttachmentMutation.isPending}
                  >
                    {uploadAttachmentMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    {uploadAttachmentMutation.isPending ? 'Uploading...' : 'Add File'}
                  </Button>
                </div>

                {uploadAttachmentMutation.isPending && (
                  <div className="flex items-center gap-2 px-3 py-2 border border-blue-100 bg-blue-50/50 rounded-lg animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Uploading file... please wait</span>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Tips: You can paste screenshots directly (Cmd+V)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {editDraft.attachments.map((a) => (
                    <div key={a.id} className="group relative flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
                      <div className="h-10 w-10 shrink-0 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                        {a.mime_type?.startsWith('image/') ? (
                          <img src={a.url} alt={a.title} className="h-full w-full object-cover" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="text-xs font-medium truncate">{a.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {a.size_bytes ? `${(a.size_bytes / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={a.url} target="_blank" rel="noopener noreferrer" title="View/Download">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Download className="h-3 w-3" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => selectedItem && deleteAttachmentMutation.mutate({ todoId: selectedItem.id, attachmentId: a.id })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {editDraft.attachments.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/30">
                      No attachments yet. Drag & drop or paste screenshots.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="destructive" onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
                  <Button onClick={handleSaveDetails} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (content: string, author: string) => void }) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <Textarea
        placeholder="Add a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            if (!content.trim()) return;
            onSubmit(content.trim(), author || 'Anon');
            setContent('');
          }}
        >
          Post
        </Button>
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  items,
  onSelect,
}: {
  col: typeof statusColumns[number];
  items: TodoItem[];
  onSelect: (item: TodoItem | null) => void;
}) {
  const { setNodeRef } = useDroppable({ id: col.key, data: { containerId: col.key } });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[240px]">
      <div className={`rounded-xl p-3 space-y-3 ${col.color} border ${col.accent}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
            <div className="font-semibold text-sm tracking-tight">{col.label}</div>
          </div>
          <Badge variant="outline">{items.length}</Badge>
        </div>
        <SortableContext id={col.key} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[120px]">
            {items.map((item) => (
              <SortableCard key={item.id} id={item.id} columnKey={col.key} onSelect={onSelect} item={item} accent={col.accent} />
            ))}
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-slate-200 rounded-lg">Drag here or create a card.</div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({
  id,
  columnKey,
  onSelect,
  item,
  accent,
}: {
  id: number | string;
  columnKey: string;
  onSelect: (item: TodoItem | null) => void;
  item: TodoItem;
  accent: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { sortable: { containerId: columnKey }, containerId: columnKey },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    cursor: 'grab',
  };
  return (
    <Card ref={setNodeRef} style={style} className={`shadow-sm border ${accent} bg-white cursor-pointer`} onClick={() => onSelect(item)}>
      <CardContent className="py-3 flex items-center gap-2">
        <span className="p-1" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className={`font-semibold ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {item.title}
        </div>
      </CardContent>
    </Card>
  );
}
