import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  toast,
} from "@/components/kit";
import {
  financeSettingsApi,
  type FinanceSettingsDTO,
} from "@/modules/finance/presentation/api/client";
import { ImageKeyUploadField } from "@/shared/ui/ImageKeyUploadField";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function BankPaymentSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["finance-settings"],
    queryFn: () => financeSettingsApi.get(),
  });

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrImageKey, setQrImageKey] = useState("");
  const [autoLedgerOnPayment, setAutoLedgerOnPayment] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setBankName(data.bankName ?? "");
    setAccountName(data.accountName ?? "");
    setAccountNumber(data.accountNumber ?? "");
    setQrImageKey(data.qrImageKey ?? "");
    setAutoLedgerOnPayment(data.autoLedgerOnPayment ?? false);
  }, [data]);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated: FinanceSettingsDTO = await financeSettingsApi.update({
        bankName: bankName.trim() || null,
        accountName: accountName.trim() || null,
        accountNumber: accountNumber.trim() || null,
        qrImageKey: qrImageKey.trim() || null,
        autoLedgerOnPayment,
      });
      qc.setQueryData(["finance-settings"], updated);
      toast.success("ບັນທຶກຂໍ້ມູນບັນຊີທະນາຄານສໍາເລັດ");
    } catch {
      // fetcher toasts
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ບັນຊີທະນາຄານ (ໃບເກັບເງິນ)</CardTitle>
        <CardDescription>
          ຕັ້ງຄ່າທົ່ວໂລກ — ຈະສະແດງໃນ PDF ໃບເກັບເງິນ ທຸກໃບ (ຊື່ບັນຊີ, ເລກບັນຊີ, QR code).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">ກໍາລັງໂຫຬດ...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankName">ຊື່ທະນາຄານ</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCEL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">ຊື່ບັນຊີ</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accountNumber">ເລກບັນຊີ</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                  className="font-mono"
                />
              </div>
            </div>

            <ImageKeyUploadField
              label="QR code ຊຳລະເງິນ"
              value={qrImageKey}
              onChange={setQrImageKey}
              keyPrefix="uploads/finance/bank-qr"
              aspectRatio="aspect-square"
              aspectHint="1:1"
              widthPx={400}
              heightPx={400}
            />

            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="autoLedgerOnPayment">ບັນທຶກລາຍຮັບອັດຕະໂນມັດ</Label>
                <p className="text-muted-foreground text-sm">
                  ເມື່ອຮັບຊຳລະເງິນ (Payment) ຈະສ້າງລາຍການໃນສະຫມຸດລາຍຮັບ-ລາຍຈ່າຍອັດຕະໂນມັດ.
                  ຍົກເລີກໃບເສັດ → ລຶບລາຍການ ledger ທີ່ເຊື່ອມກັນ.
                </p>
              </div>
              <Switch
                id="autoLedgerOnPayment"
                checked={autoLedgerOnPayment}
                onCheckedChange={setAutoLedgerOnPayment}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={onSave} isLoading={saving}>
                ບັນທຶກ
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
