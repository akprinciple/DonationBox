import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const donor = accounts.get("wallet_1")!;

describe("donation", () => {
  it("sets the deployer as the donation treasury", () => {
    const { result } = simnet.callReadOnlyFn("donation", "get-treasury", [], deployer);
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("transfers STX to the treasury and records donation totals", () => {
    const donorBalanceBefore = simnet.getAssetsMap().get("STX")?.get(donor) ?? 0n;
    const treasuryBalanceBefore = simnet.getAssetsMap().get("STX")?.get(deployer) ?? 0n;

    const { result } = simnet.callPublicFn(
      "donation",
      "donate",
      [Cl.uint(2_500_000)],
      donor,
    );

    expect(result).toBeOk(Cl.uint(2_500_000));
    expect(simnet.getAssetsMap().get("STX")?.get(donor)).toBe(donorBalanceBefore - 2_500_000n);
    expect(simnet.getAssetsMap().get("STX")?.get(deployer)).toBe(treasuryBalanceBefore + 2_500_000n);
    expect(
      simnet.callReadOnlyFn("donation", "get-total-donated", [], deployer).result,
    ).toBeOk(Cl.uint(2_500_000));
    expect(
      simnet.callReadOnlyFn("donation", "get-donation-count", [], deployer).result,
    ).toBeOk(Cl.uint(1));
    expect(
      simnet.callReadOnlyFn(
        "donation",
        "get-donor-total",
        [Cl.principal(donor)],
        deployer,
      ).result,
    ).toBeOk(Cl.uint(2_500_000));
  });

  it("rejects zero-value donations", () => {
    const { result } = simnet.callPublicFn("donation", "donate", [Cl.uint(0)], donor);
    expect(result).toBeErr(Cl.uint(1));
  });
});
