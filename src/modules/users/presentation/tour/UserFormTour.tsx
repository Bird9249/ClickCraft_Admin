import { BrandTour, type BrandTourEvent } from "@/components/brand/BrandTour";
import { userFormTourSteps } from "./formTourSteps";

type UserFormTourProps = {
  run: boolean;
  onCallback: (data: BrandTourEvent) => void;
};

export function UserFormTour({ run, onCallback }: UserFormTourProps) {
  return (
    <BrandTour steps={userFormTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useUserFormTour } from "./useUserFormTour";
