<<<<<<< HEAD
import {
  NewGauge,
  RewardsOnlyGaugeCreated,
} from "../../generated/GaugeController/GaugeController";
=======
import { NewGauge } from "../../generated/GaugeController/GaugeController";
>>>>>>> b5219fd (Squashed All)
import { Gauge as GaugeTemplate } from "../../generated/templates";

export function handleNewGauge(event: NewGauge): void {
  const gaugeAddress = event.params.addr;

  GaugeTemplate.create(gaugeAddress);
}
<<<<<<< HEAD

export function handleRewardsOnlyGaugeCreated(
  event: RewardsOnlyGaugeCreated
): void {
  const gaugeAddress = event.params.gauge;

  GaugeTemplate.create(gaugeAddress);
}
=======
>>>>>>> b5219fd (Squashed All)
