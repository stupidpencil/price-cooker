"use client";

import toast, { Toaster, ToastBar } from "react-hot-toast";

const TOAST_DURATION_MS = 10_000;

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: TOAST_DURATION_MS,
        error: { duration: TOAST_DURATION_MS },
        style: {
          maxWidth: "420px",
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              <span className="flex-1">{message}</span>
              {t.type !== "loading" && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 flex shrink-0 items-center justify-center rounded p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Fermer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
