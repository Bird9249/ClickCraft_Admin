import { BrandTour, type BrandTourEvent } from "@/components/brand/BrandTour";
import { usersTourSteps } from "./tourSteps";

type UsersTourProps = {
  run: boolean;
  onCallback: (data: BrandTourEvent) => void;
};

export function UsersTour({ run, onCallback }: UsersTourProps) {
  return (
    <BrandTour steps={usersTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useUsersTour } from "./useUsersTour";
