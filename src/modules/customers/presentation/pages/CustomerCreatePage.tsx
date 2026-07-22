import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { useCreateCustomer } from "../api/queries";
import { CustomerForm } from "../ui/CustomerForm";

export function CustomerCreatePage() {
  const nav = useNavigate({ from: "/app/customers/create" });
  const createCustomer = useCreateCustomer();

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ສ້າງລູກຄ້າ</h2>
            <p className="text-muted-foreground">ສ້າງລູກຄ້າໃໝ່ໃນລະບົບ.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/customers" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>
        <div className="mt-6 rounded-xl border bg-card p-6">
          <CustomerForm
            onSubmit={async (vals) => {
              try {
                await createCustomer.mutateAsync({
                  type: vals.type,
                  name: vals.name,
                  nameLocal: vals.nameLocal || null,
                  email: vals.email || null,
                  phone: vals.phone || null,
                  whatsapp: vals.whatsapp || null,
                  address: vals.address || null,
                  taxId: vals.taxId || null,
                  notes: vals.notes || null,
                });
                toast.success("ສ້າງລູກຄ້າສໍາເລັດ");
                nav({ to: "/app/customers" });
              } catch {
                // handled by mutation
              }
            }}
            submitting={createCustomer.isPending}
          />
        </div>
      </Main>
    </>
  );
}
