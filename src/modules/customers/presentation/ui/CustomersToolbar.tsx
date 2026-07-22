import { PlusIcon } from "lucide-react";
import { Button } from "@/components/kit";

type CustomersToolbarProps = {
  canManage: boolean;
  onCreate: () => void;
};

export function CustomersToolbar({
  canManage,
  onCreate,
}: CustomersToolbarProps) {
  return (
    <div className="mb-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">ລູກຄ້າ</h2>
          <p className="text-muted-foreground">ຈັດການລູກຄ້າໃນລະບົບ.</p>
        </div>
        {canManage && (
          <Button onClick={onCreate}>
            <PlusIcon className="h-4 w-4" />
            ສ້າງລູກຄ້າ
          </Button>
        )}
      </div>
    </div>
  );
}
