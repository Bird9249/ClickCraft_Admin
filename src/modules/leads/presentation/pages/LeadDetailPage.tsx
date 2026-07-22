import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, Textarea, toast } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { LeadFeatureDTO } from "@/modules/leads/domain/contracts";
import { formatDateLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useLeadActions, useLeadQuery, useUpdateLead } from "../api/queries";
import { LeadStatusBadge } from "../ui/LeadStatusBadge";

export function LeadDetailPage() {
  const nav = useNavigate({ from: "/app/leads/$id" });
  const { id } = useParams({ from: "/app/leads/$id" });
  const { data, ...result } = useLeadQuery(id);
  const updateLead = useUpdateLead(id);
  const actions = useLeadActions(id);
  const canUpdate = useActionPermission(["leads:update"]);
  const canConvert = useActionPermission(["leads:convert"]);
  const [notes, setNotes] = useState<string | null>(null);

  const features = (data?.selectedFeatures ?? []) as LeadFeatureDTO[];
  const notesValue = notes ?? data?.notes ?? "";
  const isConverted = data?.status === "converted";
  const isLost = data?.status === "lost";

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              {"ລາຍລະອຽດຄຳຂໍ"}
            </h2>
            <p className="text-muted-foreground">
              {"ຄຳຂໍໃບສະເໜີລາຄາຈາກ Website"}
            </p>
          </div>
          <Button variant="outline" onClick={() => nav({ to: "/app/leads" })}>
            <ArrowLeftIcon className="size-4" />
            {"ກັບຄືນ"}
          </Button>
        </div>

        <QueryState
          result={result}
          title="ກໍາລັງໂຫຼດ"
          description="ກໍາລັງດຶງຂໍ້ມູນ lead"
          variant="fullscreen"
        >
          {!data ? null : (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 rounded-xl border bg-card p-6 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg">{data.companyName}</h3>
                    <p className="text-muted-foreground text-sm">
                      {data.contactName} {"·"} {data.phone}
                    </p>
                  </div>
                  <LeadStatusBadge status={data.status} />
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{"ທີ່ຢູ່"}</dt>
                    <dd>{data.addressText}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{"ແພັກເກັດ / ເຟສ"}</dt>
                    <dd>
                      {data.presetName ?? data.presetId}
                      {data.phaseLabel ? ` — ${data.phaseLabel}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{"ຍອດປະມານ"}</dt>
                    <dd className="tabular-nums">
                      {data.estimatedSubtotal.toLocaleString()} {data.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{"ວັນທີສົ່ງ"}</dt>
                    <dd>{formatDateLocal(data.createdAt)}</dd>
                  </div>
                  {data.sourceUrl ? (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">{"ລິ້ງແຫຼ່ງທີ່ມາ"}</dt>
                      <dd className="truncate">
                        <a
                          href={data.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {data.sourceUrl}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div>
                  <h4 className="mb-2 font-medium">{"ຟີເຈີທີ່ເລືອກ"}</h4>
                  <ul className="divide-y rounded-lg border">
                    {features.map((f) => (
                      <li
                        key={f.key}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="text-muted-foreground">
                            [{f.phaseLabel}]{" "}
                          </span>
                          {f.label}
                        </span>
                        <span className="tabular-nums">
                          {f.priceLak.toLocaleString()} {data.currency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border bg-card p-4">
                  <h4 className="font-medium">{"ການດຳເນີນການ"}</h4>
                  {canUpdate && !isConverted ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled={
                        actions.markContacted.isPending ||
                        data.status === "contacted"
                      }
                      onClick={() => actions.markContacted.mutate()}
                    >
                      {"ມາກວ່າຕິດຕໍ່ແລ້ວ"}
                    </Button>
                  ) : null}
                  {canConvert && !isConverted && !isLost ? (
                    <Button
                      className="w-full"
                      disabled={actions.convert.isPending}
                      onClick={async () => {
                        try {
                          const res = await actions.convert.mutateAsync();
                          nav({
                            to: "/app/quotations/$id/edit",
                            params: { id: res.quotationId },
                          });
                        } catch {
                          // toast handled
                        }
                      }}
                    >
                      {"ແປງເປັນລູກຄ້າ + ໃບສະເໜີລາຄາ"}
                    </Button>
                  ) : null}
                  {canUpdate && !isConverted && !isLost ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={actions.markLost.isPending}
                      onClick={() => actions.markLost.mutate()}
                    >
                      {"ປິດຄຳຂໍ"}
                    </Button>
                  ) : null}
                  {isConverted && data.quotationId ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link
                        to="/app/quotations/$id/edit"
                        params={{ id: data.quotationId }}
                      >
                        {"ເປີດໃບສະເໜີລາຄາ"}
                      </Link>
                    </Button>
                  ) : null}
                  {isConverted && data.customerId ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link
                        to="/app/customers/$id/edit"
                        params={{ id: data.customerId }}
                      >
                        {"ເປີດລູກຄ້າ"}
                      </Link>
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-xl border bg-card p-4">
                  <h4 className="font-medium">{"ໝາຍເຫດທີມ"}</h4>
                  <Textarea
                    rows={5}
                    value={notesValue}
                    disabled={!canUpdate}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  {canUpdate ? (
                    <Button
                      size="sm"
                      disabled={updateLead.isPending}
                      onClick={async () => {
                        try {
                          await updateLead.mutateAsync({ notes: notesValue });
                          toast.success("ບັນທຶກໝາຍເຫດແລ້ວ");
                          setNotes(null);
                        } catch {
                          // handled
                        }
                      }}
                    >
                      {"ບັນທຶກໝາຍເຫດ"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
