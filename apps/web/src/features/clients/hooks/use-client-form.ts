"use client";
/** Hook behind the create/edit client dialog: React Hook Form + Zod, the save call, field errors under the field, a success toast. */
import { zodResolver } from "@hookform/resolvers/zod";
import type { Client } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useApiErrorHandler } from "@/shared/error-display";
import { clientFormSchema, EMPTY_CLIENT_FORM, type ClientFormValues } from "../model/client-form.schema";
import { useCreateClient, useUpdateClient } from "./use-client-mutations";

/** What the dialog needs. */
export interface ClientForm {
  /** The React Hook Form instance. */
  readonly form: UseFormReturn<ClientFormValues>;
  /** Submit handler for the `<form onSubmit>`. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while the request runs. */
  readonly pending: boolean;
  /** Puts the starting values back (when the dialog opens). */
  readonly reset: () => void;
}

/** Options of {@link useClientForm}. */
export interface ClientFormOptions {
  /** The client being edited; leave out to create a new one. */
  readonly client?: Client;
  /** Runs after a successful save with the stored client. */
  readonly onSaved: (client: Client) => void;
}

/**
 * Builds the dialog's starting values.
 *
 * @param client - The client being edited, if any.
 * @returns Name and notes (empty for a new client).
 */
function startingValues(client: Client | undefined): ClientFormValues {
  return client ? { name: client.name, notes: client.notes ?? "" } : EMPTY_CLIENT_FORM;
}

/**
 * Wires the dialog's form to the create or update mutation.
 * API validation errors go under the matching field; other failures show a toast through the shared handler (ADR-030).
 *
 * @param options - The client to edit (or none) and the success callback.
 * @returns The form, its submit handler and the pending flag.
 */
export function useClientForm({ client, onSaved }: Readonly<ClientFormOptions>): ClientForm {
  const t = useTranslations("clients.form");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const create = useCreateClient();
  const update = useUpdateClient(client?.id ?? "");
  const mutation = client ? update : create;
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: startingValues(client),
    mode: "onSubmit",
  });
  const submit = useCallback(
    async (values: ClientFormValues) => {
      try {
        const saved = await mutation.mutateAsync(values);
        showToast({ title: client ? t("updated") : t("created"), tone: "success" });
        onSaved(saved);
      } catch (error) {
        const route = handleError(error, "action");
        for (const [field, message] of Object.entries(route.fieldErrors)) {
          if (field === "name" || field === "notes") form.setError(field, { message });
        }
      }
    },
    [client, form, handleError, mutation, onSaved, showToast, t],
  );
  const handleSubmit = form.handleSubmit(submit);
  return {
    form,
    onSubmit: (event) => void handleSubmit(event),
    pending: mutation.isPending,
    reset: () => form.reset(startingValues(client)),
  };
}
