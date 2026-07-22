import { z } from "zod";
import {
  Button,
  FormActions,
  FormInput,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { SimpleSelect } from "@/shared/ui/SimpleSelect";

const CustomerFormSchema = z.object({
  type: z.enum(["company", "individual"]),
  name: z.string().min(1, "ຕ້ອງໃສ່ຊື່"),
  nameLocal: z.string().optional(),
  email: z.string().email("ອີເມວໃຫ້ຖືກຕ້ອງ").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

export function CustomerForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  submitting?: boolean;
}) {
  const methods = RHF.useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      type: "company",
      name: "",
      nameLocal: "",
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      taxId: "",
      notes: "",
      ...initialValues,
    },
  });

  return (
    <FormRoot<CustomerFormValues>
      methods={methods}
      onSubmit={(vals) => onSubmit(vals)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">ປະເພດ</label>
          <SimpleSelect
            value={methods.watch("type")}
            onValueChange={(v) =>
              methods.setValue("type", v as "company" | "individual")
            }
            options={[
              { value: "company", label: "ບໍລິສັດ" },
              { value: "individual", label: "ບຸກຄົນ" },
            ]}
            placeholder="ເລືອກປະເພດ"
          />
        </div>
        <FormInput name="name" label="ຊື່" requiredMark placeholder="ຊື່ລູກຄ້າ" />
        <FormInput name="nameLocal" label="ຊື່ທ້ອງຖິ່ນ" placeholder="ຊື່ພາສາທ້ອງຖິ່ນ" />
        <FormInput name="taxId" label="ເລກທີ່ຜູ້ເສຍພາສີ" placeholder="0000000000000" />
        <FormInput name="email" label="ອີເມວ" type="email" placeholder="example@email.com" />
        <FormInput name="phone" label="ໂທລະສັບ" placeholder="+856 20 XXXX XXXX" />
        <FormInput name="whatsapp" label="WhatsApp" placeholder="+856 20 XXXX XXXX" />
        <div className="md:col-span-2">
          <FormTextarea name="address" label="ທີ່ຢູ່" placeholder="ທີ່ຢູ່ລູກຄ້າ" />
        </div>
        <div className="md:col-span-2">
          <FormTextarea name="notes" label="ໝາຍເຫດ" placeholder="ໝາຍເຫດເພີ່ມເຕີມ" />
        </div>
      </div>

      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
