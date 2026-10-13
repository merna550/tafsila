/**
 * Use case: delete the signed-in user's account and all personal data (FR-AUTH-05, NFR-05).
 * The order puts the irreversible step last: files, analytics, sign-in account, audit. Every step is safe to repeat,
 * so a failure before the account is deleted leaves it intact and the person can simply try again.
 */
import { AppError } from "../domain/errors";
import type { AccountAudit } from "../ports/account-audit";
import type { AccountDeleter } from "../ports/account-deleter";
import type { ErrorReporter } from "../ports/error-reporter";
import type { IdentityEraser } from "../ports/identity-eraser";
import type { AuthContext } from "../ports/token-verifier";
import type { UserFilesRemover } from "../ports/user-files-remover";

/** What the use case needs. */
export interface DeleteAccountDeps {
  readonly userFilesRemover: UserFilesRemover;
  readonly identityEraser: IdentityEraser;
  readonly accountDeleter: AccountDeleter;
  readonly accountAudit: AccountAudit;
  readonly errorReporter: ErrorReporter;
}

/**
 * Deletes the caller's account.
 *
 * @param deps - The four deletion ports and the error reporter.
 * @param ctx - Verified caller (the only source of the user id).
 * @param requestId - Id of the request, attached to a reported audit failure.
 * @throws {AppError} ACCOUNT_DELETE_FORBIDDEN for an admin; any provider failure before the account is deleted propagates.
 */
export async function deleteAccount(
  deps: DeleteAccountDeps,
  ctx: AuthContext,
  requestId: string,
): Promise<void> {
  if (ctx.role === "admin") throw new AppError("ACCOUNT_DELETE_FORBIDDEN");
  await deps.userFilesRemover.removeAll(ctx.userId);
  await deps.identityEraser.erase(ctx.userId);
  await deps.accountDeleter.deleteUser(ctx.userId);
  try {
    await deps.accountAudit.recordDeleted();
  } catch (error) {
    // The account is already gone: the person must not see a failure for a missing audit row.
    deps.errorReporter.captureException(error, { requestId });
  }
}
