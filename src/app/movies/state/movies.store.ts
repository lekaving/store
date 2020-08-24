import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { exhaustMap, map } from 'rxjs/operators';
import { Action, DeepReadonly, ofType, Selector, Store } from '../../shared/state/helpers';
import { MovieModel } from '../models/movie.model';
import { MoviesService } from '../services/movies.service';
import { GetPopularMovies, GetPopularMoviesSuccess, MoviesActionEnum } from './movies.actions';
import { reducer } from './movies.reducer';

export interface MoviesState {
  items: MovieModel[];
  loading: boolean;
}

export type ReadOnlyMoviesState = DeepReadonly<MoviesState>;
const defaultState: ReadOnlyMoviesState = {
  items: [],
  loading: false
};

@Injectable()
@Store({
  state: new BehaviorSubject<ReadOnlyMoviesState>(defaultState),
  defaultState: defaultState,
  reducer: reducer
})
export class MoviesStore {

  constructor(
    private moviesService: MoviesService
  ) {
  }

  @Action(GetPopularMovies)
  getPopularMovies(action) {
    return action.pipe(
      ofType(MoviesActionEnum.GetPopularMovies),
      exhaustMap(() => this.moviesService.getPopularMovies()),
      map((payload: any) => new GetPopularMoviesSuccess(payload.results))
    );
  }

  @Selector('items')
  movies$: Observable<MovieModel[]>;
}
