import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
} from "react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import OfferOverview
  from "./OfferOverview";

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatMoney(
  value,
  currencyCode = "USD",
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "Not set";
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "Not set";
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency:
          currencyCode ||
          "USD",
        maximumFractionDigits: 2,
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(
      2,
    )} ${currencyCode || "USD"}`;
  }
}

function OfferStatusBadge({
  status,
}) {
  const tone =
    status === "accepted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "approved" ||
          status === "sent" ||
          status === "viewed"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : status ===
            "pending_approval"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : status === "declined" ||
              status === "expired" ||
              status ===
                "withdrawn" ||
              status ===
                "superseded"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {getAdmissionStatusLabel(
        status,
      )}
    </span>
  );
}

export default function OfferWorkspace({
  onCreateOffer,
  onEditOffer,
  onOfferWorkflowAction,
}) {
  const {
    offers = {
      items: [],
      total: 0,
      page: 1,
      pageCount: 0,
    },

    offerFilters = {
      search: "",
      status: "",
      page: 1,
    },

    selectedOfferId,
    selectedOffer,

    offersLoading,
    offersError,

    offerMutationLoading,
    offerMutationError,

    canCreateOffers,
    canEditOffers,

    setOfferFilters,
    resetOfferFilters,

    refreshOffers,
    selectOffer,



    clearOfferMutationError,

    selectedAdmissionCycle,
  } = useAdmissions();

  const offerItems =
    Array.isArray(
      offers?.items,
    )
      ? offers.items
      : [];

  useEffect(() => {
    if (
      selectedOfferId ||
      !offerItems.length
    ) {
      return;
    }

    selectOffer?.(
      offerItems[0],
    );
  }, [
    offerItems,
    selectedOfferId,
    selectOffer,
  ]);

  const updateFilters = (
    updates,
    options,
  ) => {
    setOfferFilters?.(
      updates,
      options,
    );
  };

  const handleSearchChange = (
    event,
  ) => {
    updateFilters({
      search:
        event.target.value,
    });
  };

  const handleStatusChange = (
    event,
  ) => {
    updateFilters({
      status:
        event.target.value,
    });
  };

  const goToPreviousPage = () => {
    const currentPage =
      Number(
        offers.page,
      ) || 1;

    if (currentPage <= 1) {
      return;
    }

    updateFilters(
      {
        page:
          currentPage - 1,
      },
      {
        resetPage: false,
      },
    );
  };

  const goToNextPage = () => {
    const currentPage =
      Number(
        offers.page,
      ) || 1;

    const pageCount =
      Number(
        offers.pageCount,
      ) || 0;

    if (
      currentPage >=
      pageCount
    ) {
      return;
    }

    updateFilters(
      {
        page:
          currentPage + 1,
      },
      {
        resetPage: false,
      },
    );
  };

  const currentPage =
    Number(
      offers.page,
    ) || 1;

  const pageCount =
    Number(
      offers.pageCount,
    ) || 0;
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700">
              <BadgeDollarSign size={18} />
              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Offer management
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Offer Workspace
            </h2>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Prepare, approve, send and manage admission offers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => refreshOffers?.()}
              disabled={offersLoading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black"
            >
              <RefreshCw
                size={16}
                className={offersLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              disabled={!canCreateOffers}
              onClick={() => onCreateOffer?.()}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white"
            >
              New Offer
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className={`${INPUT_CLASSES} pl-10`}
              placeholder="Search offers..."
              value={offerFilters.search || ""}
              onChange={handleSearchChange}
            />
          </label>

          <select
            value={offerFilters.status || ""}
            onChange={handleStatusChange}
            className={INPUT_CLASSES}
          >
            <option value="">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="pending_approval">
              Pending Approval
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="sent">
              Sent
            </option>

            <option value="viewed">
              Viewed
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="declined">
              Declined
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="withdrawn">
              Withdrawn
            </option>
          </select>

          <button
            type="button"
            onClick={() => resetOfferFilters?.()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black"
          >
            <SlidersHorizontal size={16} />
            Reset
          </button>
        </div>
      </header>

      <div className="grid xl:grid-cols-[390px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50">
          {offersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2
                className="animate-spin"
                size={26}
              />
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {offerItems.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => selectOffer?.(offer)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    offer.id === selectedOfferId
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black">
                        {offer.offer_number}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {offer.entry_grade_level}
                      </p>
                    </div>

                    <OfferStatusBadge
                      status={offer.status}
                    />
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Start:
                    {" "}
                    {formatDate(
                      offer.intended_start_date,
                    )}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>
        <main className="min-w-0 bg-white">
          {offersError && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-4">
              <p className="font-black text-red-800">
                Offers could not be loaded.
              </p>

              <p className="mt-1 text-sm font-semibold text-red-700">
                {offersError}
              </p>
            </div>
          )}

          {!offersLoading &&
          !offerItems.length ? (
            <div className="flex min-h-[620px] items-center justify-center p-8">
              <div className="max-w-md text-center">
                <FileText
                  size={32}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  No admission offers found
                </h3>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Create an offer from an approved or published admission
                  decision.
                </p>
              </div>
            </div>
          ) : (
            <OfferOverview
              offer={selectedOffer}
              canEditOffer={canEditOffers}
              mutationLoading={offerMutationLoading}
              mutationError={offerMutationError}
              onEditOffer={onEditOffer}
              onSubmitOffer={() =>
                onOfferWorkflowAction?.(
                  "submit_for_approval",
                  selectedOffer,
                )
              }
              onApproveOffer={() =>
                onOfferWorkflowAction?.(
                  "approve",
                  selectedOffer,
                )
              }
              onSendOffer={() =>
                onOfferWorkflowAction?.(
                  "send",
                  selectedOffer,
                )
              }
              onRecordViewed={() =>
                onOfferWorkflowAction?.(
                  "record_viewed",
                  selectedOffer,
                )
              }
              onAcceptOffer={() =>
                onOfferWorkflowAction?.(
                  "accept",
                  selectedOffer,
                )
              }
              onDeclineOffer={() =>
                onOfferWorkflowAction?.(
                  "decline",
                  selectedOffer,
                )
              }
              onWithdrawOffer={() =>
                onOfferWorkflowAction?.(
                  "withdraw",
                  selectedOffer,
                )
              }
              onClearMutationError={clearOfferMutationError}
            />
          )}
        </main>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-800">
            {Number(offers.total) || 0} total offers
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Page {currentPage} of {Math.max(pageCount, 1)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={
              currentPage <= 1 ||
              offersLoading
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={
              currentPage >= pageCount ||
              offersLoading
            }
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
