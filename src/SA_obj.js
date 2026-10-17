import { PICTO_WORDS } from './functions';

export default class SA_obj {
  constructor() {
    // name
    this.name = '';

    // list of booleans, one per pictogram, all false
    this.picto_bool = Array(PICTO_WORDS.length).fill(false);

    // empty strings by default
    this.signal_word = 'None';
    this.occupational_hazard = 'Zero Emission';
  }
}