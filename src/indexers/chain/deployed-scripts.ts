import { getAddressDetailsSafe } from "@teiki/protocol/helpers/lucid";

import { $handlers } from "../../framework/chain";

import { TeikiChainIndexContext } from "./context";

export type Event = { type: "deployed_scripts"; indicies: number[] };
const $ = $handlers<TeikiChainIndexContext, Event>();

export const filter = $.filter(
  ({
    tx,
    context: {
      config: { ALWAYS_FAIL_SCRIPT_HASH, PROTOCOL_SCRIPT_V_SCRIPT_HASH },
    },
  }) => {
    const indicies: number[] = [];
    for (const [index, { address }] of tx.body.outputs.entries()) {
      try {
        const scriptHash =
          getAddressDetailsSafe(address)?.paymentCredential?.hash;
        if (
          scriptHash === ALWAYS_FAIL_SCRIPT_HASH ||
          scriptHash === PROTOCOL_SCRIPT_V_SCRIPT_HASH
        )
          indicies.push(index);
      } catch (e) {
        if (
          !(e instanceof Error) ||
          e.message.includes("No address type matched for")
        )
          throw e;
      }
    }
    return indicies.length ? [{ type: "deployed_scripts", indicies }] : null;
  }
);

export const event = $.event(async ({ driver, event: { indicies } }) => {
  // TODO: Better tags...
  await driver.storeWithScript(indicies, (o) => ["script", o]);
});
