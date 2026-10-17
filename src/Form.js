export default class Form {
  constructor() {
    //Raw Material
    this.feedstock_generation = '';
    this.availability = '';
    this.seasonality = '';
    this.RM_score = -1;

    //Solvents & Additives
    this.solvents_SA = [];
    this.additives_SA = [];
    this.solvents_PP_SA = [];
    this.additives_PP_SA = [];
    this.SA_score = -1

    //Extraction
    this.overall_target_content_EX = -1;
    this.target_yield_EX = -1;
    this.bio_derived_EX = -1;
    this.petrol_based_EX = -1;
    this.product_EX = -1
    this.starting_EX = -1;
    this.total_yield_EX = -1;
    this.depletion_efficientcy_EX = -1;
    this.solvent_impact_EX = -1;
    this.carbon_economy_EX = -1;
    this.time_effectivness_EX = -1;
    this.EX_score = -1;

    //Processes & Equipments

    this.precesses = [];
    this.processes_PP = [];
    this.PE_score = -1;

    //Waste
    this.product_WA = -1;
    this.biomass_WA = -1;
    this.solvent_WA = -1;
    this.water_WA = -1;
    this.additive_WA = -1;
    this.solvents_WA = [];
    this.additives_WA = [];
    this.solvents_PP_WA = [];
    this.additives_PP_WA = [];
    this.PME_WA = -1;
    this.WA_score = -1;

    //Product
    this.selectivity = -1;
    this.additives_PR = [];
    this.additives_PP_PR = [];
    this.PR_score = -1;
  }
}