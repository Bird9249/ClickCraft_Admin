import { BrandTour, type BrandTourEvent } from "@/components/brand/BrandTour";
import { roleFormTourSteps } from "./formTourSteps";

type RoleFormTourProps = {
  run: boolean;
  onCallback: (data: BrandTourEvent) => void;
};

export function RoleFormTour({ run, onCallback }: RoleFormTourProps) {
  return (
    <BrandTour steps={roleFormTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useRoleFormTour } from "./useRoleFormTour";
