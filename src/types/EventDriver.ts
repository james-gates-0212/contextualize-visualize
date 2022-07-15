/** The type of the inputs to an event listener. */
type EventListenerIn<F> = F extends (...args: infer U) => any ? U : [];
/** The type of the outputs from an event listener. */
type EventListenerOut<F> = F extends (...args: any[]) => infer U ? U : never;

/** The type of an event listener. */
type EventListener<F> = (...args: EventListenerIn<F>) => EventListenerOut<F>;
/** Type type of properties for an event listener. */
type EventListenerProperties = { once: boolean };
/** The type of an event listener along with its properties. */
type EventListenerEntry<F> = {
  listener: EventListener<F>;
} & EventListenerProperties;

/** A type used to filter event listener functions out of another type. */
type EventListenerFilter<T, U extends keyof T = keyof T> = {
  [K in U]: T[K] extends (...args: any[]) => any ? K : never;
}[U];
/** A type that describes the prescribed events of a specified type. */
type EventKey<T> = EventListenerFilter<T> & string;

/** An object that can have events easily attached to it. */
class EventDriver<T> {
  private listeners: { [K in EventKey<T>]?: Set<EventListenerEntry<T[K]>> };

  constructor() {
    this.listeners = {};
  }

  private ensureListenersReady<K extends EventKey<T>>(event: K) {
    if (this.listeners[event] === undefined) this.listeners[event] = new Set();
    return this;
  }

  /**
   * Adds an event listener to the object that fires one time.
   * @param event The type of event.
   * @param listener The event listener to add.
   */
  public once<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>) {
    this.ensureListenersReady(event);
    this.listeners[event]!.add({
      listener,
      once: true,
    });
    return this;
  }
  /**
   * Adds an event listener to the object that fires multiple times.
   * @param event The type of event.
   * @param listener The event listener to add.
   */
  public on<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>) {
    this.ensureListenersReady(event);
    this.listeners[event]!.add({
      listener,
      once: false,
    });
    return this;
  }
  /**
   * Removes an event listener from the object.
   * @param event The type of event.
   * @param listener The event listener to remove.
   */
  public off<K extends EventKey<T>>(event: K, listener: EventListener<T[K]>) {
    this.ensureListenersReady(event);
    this.listeners[event]!.forEach((entry) => {
      if (entry.listener === listener) this.listeners[event]!.delete(entry);
    });
    return this;
  }

  /**
   * Triggers an event to be fired so that all listeners may be notified.
   * @param event The type of event.
   * @param args The arguments to pass to the event listeners.
   */
  public notify<K extends EventKey<T>>(
    event: K,
    ...args: EventListenerIn<T[K]>
  ) {
    this.ensureListenersReady(event);
    this.listeners[event]!.forEach((entry) => {
      entry.listener(...args);
      if (entry.once) this.listeners[event]!.delete(entry);
    });
    return this;
  }
}

// Define exports.
export default EventDriver;
