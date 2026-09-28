export const CURRENT_USER_ID = 4;

export class CurrentUser {
  private static instance: CurrentUser | null = null;

  private constructor(private readonly id: number) {}

  static getInstance(): CurrentUser {
    if (CurrentUser.instance === null) {
      CurrentUser.instance = new CurrentUser(CURRENT_USER_ID);
    }

    return CurrentUser.instance;
  }

  getId(): number {
    return this.id;
  }
}
