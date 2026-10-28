"use client";
/** Hook behind the fabric editor: React Hook Form + Zod, create or update, API field errors under the field, a success toast. */
import { zodResolver } from "@hookform/resolvers/zod";
import type { AdminFabric } from "@tafsila/schemas";
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useApiErrorHandler } from "@/shared/error-display";
import {
  EMPTY_FABRIC_FORM,
  fabricFormSchema,
  fabricToForm,
  formFieldOf,
  toCreateFabricBody,
  toUpdateFabricBody,
  type FabricFormValues,
} from "../model/fabric-form";
import { useCreateFabric, useUpdateFabric } from "./use-catalogue-mutations";

/** What the editor needs. */
export interface FabricForm {
  /** The React Hook Form instance. */
  readonly form: UseFormReturn<FabricFormValues>;
  /** Submit handler for the `<form onSubmit>`. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while the request runs. */
  readonly pending: boolean;
}

/** Options of {@link useFabricForm}. */
export interface FabricFormOptions {
  /** The fabric being edited; leave out to add a new one. */
  readonly fabric?: AdminFabric;
  /** Runs after a successful save. */
  readonly onSaved: () => void;
}

/**
 * Wires the editor's form to the create or update mutation.
 *
 * @param options - The fabric (or none) and the success callback.
 * @returns The form, its submit handler and the pending flag.
 */
export function useFabricForm({ fabric, onSaved }: Readonly<FabricFormOptions>): FabricForm {
  const t = useTranslations("admin.fabrics.form");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const create = useCreateFabric();
  const update = useUpdateFabric(fabric?.id ?? "");
  const form = useForm<FabricFormValues>({
    resolver: zodResolver(fabricFormSchema),
    defaultValues: fabric ? fabricToForm(fabric) : EMPTY_FABRIC_FORM,
    mode: "onSubmit",
  });
  /**
   * Saves, then toasts and reports; field errors of the API go under their fields.
   *
   * @param values - The validated form values.
   */
  const submit = async (values: FabricFormValues): Promise<void> => {
    try {
      if (fabric) await update.mutateAsync(toUpdateFabricBody(values));
      else await create.mutateAsync(toCreateFabricBody(values));
    } catch (error) {
      const route = handleError(error, "action");
      for (const [apiField, message] of Object.entries(route.fieldErrors)) {
        const field = formFieldOf(apiField);
        if (field) form.setError(field, { message });
      }
      return;
    }
    showToast({ title: fabric ? t("updated") : t("created"), tone: "success" });
    onSaved();
  };
  const handleSubmit = form.handleSubmit(submit);
  return {
    form,
    onSubmit: (event) => void handleSubmit(event),
    pending: create.isPending || update.isPending,
  };
}
