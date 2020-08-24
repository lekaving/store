import { MoviesActionEnum, MoviesActions } from './movies.actions';
import { ReadOnlyMoviesState } from './movies.store';

export const reducer = (state, action: MoviesActions): ReadOnlyMoviesState => {
  switch (action.type) {
    case MoviesActionEnum.GetPopularMovies:
      debugger
      return {
        ...state
      }
    case MoviesActionEnum.GetPopularMoviesSuccess:
      debugger
      return {...state, items: action.payload};
    default:
      debugger
      return state;
  }
};
