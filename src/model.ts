/**
 * A Model is a class that contains the document schema, methods, and functions.
 */
export class Model {
  // TODO: Define the modelize function, which can convert a POJO to the current
  // model instance.
  public static modelize<T extends new (...args: any[]) => any>(
    this: T,
    _o: Partial<InstanceType<T>>,
  ): InstanceType<T> {
    return null;
  }
}
