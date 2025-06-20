export type ErrorCategory =
  | "SYSTEM"
  | "USER"
  | "NETWORK"
  | "DATABASE"
  | "AUTH"
  | "UNKNOWN";

export type ErrorSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export class BaseError extends Error {
  public readonly name: string;
  // Maps to errors.error_code (e.g., "DURABLE_001")
  public readonly errorCode: string;
  // Maps to errors.category (e.g., "SYSTEM", "DATABASE")
  public readonly category: ErrorCategory;
  // Maps to errors.severity (e.g., "CRITICAL", "MEDIUM")
  public readonly severity: ErrorSeverity;
  // Maps to errors.message (internal details, can be null)
  public readonly message: string;
  // Maps to errors.message_user (user-friendly message, required)
  public readonly messageUser: string;
  // Maps to errors.user_action (e.g., "Retry later", can be null)
  public readonly userAction: string | null;
  // Maps to errors.status (HTTP status code, can be null)
  public readonly status: number | null;
  // Maps to errors.website_url (e.g., help page, can be null)
  public readonly websiteUrl: string | null;
  // Maps to errors.user_id (UUID, can be null if not tied to a user)
  public readonly userId: string | null;
  // Maps to errors.timestamp (defaults to now)
  public readonly timestamp: Date;
  // Maps to errors.metadata (JSONB for extra context, can be null)
  public readonly metadata: Record<string, unknown> | null;
  // Original error for chaining (not stored in DB but useful for debugging)
  public readonly cause?: Error;

  constructor(
    message: string,
    options: {
      errorCode: string;
      category: ErrorCategory;
      severity: ErrorSeverity;
      messageUser?: string;
      userAction?: string | null;
      status?: number | null;
      websiteUrl?: string | null;
      userId?: string | null;
      metadata?: Record<string, unknown> | null;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);

    this.errorCode = options.errorCode;
    this.category = options.category;
    this.severity = options.severity;
    this.message = message;
    this.messageUser = options.messageUser ?? message; // Fallback to internal message
    this.userAction = options.userAction ?? null;
    this.status = options.status ?? null;
    this.websiteUrl = options.websiteUrl ?? null;
    this.userId = options.userId ?? null;
    this.timestamp = new Date();
    this.metadata = options.metadata ?? null;
    this.cause = options.cause;
  }

  // Serialize to match errors table structure for DB insertion
  toDatabaseRecord() {
    return {
      name: this.name,
      error_code: this.errorCode,
      category: this.category,
      severity: this.severity,
      message: this.message,
      message_user: this.messageUser,
      user_action: this.userAction,
      status: this.status,
      website_url: this.websiteUrl,
      user_id: this.userId,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
    };
  }

  // Serialize to JSON for API responses (exposes only user-safe fields)
  toJSON() {
    return {
      errorCode: this.errorCode,
      message: this.messageUser,
      userAction: this.userAction,
      websiteUrl: this.websiteUrl,
      ...(this.status ? { status: this.status } : {}),
    };
  }

  // Detailed string for logging
  toString() {
    return (
      `${this.name} [${this.errorCode}]: ${this.message}\n` +
      `Category: ${this.category}, Severity: ${this.severity}\n` +
      `User Message: ${this.messageUser}\n` +
      (this.userAction ? `User Action: ${this.userAction}\n` : "") +
      (this.metadata
        ? `Metadata: ${JSON.stringify(this.metadata, null, 2)}\n`
        : "") +
      (this.cause ? `Caused by: ${this.cause.toString()}` : "")
    );
  }

  // Wrap unknown errors to ensure they fit the table schema
  static wrap(
    error: unknown,
    fallbackOptions: {
      errorCode?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
    } = {}
  ): BaseError {
    const defaultCode = fallbackOptions.errorCode ?? "UNKNOWN_ERROR";
    const defaultCategory = fallbackOptions.category ?? "UNKNOWN";
    const defaultSeverity = fallbackOptions.severity ?? "MEDIUM";

    if (error instanceof BaseError) return error;
    if (error instanceof Error) {
      return new BaseError(error.message, {
        errorCode: defaultCode,
        category: defaultCategory,
        severity: defaultSeverity,
        messageUser: "An unexpected error occurred",
        cause: error,
      });
    }
    return new BaseError(String(error), {
      errorCode: defaultCode,
      category: defaultCategory,
      severity: defaultSeverity,
      messageUser: "An unexpected error occurred",
    });
  }
}
