import { PICTO_WORDS } from './functions';

export default class SA_obj {
  constructor() {
    // list of booleans, one per pictogram, all false
    this.picto_bool = Array(PICTO_WORDS.length).fill(false);

    // empty strings by default
    this.signal_word = '';
    this.occupational_hazard = '';

    // amount as a number, initialized to -1
    this.amount = -1;
  }
}