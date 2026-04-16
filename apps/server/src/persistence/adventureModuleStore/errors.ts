export class AdventureModuleNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleNotFoundError";
  }
}

export class AdventureModuleForbiddenError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleForbiddenError";
  }
}

export class AdventureModuleValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleValidationError";
  }
}

