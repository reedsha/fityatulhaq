/**
 * Phase 2 SMTP-delivery smoke test — a plain Node script (no Jest/Mocha/sinon).
 *
 *   1. Run the test:  npx ts-node src/__tests__/smtp.test.ts
 *
 * Runs entirely in-process against a fake transporter, so no mail leaves the
 * machine and no relay credentials are needed. The SMTP_* environment variables
 * are pinned below before `../utils/smtp` is loaded — that module refuses to
 * load without a user and password, and points at a closed local port so that
 * even an unexpected real connection attempt fails fast instead of hanging.
 *
 * Expect one `[SMTP] Verification failed` line on startup: the module-level
 * `transporter.verify()` probe runs before the fake is installed, which is
 * precisely the fail-fast behaviour requirement 7 asks for.
 */

import type { SendMailOptions } from "nodemailer";

import type { SmtpRateLimitConfig } from "../utils/smtpRateLimiter";

process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = "2525";
process.env.SMTP_USER = "smtp-test-user";
process.env.SMTP_PASS = "smtp-test-pass";
process.env.SMTP_SENDER_EMAIL = "noreply@fityatulhaq.org";

let failures = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  console.error(`FAIL: ${name}`);
  failures += 1;
}

interface FakeState {
  sent: SendMailOptions[];
  outcome: {
    messageId?: string;
    error?: Error;
  };
}

interface FakeTransporter {
  sendMail: (options: SendMailOptions) => Promise<unknown>;
  verify: () => Promise<boolean>;
}

/** Swaps the real transport's network methods for record-and-replay stubs. */
function installFakeTransporter(target: unknown, state: FakeState): void {
  const patchable = target as FakeTransporter;

  patchable.sendMail = async (options: SendMailOptions): Promise<unknown> => {
    state.sent.push(options);

    if (state.outcome.error !== undefined) {
      throw state.outcome.error;
    }

    return { messageId: state.outcome.messageId };
  };

  patchable.verify = async (): Promise<boolean> => true;
}

/**
 * Nodemailer widens `html`/`text` to accept streams and buffers. The module
 * under test only ever passes strings, so collapse anything else to empty.
 */
function readBody(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readRecipients(options: SendMailOptions): string[] {
  if (options.to === undefined) {
    return [];
  }

  const list = Array.isArray(options.to) ? options.to : [options.to];

  return list.map((entry) => {
    if (typeof entry === "string") return entry;
    // Nodemailer 10.x may provide an array of address objects.
    // Handle both single object and array forms.
    const addrObj = entry as { address?: string } | { address?: string[] };
    const addrs = Array.isArray(addrObj?.address)
      ? addrObj.address
      : addrObj?.address
        ? [addrObj.address]
        : [];
    return addrs[0] ?? String(entry);
  });
}

async function run(): Promise<void> {
  const smtp = await import("../utils/smtp");
  const limiter = await import("../utils/smtpRateLimiter");
  const delivery = await import("../services/smtpDelivery");

  const state: FakeState = { sent: [], outcome: { messageId: "smtp-message-id" } };
  installFakeTransporter(smtp.transporter, state);

  // --- Transport configuration --------------------------------------------

  check("transport uses the configured host", smtp.smtpTransportOptions.host === "127.0.0.1");
  check("transport uses the configured port", smtp.smtpTransportOptions.port === 2525);
  check("transport uses the configured user", smtp.smtpTransportOptions.auth.user === "smtp-test-user");
  check("transport uses the configured password", smtp.smtpTransportOptions.auth.pass === "smtp-test-pass");
  check("transport is not implicitly TLS on a submission port", smtp.smtpTransportOptions.secure === false);
  check("transport allows self-signed certs in dev", smtp.smtpTransportOptions.tls.rejectUnauthorized === false);
  check("transport bounds the connect phase", smtp.smtpTransportOptions.connectionTimeout > 0);
  check("transport bounds the whole exchange", smtp.smtpTransportOptions.socketTimeout > 0);
  check("sender is branded", smtp.SMTP_FROM.includes("FityatulHaq") && smtp.SMTP_FROM.includes("noreply@fityatulhaq.org"));

  check("implicit TLS is enabled on port 465", smtp.resolveSecureFlag(465));
  check("implicit TLS is off on port 587", !smtp.resolveSecureFlag(587));

  // --- HTML template -------------------------------------------------------

  const verificationHtml = smtp.createOtpEmailHtml("428913", "EMAIL_VERIFICATION");
  const resetHtml = smtp.createOtpEmailHtml("519204", "PASSWORD_RESET");

  check("HTML renders the verification heading", verificationHtml.includes("Verify your email address"));
  check("HTML renders the reset heading", resetHtml.includes("Reset your password"));
  check("HTML renders the code", verificationHtml.includes("428913"));
  check("HTML states the 15 minute expiry", verificationHtml.includes("expires in 15 minutes"));
  check("HTML uses the brand accent", verificationHtml.includes("#059669"));
  check("HTML is Outlook-safe table layout", verificationHtml.includes('role="presentation"') && verificationHtml.includes('cellpadding="0"'));
  check("HTML keeps styles inline", !verificationHtml.includes("<style"));
  check("HTML includes the ignored-request notice", verificationHtml.includes("If you didn't request this code"));
  check("HTML is marked up as a document", verificationHtml.startsWith("<!DOCTYPE html>"));

  // --- Plain-text alternative ---------------------------------------------

  const verificationText = smtp.createOtpEmailText("428913", "EMAIL_VERIFICATION");
  const resetText = smtp.createOtpEmailText("519204", "PASSWORD_RESET");

  check("text part renders the verification heading", verificationText.includes("Verify your email address"));
  check("text part renders the reset heading", resetText.includes("Reset your password"));
  check("text part renders the code", verificationText.includes("428913"));
  check("text part states the 15 minute expiry", verificationText.includes("expires in 15 minutes"));
  check("text part includes the ignored-request notice", verificationText.includes("If you didn't request this code"));
  check("text part contains no HTML markup", !verificationText.includes("<"));

  // --- sendEmail success path ---------------------------------------------

  const okResult = await smtp.sendEmail({
    to: ["member@fityatulhaq.test"],
    subject: "Phase 2 harness",
    html: "<p>hello</p>",
    text: "hello",
  });

  check("sendEmail reports success", okResult.success && okResult.messageId === "smtp-message-id");
  check("sendEmail dispatched exactly one message", state.sent.length === 1);
  check("sendEmail addresses the recipient", readRecipients(state.sent[0] ?? {})[0] === "member@fityatulhaq.test");
  check("sendEmail applies the branded sender", state.sent[0]?.from === smtp.SMTP_FROM);

  // --- sendOtpEmail wiring -------------------------------------------------

  state.sent.length = 0;

  const otpResult = await smtp.sendOtpEmail("member@fityatulhaq.test", "428913", "EMAIL_VERIFICATION");
  const otpMessage = state.sent[0];

  check("sendOtpEmail reports success", otpResult.success);
  check("sendOtpEmail sets the verification subject", otpMessage?.subject === "Verify your FityatulHaq email address");
  check("sendOtpEmail delivers the code in the HTML part", readBody(otpMessage?.html).includes("428913"));
  check("sendOtpEmail delivers the code in the text part", readBody(otpMessage?.text).includes("428913"));

  state.sent.length = 0;

  await smtp.sendOtpEmail("member@fityatulhaq.test", "519204", "PASSWORD_RESET");
  check("sendOtpEmail sets the reset subject", state.sent[0]?.subject === "Reset your FityatulHaq password");

  // --- sendEmail failure path ---------------------------------------------

  state.sent.length = 0;
  state.outcome = { error: new Error("535 Authentication failed") };

  const failedResult = await smtp.sendEmail({
    to: ["member@fityatulhaq.test"],
    subject: "Phase 2 harness",
    html: "<p>hello</p>",
  });

  check("sendEmail surfaces a relay rejection", !failedResult.success);
  check("sendEmail reports the relay message", failedResult.error === "535 Authentication failed");
  check("sendEmail returns instead of throwing", failedResult.success === false);

  state.outcome = { messageId: "smtp-message-id" };

  // --- Rate limiter --------------------------------------------------------

  limiter.resetSmtpLimiter();

  const identifier = "quota@fityatulhaq.test";
  const purpose = "PASSWORD_RESET";

  check("quota starts open", limiter.canResend(identifier, purpose));
  check("inspecting the quota does not consume it", limiter.canResend(identifier, purpose));

  limiter.recordSend(identifier, purpose);
  limiter.recordSend(identifier, purpose);
  check("quota still open after two dispatches", limiter.canResend(identifier, purpose));

  limiter.recordSend(identifier, purpose);
  check("quota closes after the third dispatch", !limiter.canResend(identifier, purpose));
  check("quota is shared across identifier casing", !limiter.canResend("QUOTA@FityatulHaq.test", purpose));

  const strictConfig: SmtpRateLimitConfig = { windowMs: 60_000, maxAttempts: 1 };
  limiter.recordSend("strict@fityatulhaq.test", purpose, strictConfig);

  check(
    "a custom config narrows the quota",
    !limiter.canResend("strict@fityatulhaq.test", purpose, strictConfig),
  );
  check(
    "a custom config leaves the default quota untouched",
    limiter.canResend("strict@fityatulhaq.test", purpose),
  );

  // --- deliverOtpEmail non-fatal contract ---------------------------------

  limiter.resetSmtpLimiter();

  const target = "deliver-quota@fityatulhaq.test";
  const dispatches = [
    await delivery.deliverOtpEmail(target, "111111", "EMAIL_VERIFICATION"),
    await delivery.deliverOtpEmail(target, "222222", "EMAIL_VERIFICATION"),
    await delivery.deliverOtpEmail(target, "333333", "EMAIL_VERIFICATION"),
    await delivery.deliverOtpEmail(target, "444444", "EMAIL_VERIFICATION"),
  ];

  check("first three dispatches succeed", dispatches.slice(0, 3).every((item) => item.sent));
  check(
    "fourth dispatch is refused by the quota",
    dispatches[3]?.sent === false && dispatches[3]?.error === "RATE_LIMIT_EXCEEDED",
  );

  limiter.resetSmtpLimiter();
  state.outcome = { error: new Error("connect ECONNREFUSED 127.0.0.1:2525") };

  const failedDispatch = await delivery.deliverOtpEmail(
    "no-burn@fityatulhaq.test",
    "123456",
    "EMAIL_VERIFICATION",
  );

  check("a failed dispatch is reported but never throws", failedDispatch.sent === false);
  check("a failed dispatch does not burn quota", limiter.canResend("no-burn@fityatulhaq.test", "EMAIL_VERIFICATION"));
}

run()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nAll checks passed.");
  })
  .catch((error: unknown) => {
    const reason = error instanceof Error ? error.stack ?? error.message : String(error);

    console.error(`FAIL: the test harness threw — ${reason}`);
    process.exitCode = 1;
  });
