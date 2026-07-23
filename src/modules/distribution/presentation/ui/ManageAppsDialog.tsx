import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/kit";
import { useCreateApp, useDistributionAppsQuery } from "../api/queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite?: boolean;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function ManageAppsDialog({ open, onOpenChange, canWrite }: Props) {
  const appsQuery = useDistributionAppsQuery();
  const createApp = useCreateApp();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSlug("");
    setSlugTouched(false);
  }, [open]);

  const onSubmit = async () => {
    const nextSlug = slugTouched ? slug.trim() : slugify(name);
    if (!name.trim() || !nextSlug) return;
    await createApp.mutateAsync({ name: name.trim(), slug: nextSlug });
    setName("");
    setSlug("");
    setSlugTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ຈັດການແອັບ</DialogTitle>
          <DialogDescription>ສ້າງແອັບເພີ່ມເພື່ອແຍກ Android release</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {(appsQuery.data?.data ?? []).map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{app.name}</p>
                <p className="font-mono text-muted-foreground text-xs">
                  {app.slug}
                </p>
              </div>
            </div>
          ))}
          {(appsQuery.data?.data?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">ຍັງບໍ່ມີແອັບ</p>
          )}
        </div>

        {canWrite && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="font-medium text-sm">ເພີ່ມແອັບ</p>
            <Input
              value={name}
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                if (!slugTouched) setSlug(slugify(next));
              }}
              placeholder="ຊື່ແອັບ"
            />
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="slug (kebab-case)"
            />
            <Button
              onClick={onSubmit}
              disabled={createApp.isPending || !name.trim() || !slug.trim()}
            >
              {createApp.isPending ? "ກໍຳລັງສ້າງ..." : "ສ້າງແອັບ"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ປິດ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
