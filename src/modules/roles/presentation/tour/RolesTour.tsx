import { BrandTour, type BrandTourEvent } from "@/components/brand/BrandTour";
import { rolesTourSteps } from "./tourSteps";

type RolesTourProps = {
  run: boolean;
  onCallback: (data: BrandTourEvent) => void;
};

export function RolesTour({ run, onCallback }: RolesTourProps) {
  return (
    <BrandTour steps={rolesTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useRolesTour } from "./useRolesTour";
