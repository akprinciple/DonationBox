'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Cl, Pc } from '@stacks/transactions';
import { useAtomValue } from 'jotai';
import deployments from '@/generated/deployments.json';
import {
  useDonation_Donate,
  useDonation_GetDonationCount,
  useDonation_GetDonorTotal,
  useDonation_GetTotalDonated,
  useDonation_GetTreasury,
} from '@/generated/hooks';
import { addressAtom } from '@/store/wallet';
import { scaffoldConfig } from '@/scaffold.config';

const MICRO_STX = 1_000_000n;
const PRESETS = ['1', '5', '10', '25'];
const contractId = (
  deployments.contracts as Record<string, { contract_id?: string }>
).donation?.contract_id;

function readResponse<T>(
  raw: unknown,
  isValue: (value: unknown) => value is T,
): T | null {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('ok' in raw) ||
    raw.ok !== true ||
    !('value' in raw)
  ) {
    return null;
  }
  return isValue(raw.value) ? raw.value : null;
}

function parseStxAmount(value: string): bigint | null {
  const match = value.trim().match(/^(\d+)(?:\.(\d{1,6}))?$/);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(6, '0') || '0');
  const amount = whole * MICRO_STX + fraction;
  return amount > 0n ? amount : null;
}

function formatStx(amount: bigint | null, maximumFractionDigits = 2): string {
  if (amount === null) return '—';
  const whole = amount / MICRO_STX;
  const fraction = amount % MICRO_STX;
  const fractionText = fraction
    .toString()
    .padStart(6, '0')
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, '');
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path d="M5 15 15 5M6 5h9v9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M20.3 5.7a5.1 5.1 0 0 0-7.2 0l-1.1 1.1-1.1-1.1a5.1 5.1 0 0 0-7.2 7.2l1.1 1.1L12 22l7.2-7.9 1.1-1.1a5.1 5.1 0 0 0 0-7.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DonationExperience() {
  const address = useAtomValue(addressAtom);
  const [amount, setAmount] = useState('5');
  const [formError, setFormError] = useState('');
  const donate = useDonation_Donate();
  const totalDonated = useDonation_GetTotalDonated();
  const donationCount = useDonation_GetDonationCount();
  const donorTotal = useDonation_GetDonorTotal();
  const treasury = useDonation_GetTreasury();
  const isDeployed = Boolean(contractId);

  const refreshStats = useCallback(async () => {
    await Promise.all([
      totalDonated.call(),
      donationCount.call(),
      treasury.call(),
      ...(address ? [donorTotal.call([Cl.principal(address)])] : []),
    ]);
  }, [address, donationCount.call, donorTotal.call, totalDonated.call, treasury.call]);

  useEffect(() => {
    if (!isDeployed) return;
    void refreshStats().catch((error: unknown) => {
      console.error('[donation] Unable to load on-chain donation stats:', error);
    });
  }, [isDeployed, refreshStats]);

  useEffect(() => {
    if (donate.txStatus === 'success') {
      void refreshStats().catch((error: unknown) => {
        console.error('[donation] Unable to refresh confirmed donation stats:', error);
      });
    }
  }, [donate.txStatus, refreshStats]);

  const parsedAmount = useMemo(() => parseStxAmount(amount), [amount]);
  const total = readResponse(totalDonated.data, (value): value is bigint => typeof value === 'bigint');
  const count = readResponse(donationCount.data, (value): value is bigint => typeof value === 'bigint');
  const contributed = readResponse(donorTotal.data, (value): value is bigint => typeof value === 'bigint');
  const treasuryAddress = readResponse(treasury.data, (value): value is string => typeof value === 'string');

  const handleDonate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!address) {
      setFormError('Connect your Stacks wallet to make a donation.');
      return;
    }
    if (!parsedAmount) {
      setFormError('Enter an amount greater than 0, with up to 6 decimal places.');
      return;
    }

    try {
      await donate.call(
        [Cl.uint(parsedAmount)],
        [Pc.principal(address).willSendEq(parsedAmount).ustx()],
      );
    } catch {
      setFormError('Your wallet could not submit the transaction. Check your wallet and try again.');
    }
  };

  const transactionMessage = donate.txStatus === 'success'
    ? 'Donation confirmed. Thank you for backing open-source builders.'
    : donate.txStatus === 'pending'
      ? 'Transaction submitted. Waiting for a Stacks confirmation…'
      : donate.txStatus === 'abort_by_response'
        ? donate.txStatusError ?? 'The donation was rejected by the contract.'
        : donate.txStatus === 'error'
          ? donate.txStatusError ?? 'Transaction status could not be confirmed.'
          : donate.error
            ? 'The wallet request failed. Please try again.'
            : formError;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="relative">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#b9c0b4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bcf36a] shadow-[0_0_12px_#bcf36a]" />
            Built in the open · Powered by Stacks
          </div>
          <h1 className="max-w-2xl font-instrument text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#f4f2e9] sm:text-6xl lg:text-[76px]">
            Good tools make
            <br />
            <span className="text-[#bcf36a]">good things</span>
            <br />
            possible.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#a7aaa1] sm:text-lg sm:leading-8">
            Help Scaffold Stacks make building on Bitcoin feel effortless. Your
            support keeps the guides, tooling, and open-source work moving forward.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#8b9088]">
            <span className="inline-flex items-center gap-2">
              <span className="text-[#bcf36a]">↗</span> Open-source tooling
            </span>
            <span className="h-1 w-1 rounded-full bg-[#565a52]" />
            <span className="inline-flex items-center gap-2">
              <span className="text-[#bcf36a]">◈</span> Direct STX donations
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[40px] bg-[#b5e86d]/[0.06] blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-[#171a16] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full border border-[#bcf36a]/10" />
            <div className="absolute -right-7 -top-14 h-40 w-40 rounded-full border border-[#bcf36a]/10" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#828a7b]">
                    Keep the stack growing
                  </p>
                  <h2 className="mt-2 font-instrument text-2xl font-medium tracking-[-0.03em] text-[#f4f2e9]">
                    Make a contribution
                  </h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#bcf36a]/20 bg-[#bcf36a]/[0.08] text-[#bcf36a]">
                  <HeartMark />
                </div>
              </div>

              <form className="mt-8" onSubmit={handleDonate}>
                <label htmlFor="donation-amount" className="text-xs text-[#a2a79b]">
                  Choose an amount <span className="text-[#71766d]">(STX)</span>
                </label>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset);
                        setFormError('');
                      }}
                      aria-pressed={amount === preset}
                      className={`rounded-xl border px-2 py-3 font-mono text-sm transition ${
                        amount === preset
                          ? 'border-[#bcf36a] bg-[#bcf36a] text-[#171a16]'
                          : 'border-white/10 bg-white/[0.03] text-[#d9dbd2] hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center rounded-xl border border-white/10 bg-[#10120f] px-4 transition focus-within:border-[#bcf36a]/60">
                  <input
                    id="donation-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setFormError('');
                    }}
                    aria-describedby="amount-help"
                    className="w-full bg-transparent py-4 font-mono text-lg text-[#f4f2e9] outline-none placeholder:text-[#666b62]"
                    placeholder="0.00"
                  />
                  <span className="font-mono text-xs tracking-[0.14em] text-[#8e9488]">STX</span>
                </div>
                <p id="amount-help" className="mt-2 text-[11px] leading-5 text-[#747a70]">
                  Sent directly to the project treasury. Network fees are paid separately.
                </p>
                <button
                  type="submit"
                  disabled={!isDeployed || donate.loading || !parsedAmount || !address}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#bcf36a] px-5 py-4 font-instrument text-sm font-semibold text-[#171a16] transition hover:bg-[#cdf894] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {!isDeployed
                    ? 'Donation contract not deployed'
                    : donate.loading
                      ? 'Waiting for wallet…'
                      : !address
                        ? 'Connect wallet to donate'
                        : <>Donate {formatStx(parsedAmount, 6)} STX <ArrowUpRight /></>}
                </button>
                {!isDeployed && (
                  <p className="mt-3 text-center text-[11px] text-amber-200/80">
                    The contract is not deployed on this build yet.
                  </p>
                )}
                {transactionMessage && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`mt-4 rounded-xl border px-3 py-2.5 text-xs leading-5 ${
                      donate.txStatus === 'success'
                        ? 'border-[#bcf36a]/20 bg-[#bcf36a]/[0.06] text-[#c8ef9a]'
                        : donate.txStatus === 'pending'
                          ? 'border-sky-300/15 bg-sky-300/[0.05] text-sky-100/80'
                          : 'border-rose-300/15 bg-rose-300/[0.05] text-rose-100/80'
                    }`}
                  >
                    {transactionMessage}
                    {donate.txid && donate.explorerUrl && (
                      <a
                        href={donate.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 underline underline-offset-2"
                      >
                        View transaction <ArrowUpRight />
                      </a>
                    )}
                  </p>
                )}
              </form>

              <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-5 text-[11px] text-[#81877c]">
                <span>Non-custodial by design</span>
                <span className="font-mono uppercase tracking-[0.12em]">
                  {scaffoldConfig.network} · STX
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 border-t border-white/[0.09] pt-8 sm:mt-24" aria-label="Donation stats">
        <div className="mb-7 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#858c7e]">
            Transparent by default
          </p>
          <a
            href="https://explorer.hiro.so/?chain=testnet"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#aeb3a7] transition hover:text-[#bcf36a]"
          >
            Explore Stacks <ArrowUpRight />
          </a>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.08] sm:grid-cols-3">
          <StatCard
            label="Total raised"
            value={formatStx(total, 2)}
            suffix="STX"
            loading={totalDonated.loading && total === null}
          />
          <StatCard
            label="On-chain contributions"
            value={count?.toLocaleString() ?? '—'}
            suffix="donations"
            loading={donationCount.loading && count === null}
          />
          <StatCard
            label="Your contribution"
            value={address ? formatStx(contributed, 2) : '—'}
            suffix={address ? 'STX' : 'Connect wallet'}
            loading={Boolean(address) && donorTotal.loading && contributed === null}
          />
        </div>
        {isDeployed && (totalDonated.error || donationCount.error || treasury.error) && (
          <p role="status" className="mt-4 text-xs text-amber-200/80">
            Some on-chain stats are temporarily unavailable. Refresh the page to try again.
          </p>
        )}
        {treasuryAddress && (
          <p className="mt-5 break-all text-[11px] leading-5 text-[#696f65]">
            Treasury <span className="font-mono text-[#8b9186]">{treasuryAddress}</span>
          </p>
        )}
        {isDeployed && scaffoldConfig.isDevnet && (
          <p className="mt-3 text-[11px] text-[#777e72]">
            Devnet uses the local development chain. Donations have no real-world value.
          </p>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
  loading,
}: {
  label: string;
  value: string;
  suffix: string;
  loading: boolean;
}) {
  return (
    <div className="bg-[#151713] p-5 sm:p-7">
      <p className="text-xs text-[#878d81]">{label}</p>
      <div className="mt-4 flex min-h-9 items-baseline gap-2">
        <p className="font-instrument text-3xl font-medium tracking-[-0.04em] text-[#f1f0e8]">
          {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10" /> : value}
        </p>
        {!loading && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#81877c]">{suffix}</span>}
      </div>
    </div>
  );
}
