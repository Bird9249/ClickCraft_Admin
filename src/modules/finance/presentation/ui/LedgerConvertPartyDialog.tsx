import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLayout,
  Label,
  RadioGroup,
  RadioGroupItem,
  confirm,
  toast,
} from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomerDTO } from "@/modules/customers/domain/contracts";
import { config } from "@/shared/lib/config";
import { fetchLookupForInfinite, hydrateLookupItem } from "@/shared/lib/utils";
import { InfiniteCombobox } from "@/shared/ui/InfiniteCombobox";
import { ArrowRightIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useConvertLedgerParty,
  useConvertibleRelatedPartiesQuery,
} from "../api/queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LedgerConvertPartyDialog({ open, onOpenChange }: Props) {
  const parties = useConvertibleRelatedPartiesQuery(open);
  const convertParty = useConvertLedgerParty();
  const [sourceRelatedParty, setSourceRelatedParty] = useState("");
  const [customerId, setCustomerId] = useState("");

  const selectedParty = useMemo(
    () => parties.data?.find((p) => p.name === sourceRelatedParty),
    [parties.data, sourceRelatedParty],
  );

  const reset = () => {
    setSourceRelatedParty("");
    setCustomerId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleConvert = async () => {
    if (!sourceRelatedParty) {
      toast.error("ກະລຸນາເລືອກຜູ້ກ່ຽວຂ້ອງ");
      return;
    }
    if (!customerId) {
      toast.error("ກະລຸນາເລືອກລູກຄ້າ");
      return;
    }

    const ok = await confirm({
      title: "ແປງຜູ້ກ່ຽວຂ້ອງເປັນລູກຄ້າ",
      description: `ຈະອັບເດດ ${selectedParty?.entryCount ?? 0} ລາຍການຈາກ "${sourceRelatedParty}" ໃຫ້ເປັນລູກຄ້າທີ່ເລືອກ. ການກະທໍານີ້ບໍ່ສາມາດຍົກເລີກໄດ້.`,
      actionText: "ແປງ",
      ActionProps: { variant: "default" },
    });
    if (!ok) return;

    try {
      await convertParty.mutateAsync({
        sourceRelatedParty,
        customerId,
      });
      handleOpenChange(false);
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ແປງຜູ້ກ່ຽວຂ້ອງເປັນລູກຄ້າ</DialogTitle>
          <DialogDescription>
            ເລືອກຊື່ຜູ້ກ່ຽວຂ້ອງຈາກ CSV ແລ້ວຜູກກັບລູກຄ້າໃນລະບົບ — ລາຍການທັງໝົດທີ່ມີຊື່ນັ້ນຈະຖືກອັບເດດ
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <FieldLayout>
            <FieldLabel>ຜູ້ກ່ຽວຂ້ອງ (ຕົ້ນທາງ)</FieldLabel>
            <FieldContent>
              {parties.isLoading ? (
                <FieldDescription>ກໍາລັງໂຫຼດ...</FieldDescription>
              ) : (parties.data?.length ?? 0) === 0 ? (
                <FieldDescription>ບໍ່ມີຜູ້ກ່ຽວຂ້ອງທີ່ຍັງບໍ່ໄດ້ຜູກລູກຄ້າ</FieldDescription>
              ) : (
                <RadioGroup
                  value={sourceRelatedParty}
                  onValueChange={setSourceRelatedParty}
                  className="max-h-48 flex-col gap-2 overflow-y-auto"
                >
                  {parties.data?.map((party) => (
                    <div key={party.name} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={party.name}
                        id={`party-${party.name}`}
                      />
                      <Label
                        htmlFor={`party-${party.name}`}
                        className="flex flex-1 cursor-pointer justify-between font-normal"
                      >
                        <span>{party.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {party.entryCount} ລາຍການ
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </FieldContent>
          </FieldLayout>

          {selectedParty ? (
            <Alert>
              <AlertTitle>ຈະອັບເດດ {selectedParty.entryCount} ລາຍການ</AlertTitle>
              <AlertDescription className="flex items-center gap-2">
                <span>{sourceRelatedParty}</span>
                <ArrowRightIcon className="size-4 shrink-0" />
                <span>ລູກຄ້າໃນລະບົບ</span>
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldLayout>
            <FieldLabel>ລູກຄ້າ (ປາຍທາງ)</FieldLabel>
            <FieldContent>
              <InfiniteCombobox<CustomerDTO>
                queryKey={["customers-lookup-convert"]}
                queryFn={(args) =>
                  fetchLookupForInfinite(
                    `${config.apiUrl}/customers/lookup`,
                    args,
                  )
                }
                preloadQueryFn={(id) =>
                  hydrateLookupItem(`${config.apiUrl}/customers/lookup`, id)
                }
                getLabel={(item) => item.name}
                getValue={(item) => item.id}
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="ເລືອກລູກຄ້າ..."
              />
            </FieldContent>
          </FieldLayout>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            ຍົກເລີກ
          </Button>
          <Button
            type="button"
            onClick={handleConvert}
            isLoading={convertParty.isPending}
            disabled={!sourceRelatedParty || !customerId}
          >
            ແປງ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
