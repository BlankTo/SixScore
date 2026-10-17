// functions.manual.test.mjs
// Manual test runner for functions.js
// Run with: node functions.manual.test.mjs

import * as maybeModule from './functions.js';

// This works whether functions.js is CommonJS (module.exports = { ... })
// or ES module (export function ... / export default { ... })
const {
  compute_feedstock_generation_PP,
  compute_availability_PP,
  compute_seasonality_PP,
  compute_RM_Score,
  compute_single_solvent_PP,
  compute_single_additive_PP,
  compute_matrix_depletion,
  compute_matrix_depletion_PP,
  compute_solvent_impact,
  compute_solvent_impact_PP,
  compute_carbon_economy,
  compute_carbon_economy_PP,
  compute_duration_PP,
  compute_EX_Score,
  compute_single_process,
  compute_pme,
  compute_pme_pp,
  compute_selectivity_PP
} = maybeModule.default ?? maybeModule;

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

// -------------------------------------------------------
// Raw Material Section
// -------------------------------------------------------
console.log('\n--- RAW MATERIAL ---');

// TODO: change these to whatever categories you want to test
const TEST_FEEDSTOCK_GENERATION = 'Third';    // 'First' | 'Second' | 'Third' | 'Fourth'
const TEST_AVAILABILITY = 'Difficult';            // 'Easy' | 'Difficult'
const TEST_SEASONALITY = 'Seasonal';         // 'Seasonal' | 'Not Seasonal'

console.log(
  'compute_feedstock_generation_PP:',
  compute_feedstock_generation_PP(TEST_FEEDSTOCK_GENERATION)
);

console.log(
  'compute_availability_PP:',
  compute_availability_PP(TEST_AVAILABILITY)
);

console.log(
  'compute_seasonality_PP:',
  compute_seasonality_PP(TEST_SEASONALITY)
);

console.log(
  'compute_RM_Score:',
  compute_RM_Score(compute_feedstock_generation_PP(TEST_FEEDSTOCK_GENERATION), compute_availability_PP(TEST_AVAILABILITY), compute_seasonality_PP(TEST_SEASONALITY))
);

// -------------------------------------------------------
// Solvents and Additives
// -------------------------------------------------------
console.log('\n--- SOLVENTS & ADDITIVES ---');

// SOLVENT TEST INPUTS (EDIT AS NEEDED)
const TEST_SOLVENT_PRESENT = true; // false -> function returns 0
const TEST_SOLVENT_PICTOS = [
  false, // Exclamation mark
  true, // Flame
  false, // Environment
  false, // Corrosion
  false, // Flame over circle
  true, // Skull & crossbones
  true, // Health hazard
  false  // Exploding bomb
];
const TEST_SOLVENT_SIGNAL_WORD = 'Danger';          // 'None' | 'Warning' | 'Danger'
const TEST_SOLVENT_OCCUPATIONAL_HAZARD = 'Vapour/gas emission'; // 'Zero Emission' | 'Vapour/gas emission'
const TEST_SOLVENT_AMOUNT = 25; // <=5, <=20, <=50, >50

console.log(
  'compute_single_solvent_PP:',
  compute_single_solvent_PP(
    TEST_SOLVENT_PRESENT,
    TEST_SOLVENT_PICTOS,
    TEST_SOLVENT_SIGNAL_WORD,
    TEST_SOLVENT_OCCUPATIONAL_HAZARD,
    TEST_SOLVENT_AMOUNT
  )
);

// ADDITIVE TEST INPUTS (EDIT AS NEEDED)
const TEST_ADDITIVE_PRESENT = true;
const TEST_ADDITIVE_PICTOS = [
  false, // Exclamation mark
  false, // Flame
  false, // Environment
  true, // Corrosion
  false, // Flame over circle
  false, // Skull & crossbones
  false, // Health hazard
  false  // Exploding bomb
];
const TEST_ADDITIVE_SIGNAL_WORD = 'None';          // 'None' | 'Warning' | 'Danger'
const TEST_ADDITIVE_OCCUPATIONAL_HAZARD = 'Zero Emission'; // 'Zero Emission' | 'Vapour/gas emission'
const TEST_ADDITIVE_AMOUNT = 4; // <=0.1, <=1, <=5, >5

console.log(
  'compute_single_additive_PP:',
  compute_single_additive_PP(
    TEST_ADDITIVE_PRESENT,
    TEST_ADDITIVE_PICTOS,
    TEST_ADDITIVE_SIGNAL_WORD,
    TEST_ADDITIVE_OCCUPATIONAL_HAZARD,
    TEST_ADDITIVE_AMOUNT
  )
);

// -------------------------------------------------------
// Extraction
// -------------------------------------------------------
console.log('\n--- EXTRACTION ---');

// TODO: choose realistic values (avoid overall_target_content = 0)
const TEST_OVERALL_TARGET_CONTENT = 247; // e.g. 100
const TEST_TARGET_YIELD = 100;            // e.g. 60

const matrixDepletion = compute_matrix_depletion(
  TEST_OVERALL_TARGET_CONTENT,
  TEST_TARGET_YIELD
);
console.log('compute_matrix_depletion:', matrixDepletion);
console.log('compute_matrix_depletion_PP:', compute_matrix_depletion_PP(matrixDepletion));

// TODO: number of solvents
const TEST_N_BIODERIVED = 2;   // e.g. 1
const TEST_N_PETROL_BASED = 2; // e.g. 2

const solventImpact = compute_solvent_impact(
  TEST_N_BIODERIVED,
  TEST_N_PETROL_BASED
);
console.log('compute_solvent_impact:', solventImpact);
console.log('compute_solvent_impact_PP:', compute_solvent_impact_PP(solventImpact));

// TODO: carbon amounts & yield
const TEST_PRODUCT_C = 0.2;   // product carbon atoms (or mass)
const TEST_STARTING_C = 0.964;  // starting material carbon
const TEST_TOTAL_YIELD = 0.3; // %

const carbonEconomy = compute_carbon_economy(
  TEST_PRODUCT_C,
  TEST_STARTING_C,
  TEST_TOTAL_YIELD
);
console.log('compute_carbon_economy:', carbonEconomy);
console.log('compute_carbon_economy_PP:', compute_carbon_economy_PP(carbonEconomy));

// TODO: duration in minutes (or chosen time unit)
const TEST_DURATION = 240;
console.log('compute_duration_PP:', compute_duration_PP(TEST_DURATION));

console.log(
  'compute_EX_Score:',
  compute_EX_Score(compute_matrix_depletion_PP(matrixDepletion), compute_solvent_impact_PP(solventImpact), compute_carbon_economy_PP(carbonEconomy), compute_duration_PP(TEST_DURATION))
);

// -------------------------------------------------------
// Process and Equipment
// -------------------------------------------------------
console.log('\n--- PROCESS & EQUIPMENT ---');

// TODO: choose valid keys from PRESSURE_LOW / PRESSURE_HIGH
const TEST_PRESSURE_LOW = '0-100'; // must be in Object.keys(PRESSURE_LOW)
const TEST_PRESSURE_HIGH = '0 (atm)';  // must be in Object.keys(PRESSURE_HIGH)

// TODO: energy consumption & duration
const TEST_ENERGY_CONSUMPTION = 4; // e.g. kWh
const TEST_PROCESS_DURATION = 66;   // minutes

console.log(
  'compute_single_process:',
  compute_single_process(
    TEST_PRESSURE_LOW,
    TEST_PRESSURE_HIGH,
    TEST_ENERGY_CONSUMPTION,
    TEST_PROCESS_DURATION
  )
);

// -------------------------------------------------------
// Waste
// -------------------------------------------------------
console.log('\n--- WASTE ---');

// TODO: product + waste masses
const TEST_PME_PRODUCT = 0.4;
const TEST_PME_BIOMASS = 1;
const TEST_PME_SOLVENT = 0.;
const TEST_PME_WATER = 20.00;
const TEST_PME_ADDITIVE = 0.05;

const pme = compute_pme(
  TEST_PME_PRODUCT,
  TEST_PME_BIOMASS,
  TEST_PME_SOLVENT,
  TEST_PME_WATER,
  TEST_PME_ADDITIVE
);
console.log('compute_pme:', pme);
console.log('compute_pme_pp:', compute_pme_pp(pme));

// -------------------------------------------------------
// Product
// -------------------------------------------------------
console.log('\n--- PRODUCT ---');

// TODO: product selectivity (%)
const TEST_SELECTIVITY = 150;

console.log(
  'compute_selectivity_PP:',
  compute_selectivity_PP(TEST_SELECTIVITY)
);

console.log('\n--- MANUAL TESTS DONE ---');
