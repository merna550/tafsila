"use client";
/** Shared form logic of the auth screens: React Hook Form with a Zod schema, the auth call, and the form-level error. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { useAuthClient, type AuthClient, type AuthResult } from "@/shared/auth";
import { useApiErrorHandler } from "@/shared/error-display";

/** What a screen needs to configure the shared form. */
export interface AuthFormOptions<V extends FieldValues> {
  /** Zod schema of the form values; its messages are keys of `auth.validation`. */
  readonly schema: z.ZodType<V, FieldValues>;
  /** Starting values. */
  readonly defaultValues: DefaultValues<V>;
  /** Runs the auth call for the validated values. */
  readonly action: (client: AuthClient, values: V) => Promise<AuthResult>;
  /** Runs after the call succeeded. */
  readonly onSuccess: (values: V) => void;
  /** Runs once, on the first submit that passed validation (for example the `signup_started` event). */
  readonly onFirstSubmit?: () => void;
}

/** What the form components read. */
export interface AuthForm<V extends FieldValues> {
  /** The React Hook Form instance. */
  readonly form: UseFormReturn<V>;
  /** Submit handler for the `<form onSubmit>`. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** Error shown under the form (wrong password, unconfirmed email, ...), already in the page language. */
  readonly formError: string | null;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Wires validation, the auth call and error placement together so each screen hook only says what is different.
 * Field errors from the schema stay under their fields; auth errors that belong to the form go under the form;
 * everything else (rate limit, offline, unexpected) goes through the shared error handler (ADR-030).
 *
 * @param options - Schema, values, the auth call and the success callback.
 * @returns The form, its submit handler, the form-level error and the pending flag.
 */
export function useAuthForm<V extends FieldValues>(options: AuthFormOptions<V>): AuthForm<V> {
  const { schema, defaultValues, action, onSuccess, onFirstSubmit } = options;
  const client = useAuthClient();
  const handleError = useApiErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [started, setStarted] = useState(false);
  const form = useForm<V>({
    resolver: zodResolver(schema) as Resolver<V>,
    defaultValues,
    mode: "onSubmit",
  });
  const submit = useCallback(
    async (values: V) => {
      if (!started) {
        setStarted(true);
        onFirstSubmit?.();
      }
      setFormError(null);
      setPending(true);
      const result = await action(client, values);
      setPending(false);
      if (result.ok) {
        onSuccess(values);
        return;
      }
      const route = handleError(result.error, "action");
      if (route.place === "field") setFormError(route.message);
    },
    [action, client, handleError, onFirstSubmit, onSuccess, started],
  );
  const handleSubmit = form.handleSubmit(submit);
  return { form, onSubmit: (event) => void handleSubmit(event), formError, pending };
}
