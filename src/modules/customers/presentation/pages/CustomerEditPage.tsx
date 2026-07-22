import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { QueryState } from "@/shared/ui/QueryState";
import { useCustomerQuery, useUpdateCustomer } from "../api/queries";
import { CustomerForm } from "../ui/CustomerForm";

export function CustomerEditPage() {
  const nav = useNavigate({ from: "/app/customers/$id/edit" });
  const { id } = useParams({ from: "/app/customers/$id/edit" });
  const { data, ...result } = useCustomerQuery(id);
  const updateCustomer = useUpdateCustomer(id);

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ແກ້ໄຂລູກຄ້າ</h2>
            <p className="text-muted-foreground">ປັບປຸງລາຍລະອຽດຂອງລູກຄ້າ.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/customers" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <QueryState
          result={result}
          title="ກໍາລັງໂຫຼດລູກຄ້າ"
          description="ກໍາລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!data ? null : (
            <div className="mt-6 rounded-xl border bg-card p-6">
              <CustomerForm
                initialValues={{
                  type: (data.type as "company" | "individual") ?? "company",
                  name: data.name ?? "",
                  nameLocal: data.nameLocal ?? "",
                  email: data.email ?? "",
                  phone: data.phone ?? "",
                  whatsapp: data.whatsapp ?? "",
                  address: data.address ?? "",
                  taxId: data.taxId ?? "",
                  notes: data.notes ?? "",
                }}
                onSubmit={async (vals) => {
                  try {
                    await updateCustomer.mutateAsync({
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
                    toast.success("ແກ້ໄຂລູກຄ້າສໍາເລັດ");
                    nav({ to: "/app/customers" });
                  } catch {
                    // handled by mutation
                  }
                }}
                submitting={updateCustomer.isPending}
              />
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
