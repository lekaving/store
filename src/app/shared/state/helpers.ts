import { OnDestroy } from '@angular/core';
import { merge, MonoTypeOperatorFunction, Observable, OperatorFunction, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount, scan, startWith, tap } from 'rxjs/operators';
import { reducer } from '../../movies/state/movies.reducer';
import { ReadOnlyMoviesState } from '../../movies/state/movies.store';

export function ofType<T extends Action>(type: string): MonoTypeOperatorFunction<T> {
  return filter((_) => type === _.type);
}

export function hasEditedObjectValue(previous: unknown, current: unknown) {
  if (Array.isArray(previous) && Array.isArray(current)) {
    return JSON.stringify(previous) === JSON.stringify(current);
  } else if (typeof previous === 'object' && typeof current === 'object') {
    return Object.keys(current).reduce((acc, key) => {
      if (current[key] !== previous[key]) {
        acc = false;
      }
      return acc;
    }, true);
  } else {
    return previous === current;
  }
}
// TODO lekaving: DeepReadonly<S> incoming coz properties define like DeepReadonly.
export function selectState<T, R>(stateName: string): OperatorFunction<DeepReadonly<T>, R> {
  return input$ => input$.pipe(
    map(state => state[stateName]),
    filter(state => state !== null),
    distinctUntilChanged((previous, current) => hasEditedObjectValue(previous, current))
  );
}

type DeepReadonlyObject<T> = { readonly [K in keyof T]: DeepReadonlyObject<T[K]> };
export type DeepReadonly<T> = T extends Array<infer E> ?
  ReadonlyArray<DeepReadonlyObject<E>> :
  T extends object ? DeepReadonlyObject<T> :
    T;


export interface Action {
  type: string;
}

export function Action(some: any) {
  return function (target, propertyKey, descriptor) {
    const actions = target.actions$;
    target.constructor.prototype.decoratorActions = {action: some, propertyKey};
  };
}

export function Selector(keyString: string) {
  debugger
  return function (target: any, key: string) {
    debugger
    Object.defineProperty(target, key, {
      configurable: false,
      get: () => {
        return target.constructor.prototype['state'].pipe(selectState(keyString))
      }
    });
  }
}


export function Store(config: any) {
  return function _Store<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor implements OnDestroy {
      private destroy$ = new Subject<void>();

      state() {
        return config.state;
      };

      constructor(...args: any[]) {
        super(...args);
        this['__proto__']['__proto__'].state = config.state;
        const dispatcher$: Observable<Action> = merge(
          this.actions$,
          this[this.decoratorActions.propertyKey](this.actions$)
        );
        this.stateObs$ = dispatcher$.pipe(
          startWith(config.defaultState),
          scan(config.reducer),
          publishReplay(1),
          refCount(),
        );
        this.stateObs$.subscribe(data => {
          return config.state.next(data);
        });
      }

      actions$: Subject<Action> = new Subject<Action>();

      stateObs$: Observable<ReadOnlyMoviesState>;

      dispatch(action: Action): void {
        this.actions$.next(action);
      }

      ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
      }
    }
  }
}
