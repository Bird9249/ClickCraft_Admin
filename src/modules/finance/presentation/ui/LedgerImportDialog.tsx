import { FileUpIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  confirm,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLayout,
  Label,
  RadioGroup,
  RadioGroupItem,
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
import { Input } from "@/components/ui/input";
import { useImportLedgerCsv } from "../api/queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LedgerImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("replace");
  const importCsv = useImportLedgerCsv();

  const reset = () => {
    setFile(null);
    setMode("replace");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("ກະລຸນາເລືອກໄຟລ໌ CSV");
      return;
    }

    if (mode === "replace") {
      const ok = await confirm({
        title: "ແທນທີ່ຂໍ້ມູນທັງໝົດ?",
        description:
          "ລາຍການລາຍຮັບ-ລາຍຈ່າຍເກົ່າທັງໝົດຈະຖືກລຶບ ແລ້ວນຳເຂົ້າຈາກ CSV ໃໝ່. ການກະທໍານີ້ບໍ່ສາມາດຍົກເລີກໄດ້.",
        actionText: "ແທນທີ່ແລ້ວນຳເຂົ້າ",
        ActionProps: { variant: "destructive" },
      });
      if (!ok) return;
    }

    try {
      await importCsv.mutateAsync({ file, mode });
      handleOpenChange(false);
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ນຳເຂົ້າ CSV</DialogTitle>
          <DialogDescription>
            ອັບໂຫຼດໄຟລ໌ CSV ຮູບແບບ ClickCraft (ວັນທີ, ປະເພດ, ລາຍການ,
            ຈໍານວນເງິນ, ຜູ້ກ່ຽວຂ້ອງ)
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <FieldLayout>
            <FieldLabel htmlFor="ledger-csv-file">ໄຟລ໌ CSV</FieldLabel>
            <FieldContent>
              <Input
                id="ledger-csv-file"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <FieldDescription>
                  ເລືອກແລ້ວ: {file.name} ({Math.ceil(file.size / 1024)} KB)
                </FieldDescription>
              ) : (
                <FieldDescription>
                  ຕົວຢ່າງ: Income Expense ClickCraft - ລາຍການ.csv
                </FieldDescription>
              )}
            </FieldContent>
          </FieldLayout>

          <FieldLayout>
            <FieldLabel>ໂໝດນຳເຂົ້າ</FieldLabel>
            <FieldContent>
              <RadioGroup
                value={mode}
                onValueChange={(v) =>
                  setMode(v as "append" | "replace")
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="replace" id="import-replace" />
                  <Label htmlFor="import-replace">
                    ແທນທີ່ທັງໝົດ (ແນະນຳສໍາລັບ prod ຄັ້ງທໍາອິດ)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="append" id="import-append" />
                  <Label htmlFor="import-append">
                    ເພີ່ມຕໍ່ທ້າຍ (ບໍ່ລຶບລາຍການເກົ່າ)
                  </Label>
                </div>
              </RadioGroup>
            </FieldContent>
          </FieldLayout>

          {mode === "replace" ? (
            <Alert variant="destructive">
              <AlertTitle>ຄຳເຕືອນ</AlertTitle>
              <AlertDescription>
                ໂໝດແທນທີ່ຈະລຶບລາຍການລາຍຮັບ-ລາຍຈ່າຍທັງໝົດກ່ອນນຳເຂົ້າໃໝ່
              </AlertDescription>
            </Alert>
          ) : null}
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
            onClick={handleImport}
            isLoading={importCsv.isPending}
            disabled={!file}
          >
            <FileUpIcon data-icon="inline-start" />
            ນຳເຂົ້າ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
