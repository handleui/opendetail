export class OpenDetailError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpenDetailError";
  }
}

export class OpenDetailConfigError extends OpenDetailError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpenDetailConfigError";
  }
}

export class OpenDetailIndexNotFoundError extends OpenDetailError {
  readonly indexPath: string;

  constructor(indexPath: string) {
    super(
      `OpenDetail index not found at ${indexPath}. Run \`npx opendetail build\` first.`
    );

    this.indexPath = indexPath;
    this.name = "OpenDetailIndexNotFoundError";
  }
}
