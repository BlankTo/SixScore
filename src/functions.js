import Exclamation from './images/pictograms/Exclamation.png';
import Flame from './images/pictograms/Flame.png';
import Environment from './images/pictograms/Environment.png';
import Corrosion from './images/pictograms/Corrosion.png';
import FlameCircle from './images/pictograms/FlameCircle.png';
import Skull from './images/pictograms/Skull.png';
import Health from './images/pictograms/Health.png';
import Exploding from './images/pictograms/Exploding.png';

// Constants

export const PICTO_WORDS = ['Exclamation mark', 'Flame', 'Environment', 'Corrosion', 'Flame over circle', 'Skull & crossbones', 'Health hazard', 'Exploding bomb']


export const PICTO_IMAGES = [Exclamation, Flame, Environment, Corrosion, FlameCircle, Skull, Health, Exploding];
export const PICTO_DESC = ["May cause less serious health effect or damage to the ozone layer", "For fire hazards", "May cause damage to the acquatic environment", "For corrosive damage to metal, as well as skin, eyes", "For oxidizing hazards", "Can cause death or toxicity with short exposure to small amount", "May cause or suspected of causing serious health effects", "For explosion or reactivity hazards"];
const PICTO_PP = [1, 1, 1, 2, 2, 3, 3, 4]

const clampPenalty100 = (value) => {
    if (!Number.isFinite(value)) {
        return NaN;
    }
    return Math.max(0, Math.min(100, value));
}

const clampPenalty25 = (value) => {
    if (!Number.isFinite(value)) {
        return NaN;
    }
    return Math.max(0, Math.min(25, value));
}

// Raw Material Section ---------------------------------------------------------------------------------------------------------------------------------------------

export function compute_feedstock_generation_PP(feedstock_generation) {
    if (feedstock_generation === 'First') {
        return 2;
    } else if (feedstock_generation === 'Second') {
        return 0;
    } else if (feedstock_generation === 'Third') {
        return 1;
    } else if (feedstock_generation === 'Fourth') {
        return 1;
    } else {
        return NaN
    }
}

export function compute_availability_PP(availability) {
    if (availability === 'Easy') {
        return 0;
    } else if (availability === 'Difficult') {
        return 2;
    } else {
        return NaN
    }
}

export function compute_seasonality_PP(seasonality) {
    if (seasonality === 'Seasonal') {
        return 1;
    } else if (seasonality === 'Not Seasonal') {
        return 0;
    } else {
        return NaN
    }
}

export function compute_RM_Score(feedstock_generation, availability, seasonality) {
    const fg = compute_feedstock_generation_PP(feedstock_generation);
    const av = compute_availability_PP(availability);
    const se = compute_seasonality_PP(seasonality);

    if (Number.isNaN(fg) || Number.isNaN(av) || Number.isNaN(se)) {
        return -1;
    }

    return 100 - ((fg + av + se) * 20);
}

// Solvents and Additives -----------------------------------------------------------------------------------------------------------------------------------------------

export function compute_single_solvent_PP(present, boolean_pictogram_list, signal_word, occupational_hazard, amount) {

    if (present === false) {
        return 0;
    }

    let pp = 0

    // Pictograms

    for (let i = 0; i < boolean_pictogram_list.length; i++) {
        if (boolean_pictogram_list[i] === true) {
            pp += PICTO_PP[i]
        }
    }

    // Signal Word

    if (signal_word === 'None') {
        pp += 0
    } else if (signal_word === 'Warning') {
        pp += 1
    } else if (signal_word === 'Danger') {
        pp += 2
    } else {
        return NaN
    }

    // Occupational Hazard

    if (occupational_hazard === 'Zero Emission') {
        pp += 0
    } else if (occupational_hazard === 'Vapour/gas emission') {
        pp += 3
    } else {
        return NaN
    }

    // Amount multiplier

    if (amount <= 5) {
        pp *= 1
    } else if (amount <= 20) {
        pp *= 2
    } else if (amount <= 50) {
        pp *= 3
    } else if (amount > 50) {
        pp *= 4
    } else {
        return NaN
    }

    return pp

}

export function compute_single_additive_PP(present, boolean_pictogram_list, signal_word, occupational_hazard, amount) {

    if (present === false) {
        return 0;
    }

    let pp = 0

    // Pictograms

    for (let i = 0; i < boolean_pictogram_list.length; i++) {
        if (boolean_pictogram_list[i] === true) {
            pp += PICTO_PP[i]
        }
    }

    // Signal Word

    if (signal_word === 'None') {
        pp += 0
    } else if (signal_word === 'Warning') {
        pp += 1
    } else if (signal_word === 'Danger') {
        pp += 2
    } else {
        return NaN
    }

    // Occupational Hazard

    if (occupational_hazard === 'Zero Emission') {
        pp += 0
    } else if (occupational_hazard === 'Vapour/gas emission') {
        pp += 3
    } else {
        return NaN
    }

    // Amount multiplier

    if (amount <= 0.1) {
        pp *= 1
    } else if (amount <= 1) {
        pp *= 2
    } else if (amount <= 5) {
        pp *= 3
    } else if (amount > 5) {
        pp *= 4
    } else {
        return NaN
    }

    return pp

}

// Extraction -----------------------------------------------------------------------------------------------------------------------------------------------

export function compute_matrix_depletion(overall_target_content, target_yield) {

    if (overall_target_content === -1 || target_yield === -1) { return -1 }

    return (target_yield * 100 /overall_target_content)

}

export function compute_matrix_depletion_PP(matrix_depletion) {

    if (matrix_depletion === -1) { return -1 }

    const CONST_1 = -0.2941
    const CONST_2 = 27.941

    return clampPenalty25(((CONST_1) * matrix_depletion) + CONST_2)

}

export function compute_solvent_impact(n_bioderived, n_petrol_based) {

    if (n_bioderived === -1 || n_petrol_based === -1) { return -1 }

    return (n_bioderived + (2 * n_petrol_based))

}

export function compute_solvent_impact_PP(solvent_impact) {

    if (solvent_impact === -1) { return -1 }

    return clampPenalty25(2.5 * solvent_impact)

}

export function compute_carbon_economy(product, starting, total_yield) {

    if (product === -1 || starting === -1 || total_yield === -1) { return -1 }

    return (total_yield * product / starting)

}

export function compute_carbon_economy_PP(carbon_economy) {

    if (carbon_economy === -1) { return -1 }

    const CONST_1 = -5.071388
    const CONST_2 = 24.74817
    const CONST_3 = 0.306275
    const CONST_4 = 1.962412

    return clampPenalty25(CONST_1 + ((CONST_2 - CONST_1) / (1 + ((carbon_economy / CONST_3) ** CONST_4))))

}

export function compute_duration_PP(duration) {

    if (duration === -1) { return -1 }

    const CONST_1 = 31.90947
    const CONST_2 = 0.1271015
    const CONST_3 = 507.1445
    const CONST_4 = 1.273563

    return clampPenalty25(CONST_1 + (CONST_2 - CONST_1) / (1 + ((duration / CONST_3) ** CONST_4)))

}

export function compute_EX_Score(md_pp, si_pp, ce_pp, du_pp) {

    if (md_pp === -1 || si_pp === -1 || ce_pp === -1 || du_pp === -1) { return -1 }

    let pp = md_pp + si_pp + ce_pp + du_pp

    return Math.min(100, Math.max(0, Math.round(100 - pp)))

}

// Process and Equipment -----------------------------------------------------------------------------------------------------------------------------------------------

export const PRESSURE_HIGH = {
    '0': 0, 
    '> 0-2': 1,
    '> 2-5': 2,
    '> 5-10': 3,
    '> 10': 4
}

export const PRESSURE_LOW = {
    '0': 0,
    '< 1000-100': 1,
    '< 100-50': 2,
    '< 50-1': 3,
    '< 1': 4,
}

export function compute_single_process(pressure_low, pressure_high, energy_consumption, duration) {

    let pi_pp = 0

    pi_pp += PRESSURE_LOW[pressure_low]
    pi_pp += PRESSURE_HIGH[pressure_high]
    
    let ei_pp = 0

    if (energy_consumption <= 5) { ei_pp += 0}
    else if (energy_consumption <= 15) { ei_pp += 1 }
    else if (energy_consumption > 15) { ei_pp += 2 }

    if (duration <= 10) { ei_pp += 0 }
    else if (duration <= 30) { ei_pp += 1 }
    else if (duration <= 60) { ei_pp += 2 }
    else if (duration <= 90) { ei_pp += 3 }
    else if (duration <= 120) { ei_pp += 4 }
    else if (duration <= 240) { ei_pp += 5 }
    else if (duration <= 360) { ei_pp += 6 }
    else if (duration <= 480) { ei_pp += 7 }
    else if (duration <= 600) { ei_pp += 8 }
    else if (duration <= 720) { ei_pp += 9 }
    else if (duration <= 1440) { ei_pp += 10 }
    else if (duration > 1440) { ei_pp += 11 }

    return [pi_pp, ei_pp]

}

// Waste

export function compute_pme(product, biomass, solvent, water, additive) {

    return (100/((biomass + solvent + water + additive)/product))

}

export function compute_pme_pp(pme) {

    const CONST_1 = -1.473811
    const CONST_2 = 99.82682
    const CONST_3 = 2.080652
    const CONST_4 = 1.510155

    return clampPenalty100(CONST_1 + ((CONST_2 - CONST_1) / (1 + ((pme / CONST_3) ** CONST_4))))

}

// Product

export function compute_selectivity_PP(selectivity) {

    const CONST_1 = -28.17362
    const CONST_2 = 99.3915
    const CONST_3 = 171.945
    const CONST_4 = 1.185792

    return clampPenalty100(CONST_1 + ((CONST_2 - CONST_1) / (1 + ((selectivity / CONST_3) ** CONST_4))))

}