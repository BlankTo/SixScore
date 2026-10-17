import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import html2canvas from 'html2canvas';

// db's imports
import { firestore } from './firebase'; // Import Firestore from firebase.js
import {collection, doc, getDoc, getDocs, setDoc} from 'firebase/firestore';

// objects

import SA_obj from './SA_obj';
import PE_obj from './PE_obj';


// graphs' imports

import ReactApexChart from 'react-apexcharts';
//import ApexCharts from 'apexcharts';

// glass button

import GlassButton from "./GlassButton";

// pictograms

import { PICTO_WORDS, PICTO_IMAGES,
  //PICTO_DESC,
  PRESSURE_LOW, PRESSURE_HIGH, compute_RM_Score, compute_matrix_depletion, compute_solvent_impact, compute_carbon_economy, compute_duration_PP, compute_matrix_depletion_PP, compute_solvent_impact_PP, compute_carbon_economy_PP, compute_EX_Score, compute_single_solvent_PP, compute_single_additive_PP, compute_single_process, compute_pme, compute_pme_pp, compute_selectivity_PP, 
  compute_feedstock_generation_PP,
  compute_availability_PP,
  compute_seasonality_PP} from './functions';

// images imports

import home_hero_img from './images/hero.avif';
import library_img from './images/database.avif';
import placeholder from './images/images.avif'
import logo_six_bianco from './images/SIX_colore_bianco.png'

import logo_RM from './images/Logo Raw Material.png'
import logo_SA from './images/Logo S&A.png'
import logo_EX from './images/Logo Extraction.png'
import logo_PE from './images/Logo Process & Equipment.png'
import logo_WA from './images/Logo Waste.png'
import logo_PR from './images/Logo Product.png'

import ref_graph from './images/ref_graph.avif'

// ??

//import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// constants

const META_COLLECTION = 'submissions_meta';
const DATA_COLLECTION = 'submissions_data';
const version = '1.0';

const CLAMP_25_FIELDS = new Set([
  'depletion_efficiency_PP_EX',
  'solvent_impact_PP_EX',
  'carbon_economy_PP_EX',
  'time_effectivness_PP_EX',
]);

const CLAMP_100_FIELDS = new Set([
  'RM_score',
  'SA_score',
  'EX_score',
  'PE_score',
  'WA_score',
  'PR_score',
  'six_score',
  'PME_PP_WA',
]);

const clampScore100 = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return -1;
  if (numeric === -1) return -1;
  return Math.max(0, Math.min(100, numeric));
};

const clampScore25 = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return -1;
  if (numeric === -1) return -1;
  return Math.max(0, Math.min(25, numeric));
};

const clampAllScoreFields = (data) => {
  const out = { ...(data || {}) };
  CLAMP_100_FIELDS.forEach((field) => {
    out[field] = clampScore100(out[field]);
  });
  CLAMP_25_FIELDS.forEach((field) => {
    out[field] = clampScore25(out[field]);
  });
  return out;
};

const formatMetaScore = (value) => {
  const clamped = clampScore100(value);
  return clamped === -1 ? '-' : clamped;
};

const formatPenaltyPoint100 = (value) => {
  const clamped = clampScore100(value);
  return clamped === -1 ? '-' : clamped.toFixed(1);
};


const initialForm = {

  // meta
  institution_name: '',
  matrix_name: '',
  protocol_title: '',
  digital_object_identifier: '',

  //Raw Material
  show_RM: false,
  feedstock_generation: '',
  availability: '',
  seasonality: '',
  RM_score: -1,
  comment_RM: '',

  //SA_objects

  solvents: [],
  additives: [],

  //Solvents & Additives
  show_SA: false,
  present_solvents_SA: [],
  amount_solvents_SA: [],
  solvents_PP_SA: [],
  present_additives_SA: [],
  amount_additives_SA: [],
  additives_PP_SA: [],
  SA_score: -1,
  comment_SA: '',

  //Extraction
  show_EX: false,
  overall_target_content_EX: -1,
  target_yield_EX: -1,
  bio_derived_EX: -1,
  petrol_based_EX: -1,
  product_EX: -1,
  starting_EX: -1,
  total_yield_EX: -1,
  duration_EX: -1,
  depletion_efficiency_EX: -1,
  solvent_impact_EX: -1,
  carbon_economy_EX: -1,
  depletion_efficiency_PP_EX: -1,
  solvent_impact_PP_EX: -1,
  carbon_economy_PP_EX: -1,
  time_effectivness_PP_EX: -1,
  EX_score: -1,
  comment_EX: '',

  //Processes & Equipments
  show_PE: false,
  processes: [],
  processes_PP: [],
  PE_score: -1,
  comment_PE: '',

  //Waste
  show_WA: false,
  product_WA: -1,
  biomass_WA: -1,
  solvent_WA: -1,
  water_WA: -1,
  additive_WA: -1,
  present_solvents_WA: [],
  amount_solvents_WA: [],
  solvents_PP_WA: [],
  solvent_intensity_WA: -1,
  present_additives_WA: [],
  amount_additives_WA: [],
  additives_PP_WA: [],
  additive_intensity_WA: -1,
  PME_WA: -1,
  PME_PP_WA: -1,
  WA_score: -1,
  comment_WA: '',

  //Product
  show_PR: false,
  selectivity: -1,
  present_solvents_PR: [],
  solvents_PP_PR: [],
  solvent_intake_PR: -1,
  present_additives_PR: [],
  additives_PP_PR: [],
  additive_intake_PR: -1,
  PR_score: -1,
  comment_PR: '',

  //Overall
  six_score: -1,
}

const getSixScoreColor = (value) => {
  if (value === -1) return 'white';
  if (value < 25) return red_color;
  if (value < 50) return yellow_color;
  return green_color;
};

const getSixScoreColor_2 = (value) => {
  if (value === -1) return 'black';
  if (value < 25) return red_color;
  if (value < 50) return yellow_color;
  return green_color;
};

const green_color = '#84C85B';
const yellow_color = '#E8B776';
const red_color = '#FD7280';


// App

function App() {

  // Environment Variables
  const [currentContent, setCurrentContent] = useState(0);

  const [newSolventName, setNewSolventName] = useState('');
  const [newAdditiveName, setNewAdditiveName] = useState('');

  const [newProcessName, setNewProcessName] = useState('');
  const [processNameOther, setProcessNameOther] = useState('');

  // Privacy Policy
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const openPrivacy = () => setIsPrivacyOpen(true);
  const closePrivacy = () => setIsPrivacyOpen(false);

  const [privacyConsent, setPrivacyConsent] = useState(false)

  // asterisks

  const [triedSubmit, setTriedSubmit] = useState(false);

  // Comments

  const [comment, setComment] = useState('');

  // form data

  const [form, setForm] = useState(initialForm)

  const [form_report_data, setForm_report_data] = useState(initialForm);

  const [comparison_report_data, setComparison_report_data] = useState(initialForm);
  const [comparison_enabled, setComparison_enabled] = useState(false);

  const [loaded_report_data, setLoaded_report_data] = useState(null);
  const [loaded_enabled, setLoaded_enabled] = useState(false);

  // Database
  const [dbData, setDbData] = useState([]);

  // file

  const currentCsvInputRef = useRef(null);

  const [fileImportTarget, setFileImportTarget] = useState('loaded');

  const reportCardRef = useRef(null);


  // Utils

  /*const clear_RM = () => {

    updateFormField('feedstock_generation', '')
    updateFormField('availability', '')
    updateFormField('seasonality', '')

    updateFormField('RM_score', -1)

  }

  const clear_SA = () => {

    updateFormField('present_solvents_SA', form.solvents.filter((SA_obj_i, index) => false))
    updateFormField('amount_solvents_SA', form.solvents.filter((SA_obj_i, index) => -1))
    updateFormField('solvents_PP_SA', form.solvents.filter((SA_obj_i, index) => -1))

    updateFormField('present_additives_SA', form.additives.filter((SA_obj_i, index) => false))
    updateFormField('amount_additives_SA', form.additives.filter((SA_obj_i, index) => -1))
    updateFormField('additives_PP_SA', form.additives.filter((SA_obj_i, index) => -1))

    updateFormField('SA_score', -1)

  }

  const clear_EX = () => {

    updateFormField('overall_target_content_EX', -1)
    updateFormField('target_yield_EX', -1)

    updateFormField('bio_derived_EX', -1)
    updateFormField('petrol_based_EX', -1)

    updateFormField('product_EX', -1)
    updateFormField('starting_EX', -1)
    updateFormField('total_yield_EX', -1)

    updateFormField('duration_EX', -1)

    updateFormField('depletion_efficiency_EX', -1)
    updateFormField('solvent_impact_EX', -1)
    updateFormField('carbon_economy_EX', -1)
    updateFormField('time_effectivness_PP_EX', -1)

    updateFormField('EX_score', -1)

  }

  const clear_PE = () => {

    updateFormField('processes', [])
    updateFormField('processes_PP', [])

    updateFormField('PE_score', -1)

  }

  const clear_WA = () => {
    updateFormField('product_WA', -1)
    updateFormField('biomass_WA', -1)
    updateFormField('solvent_WA', -1)
    updateFormField('water_WA', -1)
    updateFormField('additive_WA', -1)

    updateFormField('present_solvents_WA', form.solvents.filter((SA_obj_i, index) => false))
    updateFormField('amount_solvents_WA', form.solvents.filter((SA_obj_i, index) => -1))
    updateFormField('solvents_PP_WA', form.solvents.filter((SA_obj_i, index) => -1))

    updateFormField('present_additives_WA', form.additives.filter((SA_obj_i, index) => false))
    updateFormField('amount_additives_WA', form.additives.filter((SA_obj_i, index) => -1))
    updateFormField('additives_PP_WA', form.additives.filter((SA_obj_i, index) => -1))

    updateFormField('WA_score', -1)
  }

  const clear_PR = () => {

    updateFormField('selectivity', -1)

    updateFormField('present_additives_PR', form.additives.filter((SA_obj_i, index) => false))
    updateFormField('amount_additives_PR', form.additives.filter((SA_obj_i, index) => -1))
    updateFormField('nature_additives_PR', form.additives.filter((SA_obj_i, index) => ''))
    updateFormField('additives_PP_PR', form.additives.filter((SA_obj_i, index) => -1))

    updateFormField('WA_score', -1)

  }

  const clear_all = () => {

    updateFormField('institution_name', -1)
    updateFormField('matrix_name', -1)
    updateFormField('protocol_title', -1)
    updateFormField('digital_object_identifier', -1)

    updateFormField('solvents', [])
    updateFormField('additives', [])

    clear_RM()
    clear_SA()
    clear_EX()
    clear_PE()
    clear_WA()
    clear_PR()

    updateFormField('six_score', -1)

  }*/

  const updateFormField = (field, value) => {
    const nextValue = CLAMP_25_FIELDS.has(field)
      ? clampScore25(value)
      : (CLAMP_100_FIELDS.has(field) ? clampScore100(value) : value);
    setForm(prev => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  // remove one solvent and its data from all sections
  const removeSolventEverywhere = (removeIndex) => {
    setForm((prev) => {
      const solvents = prev.solvents.filter((_, i) => i !== removeIndex);

      // Solvents & Additives (SA)
      const present_solvents_SA = prev.present_solvents_SA.filter((_, i) => i !== removeIndex);
      const amount_solvents_SA  = prev.amount_solvents_SA.filter((_, i) => i !== removeIndex);
      const solvents_PP_SA      = prev.solvents_PP_SA.filter((_, i) => i !== removeIndex);

      // Waste (WA)
      const present_solvents_WA = prev.present_solvents_WA.filter((_, i) => i !== removeIndex);
      const amount_solvents_WA  = prev.amount_solvents_WA.filter((_, i) => i !== removeIndex);
      const solvents_PP_WA      = prev.solvents_PP_WA.filter((_, i) => i !== removeIndex);

      const present_solvents_PR = prev.present_solvents_PR.filter((_, i) => i !== removeIndex);
      const solvents_PP_PR = prev.solvents_PP_PR.filter((_, i) => i !== removeIndex);

      return {
        ...prev,
        solvents,
        present_solvents_SA,
        amount_solvents_SA,
        solvents_PP_SA,
        present_solvents_WA,
        amount_solvents_WA,
        solvents_PP_WA,
        present_solvents_PR,
        solvents_PP_PR,
      };
    });
  };

  // remove one additive and its data from all sections
  const removeAdditiveEverywhere = (removeIndex) => {
    setForm((prev) => {
      const additives = prev.additives.filter((_, i) => i !== removeIndex);

      // Solvents & Additives (SA)
      const present_additives_SA = prev.present_additives_SA.filter((_, i) => i !== removeIndex);
      const amount_additives_SA  = prev.amount_additives_SA.filter((_, i) => i !== removeIndex);
      const additives_PP_SA      = prev.additives_PP_SA.filter((_, i) => i !== removeIndex);

      // Waste (WA)
      const present_additives_WA = prev.present_additives_WA.filter((_, i) => i !== removeIndex);
      const amount_additives_WA  = prev.amount_additives_WA.filter((_, i) => i !== removeIndex);
      const additives_PP_WA      = prev.additives_PP_WA.filter((_, i) => i !== removeIndex);

      // Product (PR)
      const present_additives_PR = prev.present_additives_PR.filter((_, i) => i !== removeIndex);
      const additives_PP_PR      = prev.additives_PP_PR.filter((_, i) => i !== removeIndex);

      return {
        ...prev,
        additives,
        present_additives_SA,
        amount_additives_SA,
        additives_PP_SA,
        present_additives_WA,
        amount_additives_WA,
        additives_PP_WA,
        present_additives_PR,
        additives_PP_PR,
      };
    });
  };


  const hexToRgb = (hex) => {
    let h = hex.replace('#','').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    let a = 1;
    if (h.length === 8) { a = parseInt(h.slice(6, 8), 16) / 255; h = h.slice(0, 6); }
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b, a };
  };

  const cssFromHex = (hex) => {
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return hex; // #RGB o #RRGGBB
    if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
      const { r, g, b, a } = hexToRgb(hex);
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`; // #RRGGBBAA -> rgba()
    }
    throw new Error('Colore esadecimale non valido');
  };

  const contrastOn = (hex) => {
    // usa la parte #RRGGBB per stimare il contrasto
    const base = hex.length === 9 ? hex.slice(0, 7) : hex;
    const { r, g, b } = hexToRgb(base);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? '#111827' : '#F9FAFB'; // testo scuro/chiaro
  };

  const rgba = (hex, alpha) => {
    const base = hex.length === 9 ? hex.slice(0, 7) : hex;
    const { r, g, b } = hexToRgb(base);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Apex Chart
  const backgroundHex = '#1B152E'; // esadecimale (anche con alpha opzionale)

  const radarOptions = {
    chart: {
      id: 'my-radar',
      type: 'radar',
      background: cssFromHex(backgroundHex),   // << usa esadecimale
      foreColor: contrastOn(backgroundHex),    // testo auto-contrasto
      toolbar: { show: false },
      dropShadow: { enabled: true, top: 2, left: 0, blur: 6, opacity: 0.18 },
      animations: { enabled: true, easing: 'easeinout', speed: 700 },
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    },

    theme: { mode: contrastOn(backgroundHex) === '#3fad56ff' ? 'light' : 'dark' },

    colors: ['#6366F1', '#F59E0B', '#10B981'], // current, comparison, loaded

    stroke: { width: 2, curve: 'smooth', lineCap: 'round', dashArray: [0, 6, 0], },

    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 0.25, opacityFrom: 0.35, opacityTo: 0.06, stops: [0, 90, 100] }
    },

    markers: { size: 4, strokeWidth: 2, strokeColors: '#ffffffff', hover: { size: 6 } },
    dataLabels: { enabled: false },

    plotOptions: {
      radar: {
        size: 150,
        polygons: {
          strokeColors: rgba('#FFFFFF', 0.18),
          connectorColors: rgba('#FFFFFF', 0.18),
          strokeWidth: 1,
          fill: { colors: [rgba('#FFFFFF', 0.06), rgba('#FFFFFF', 0.02)] }
        }
      }
    },

    yaxis: { min: 0, max: 100, tickAmount: 4, show: false },

    xaxis: {
      categories: ['Raw Material', 'S & A', 'Extraction', 'P & E', 'Waste', 'Product'],
      labels: { style: { fontWeight: 600, fontSize: '1rem' }, trim: true, offsetY: 6, },
    },

    tooltip: {
      theme: contrastOn(backgroundHex) === '#566d9fff' ? 'light' : 'dark',
      y: { formatter: (val) => `${Math.round(val)}%` }
    },

    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      onItemClick: { toggleDataSeries: true },  // click legend item to hide/show
      onItemHover: { highlightDataSeries: true }
    },

  };


  const db_data_to_form_data = (db) => {
    // Start from initialForm shape
    const out = {
      ...initialForm,
      // arrays will be overwritten below
    };

    // Small helper so we don’t crash on missing/short arrays
    const ensureArray = (arr, len, defaultValue) => {
      if (!Array.isArray(arr)) return new Array(len).fill(defaultValue);
      const copy = arr.slice(0, len);
      while (copy.length < len) copy.push(defaultValue);
      return copy;
    };

    // -----------------------------
    // META
    // -----------------------------
    out.institution_name         = db.institution_name || '';
    out.matrix_name              = db.matrix_name || '';
    out.protocol_title           = db.protocol_title || '';
    out.digital_object_identifier= db.digital_object_identifier || '';

    // -----------------------------
    // RAW MATERIAL
    // -----------------------------
    out.show_RM            = !!db.show_RM;
    out.feedstock_generation = db.feedstock_generation || '';
    out.availability       = db.availability || '';
    out.seasonality        = db.seasonality || '';
    out.RM_score           = db.RM_score ?? -1;
    out.comment_RM         = db.comment_RM ?? '';

    // -----------------------------
    // SOLVENTS & ADDITIVES (objects)
    // -----------------------------
    const solventsFromDb = db.solvents || [];
    out.solvents = solventsFromDb.map((s) => {
      const obj = new SA_obj();
      obj.name = s.solventName || '';
      const pictos = s.pictograms || [];
      obj.picto_bool = PICTO_WORDS.map((w) => pictos.includes(w));
      obj.signal_word = s.signalWord || 'None';
      obj.occupational_hazard = s.occupationalHazard || 'Zero Emission';
      return obj;
    });

    const additivesFromDb = db.additives || [];
    out.additives = additivesFromDb.map((a) => {
      const obj = new SA_obj();
      obj.name = a.additiveName || '';
      const pictos = a.pictograms || [];
      obj.picto_bool = PICTO_WORDS.map((w) => pictos.includes(w));
      obj.signal_word = a.signalWord || 'None';
      obj.occupational_hazard = a.occupationalHazard || 'Zero Emission';
      return obj;
    });

    const nSolv = out.solvents.length;
    const nAdd  = out.additives.length;

    // -----------------------------
    // S & A STATE
    // -----------------------------
    out.show_SA = db.show_SA ?? (nSolv > 0 || nAdd > 0);

    out.present_solvents_SA = ensureArray(db.present_solvents_SA, nSolv, true);
    out.amount_solvents_SA  = ensureArray(db.amount_solvents_SA,  nSolv, -1);
    out.solvents_PP_SA      = ensureArray(db.solvents_PP_SA,      nSolv, -1);

    out.present_additives_SA = ensureArray(db.present_additives_SA, nAdd, true);
    out.amount_additives_SA  = ensureArray(db.amount_additives_SA,  nAdd, -1);
    out.additives_PP_SA      = ensureArray(db.additives_PP_SA,      nAdd, -1);

    out.SA_score = db.SA_score ?? -1;
    out.comment_SA = db.comment_SA ?? '';

    // -----------------------------
    // EXTRACTION
    // -----------------------------
    out.show_EX                  = !!db.show_EX;
    out.overall_target_content_EX= db.overall_target_content_EX ?? -1;
    out.target_yield_EX          = db.target_yield_EX ?? -1;
    out.bio_derived_EX           = db.bio_derived_EX ?? -1;
    out.petrol_based_EX          = db.petrol_based_EX ?? -1;
    out.product_EX               = db.product_EX ?? -1;
    out.starting_EX              = db.starting_EX ?? -1;
    out.total_yield_EX           = db.total_yield_EX ?? -1;
    out.duration_EX              = db.duration_EX ?? -1;

    out.depletion_efficiency_EX   = db.depletion_efficiency_EX ?? -1;
    out.solvent_impact_EX         = db.solvent_impact_EX ?? -1;
    out.carbon_economy_EX         = db.carbon_economy_EX ?? -1;

    out.depletion_efficiency_PP_EX= db.depletion_efficiency_PP_EX ?? -1;
    out.solvent_impact_PP_EX      = db.solvent_impact_PP_EX ?? -1;
    out.carbon_economy_PP_EX      = db.carbon_economy_PP_EX ?? -1;
    out.time_effectivness_PP_EX   = db.time_effectivness_PP_EX ?? -1;
    out.EX_score                  = db.EX_score ?? -1;
    out.comment_EX                = db.comment_EX ?? '';

    // -----------------------------
    // PROCESSES & EQUIPMENT
    // -----------------------------
    out.show_PE = !!db.show_PE;

    const processesFromDb = db.processes || [];
    out.processes = processesFromDb.map((p) => {
      const obj = new PE_obj();
      obj.name              = p.processName || '';
      obj.pressure_low      = p.pressure_low || '';
      obj.pressure_high     = p.pressure_high || '';
      obj.energy_consumption= p.energy_consumption ?? -1;
      obj.duration          = p.duration ?? -1;
      return obj;
    });

    const nProc = out.processes.length;
    out.processes_PP = ensureArray(db.processes_PP, nProc, -1);
    out.PE_score     = db.PE_score ?? -1;
    out.comment_PE   = db.comment_PE ?? '';

    // -----------------------------
    // WASTE
    // -----------------------------
    out.show_WA      = !!db.show_WA;
    out.product_WA   = db.product_WA ?? -1;
    out.biomass_WA   = db.biomass_WA ?? -1;
    out.solvent_WA   = db.solvent_WA ?? -1;
    out.water_WA     = db.water_WA ?? -1;
    out.additive_WA  = db.additive_WA ?? -1;

    out.PME_WA       = db.pme ?? db.PME_WA ?? -1;
    out.PME_PP_WA    = db.pme_pp ?? db.PME_PP_WA ?? -1;

    out.present_solvents_WA = ensureArray(db.present_solvents_WA, nSolv, false);
    out.amount_solvents_WA  = ensureArray(db.amount_solvents_WA,  nSolv, -1);
    out.solvents_PP_WA      = ensureArray(db.solvents_PP_WA,      nSolv, -1);
    out.solvent_intensity_WA= db.solvent_intensity_WA ?? -1;

    out.present_additives_WA = ensureArray(db.present_additives_WA, nAdd, false);
    out.amount_additives_WA  = ensureArray(db.amount_additives_WA,  nAdd, -1);
    out.additives_PP_WA      = ensureArray(db.additives_PP_WA,      nAdd, -1);
    out.additive_intensity_WA= db.additive_intensity_WA ?? -1;

    out.WA_score = db.WA_score ?? -1;
    out.comment_WA = db.comment_WA ?? '';

    // -----------------------------
    // PRODUCT (PR)
    // -----------------------------
    out.show_PR = !!db.show_PR;
    out.selectivity = db.selectivity ?? -1;

    out.present_solvents_PR = ensureArray(db.present_solvents_PR, nSolv, false);
    out.solvents_PP_PR      = ensureArray(db.solvents_PP_PR,      nSolv, -1);
    out.solvent_intake_PR   = db.solvent_intake ?? db.solvent_intake_PR ?? -1;

    out.present_additives_PR = ensureArray(db.present_additives_PR, nAdd, false);
    out.additives_PP_PR      = ensureArray(db.additives_PP_PR,      nAdd, -1);
    out.additive_intake_PR   = db.additive_intake ?? db.additive_intake_PR ?? -1;

    out.PR_score = db.PR_score ?? -1;
    out.comment_PR = db.comment_PR ?? '';

    // -----------------------------
    // SixScore (overall)
    // -----------------------------
    out.six_score = db.six_score ?? -1;

    
    return clampAllScoreFields(out);
  };

    const load_data_into_form = (formDataFromDb) => {
      // just push it into the main form state
      setForm(clampAllScoreFields(formDataFromDb));
    };

    // Ensure imported JSON has defaults for missing fields (e.g. older exports)
    const normalizeImportedFormData = (data) => {
      const normalized = { ...(data || {}) };

      Object.keys(initialForm).forEach((key) => {
        if (normalized[key] == null) {
          normalized[key] = initialForm[key];
        }
      });

      return clampAllScoreFields(normalized);
    };

    // Load a previously exported JSON file into loaded_report_data
    const handleFileUpload = (event) => {
      const file = event?.target?.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json')) {
        window.alert('Invalid file type. Please select a .json file exported from this tool.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          const parsed = JSON.parse(text);

          // Support both:
          //  - wrapped format: { __six_export_version, exported_at, data: {...} }
          //  - raw format: { ...formObject }
          let data = parsed;
          if (parsed && parsed.__six_export_version && parsed.data) {
            data = parsed.data;
          }

          if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format in file.');
          }

          const normalizedData = normalizeImportedFormData(data);

          // Route to the correct target
          if (fileImportTarget === 'current') {
            setForm_report_data(normalizedData);
            // also load into the editable form
            load_data_into_form(normalizedData);
            setCurrentContent(4);
          } else if (fileImportTarget === 'comparison') {
            setComparison_report_data(normalizedData);
            setComparison_enabled(true);
            setCurrentContent(4);
          } else {
            // 'loaded' (default)
            setLoaded_report_data(normalizedData);
            setLoaded_enabled(true);
            setCurrentContent(4);
          }
        } catch (err) {
          console.error('Error reading uploaded file:', err);
          window.alert('Could not load this file. Make sure you selected a valid JSON export.');
        } finally {
          if (event?.target) {
            event.target.value = '';
          }
        }
      };

      reader.onerror = () => {
        console.error('File reading error');
        window.alert('Error reading the selected file.');
      };

      reader.readAsText(file);
    };

    const downloadPredefinedPdf = () => {
      const url = `${process.env.PUBLIC_URL}/user_guide.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = 'user_guide.pdf'; // nome del file scaricato
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };



    // Download the given report/form object as JSON
    const downloadData = (formObject) => {
      if (!formObject) {
        window.alert('No data available to download.');
        return;
      }

      const exportPayload = {
        __six_export_version: 1,
        exported_at: new Date().toISOString(),
        data: formObject,
      };

      const json = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      // Build a reasonably nice filename: <institution>_YYYY-MM-DDTHH-mm-ss.json
      const safeInstitution = (formObject.institution_name || 'six_report')
        .toString()
        .trim()
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '');

      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${safeInstitution || 'six_report'}_${timeStamp}.json`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(link.href);
    };

    // Trigger the hidden file input (you’ll add it in JSX)
    const openCurrentCsvPicker = (target = 'loaded') => {
      // remember which report this upload is meant for
      setFileImportTarget(target);

      if (currentCsvInputRef && currentCsvInputRef.current) {
        // reset so selecting the same file twice still triggers onChange
        currentCsvInputRef.current.value = '';
        currentCsvInputRef.current.click();
      }
    };


    const handleDownloadCardAsImage = async () => {
      if (!reportCardRef.current) return;

      try {
        const canvas = await html2canvas(reportCardRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,

          onclone: (clonedDoc) => {
            // 1) trova il contenitore dei pulsanti nella card
            const actions = clonedDoc.querySelector('[data-export-actions="true"]');
            if (!actions) return;

            // 2) rimuove i pulsanti (e quindi anche lo spazio dei bottoni)
            actions.innerHTML = '';
            actions.style.justifyContent = 'flex-end';
            actions.style.alignItems = 'center';

            // 3) prende il logo dalla titlebar e lo clona (così usi lo stesso asset)
            const titleLogo = clonedDoc.querySelector('.title_logo img');
            const logo = titleLogo ? titleLogo.cloneNode(true) : clonedDoc.createElement('img');

            // fallback se non lo trova (opzionale)
            if (!titleLogo) {
              logo.src = logo_six_bianco; // usa l’import che hai già
              logo.alt = 'Six Score Logo';
            }

            // 4) stile del logo nell’export
            logo.style.width = '140px';
            logo.style.height = 'auto';
            logo.style.cursor = 'default';

            actions.appendChild(logo);
          },
        });

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'six_report_summary.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error exporting card as image:', err);
        window.alert('Could not export the report card as an image.');
      }
    };






  /////////////////////////////////////////////////////////////////////////////////

  //useEffect(() => {}, []); // empty effect (each render update all?)

  useEffect(() => {
    // scroll the whole window to the very top whenever the page (currentContent) changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto', // or 'smooth' if you want an animated scroll
    });
  }, [currentContent]);

  useEffect(() => {

    updateFormField('RM_score', compute_RM_Score(form.feedstock_generation, form.availability, form.seasonality))

  }, [form.feedstock_generation, form.availability, form.seasonality])

  useEffect(() => {
    // If section is off, just clear SA fields
    if (!form.show_SA) {
      updateFormField('solvents_PP_SA', []);
      updateFormField('additives_PP_SA', []);
      updateFormField('SA_score', -1);
      return;
    }

    // --- per-solvent PP ---
    const solventsPP = form.solvents.map((s, i) => {
      const present = !!form.present_solvents_SA[i];
      const amount  = form.amount_solvents_SA[i] ?? -1;

      // Not present → contributes 0, but is considered "complete"
      if (!present) return 0;

      // Missing required info → mark as "not computed"
      if (!s || !s.signal_word || !s.occupational_hazard || amount === -1) {
        return -1;
      }

      const pictoList =
        Array.isArray(s.picto_bool) && s.picto_bool.length === PICTO_WORDS.length
          ? s.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

    const signalWord =
      s.signal_word && s.signal_word.trim() !== '' ? s.signal_word : 'None';

    const occHazard =
      s.occupational_hazard && s.occupational_hazard.trim() !== ''
        ? s.occupational_hazard
        : 'Zero Emission';

      const pp = compute_single_solvent_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        amount
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    // --- per-additive PP ---
    const additivesPP = form.additives.map((a, i) => {
      const present = !!form.present_additives_SA[i];
      const amount  = form.amount_additives_SA[i] ?? -1;

      if (!present) return 0;

      if (!a || !a.signal_word || !a.occupational_hazard || amount === -1) {
        return -1;
      }

      const pictoList =
        Array.isArray(a.picto_bool) && a.picto_bool.length === PICTO_WORDS.length
          ? a.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

    const signalWord =
      a.signal_word && a.signal_word.trim() !== '' ? a.signal_word : 'None';

    const occHazard =
      a.occupational_hazard && a.occupational_hazard.trim() !== ''
        ? a.occupational_hazard
        : 'Zero Emission';

      const pp = compute_single_additive_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        amount
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    // Write per-item PP arrays
    updateFormField('solvents_PP_SA', solventsPP);
    updateFormField('additives_PP_SA', additivesPP);

    // --- total SA_score ---
    const allPP = [...solventsPP, ...additivesPP];

    // No items → no score
    if (allPP.length === 0) {
      updateFormField('SA_score', -1);
      return;
    }

    // If any present item is still incomplete, keep SA_score = -1
    const hasMissing = allPP.some(pp => pp === -1);
    if (hasMissing) {
      updateFormField('SA_score', -1);
      return;
    }

    // Total penalty points: higher = worse, convert to 0–100 "score"
    const totalPP = allPP.reduce((sum, pp) => sum + pp, 0);
    const saScore = Math.max(0, Math.min(100, Math.round(100 - totalPP)));

    updateFormField('SA_score', saScore);
  }, [
    form.show_SA,
    // Solvents SA inputs
    form.solvents,
    form.present_solvents_SA,
    form.amount_solvents_SA,
    // Additives SA inputs
    form.additives,
    form.present_additives_SA,
    form.amount_additives_SA,
  ]);

  useEffect(() => {
    updateFormField('depletion_efficiency_EX', compute_matrix_depletion(form.overall_target_content_EX, form.target_yield_EX))
  }, [form.overall_target_content_EX, form.target_yield_EX])

  useEffect(() => {
    updateFormField('depletion_efficiency_PP_EX', compute_matrix_depletion_PP(form.depletion_efficiency_EX))
  }, [form.depletion_efficiency_EX])



  useEffect(() => {
    var si = compute_solvent_impact(form.bio_derived_EX, form.petrol_based_EX)
    updateFormField('solvent_impact_EX', si)
    updateFormField('solvent_impact_PP_EX', compute_solvent_impact_PP(si))
  }, [form.bio_derived_EX, form.petrol_based_EX])

  useEffect(() => {
    var ce = compute_carbon_economy(form.product_EX, form.starting_EX, form.total_yield_EX)
    updateFormField('carbon_economy_EX', ce)
    updateFormField('carbon_economy_PP_EX', compute_carbon_economy_PP(ce))
  }, [form.product_EX, form.starting_EX, form.total_yield_EX])

  useEffect(() => {
    updateFormField('time_effectivness_PP_EX', compute_duration_PP(form.duration_EX))
  }, [form.duration_EX])

  useEffect(() => {
    updateFormField('EX_score', compute_EX_Score(form.depletion_efficiency_PP_EX, form.solvent_impact_PP_EX, form.carbon_economy_PP_EX, form.time_effectivness_PP_EX))
  }, [form.depletion_efficiency_PP_EX, form.solvent_impact_PP_EX, form.carbon_economy_PP_EX, form.time_effectivness_PP_EX])


  useEffect(() => {
    // If the section is OFF, clear the PE data
    if (!form.show_PE) {
      updateFormField('processes_PP', []);
      updateFormField('PE_score', -1);
      return;
    }

    // No processes defined → nothing to compute
    if (!form.processes || form.processes.length === 0) {
      updateFormField('processes_PP', []);
      updateFormField('PE_score', -1);
      return;
    }

    // Per-process penalty points
    const processesPP = form.processes.map((proc) => {
      if (!proc) return -1;

      const pressureLow  = proc.pressure_low;
      const pressureHigh = proc.pressure_high;
      const energy       = proc.energy_consumption;
      const duration     = proc.duration;

      // Required fields: same logic as in handleSubmit
      const missingRequired =
        !pressureLow ||
        !pressureHigh ||
        energy == null ||
        duration == null ||
        energy === -1 ||
        duration === -1 ||
        Number.isNaN(energy) ||
        Number.isNaN(duration);

      if (missingRequired) {
        return -1; // "not computed yet"
      }

      // Labels must exist in PRESSURE_LOW/HIGH
      if (!(pressureLow in PRESSURE_LOW) || !(pressureHigh in PRESSURE_HIGH)) {
        return -1;
      }

      // [pressure index PP, energy index PP]
      const [piPP, eiPP] = compute_single_process(
        pressureLow,
        pressureHigh,
        Number(energy),
        Number(duration)
      );

      const totalPP = Number(piPP) + Number(eiPP);
      return Number.isNaN(totalPP) ? -1 : totalPP;
    });

    // Save per-process PP array
    updateFormField('processes_PP', processesPP);

    // If ANY process is still incomplete, keep global score = -1
    if (processesPP.some((pp) => pp === -1)) {
      updateFormField('PE_score', -1);
      return;
    }

    // Aggregate PE_score from total PP (same pattern as SA/EX)
    const totalPP = processesPP.reduce((sum, pp) => sum + pp, 0);
    const peScore = Math.max(0, Math.min(100, Math.round(100 - totalPP)));

    updateFormField('PE_score', peScore);
  }, [form.show_PE, form.processes]);


  useEffect(() => {
    // If Waste section is OFF, clear derived fields
    if (!form.show_WA) {
      updateFormField('solvents_PP_WA', []);
      updateFormField('additives_PP_WA', []);
      updateFormField('solvent_intensity_WA', -1);
      updateFormField('additive_intensity_WA', -1);
      updateFormField('PME_WA', -1);
      updateFormField('PME_PP_WA', -1);
      updateFormField('WA_score', -1);
      return;
    }

    // -------------------------
    // 1) Per-solvent waste PP
    // -------------------------
    const solventsPP_WA = form.solvents.map((s, i) => {
      const present = !!form.present_solvents_WA[i];
      const amount  = form.amount_solvents_WA[i] ?? -1;

      // Not present → contributes 0 but is "complete"
      if (!present) return 0;

      // Missing object or amount → not computed yet
      if (!s || amount === -1 || Number.isNaN(amount)) {
        return -1;
      }

      const pictoList =
        Array.isArray(s.picto_bool) && s.picto_bool.length === PICTO_WORDS.length
          ? s.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

      // Default values if empty/missing (important for old records)
      const signalWord =
        s.signal_word && s.signal_word.trim() !== '' ? s.signal_word : 'None';
      const occHazard =
        s.occupational_hazard && s.occupational_hazard.trim() !== ''
          ? s.occupational_hazard
          : 'Zero Emission';

      const pp = compute_single_solvent_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        amount
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    // Solvent intensity: sum of amounts for present solvents
    let solventIntensity = 0;
    let solventIntensityMissing = false;

    form.solvents.forEach((_, i) => {
      const present = !!form.present_solvents_WA[i];
      if (!present) return;

      const amount = form.amount_solvents_WA[i] ?? -1;
      if (amount === -1 || Number.isNaN(amount)) {
        solventIntensityMissing = true;
        return;
      }
      solventIntensity += amount;
    });

    updateFormField(
      'solvent_intensity_WA',
      solventIntensityMissing ? -1 : solventIntensity
    );

    // -------------------------
    // 2) Per-additive waste PP
    // -------------------------
    const additivesPP_WA = form.additives.map((a, i) => {
      const present = !!form.present_additives_WA[i];
      const amount  = form.amount_additives_WA[i] ?? -1;

      if (!present) return 0;

      if (!a || amount === -1 || Number.isNaN(amount)) {
        return -1;
      }

      const pictoList =
        Array.isArray(a.picto_bool) && a.picto_bool.length === PICTO_WORDS.length
          ? a.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

      const signalWord =
        a.signal_word && a.signal_word.trim() !== '' ? a.signal_word : 'None';
      const occHazard =
        a.occupational_hazard && a.occupational_hazard.trim() !== ''
          ? a.occupational_hazard
          : 'Zero Emission';

      const pp = compute_single_additive_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        amount
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    // Additive intensity: sum of amounts for present additives
    let additiveIntensity = 0;
    let additiveIntensityMissing = false;

    form.additives.forEach((_, i) => {
      const present = !!form.present_additives_WA[i];
      if (!present) return;

      const amount = form.amount_additives_WA[i] ?? -1;
      if (amount === -1 || Number.isNaN(amount)) {
        additiveIntensityMissing = true;
        return;
      }
      additiveIntensity += amount;
    });

    updateFormField(
      'additive_intensity_WA',
      additiveIntensityMissing ? -1 : additiveIntensity
    );

    // Save per-item PP arrays
    updateFormField('solvents_PP_WA', solventsPP_WA);
    updateFormField('additives_PP_WA', additivesPP_WA);

    // -------------------------
    // 3) PME and PME_PP
    // -------------------------
    const prod   = form.product_WA;
    const bio    = form.biomass_WA;
    const solv   = form.solvent_WA;
    const water  = form.water_WA;
    const add    = form.additive_WA;

    let PME_WA = -1;
    let PME_PP_WA = -1;

    const masses = [prod, bio, solv, water, add];
    const hasInvalidMass = masses.some(
      (v) => v == null || v === -1 || Number.isNaN(v)
    );

    if (!hasInvalidMass && prod > 0) {
      const totalInput = bio + solv + water + add;
      if (totalInput > 0) {
        const pmeVal = compute_pme(prod, bio, solv, water, add);
        PME_WA = Number.isNaN(pmeVal) ? -1 : pmeVal;

        if (PME_WA !== -1) {
          const pmePP = compute_pme_pp(PME_WA);
          PME_PP_WA = Number.isNaN(pmePP) ? -1 : pmePP;
        }
      }
    }

    updateFormField('PME_WA', PME_WA);
    updateFormField('PME_PP_WA', PME_PP_WA);

    // -------------------------
    // 4) Overall WA_score (0–100)
    // -------------------------
    const anySolventMissing = solventsPP_WA.some((pp) => pp === -1);
    const anyAdditiveMissing = additivesPP_WA.some((pp) => pp === -1);

    // If anything is incomplete, keep WA_score = -1
    if (PME_PP_WA === -1 || anySolventMissing || anyAdditiveMissing) {
      updateFormField('WA_score', -1);
      return;
    }

    const totalPP =
      PME_PP_WA +
      solventsPP_WA.reduce((sum, pp) => sum + pp, 0) +
      additivesPP_WA.reduce((sum, pp) => sum + pp, 0);

    const WA_score = Math.max(
      0,
      Math.min(100, Math.round(100 - totalPP))
    );

    updateFormField('WA_score', WA_score);
  }, [
    form.show_WA,
    // PME inputs
    form.product_WA,
    form.biomass_WA,
    form.solvent_WA,
    form.water_WA,
    form.additive_WA,
    // Solvent waste inputs
    form.solvents,
    form.present_solvents_WA,
    form.amount_solvents_WA,
    // Additive waste inputs
    form.additives,
    form.present_additives_WA,
    form.amount_additives_WA,
  ]);


  useEffect(() => {
    // If Product section is OFF, clear PR-derived fields
    if (!form.show_PR) {
      updateFormField('solvents_PP_PR', []);
      updateFormField('solvent_intake_PR', -1);
      updateFormField('additives_PP_PR', []);
      updateFormField('additive_intake_PR', -1);
      updateFormField('PR_score', -1);
      return;
    }

    // --- per-solvent PP (PR) & completeness check ---
    const solvents_PP_PR = form.solvents.map((s, i) => {
      const present = !!form.present_solvents_PR[i];
      if (!present) return 0;

      const pictoList =
        Array.isArray(s.picto_bool) && s.picto_bool.length === PICTO_WORDS.length
          ? s.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

      const signalWord =
        s.signal_word && s.signal_word.trim() !== '' ? s.signal_word : 'None';
      const occHazard =
        s.occupational_hazard && s.occupational_hazard.trim() !== ''
          ? s.occupational_hazard
          : 'Zero Emission';

      const pp = compute_single_solvent_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        0.01
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    updateFormField('solvents_PP_PR', solvents_PP_PR);

    let solvent_intake = 0;

    solvents_PP_PR.forEach((pp, i) => {
      const present = !!form.present_solvents_PR[i];
      if (!present) return;
      solvent_intake += pp
    });

    updateFormField('solvent_intake_PR', solvent_intake);

    // --- per-additive PP (PR) & completeness check ---
    const additives_PP_PR = form.additives.map((a, i) => {
      const present = !!form.present_additives_PR[i];
      if (!present) return 0;

      const pictoList =
        Array.isArray(a.picto_bool) && a.picto_bool.length === PICTO_WORDS.length
          ? a.picto_bool
          : new Array(PICTO_WORDS.length).fill(false);

      const signalWord =
        a.signal_word && a.signal_word.trim() !== '' ? a.signal_word : 'None';
      const occHazard =
        a.occupational_hazard && a.occupational_hazard.trim() !== ''
          ? a.occupational_hazard
          : 'Zero Emission';

      const pp = compute_single_additive_PP(
        present,
        pictoList,
        signalWord,
        occHazard,
        0.01
      );

      return Number.isNaN(pp) ? -1 : pp;
    });

    updateFormField('additives_PP_PR', additives_PP_PR);

    let additive_intake = 0;

    additives_PP_PR.forEach((pp, i) => {
      const present = !!form.present_additives_PR[i];
      if (!present) return;
      additive_intake += pp
    });

    updateFormField('additive_intake_PR', additive_intake);

    // --- selectivity component ---
    const sel = form.selectivity;
    if (sel === -1 || sel == null || Number.isNaN(sel)) {
      updateFormField('PR_score', -1);
      return;
    }

    const selPP = clampScore100(compute_selectivity_PP(sel));
    if (selPP === -1) {
      updateFormField('PR_score', -1);
      return;
    }

    // For now PR_score is driven only by selectivity penalty
    const totalPP = selPP + solvent_intake + additive_intake;
    const PR_score = Math.max(
      0, 
      Math.min(100, Math.round(100 - totalPP))
    );

    updateFormField('PR_score', PR_score);
  }, [
    form.show_PR,
    form.selectivity,
    form.solvents,
    form.present_solvents_PR,
    form.additives,
    form.present_additives_PR,
  ]);


  useEffect(() => {

    var pp = 0
    var count = 0

    if (form.RM_score === -1 && form.SA_score === -1 && form.EX_score === -1 && form.PE_score === -1 && form.WA_score === -1 && form.PR_score === -1) {
      updateFormField('six_score', -1)
      return;
    }

    if (form.RM_score !== -1) { pp += (100 - form.RM_score); count += 1; }
    if (form.SA_score !== -1) { pp += (100 - form.SA_score); count += 1; }
    if (form.EX_score !== -1) { pp += (100 - form.EX_score); count += 1; }
    if (form.PE_score !== -1) { pp += (100 - form.PE_score); count += 1; }
    if (form.WA_score !== -1) { pp += (100 - form.WA_score); count += 1; }
    if (form.PR_score !== -1) { pp += (100 - form.PR_score); count += 1; }

    updateFormField('six_score', 100 - Math.round(pp / count))

  }, [form.RM_score, form.SA_score, form.EX_score, form.PE_score, form.WA_score, form.PR_score])



  useEffect(() => { // fetch dataset on content 5
    
    if (currentContent === 5) {
      const fetchSubmissions = async () => {
        try {
          const metaSnap = await getDocs(collection(firestore, META_COLLECTION));
          const rows = metaSnap.docs.map((d) => {
            const m = d.data();
            const submitId = d.id;

            return {
              id: submitId,

              institutionName: m.institution_name ?? '-',
              matrixName:      m.matrix_name ?? '-',
              protocolTitle:   m.protocol_title ?? '-',
              DOI:             m.digital_object_identifier ?? '-',

              greenRatingRM: formatMetaScore(m.RM_score),
              greenRatingAS: formatMetaScore(m.SA_score),
              greenRatingEX: formatMetaScore(m.EX_score),
              greenRatingPE: formatMetaScore(m.PE_score),
              greenRatingWA: formatMetaScore(m.WA_score),
              greenRatingPR: formatMetaScore(m.PR_score),
              greenRating:   formatMetaScore(m.six_score),
            };
          });

          // 🔽 sort by Six Score (greenRating) descending
          const sortedRows = [...rows].sort((a, b) => {
            const aScore =
              typeof a.greenRating === 'number' ? a.greenRating : -1;
            const bScore =
              typeof b.greenRating === 'number' ? b.greenRating : -1;
            return bScore - aScore; // highest score first
          });

          setDbData(sortedRows);
        } catch (err) {
          console.error('Error fetching submissions:', err);
        }
      };

      fetchSubmissions();
    } else if (currentContent !== 1 && currentContent !== 4 && currentContent !== 6) {
      setForm(initialForm);
      setPrivacyConsent(false);
      setNewProcessName('')
      setNewSolventName('')
      setNewAdditiveName('')
      setTriedSubmit(false)
      setForm_report_data(initialForm)
      setComparison_report_data(initialForm)
      setLoaded_report_data(null)
      setComparison_enabled(false)
    }
  }, [currentContent]);

  
  // Defined elements

  const Tooltip = ({ text, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
  
    return (
      <div
        style={{ position: 'relative', display: 'inline-block', width: '20px', height: '20px', marginLeft: '5px', marginRight: '5px' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div style={{ position: 'absolute', top: '-20px', left: '40px', width: '200px', backgroundColor: 'black', color: 'white', padding: '5px', borderRadius: '10px', zIndex: 999 }}>
            {text}
          </div>
        )}
      </div>
    );
  };

  const renderSectionCommentField = (field, placeholder) => (
    <div className="debug-form-field_2">
      <div className="question debug_bold_inside_2">Comment (optional)</div>
      <textarea
        maxLength={1000}
        className="debug_form_answer comment-text-area"
        rows="3"
        placeholder={placeholder}
        value={form[field] ?? ''}
        onChange={(e) => updateFormField(field, e.target.value)}
        style={{ width: '100%', maxWidth: '100%', resize: 'vertical' }}
      />
    </div>
  );

  /*const TooltipLarge = ({ text, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
  
    return (
      <div
        style={{ position: 'relative', display: 'inline-block', width: '20px', height: '20px', marginLeft: '5px', marginRight: '5px' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div style={{ position: 'absolute', top: '-20px', left: '40px', width: '600px', backgroundColor: 'black', color: 'white', padding: '5px', borderRadius: '10px', zIndex: 999 }}>
            {text}
          </div>
        )}
      </div>
    );
  };*/

  // Big functions

  const add_Solvent = () => {
    const trimmed = newSolventName.trim();
    if (!trimmed) return;

    setForm((prev) => {
      const newObj = new SA_obj();
      newObj.name = trimmed;

      const solvents = [...prev.solvents, newObj];
      
      const present_solvents_SA = [
        ...prev.present_solvents_SA,
        true,
      ];
      const amount_solvents_SA = [
        ...prev.amount_solvents_SA,
        -1,
      ];
      const solvents_PP_SA = [
        ...prev.solvents_PP_SA,
        -1,
      ];

      const present_solvents_WA = [
        ...prev.present_solvents_WA,
        false,
      ];
      const amount_solvents_WA = [
        ...prev.amount_solvents_WA,
        -1,
      ];
      const solvents_PP_WA = [
        ...prev.solvents_PP_WA,
        -1,
      ];

      const present_solvents_PR = [
        ...prev.present_solvents_PR,
        false,
      ];
      const solvents_PP_PR = [
        ...prev.solvents_PP_PR,
        -1,
      ];

      return {
        ...prev,
        solvents,
        present_solvents_SA,
        amount_solvents_SA,
        solvents_PP_SA,
        present_solvents_WA,
        amount_solvents_WA,
        solvents_PP_WA,
        present_solvents_PR,
        solvents_PP_PR,
      };
    });

    setNewSolventName('');
  }

  const add_Additive = () => {
    const trimmed = newAdditiveName.trim();
    if (!trimmed) return;

    setForm((prev) => {
      const newObj = new SA_obj();
      newObj.name = trimmed;

      const additives = [...prev.additives, newObj];
      
      const present_additives_SA = [
        ...prev.present_additives_SA,
        true,
      ];
      const amount_additives_SA = [
        ...prev.amount_additives_SA,
        -1,
      ];
      const additives_PP_SA = [
        ...prev.additives_PP_SA,
        -1,
      ];

      const present_additives_WA = [
        ...prev.present_additives_WA,
        false,
      ];
      const amount_additives_WA = [
        ...prev.amount_additives_WA,
        -1,
      ];
      const additives_PP_WA = [
        ...prev.additives_PP_WA,
        -1,
      ];

      const present_additives_PR = [
        ...prev.present_additives_PR,
        false,
      ];
      const additives_PP_PR = [
        ...prev.additives_PP_PR,
        -1,
      ];

      return {
        ...prev,
        additives,
        present_additives_SA,
        amount_additives_SA,
        additives_PP_SA,
        present_additives_WA,
        amount_additives_WA,
        additives_PP_WA,
        present_additives_PR,
        additives_PP_PR,
      };
    });

    setNewAdditiveName('');
  }

  const handleSubmit = (event) => {

    event.preventDefault();

    var allok = true
    var check_solvents = false
    var check_additives = false
    var check_solvents_SA = false
    var check_additives_SA = false
    var check_solvents_WA = false
    var check_additives_WA = false

    if (form.show_RM) {

      if (form.feedstock_generation === '') {
        allok = false
      }
      if (form.availability === '') {
        allok = false
      }
      if (form.seasonality === '') {
        allok = false
      }

    }

    if (form.solvents.length !== 0) {
      check_solvents = true
    }

    if (form.additives.length !== 0) {
      check_additives = true
    }

    if (form.show_SA) {
      
      check_solvents_SA = true
      check_additives_SA = true

    }

    if (form.show_EX) {

      if (form.overall_target_content_EX === -1) {
        allok = false
      }
      if (form.target_yield_EX === -1) {
        allok = false
      }

      if (form.bio_derived_EX === -1) {
        allok = false
      }
      if (form.petrol_based_EX === -1) {
        allok = false
      }

      if (form.product_EX === -1) {
        allok = false
      }
      if (form.starting_EX === -1) {
        allok = false
      }
      if (form.total_yield_EX === -1) {
        allok = false
      }

      if (form.duration_EX === -1) {
        allok = false
      }

    }
    
    if (form.show_PE) {

      if (form.processes.length !== 0) {

        form.processes.map((PE_obj_i) => {

          if (PE_obj_i.pressure_low === '') {
            allok = false
          }
          if (PE_obj_i.pressure_high === '') {
            allok = false
          }

          if (PE_obj_i.energy_consumption === -1) {
            allok = false
          }
          if (PE_obj_i.duration === -1) {
            allok = false
          }

          return 0

        })

      }

    }

    if (form.show_WA) {

      if (form.product_WA === -1) {
        allok = false
      }
      if (form.matrix_WA === -1) {
        allok = false
      }
      if (form.solvent_WA === -1) {
        allok = false
      }
      if (form.water_WA === -1) {
        allok = false
      }
      if (form.additive_WA === -1) {
        allok = false
      }

      check_solvents_WA = true

      check_additives_WA = true

    }

    if (form.show_PR) {

      if (form.selectivity === -1) {
        allok = false
      }

    }

    if (check_solvents) {

      form.solvents.map((SA_obj_i) => {
        if (SA_obj_i.name === '') {
          allok = false
        }
        if (SA_obj_i.signal_word === '') {
          allok = false
        }
        if (SA_obj_i.occupational_hazard === '') {
          allok = false
        }
        return -1
      })
    
    }

    if (check_additives) {
    
      form.additives.map((SA_obj_i) => {
        if (SA_obj_i.name === '') {
          allok = false
        }
        if (SA_obj_i.signal_word === '') {
          allok = false
        }
        if (SA_obj_i.occupational_hazard === '') {
          allok = false
        }
        return -1
      })

  }

    if (check_solvents_SA) {
      
      form.present_solvents_SA.map((present, i) => {
        if (present) {
          if (form.amount_solvents_SA[i] === -1) {
            allok = false
          }
        }
        return -1
      })

    }

    if (check_additives_SA) {
      
      form.present_additives_SA.map((present, i) => {
        if (present) {
          if (form.amount_additives_SA[i] === -1) {
            allok = false
          }
        }
        return -1
      })

    }

    if (check_solvents_WA) {

      form.present_solvents_WA.map((present, i) => {
        if (present) {
          if (form.amount_solvents_WA[i] === -1) {
            allok = false
          }
        }
        return -1
      })

    }

    if (check_additives_WA) {
      
      form.present_additives_WA.map((present, i) => {
        if (present) {
          if (form.amount_additives_WA[i] === -1) {
            allok = false
          }
        }
        return -1
      })

    }

    if (privacyConsent === false) {
      allok = false
    }

    if (allok) {
      // save full form data depending on target
      setForm_report_data(form);
      setCurrentContent(4);
      setTriedSubmit(false);
    }
    else {
      setTriedSubmit(true)
      window.alert("Not all fields are correctly compiled");
    }

  };

  const handleAddToFirestore = async (target= 'current') => {

    const submit_form = target === 'current' ? form_report_data : comparison_report_data

    if (submit_form.digital_object_identifier === '') {
      window.alert("DOI must be added to submit");
      return 1;
    }

    const confirmed = window.confirm("Are you sure you want to add this to Firestore?");
    if (!confirmed) return;

    try {
      // Generate ONE id and use it for both collections
      const metaRef = doc(collection(firestore, META_COLLECTION));
      const submitId = metaRef.id;

      // -------- META DOC (summary for table) --------
      const meta = {
        submitId,

        institution_name: submit_form.institution_name,
        matrix_name: submit_form.matrix_name,
        protocol_title: submit_form.protocol_title,
        digital_object_identifier: submit_form.digital_object_identifier,

        hasSolvents:  submit_form.solvents.length > 0,
        hasAdditives: submit_form.additives.length > 0,
        hasProcesses: submit_form.processes.length > 0,

        RM_score: submit_form.RM_score,
        SA_score: submit_form.SA_score,
        EX_score: submit_form.EX_score,
        PE_score: submit_form.PE_score,
        WA_score: submit_form.WA_score,
        PR_score: submit_form.PR_score,

        six_score: submit_form.six_score,
      };

      // -------- DATA DOC (full submit_form payload) --------
      const payload = {
        submitId,

        hasSolvents:  submit_form.solvents.length > 0,
        hasAdditives: submit_form.additives.length > 0,
        hasProcesses: submit_form.processes.length > 0,

        six_score: submit_form.six_score,

        // RAW MATERIAL
        show_RM: submit_form.show_RM,
        ...(submit_form.show_RM && {
          feedstock_generation: submit_form.feedstock_generation,
          availability:        submit_form.availability,
          seasonality:         submit_form.seasonality,
        }),
        RM_score: submit_form.RM_score,
        comment_RM: submit_form.comment_RM ?? '',

        // Extraction – I’ll leave your inner fields as you had them
        show_EX: submit_form.show_EX,
        ...(submit_form.show_EX && {
          overall_target_content_EX: submit_form.overall_target_content_EX,
          target_yield_EX:           submit_form.target_yield_EX,
          depletion_efficiency_EX:  submit_form.depletion_efficiency_EX,
          bio_derived_EX:            submit_form.bio_derived_EX,
          petrol_based_EX:           submit_form.petrol_based_EX,
          solvent_impact_EX:         submit_form.solvent_impact_EX,
          product_EX:                submit_form.product_EX,
          starting_EX:               submit_form.starting_EX,
          total_yield_EX:            submit_form.total_yield_EX,
          carbon_economy_EX:         submit_form.carbon_economy_EX,
          duration_EX:               submit_form.duration_EX,
          depletion_efficiency_PP_EX:submit_form.depletion_efficiency_PP_EX,
          solvent_impact_PP_EX:      submit_form.solvent_impact_PP_EX,
          carbon_economy_PP_EX:      submit_form.carbon_economy_PP_EX,
          time_effectivness_PP_EX:   submit_form.time_effectivness_PP_EX,
        }),
        EX_score: submit_form.EX_score,
        comment_EX: submit_form.comment_EX ?? '',
      };

      // --- S&A (definitions + state arrays) ---
      if (submit_form.solvents.length) {
        payload.solvents = submit_form.solvents.map((s) => {
          const pictoBool = Array.isArray(s.picto_bool) ? s.picto_bool : [];
          const pictograms = PICTO_WORDS.filter((_, idx) => !!pictoBool[idx]);
          return {
            solventName:        s.name,
            pictograms,
            signalWord:         s.signal_word,
            occupationalHazard: s.occupational_hazard,
          };
        });
      }

      if (submit_form.additives.length) {
        payload.additives = submit_form.additives.map((a) => {
          const pictoBool = Array.isArray(a.picto_bool) ? a.picto_bool : [];
          const pictograms = PICTO_WORDS.filter((_, idx) => !!pictoBool[idx]);
          return {
            additiveName:       a.name,
            pictograms,
            signalWord:         a.signal_word,
            occupationalHazard: a.occupational_hazard,
          };
        });
      }

      payload.show_SA           = submit_form.show_SA;
      payload.present_solvents_SA  = [...submit_form.present_solvents_SA];
      payload.amount_solvents_SA   = [...submit_form.amount_solvents_SA];
      payload.solvents_PP_SA       = [...submit_form.solvents_PP_SA];
      payload.present_additives_SA = [...submit_form.present_additives_SA];
      payload.amount_additives_SA  = [...submit_form.amount_additives_SA];
      payload.additives_PP_SA      = [...submit_form.additives_PP_SA];
      payload.SA_score             = submit_form.SA_score;
      payload.comment_SA           = submit_form.comment_SA ?? '';

      // --- PE ---
      payload.show_PE = submit_form.show_PE;
      if (submit_form.processes.length) {
        payload.processes = submit_form.processes.map((p) => ({
          processName:        p.name,
          pressure_low:       p.pressure_low,
          pressure_high:      p.pressure_high,
          energy_consumption: p.energy_consumption,
          duration:           p.duration,
        }));
        payload.processes_PP = [...submit_form.processes_PP];
      }
      payload.PE_score = submit_form.PE_score;
      payload.comment_PE = submit_form.comment_PE ?? '';

      // --- WA ---
      payload.show_WA = submit_form.show_WA;
      if (submit_form.show_WA) {
        payload.product_WA  = submit_form.product_WA;
        payload.biomass_WA  = submit_form.biomass_WA;
        payload.solvent_WA  = submit_form.solvent_WA;
        payload.water_WA    = submit_form.water_WA; // <- fixed from submit_form.water
        payload.additive_WA = submit_form.additive_WA;
        payload.pme         = submit_form.PME_WA;
        payload.pme_pp      = submit_form.PME_PP_WA;

        payload.present_solvents_WA   = [...submit_form.present_solvents_WA];
        payload.amount_solvents_WA    = [...submit_form.amount_solvents_WA];
        payload.solvents_PP_WA        = [...submit_form.solvents_PP_WA];
        payload.solvent_intensity_WA  = submit_form.solvent_intensity_WA;

        payload.present_additives_WA  = [...submit_form.present_additives_WA];
        payload.amount_additives_WA   = [...submit_form.amount_additives_WA];
        payload.additives_PP_WA       = [...submit_form.additives_PP_WA];
        payload.additive_intensity_WA = submit_form.additive_intensity_WA;
      }
      payload.WA_score = submit_form.WA_score;
      payload.comment_WA = submit_form.comment_WA ?? '';

      // --- PR ---
      payload.show_PR = submit_form.show_PR;
      if (submit_form.show_PR) {
        payload.selectivity          = submit_form.selectivity;
        payload.present_solvents_PR = [...submit_form.present_solvents_PR];
        payload.solvents_PP_PR      = [...submit_form.solvents_PP_PR];
        payload.solvent_intake      = submit_form.solvent_intake_PR;
        payload.present_additives_PR = [...submit_form.present_additives_PR];
        payload.additives_PP_PR      = [...submit_form.additives_PP_PR];
        payload.additive_intake      = submit_form.additive_intake_PR;
      }
      payload.PR_score = submit_form.PR_score;
      payload.comment_PR = submit_form.comment_PR ?? '';

      // -------- ACTUAL WRITES --------
      await setDoc(metaRef, meta); // META_COLLECTION / submitId

      const dataRef = doc(collection(firestore, DATA_COLLECTION), submitId);
      await setDoc(dataRef, payload); // DATA_COLLECTION / submitId

      console.log('Data added to Firestore successfully:', submitId);
    } catch (error) {
      console.error('Error adding data to Firestore:', error);
    }
  };


  const handleComment = async () => {
    try {

      const submitId = firestore.collection('comments').doc().id;
      
      if (comment.length) {
        var data = {
          comment: comment,
        }
      }

      // Add entry to Firestore
      await firestore.collection('comments').doc(submitId).set(data);

      setComment('')

      console.log('Comment added to Firestore successfully');
    } catch (error) {
      console.error('Error adding comment to Firestore:', error);
    }
  };
  

  const openReportFromDb = async (submitId) => {
    try {
      const metaRef = doc(collection(firestore, META_COLLECTION), submitId);
      const dataRef = doc(collection(firestore, DATA_COLLECTION), submitId);

      const metaSnap = await getDoc(metaRef);
      const dataSnap = await getDoc(dataRef);

      if (!dataSnap.exists()) {
        window.alert('Submission not found.');
        return;
      }

      const meta = metaSnap.exists() ? metaSnap.data() : {};
      const raw  = dataSnap.data();

      const combined = {
        institution_name:         meta.institution_name ?? '',
        matrix_name:              meta.matrix_name ?? '',
        protocol_title:           meta.protocol_title ?? '',
        digital_object_identifier: meta.digital_object_identifier ?? '',
        ...raw,
      };

      const form_data = db_data_to_form_data(combined); // still to implement fully

      setForm_report_data(form_data);
      load_data_into_form(form_data);
      setCurrentContent(4);
    } catch (err) {
      console.error('Error loading submission:', err);
    }
  };



  const renderContent = () => {// Content Page (all page apart titlebar and sidebar)

    switch (currentContent) { // currentContent set what to see in the content part

      case 0: // 0: Home Page

      return (
        <div className="prova_page">
          <div className="prova_hero">
            <img loading="eager" rel="preload"
              className="prova_hero_image"
              src={home_hero_img}
              alt="Hero"
            />
          </div>

          <div className="prova_content">
            <div className="prova_row prova_row_first">
              <div className="prova_col prova_oneThird_1">
                <h1 className="prova_oneThird_1_title">
                  Welcome to <span className="sixscore-bold">SixScore</span><span style={{ marginLeft: '0.35rem', fontSize: '0.75rem', color: 'var(--the-white)', lineHeight: 1 }}>v{version}</span>
                </h1>
                <span className='prova_oneThird_1_text'>Your open-source solution for evaluating and enhancing the sustainability of extraction processes</span>
                <GlassButton onClick={() => setCurrentContent(1)}>Get Your Sustainability Score!</GlassButton>
              </div>
              <div className="prova_col prova_twoThird_1"></div>
            </div>

            <div className="prova_row">
              <div className="prova_col prova_oneThird_2">
                <h1 className="prova_oneThird_2_title">
                  Designed to fill the gap in Existing Metrics
                </h1>
                <span className='prova_oneThird_2_text'>Sustainability Impact for Extractions (SIX) Score provides a comprehensive framework that quantifies the environmental and health impacts of extraction protocols. By integrating key parameters such as energy efficiency, solvent usage, waste management, and equipment design, our tool empowers you to assess and improve the sustainability of your extraction methods.</span>
              </div>
              <div className="prova_col prova_Half">
                <img loading="eager" rel="preload" src={ref_graph} alt="Description of the 2" className="prova_half_img" style={{ borderRadius: '50px' }} />
              </div>
            </div>

            <div className="prova_row">
              {/* LEFT COLUMN: 3 stacked boxes */}
              <div className="prova_col prova_oneThird prova_col_split3container">
                <div className="prova_col_split3">
                  <div className="prova_col_split3_item">
                    Built upon the foundation of the Six Green Extraction Principles, SIX Score employs a penalty points system to objectively measure performance across six critical factors:
                  </div>

                  <div className="prova_col_split3_item">
                    {/* intentionally empty */}
                  </div>

                  <div className="prova_col_split3_item">
                    Each factor is carefully analysed through quantitative estimations, culminating in a single, easy-to-interpret metric: the SIX Score. With an integrated database and a user-friendly interface, our open-source software continuously evolves with emerging best practices and innovative research, ensuring that you always have access to the latest insights in sustainable extraction.
                  </div>
                </div>
              </div>

              <div className="prova_col prova_twoThird prova_col_hexagon">
                <div className="prova_hexagon">
                  <div className="prova_hex_item prova_hex_item_rm">
                    <img loading="eager" rel="preload"
                      src={logo_RM}
                      alt="logo rm section"
                      className="logo_section"
                    />
                  </div>

                  <div className="prova_hex_item prova_hex_item_sa">
                    <img loading="eager" rel="preload"
                      src={logo_SA}
                      alt="logo sa section"
                      className="logo_section"
                    />
                  </div>

                  <div className="prova_hex_item prova_hex_item_ex">
                    <img loading="eager" rel="preload"
                      src={logo_EX}
                      alt="logo ex section"
                      className="logo_section"
                    />
                  </div>

                  <div className="prova_hex_item prova_hex_item_pe">
                    <img loading="eager" rel="preload"
                      src={logo_PE}
                      alt="logo pe section"
                      className="logo_section"
                    />
                  </div>

                  <div className="prova_hex_item prova_hex_item_wa">
                    <img loading="eager" rel="preload"
                      src={logo_WA}
                      alt="logo wa section"
                      className="logo_section"
                    />
                  </div>

                  <div className="prova_hex_item prova_hex_item_pr">
                    <img loading="eager" rel="preload"
                      src={logo_PR}
                      alt="logo pr section"
                      className="logo_section"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="prova_row">
              <div className="prova_col prova_oneThird">
              </div>

              <div className="prova_col prova_twoThird prova_col_split4container">
                <div className="prova_col_split4">
                  <div className="prova_col_split4_item">
                    Join us on the journey toward <span className='bold-in-text'>greener</span>, more <span className='bold-in-text'>efficient extraction processes.</span>
                  </div>

                  <div className="prova_col_split4_item">
                    {/* intentionally empty */}
                  </div>

                  <div className="prova_col_split4_item">
                    Contribute to a future where <span className='bold-in-text'>sustainability</span> and <span className='bold-in-text'>operational excellence</span> go <span className='bold-in-text'>hand in hand.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fifth row: background image + text only in the second half */}
            <div className="prova_row prova_row_5bg">
              {/* background image, like a mini-hero */}
              <img loading="eager" rel="preload"
                src={library_img}
                alt="Background section"
                className="prova_row_5bg_img"
              />

              {/* left half: empty, only shows image */}
              <div className="prova_col prova_Half">
                {/* intentionally empty */}
              </div>

              {/* right half: text over the image */}
              <div className="prova_col prova_Half prova_row_5bg_text">
                <h2 className='row5-title'>Join our Collaborative Database</h2>
                <p className='row5-text'>
                  We invite you to contribute to our community-driven database, a key component in enhancing the sustainability calculations that form the backbone of the SIX Score. By participating, your contribution will directly support the refinement of our softwares evaluation models, helping us build solid and realistic benchmark values based on realworld data. These benchmarks are essential for comparing different extraction processes and ensuring the tool remains accurate, relevant, and scientifically grounded.
                </p>
                <GlassButton onClick={() => setCurrentContent(1)}>Compile the Form</GlassButton>
              </div>
            </div>


            <div className="prova_row">
              <div className="prova_col prova_Half row6">
                <div className='row6-inner'>
                  <h2 className='row6-title'>
                    Join the community
                    </h2>
                  <span className='row6-text'>
                    We invite you to contribute to our community-driven database, a key component in enhancing the sustainability calculations that form the backbone of the SIX Score. By participating, your contribution will directly support the refinement of our softwares evaluation models, helping us build solid and realistic benchmark values based on realworld data. These benchmarks are essential for comparing different extraction processes and ensuring the tool remains accurate, relevant, and scientifically grounded.
                  </span>
                </div>
              </div>
              <div className="prova_col prova_Half"></div>
            </div>

          </div>
        </div>
      )

      case 4:

        return (
          <div className="prova_page_form">
            {/* HERO ROW */}
            <div
              className="prova_row_form prova_row_hero_report"
              style={{ backgroundColor: '#231E3A' }}
            >
              {/* hero background could be an image; left & right columns kept as structure */}
              <div className="prova_col_form prova_OneThird_form">
                {/* intentionally empty – acts as part of the hero background */}
              </div>

              <div className="prova_col_form prova_TwoThird_form prova_row_hero_form_text">
                {/* you can add hero text here if you want */}
              </div>

              {/* CARD OVER THE HERO */}
              <div className="debug-form-card_2 border " style={{ height: '100vh' }} ref={reportCardRef}>
                {/* TOP ROW: 1/4 HEIGHT, 3 COLUMNS */}
                <div className="debug-card-row debug-card-row--top border_bottom_card">
                  <div className="debug-card-col debug-card-col--third border_right_card">
                    {/* top col 1 content */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'grey', fontSize: '1.2rem' }}>Institution name:</span>
                      <span style={{ color: 'white', fontWeight: '500', marginTop: '2vh', fontSize: '1.5rem', marginBottom: '1vh' }}>
                        {form_report_data.institution_name === '' ? 'Not specified' : form_report_data.institution_name}
                        </span>
                    </div>
                  </div>
                  <div className="debug-card-col debug-card-col--third border_right_card">
                    {/* top col 2 content */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'grey', fontSize: '1.2rem' }}>Matrix name:</span>
                      <span style={{ color: 'white', fontWeight: '500', marginTop: '2vh', fontSize: '1.5rem' }}>
                        {form_report_data.matrix_name === '' ? 'Not specified' : form_report_data.matrix_name}
                        </span>
                    </div>
                  </div>
                  <div className="debug-card-col debug-card-col--third">
                    {/* top col 3 content */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'grey', fontSize: '1.2rem' }}>Protocol title:</span>
                      <span style={{ color: 'white', fontWeight: '500', marginTop: '2vh', fontSize: '1.5rem' }}>
                        {form_report_data.protocol_title === '' ? 'Not specified' : form_report_data.protocol_title}
                        </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ROW: 3/4 HEIGHT, 2 COLUMNS */}
                <div className="debug-card-row debug-card-row--bottom">
                  <div className="debug-card-col debug-card-col--half_l border_right_card">
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',  }}>
                      
                      <div className='border_bottom_card' style={{ alignContent: 'center', flex: '1', paddingRight: '2rem' }}>
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '2rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Six Score</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '4rem', paddingBottom: '3vh', color: getSixScoreColor(form_report_data.six_score) }}>
                            {form_report_data.six_score === -1 ? '-' : form_report_data.six_score}
                          </div>
                        </div>
                      </div>

                      <div style={{ alignContent: 'center', flex: '3', paddingRight: '2rem' }}>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Raw Material</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.RM_score) }}>
                            {form_report_data.RM_score === -1 ? '-' : form_report_data.RM_score}
                          </div>
                        </div>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>S & A</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.SA_score) }}>
                            {form_report_data.SA_score === -1 ? '-' : form_report_data.SA_score}
                          </div>
                        </div>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Extraction</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.EX_score) }}>
                            {form_report_data.EX_score === -1 ? '-' : form_report_data.EX_score}
                          </div>
                        </div>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>P & E</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.PE_score) }}>
                            {form_report_data.PE_score === -1 ? '-' : form_report_data.PE_score}
                          </div>
                        </div>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Waste</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.WA_score) }}>
                            {form_report_data.WA_score === -1 ? '-' : form_report_data.WA_score}
                          </div>
                        </div>

                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1.5rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Product</strong>{' '}
                          </div>
                          <div className='border_bottom_card' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: getSixScoreColor(form_report_data.PR_score) }}>
                            {form_report_data.PR_score === -1 ? '-' : form_report_data.PR_score}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="debug-card-col debug-card-col--half_r">
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        gap: '1rem',
                      }}
                    >
                      {/* CHART AREA */}
                      <div
                        style={{
                          width: '100%',
                          flex: '1 1 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {form_report_data ? (
                          <ReactApexChart
                            options={radarOptions}
                            type="radar"
                            height={400}
                            width={500}
                            series={(() => {
                              const makeData = (report) => [
                                Math.min(100, Math.max(0, report?.RM_score ?? 0)),
                                Math.min(100, Math.max(0, report?.SA_score ?? 0)),
                                Math.min(100, Math.max(0, report?.EX_score ?? 0)),
                                Math.min(100, Math.max(0, report?.PE_score ?? 0)),
                                Math.min(100, Math.max(0, report?.WA_score ?? 0)),
                                Math.min(100, Math.max(0, report?.PR_score ?? 0)),
                              ];

                              const series = [];

                              series.push({
                                name: 'Current protocol',
                                data: makeData(form_report_data),
                              });

                              if (comparison_enabled && comparison_report_data) {
                                series.push({
                                  name: 'Comparison',
                                  data: makeData(comparison_report_data),
                                });
                              }

                              if (loaded_enabled && loaded_report_data) {
                                series.push({
                                  name: 'Loaded',
                                  data: makeData(loaded_report_data),
                                });
                              }

                              return series;
                            })()}
                          />
                        ) : (
                          <span style={{ color: 'white', opacity: 0.7 }}>
                            No data available for chart
                          </span>
                        )}
                      </div>

                      {/* BUTTONS AREA */}

                      <div
                        data-export-actions="true"
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'right',
                          gap: '0.75rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <button
                          type="button"
                          className="chart-button"
                          onClick={() => {handleAddToFirestore('current')}}
                        >
                          Add to Database +
                        </button>

                        <button
                          type="button"
                          className="chart-button chart-button--outline"
                          onClick={handleDownloadCardAsImage}
                        >
                          Download PNG 📥
                        </button>
                      </div>

                    </div>
                  </div>




                </div>
              </div>
            </div>

            {comparison_enabled && (
              <div className="prova_row_form" style={{ marginTop: '0.5rem' }}>
                <div
                  className="prova_col_form prova_Half_form"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      opacity: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Current
                  </div>
                  <div style={{ fontSize: '1.25rem', opacity: 0.75, lineHeight: 1.3, textAlign: 'center' }}>
                    <div><span style={{ fontWeight: 600 }}>Matrix:</span> {form_report_data?.matrix_name || '-'}</div>
                    <div><span style={{ fontWeight: 600 }}>Protocol:</span> {form_report_data?.protocol_title || '-'}</div>
                  </div>
                </div>
                <div
                  className="prova_col_form prova_Half_form"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      opacity: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Comparison
                  </div>
                  <div style={{ fontSize: '1.25rem', opacity: 0.75, lineHeight: 1.3, textAlign: 'center' }}>
                    <div><span style={{ fontWeight: 600 }}>Matrix:</span> {comparison_report_data?.matrix_name || '-'}</div>
                    <div><span style={{ fontWeight: 600 }}>Protocol:</span> {comparison_report_data?.protocol_title || '-'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* CARD 2 – RAW MATERIAL */}
            {(form_report_data.show_RM || (comparison_enabled && comparison_report_data.show_RM)) && <div className="prova_row_form">
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Raw Material
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(form_report_data.RM_score) }}>
                      {/* use form or your snapshot object here */}
                      {form_report_data.RM_score === -1 ? '-' : form_report_data.RM_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">
                    {/* Feedstock generation */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Feedstock generation</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.feedstock_generation === '' ? '' : '(' + form_report_data.feedstock_generation + ')'} <span style={{ fontWeight: '600'}}>{form_report_data.feedstock_generation === '' ? '-' : compute_feedstock_generation_PP(form_report_data.feedstock_generation) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    form_report_data.feedstock_generation === ''
                                                                    ? 'black'
                                                                    : form_report_data.feedstock_generation === 'Third'
                                                                    ? yellow_color
                                                                    : form_report_data.feedstock_generation === 'Fourth'
                                                                    ? yellow_color
                                                                    : form_report_data.feedstock_generation === 'Second'
                                                                    ? green_color
                                                                    : form_report_data.feedstock_generation === 'First'
                                                                    ? red_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                    {/* Availability */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Availability</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.availability === '' ? '' : '(' + form_report_data.availability + ')'} <span style={{ fontWeight: '600'}}>{form_report_data.availability === '' ? '-' : compute_availability_PP(form_report_data.availability) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    form_report_data.availability === ''
                                                                    ? 'black'
                                                                    : form_report_data.availability === 'Easy'
                                                                    ? green_color
                                                                    : form_report_data.availability === 'Difficult'
                                                                    ? red_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                    {/* Seasonality */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Seasonality</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.seasonality === '' ? '' : '(' + form_report_data.seasonality + ')'} <span style={{ fontWeight: '600'}}>{form_report_data.seasonality === '' ? '-' : compute_seasonality_PP(form_report_data.seasonality) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    form_report_data.seasonality === ''
                                                                    ? 'black'
                                                                    : form_report_data.seasonality === 'Not Seasonal'
                                                                    ? green_color
                                                                    : form_report_data.seasonality === 'Seasonal'
                                                                    ? yellow_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                  </div>
                </div>
              </div>
              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Raw Material
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(comparison_report_data.RM_score) }}>
                      {/* use form or your snapshot object here */}
                      {comparison_report_data.RM_score === -1 ? '-' : comparison_report_data.RM_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">
                    {/* Feedstock generation */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Feedstock generation</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.feedstock_generation === '' ? '' : '(' + comparison_report_data.feedstock_generation + ')'} <span style={{ fontWeight: '600'}}>{comparison_report_data.feedstock_generation === '' ? '-' : compute_feedstock_generation_PP(comparison_report_data.feedstock_generation) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    comparison_report_data.feedstock_generation === ''
                                                                    ? 'black'
                                                                    : comparison_report_data.feedstock_generation === 'Third'
                                                                    ? yellow_color
                                                                    : comparison_report_data.feedstock_generation === 'Fourth'
                                                                    ? yellow_color
                                                                    : comparison_report_data.feedstock_generation === 'Second'
                                                                    ? green_color
                                                                    : comparison_report_data.feedstock_generation === 'First'
                                                                    ? red_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                    {/* Availability */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Availability</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.availability === '' ? '' : '(' + comparison_report_data.availability + ')'} <span style={{ fontWeight: '600'}}>{comparison_report_data.availability === '' ? '-' : compute_availability_PP(comparison_report_data.availability) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    comparison_report_data.availability === ''
                                                                    ? 'black'
                                                                    : comparison_report_data.availability === 'Easy'
                                                                    ? green_color
                                                                    : comparison_report_data.availability === 'Difficult'
                                                                    ? red_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                    {/* Seasonality */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Seasonality</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.seasonality === '' ? '' : '(' + comparison_report_data.seasonality + ')'} <span style={{ fontWeight: '600'}}>{comparison_report_data.seasonality === '' ? '-' : compute_seasonality_PP(comparison_report_data.seasonality) * 20}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor:
                                                                    comparison_report_data.seasonality === ''
                                                                    ? 'black'
                                                                    : comparison_report_data.seasonality === 'Not Seasonal'
                                                                    ? green_color
                                                                    : comparison_report_data.seasonality === 'Seasonal'
                                                                    ? yellow_color
                                                                    : 'black'
                                                                    }} />*/}
                    </div>

                  </div>
                </div>
              </div>}

            </div>}

            {/* CARD 3 – S & A */}
            {(form_report_data.show_SA || (comparison_enabled && comparison_report_data.show_SA)) && <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Solvents & Additives
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(form_report_data.SA_score) }}>
                      {/* use form or your snapshot object here */}
                      {form_report_data.SA_score === -1 ? '-' : form_report_data.SA_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">
                    
                    <div>Solvents:</div>

                    {(form_report_data.solvents || []).map((solvent, index) => (
                      <div key={`solvent-${index}`} >
                        {form_report_data.present_solvents_SA[index] && 
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{solvent.name}</strong>{' '}
                          </div>
                          <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {!form_report_data.present_solvents_SA[index] ? '-' : form_report_data.solvents_PP_SA[index] === -1 ? '-': form_report_data.solvents_PP_SA[index]}
                          </div>
                          {/*<span className="circle rm-circle" />*/}
                        </div>}
                      </div>
                    ))}
                    
                    <div>Additives:</div>

                    {(form_report_data.additives || []).map((additive, index) => (
                      <div key={`solvent-${index}`} >
                        {form_report_data.present_additives_SA[index] && 
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{additive.name}</strong>{' '}
                          </div>
                          <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {!form_report_data.present_additives_SA[index] ? 'not present' : form_report_data.additives_PP_SA[index] === -1 ? '-': form_report_data.additives_PP_SA[index]}
                          </div>
                          {/*<span className="circle rm-circle" />*/}
                        </div>}
                      </div>
                    ))}

                  </div>
                </div>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Solvents & Additives
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(comparison_report_data.SA_score) }}>
                      {/* use form or your snapshot object here */}
                      {comparison_report_data.SA_score === -1 ? '-' : comparison_report_data.SA_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">
                    
                    <div>Solvents:</div>

                    {(comparison_report_data.solvents || []).map((solvent, index) => (
                      <div key={`solvent-${index}`} >
                        {comparison_report_data.present_solvents_SA[index] && 
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{solvent.name}</strong>{' '}
                          </div>
                          <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {!comparison_report_data.present_solvents_SA[index] ? '-' : comparison_report_data.solvents_PP_SA[index] === -1 ? '-': comparison_report_data.solvents_PP_SA[index]}
                          </div>
                          {/*<span className="circle rm-circle" />*/}
                        </div>}
                      </div>
                    ))}
                    
                    <div>Additives:</div>

                    {(comparison_report_data.additives || []).map((additive, index) => (
                      <div key={`solvent-${index}`} >
                        {comparison_report_data.present_additives_SA[index] && 
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>{additive.name}</strong>{' '}
                          </div>
                          <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {!comparison_report_data.present_additives_SA[index] ? 'not present' : comparison_report_data.additives_PP_SA[index] === -1 ? '-': comparison_report_data.additives_PP_SA[index]}
                          </div>
                          {/*<span className="circle rm-circle" />*/}
                        </div>}
                      </div>
                    ))}

                  </div>
                </div>
              </div>}

            </div>}

            
            {/* CARD 4 – EXTRACTION */}
            {(form_report_data.show_EX || (comparison_enabled && comparison_report_data.show_EX)) && <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Extraction
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(form_report_data.EX_score) }}>
                      {/* use form or your snapshot object here */}
                      {form_report_data.EX_score === -1 ? '-' : form_report_data.EX_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Depletion Efficiency</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.depletion_efficiency_EX === -1 ? '' : 
                        '(' + (form_report_data.depletion_efficiency_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{form_report_data.depletion_efficiency_EX === -1 ? '-' : (form_report_data.depletion_efficiency_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: form_report_data.depletion_efficiency_EX > 75 ? green_color: form_report_data.depletion_efficiency_EX > 50 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Solvent Impact</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.solvent_impact_EX === -1 ? '' : 
                        '(' + (form_report_data.solvent_impact_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{form_report_data.solvent_impact_EX === -1 ? '-' : (form_report_data.solvent_impact_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: form_report_data.solvent_impact_EX < 4 ? green_color: form_report_data.solvent_impact_EX < 7 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Carbon Economy</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.carbon_economy_EX === -1 ? '' : 
                        '(' + (form_report_data.carbon_economy_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{form_report_data.carbon_economy_EX === -1 ? '-' : (form_report_data.carbon_economy_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: form_report_data.carbon_economy_EX > 0.5 ? green_color: form_report_data.carbon_economy_EX > 0.2 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Duration</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.duration_EX === -1 ? '' : 
                        '(' + (form_report_data.duration_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{form_report_data.duration_EX === -1 ? '-' : (form_report_data.time_effectivness_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: form_report_data.duration_EX < 120 ? green_color: form_report_data.duration_EX < 720 ? yellow_color : red_color }} />*/}
                    </div>


                  </div>
                </div>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Extraction
                    </div>

                    <div style={{ fontSize: '3rem', fontWeight: 600, color: getSixScoreColor_2(comparison_report_data.EX_score) }}>
                      {/* use form or your snapshot object here */}
                      {comparison_report_data.EX_score === -1 ? '-' : comparison_report_data.EX_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Depletion Efficiency</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.depletion_efficiency_EX === -1 ? '' : 
                        '(' + (comparison_report_data.depletion_efficiency_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{comparison_report_data.depletion_efficiency_EX === -1 ? '-' : (comparison_report_data.depletion_efficiency_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: comparison_report_data.depletion_efficiency_EX > 75 ? green_color: comparison_report_data.depletion_efficiency_EX > 50 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Solvent Impact</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.solvent_impact_EX === -1 ? '' : 
                        '(' + (comparison_report_data.solvent_impact_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{comparison_report_data.solvent_impact_EX === -1 ? '-' : (comparison_report_data.solvent_impact_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: comparison_report_data.solvent_impact_EX < 4 ? green_color: comparison_report_data.solvent_impact_EX < 7 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Carbon Economy</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.carbon_economy_EX === -1 ? '' : 
                        '(' + (comparison_report_data.carbon_economy_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{comparison_report_data.carbon_economy_EX === -1 ? '-' : (comparison_report_data.carbon_economy_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: comparison_report_data.carbon_economy_EX > 0.5 ? green_color: comparison_report_data.carbon_economy_EX > 0.2 ? yellow_color : red_color }} />*/}
                    </div>

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong style={{ fontSize: '1rem', fontWeight: '500', whiteSpace: 'nowrap' }}>Duration</strong>{' '}
                      </div>
                      <div className='border_bottom_card_2' style={{ width: '100%', paddingBottom: '3vh', marginLeft: '1vw', marginRight: '1vw' }}></div>
                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.duration_EX === -1 ? '' : 
                        '(' + (comparison_report_data.duration_EX).toFixed(2) + ') '
                        }<span style={{ fontWeight: '600' }}>{comparison_report_data.duration_EX === -1 ? '-' : (comparison_report_data.time_effectivness_PP_EX).toFixed(1)}</span>
                      </div>
                      {/*<span className="circle rm-circle" style={{ backgroundColor: comparison_report_data.duration_EX < 120 ? green_color: comparison_report_data.duration_EX < 720 ? yellow_color : red_color }} />*/}
                    </div>


                  </div>
                </div>
              </div>}
              
            </div>}



            {/* CARD 5 – Processes & Equipment */}
            {(form_report_data.show_PE || (comparison_enabled && comparison_report_data.show_PE)) && <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Processes &amp; Equipment
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(form_report_data.PE_score),
                      }}
                    >
                      {form_report_data.PE_score === -1 ? '-' : form_report_data.PE_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: list of processes with their own score */}
                  <div className="debug-form-field_2">
                    <div>Processes:</div>

                    {(form_report_data.processes || []).map((proc, index) => (
                      <div key={`process-${index}`}>
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong
                              style={{
                                fontSize: '1rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {proc.name || `Process ${index + 1}`}
                            </strong>{' '}
                          </div>

                          <div
                            className="border_bottom_card_2"
                            style={{
                              width: '100%',
                              paddingBottom: '3vh',
                              marginLeft: '1vw',
                              marginRight: '1vw',
                            }}
                          ></div>

                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {Array.isArray(form_report_data.processes_PP) &&
                            form_report_data.processes_PP[index] !== undefined &&
                            form_report_data.processes_PP[index] !== -1
                              ? form_report_data.processes_PP[index]
                              : '-'}
                          </div>

                          {/*<span className="circle rm-circle" />*/}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Processes &amp; Equipment
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(comparison_report_data.PE_score),
                      }}
                    >
                      {comparison_report_data.PE_score === -1 ? '-' : comparison_report_data.PE_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: list of processes with their own score */}
                  <div className="debug-form-field_2">
                    <div>Processes:</div>

                    {(comparison_report_data.processes || []).map((proc, index) => (
                      <div key={`process-${index}`}>
                        <div className="rm-line">
                          <div className="rm-line-text">
                            <strong
                              style={{
                                fontSize: '1rem',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {proc.name || `Process ${index + 1}`}
                            </strong>{' '}
                          </div>

                          <div
                            className="border_bottom_card_2"
                            style={{
                              width: '100%',
                              paddingBottom: '3vh',
                              marginLeft: '1vw',
                              marginRight: '1vw',
                            }}
                          ></div>

                          <div style={{ fontSize: '2rem', color: 'black' }}>
                            {Array.isArray(comparison_report_data.processes_PP) &&
                            comparison_report_data.processes_PP[index] !== undefined &&
                            comparison_report_data.processes_PP[index] !== -1
                              ? comparison_report_data.processes_PP[index]
                              : '-'}
                          </div>

                          {/*<span className="circle rm-circle" />*/}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>}
              
            </div>}


            {/* CARD 6 – WASTE */}
            {(form_report_data.show_WA || (comparison_enabled && comparison_report_data.show_WA)) && <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Waste
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(form_report_data.WA_score),
                      }}
                    >
                      {form_report_data.WA_score === -1 ? '-' : form_report_data.WA_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">

                    {/* Optional: PME display */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <div className="rm-line">
                        <div className="rm-line-text">
                          <strong
                            style={{
                              fontSize: '1rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Process Mass Efficiency
                          </strong>{' '}
                        </div>

                        <div
                          className="border_bottom_card_2"
                          style={{
                            width: '100%',
                            paddingBottom: '3vh',
                            marginLeft: '1vw',
                            marginRight: '1vw',
                          }}
                        ></div>

                        <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                          {
                            form_report_data.PME_WA === -1
                            ? ''
                            : '(PME: ' + form_report_data.PME_WA.toFixed(2) + ') '
                            }<span style={{ fontWeight: '600' }}>{
                              form_report_data.PME_PP_WA === -1
                            ? '-'
                            : (form_report_data.PME_PP_WA).toFixed(1)
                            }</span>
                        </div>

                        {/*<span className="circle rm-circle" />*/}
                      </div>
                    </div>


                    {/* Solvent waste */}
                    <div>Solvents (waste):</div>

                    {(form_report_data.solvents || []).map((solvent, index) => (
                      <div key={`waste-solvent-${index}`}>
                        {form_report_data.present_solvents_WA &&
                          form_report_data.present_solvents_WA[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {solvent.name}
                                </strong>{' '}
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(form_report_data.solvents_PP_WA) ||
                                form_report_data.solvents_PP_WA[index] === undefined ||
                                form_report_data.solvents_PP_WA[index] === -1
                                  ? '-'
                                  : form_report_data.solvents_PP_WA[index]}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                    {/* Additive waste */}
                    <div style={{ marginTop: '1.5rem' }}>Additives (waste):</div>

                    {(form_report_data.additives || []).map((additive, index) => (
                      <div key={`waste-additive-${index}`}>
                        {form_report_data.present_additives_WA &&
                          form_report_data.present_additives_WA[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {additive.name}
                                </strong>{' '}
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(form_report_data.additives_PP_WA) ||
                                form_report_data.additives_PP_WA[index] === undefined ||
                                form_report_data.additives_PP_WA[index] === -1
                                  ? '-'
                                  : form_report_data.additives_PP_WA[index]}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}


                  </div>
                </div>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Waste
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(comparison_report_data.WA_score),
                      }}
                    >
                      {comparison_report_data.WA_score === -1 ? '-' : comparison_report_data.WA_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY: each field with its own circle on the FAR RIGHT */}
                  <div className="debug-form-field_2">

                    {/* Optional: PME display */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <div className="rm-line">
                        <div className="rm-line-text">
                          <strong
                            style={{
                              fontSize: '1rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Process Mass Efficiency
                          </strong>{' '}
                        </div>

                        <div
                          className="border_bottom_card_2"
                          style={{
                            width: '100%',
                            paddingBottom: '3vh',
                            marginLeft: '1vw',
                            marginRight: '1vw',
                          }}
                        ></div>

                        <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                          {
                            comparison_report_data.PME_WA === -1
                            ? ''
                            : '(PME: ' + comparison_report_data.PME_WA.toFixed(2) + ') '
                            }<span style={{ fontWeight: '600' }}>{
                              comparison_report_data.PME_PP_WA === -1
                            ? '-'
                            : (comparison_report_data.PME_PP_WA).toFixed(1)
                            }</span>
                        </div>

                        {/*<span className="circle rm-circle" />*/}
                      </div>
                    </div>


                    {/* Solvent waste */}
                    <div>Solvents (waste):</div>

                    {(comparison_report_data.solvents || []).map((solvent, index) => (
                      <div key={`waste-solvent-${index}`}>
                        {comparison_report_data.present_solvents_WA &&
                          comparison_report_data.present_solvents_WA[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {solvent.name}
                                </strong>{' '}
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(comparison_report_data.solvents_PP_WA) ||
                                comparison_report_data.solvents_PP_WA[index] === undefined ||
                                comparison_report_data.solvents_PP_WA[index] === -1
                                  ? '-'
                                  : comparison_report_data.solvents_PP_WA[index]}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                    {/* Additive waste */}
                    <div style={{ marginTop: '1.5rem' }}>Additives (waste):</div>

                    {(comparison_report_data.additives || []).map((additive, index) => (
                      <div key={`waste-additive-${index}`}>
                        {comparison_report_data.present_additives_WA &&
                          comparison_report_data.present_additives_WA[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {additive.name}
                                </strong>{' '}
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(comparison_report_data.additives_PP_WA) ||
                                comparison_report_data.additives_PP_WA[index] === undefined ||
                                comparison_report_data.additives_PP_WA[index] === -1
                                  ? '-'
                                  : comparison_report_data.additives_PP_WA[index]}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}


                  </div>
                </div>
              </div>}

            </div>}


            
            {/* CARD 7 – PRODUCT */}
            {(form_report_data.show_PR || (comparison_enabled && comparison_report_data.show_PR)) && <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Product
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(form_report_data.PR_score),
                      }}
                    >
                      {form_report_data.PR_score === -1 ? '-' : form_report_data.PR_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY */}
                  <div className="debug-form-field_2">
                    {/* Selectivity */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong
                          style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Selectivity
                        </strong>{' '}
                      </div>

                      <div
                        className="border_bottom_card_2"
                        style={{
                          width: '100%',
                          paddingBottom: '3vh',
                          marginLeft: '1vw',
                          marginRight: '1vw',
                        }}
                      ></div>

                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {form_report_data.selectivity === -1 ||
                        form_report_data.selectivity == null ||
                        Number.isNaN(form_report_data.selectivity)
                          ? ''
                          : '(' + form_report_data.selectivity + ' mg/g extract) '}<span style={{ fontWeight: '600' }}>{form_report_data.selectivity === -1 ||
                        form_report_data.selectivity == null ||
                        Number.isNaN(form_report_data.selectivity)
                          ? '-' : formatPenaltyPoint100(compute_selectivity_PP(form_report_data.selectivity))}</span>
                      </div>

                      {/*<span className="circle rm-circle" />*/}
                    </div>

                    {/* Additives in Product */}
                    <div style={{ marginTop: '1.5rem' }}>Contaminants:</div>

                    {(form_report_data.solvents || []).map((solvent, index) => (
                      <div key={`product-solvent-${index}`}>
                        {Array.isArray(form_report_data.present_solvents_PR) &&
                          form_report_data.present_solvents_PR[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {solvent.name}
                                </strong>
                                <span
                                  style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                  }}
                                >
                                </span>
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(form_report_data.solvents_PP_PR) ||
                                form_report_data.solvents_PP_PR[index] === undefined ||
                                form_report_data.solvents_PP_PR[index] === -1
                                  ? '-'
                                  : Math.max(
                                      0,
                                      form_report_data.solvents_PP_PR[index]
                                    )}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                    {(form_report_data.additives || []).map((additive, index) => (
                      <div key={`product-additive-${index}`}>
                        {Array.isArray(form_report_data.present_additives_PR) &&
                          form_report_data.present_additives_PR[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {additive.name}
                                </strong>
                                <span
                                  style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                  }}
                                >
                                </span>
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(form_report_data.additives_PP_PR) ||
                                form_report_data.additives_PP_PR[index] === undefined ||
                                form_report_data.additives_PP_PR[index] === -1
                                  ? '-'
                                  : Math.max(
                                      0,
                                      form_report_data.additives_PP_PR[index]
                                    )}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                  </div>
                </div>
              </div>
              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <div className="debug-form-card">
                  {/* HEADER: title + score on the right */}
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Product
                    </div>

                    <div
                      style={{
                        fontSize: '3rem',
                        fontWeight: 600,
                        color: getSixScoreColor_2(comparison_report_data.PR_score),
                      }}
                    >
                      {comparison_report_data.PR_score === -1 ? '-' : comparison_report_data.PR_score}
                    </div>
                  </div>

                  <div className="debug-form-separator" />

                  {/* BODY */}
                  <div className="debug-form-field_2">
                    {/* Selectivity */}

                    <div className="rm-line">
                      <div className="rm-line-text">
                        <strong
                          style={{
                            fontSize: '1rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Selectivity
                        </strong>{' '}
                      </div>

                      <div
                        className="border_bottom_card_2"
                        style={{
                          width: '100%',
                          paddingBottom: '3vh',
                          marginLeft: '1vw',
                          marginRight: '1vw',
                        }}
                      ></div>

                      <div style={{ fontSize: '1.6rem', color: 'black', whiteSpace: 'nowrap' }}>
                        {comparison_report_data.selectivity === -1 ||
                        comparison_report_data.selectivity == null ||
                        Number.isNaN(comparison_report_data.selectivity)
                          ? ''
                          : '(' + comparison_report_data.selectivity + ' mg/g extract) '}<span style={{ fontWeight: '600' }}>{comparison_report_data.selectivity === -1 ||
                        comparison_report_data.selectivity == null ||
                        Number.isNaN(comparison_report_data.selectivity)
                          ? '-' : formatPenaltyPoint100(compute_selectivity_PP(comparison_report_data.selectivity))}</span>
                      </div>

                      {/*<span className="circle rm-circle" />*/}
                    </div>

                    {/* Additives in Product */}
                    <div style={{ marginTop: '1.5rem' }}>Contaminants:</div>

                    {(comparison_report_data.solvents || []).map((solvent, index) => (
                      <div key={`product-solvent-${index}`}>
                        {Array.isArray(comparison_report_data.present_solvents_PR) &&
                          comparison_report_data.present_solvents_PR[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {solvent.name}
                                </strong>
                                <span
                                  style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                  }}
                                >
                                </span>
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(comparison_report_data.solvents_PP_PR) ||
                                comparison_report_data.solvents_PP_PR[index] === undefined ||
                                comparison_report_data.solvents_PP_PR[index] === -1
                                  ? '-'
                                  : Math.max(
                                      0,
                                      comparison_report_data.solvents_PP_PR[index]
                                    )}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                    {(comparison_report_data.additives || []).map((additive, index) => (
                      <div key={`product-additive-${index}`}>
                        {Array.isArray(comparison_report_data.present_additives_PR) &&
                          comparison_report_data.present_additives_PR[index] && (
                            <div className="rm-line">
                              <div className="rm-line-text">
                                <strong
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {additive.name}
                                </strong>
                                <span
                                  style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.85rem',
                                    opacity: 0.7,
                                  }}
                                >
                                </span>
                              </div>

                              <div
                                className="border_bottom_card_2"
                                style={{
                                  width: '100%',
                                  paddingBottom: '3vh',
                                  marginLeft: '1vw',
                                  marginRight: '1vw',
                                }}
                              ></div>

                              <div style={{ fontSize: '2rem', color: 'black' }}>
                                {!Array.isArray(comparison_report_data.additives_PP_PR) ||
                                comparison_report_data.additives_PP_PR[index] === undefined ||
                                comparison_report_data.additives_PP_PR[index] === -1
                                  ? '-'
                                  : Math.max(
                                      0,
                                      comparison_report_data.additives_PP_PR[index]
                                    )}
                              </div>

                              {/*<span className="circle rm-circle" />*/}
                            </div>
                          )}
                      </div>
                    ))}

                  </div>
                </div>
              </div>}

            </div>}

            {/* CARD  */}
            <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {handleAddToFirestore('current')}}
                >
                  Add to Database +
                </button>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {handleAddToFirestore('comparison')}}
                >
                  Add comparison to Database +
                </button>
              </div>}
              
            </div>

            {/* CARD  */}
            <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2 chart-button_2--outline"
                  onClick={() => {
                    load_data_into_form(form_report_data);
                    setCurrentContent(1);
                  }}
                  disabled={!form_report_data}
                >
                  Modify Current
                </button>
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {
                    setComparison_report_data(form_report_data);
                    setComparison_enabled(true)
                    setForm_report_data(initialForm);
                    load_data_into_form(initialForm);
                    setPrivacyConsent(false)
                    setCurrentContent(1);
                  }}
                  disabled={!form_report_data}
                >
                  Compile New and Compare with Current
                </button>
                <button
                  type="button"
                  className="chart-button_2 chart-button_2--outline"
                  onClick={() => downloadData(form_report_data)}
                  disabled={!form_report_data}
                >
                  Download Current 📥
                </button>
              </div>

              {comparison_enabled && <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2 chart-button_2--outline"
                  onClick={() => {
                    load_data_into_form(comparison_report_data);
                    setComparison_report_data(form_report_data)
                    setForm_report_data(initialForm)
                    setCurrentContent(1);
                  }}
                  disabled={!form_report_data}
                >
                  Modify Comparison
                </button>
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {
                    setForm_report_data(initialForm);
                    setComparison_enabled(true)
                    load_data_into_form(initialForm);
                    setPrivacyConsent(false)
                    setCurrentContent(1);
                  }}
                  disabled={!form_report_data}
                >
                  Compile New and Compare with Comparison
                </button>
                <button
                  type="button"
                  className="chart-button_2 chart-button_2--outline"
                  onClick={() => {
                    setComparison_report_data(initialForm);
                    setComparison_enabled(false);
                  }}
                >
                  Remove Comparison
                </button>
                <button
                  type="button"
                  className="chart-button_2 chart-button_2--outline"
                  onClick={() => downloadData(comparison_report_data)}
                  disabled={!comparison_report_data}
                >
                  Download Comparison 📥
                </button>
              </div>}
              
            </div>

            {/* CARD  */}
            <div className="prova_row_form">
              
              <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {openCurrentCsvPicker('current')}}
                >
                  Load Data to current 📤	
                </button>
              </div>

              <div className="prova_col_form prova_Half_form">
                <button
                  type="button"
                  className="chart-button_2"
                  onClick={() => {openCurrentCsvPicker('comparison')}}
                >
                  Load Data to comparison 📤	
                </button>
              </div>
              
            </div>




          </div>
        );


      case 1:

      return (
        
        <div className='prova_page_form'>
          <div className="prova_row_form prova_row_hero_form">
            {/* background image, like a mini-hero */}
            <img loading="eager" rel="preload"
              src={placeholder}
              alt="Background section"
              className="prova_row_hero_form_img"
            />

            {/* left half: empty, only shows image */}
            <div className="prova_col_form prova_OneThird_form">
              {/* intentionally empty */}
            </div>

            {/* right half: text over the image */}
            <div className="prova_col_form prova_TwoThird_form prova_row_hero_form_text">
              <h2 className='hero_form_title'>SixScore Form</h2>
              <p className='hero_form_text'>
                SIX Score Hub is an open-access, versioned web platform that operationalizes the SIX Score metric to integrate sustainability assessment directly into green-extraction process design. It supports continuous optimization by scoring the impact of different solvents, additives, and enabling technologies, paving the way for transparent comparison of protocols and evidence-based decision-making as methods evolve.
              </p>
              <p className='hero_form_text'>
                The SIX Score Hub database is a structured, traceable, community-driven repository of SIX Score assessments. It enables aggregation of population-level trends for benchmarking and periodic refinement of thresholds and scoring functions, and provides a robust foundation for future workflows while preserving full data origin.
              </p>
              <GlassButton onClick={() => setCurrentContent(5)}><span style={{ color: '#000' }}>Check the Database</span></GlassButton>
            </div>
          </div>

          {/* NEW ROW: centered rectangle with fields */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card_1">
                <div className="debug-form-field">
                  <div className="question debug_bold_inside">Institution Name:</div>
                  <input
                    type="text" maxLength="50"
                    className="debug_form_answer"
                    value={form.institution_name}
                    onChange={(e) => updateFormField('institution_name', e.target.value)}
                    placeholder="Enter institution name"
                  />
                </div>

                <div className="debug-form-field">
                  <div className="question debug_bold_inside">Matrix Name:</div>
                  <input
                    type="text" maxLength="50"
                    className="debug_form_answer"
                    value={form.matrix_name}
                    onChange={(e) => updateFormField('matrix_name', e.target.value)}
                    placeholder="Enter matrix name"
                  />
                </div>

                <div className="debug-form-field">
                  <div className="question debug_bold_inside">Protocol Title:</div>
                  <input
                    type="text" maxLength="50"
                    className="debug_form_answer"
                    value={form.protocol_title}
                    onChange={(e) => updateFormField('protocol_title', e.target.value)}
                    placeholder="Enter protocol title"
                  />
                </div>

                <div className="debug-form-field">
                  <div className="question debug_bold_inside">DOI</div>
                  <input
                    type="text" maxLength="50"
                    className="debug_form_answer"
                    value={form.digital_object_identifier}
                    onChange={(e) => updateFormField('digital_object_identifier', e.target.value)}
                    placeholder="Enter DOI"
                  />
                  <div className="debug_field_helper">
                    Needed for database submission.
                  </div>
                </div>

              </div>
            </div>
          </div>


          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">

                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Raw Material</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="Raw_Material_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_RM}
                          onChange={(e) => updateFormField('show_RM', e.target.checked)}
                          aria-label="Toggle Raw Material debug section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body: fields only when toggle is ON */}
                {form.show_RM && (
                  <>
                    <div className="debug-form-separator" />
                    <div className="debug-form-field_2">
                      <div className="question debug_bold_inside_2">
                        <span>Feedstock Generation:</span>
                        <Tooltip text="Follow biorefinery-based biomass classification">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      
                      <select
                        className={
                          "debug_form_answer_2" +
                          (triedSubmit && form.feedstock_generation === ""
                            ? " debug_form_answer_2--error"
                            : "")
                        }
                        value={form.feedstock_generation}
                        onChange={(e) => updateFormField('feedstock_generation', e.target.value)}
                      >
                        <option value="">Select.</option>
                        <option value="First">First</option>
                        <option value="Second">Second</option>
                        <option value="Third">Third</option>
                        <option value="Fourth">Fourth</option>
                      </select>
                    </div>

                    <div className="debug-form-field_2">
                      <div className="question debug_bold_inside_2">
                        <span>Availability:</span>
                        <Tooltip text="Global production surpass 10 million tons per year is considered high availability (check FAOSTAT data or other official sources)">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      <select
                        className={
                          "debug_form_answer_2" +
                          (triedSubmit && form.availability === ""
                            ? " debug_form_answer_2--error"
                            : "")
                        }
                        value={form.availability}
                        onChange={(e) => updateFormField('availability', e.target.value)}
                      >
                        <option value="">Select.</option>
                        <option value="Easy">Easy</option>
                        <option value="Difficult">Difficult</option>
                      </select>
                    </div>

                    <div className="debug-form-field_2">
                      <div className="question debug_bold_inside_2">
                        <span>Seasonability:</span>
                        <Tooltip text="Seasonal if available only in one season per year">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      <select
                        className={
                          "debug_form_answer_2" +
                          (triedSubmit && form.seasonality === ""
                            ? " debug_form_answer_2--error"
                            : "")
                        }
                        value={form.seasonality}
                        onChange={(e) => updateFormField('seasonality', e.target.value)}
                      >
                        <option value="">Select.</option>
                        <option value="Seasonal">Seasonal</option>
                        <option value="Not Seasonal">Not Seasonal</option>
                      </select>
                    </div>

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_RM',
                      'Optional notes for this Raw Material section.'
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Solvents & Additives */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">

                {/* header: title + toggle */}
                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Solvents &amp; Additives</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="SA_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_SA}
                          onChange={(e) =>
                            updateFormField('show_SA', e.target.checked)
                          }
                          aria-label="Toggle Solvents & Additives section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body only when toggle is ON */}
                {form.show_SA && (
                  <>
                    <div className="debug-form-separator" />

                    {/* two columns: Solvents / Additives */}
                    <div
                      className="debug-form-field_2"
                      style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', width: '100%' }}
                    >
                      {/* SOLVENTS COLUMN */}
                      <div style={{ flex: 1, width: '100%' }}>
                        <div className="question debug_bold_inside_2">
                          Solvent List
                        </div>

                        {/* add solvent */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <input
                            type="text" maxLength="50"
                            className="debug_form_answer_2_SA"
                            placeholder="New solvent name"
                            value={newSolventName}
                            onChange={(e) => setNewSolventName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={add_Solvent}
                            >
                            <span className="btn-add-label">Add item</span>
                            <span className="btn-add-icon">
                              <span className="btn-add-plus">+</span>
                            </span>
                          </button>

                        </div>

                        {/* existing solvents */}
                        {form.solvents.map((solvent, index) => (
                          <div
                            key={`solvent-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: solvent name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {solvent.name || `Solvent ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>

                                {/* right: free / toggle / present */}
                                {/*<div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                  'present-label' +
                                  (!(form.present_solvents_SA[index] ?? false)
                                    ? ' present-label--active'
                                    : '')
                                }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_solvents_SA[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_solvents_SA = [...prev.present_solvents_SA];
                                          present_solvents_SA[index] = checked;
                                          return { ...prev, present_solvents_SA };
                                        });
                                      }}
                                      aria-label="Solvent present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_solvents_SA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>*/}

                                <button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeSolventEverywhere(index)}
                                  >
                                  <span className="btn-remove-label">Remove</span>
                                  <span className="btn-remove-icon">
                                    <span className="btn-remove-plus">-</span>
                                  </span>
                                </button>
                              </div>

                            </div>

                            {/* details only if present */}
                            {form.present_solvents_SA[index] && (
                              <div className='sa-details'>
                                {/* pictograms */}
                                <div className="debug-form-field_2">
                                  
                                  <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.35rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {PICTO_WORDS.map((picto, pictogramIndex) => (
                                      <div
                                        key={pictogramIndex}
                                        className="picto-row"
                                      >
                                        {/* left: pictogram image placeholder */}
                                        <div className='picto-left'>
                                          <img loading="eager" rel="preload"
                                            className="picto-icon"
                                            src={PICTO_IMAGES[pictogramIndex]}
                                            alt={picto}
                                          />

                                          {/* center: name */}
                                          <div className="picto-name">{picto}</div>
                                        </div>

                                        {/* right: checkbox */}
                                        {/* right: toggle styled like the others */}
                                          <label className="picto-toggle toggle_debug">
                                            <input
                                              type="checkbox"
                                              checked={solvent.picto_bool[pictogramIndex] ?? false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm((prev) => {
                                                  const solvents = [...prev.solvents];
                                                  const s = { ...solvents[index] };
                                                  const picto_bool = [...s.picto_bool];
                                                  picto_bool[pictogramIndex] = checked;
                                                  s.picto_bool = picto_bool;
                                                  solvents[index] = s;
                                                  return { ...prev, solvents };
                                                });
                                              }}
                                            />
                                            <span className="slider"></span>
                                          </label>

                                        
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* signal word */}
                                <div className="debug-form-field_2 signal-row">
                                  {/* left: label */}
                                  <div className="question debug_bold_inside_2">
                                    Signal word
                                  </div>

                                  {/* right: horizontal options */}
                                  <div className="signal-options">
                                    {['None', 'Warning', 'Danger'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={
                                          'signal-option' +
                                          (solvent.signal_word === option ? ' signal-option--selected' : '')
                                        }
                                        onClick={() => {
                                          setForm((prev) => {
                                            const solvents = [...prev.solvents];
                                            const s = { ...solvents[index] };
                                            s.signal_word = option;
                                            solvents[index] = s;
                                            return { ...prev, solvents };
                                          });
                                        }}
                                      >
                                        <span
                                          className={
                                            'signal-dot' +
                                            (solvent.signal_word === option ? ' signal-dot--selected' : '')
                                          }
                                        />
                                        <span className="signal-label">{option}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* occupational hazard */}
                                <div className="debug-form-field_2 hazard-row">
                                  {/* left: label text */}
                                  <span className="question debug_bold_inside_2">
                                    Vapour/gas emission
                                  </span>

                                  {/* right: toggle */}
                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={solvent.occupational_hazard === 'Vapour/gas emission'}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((prev) => {
                                          const solvents = [...prev.solvents];
                                          const s = { ...solvents[index] };
                                          s.occupational_hazard = on
                                            ? 'Vapour/gas emission'
                                            : 'Zero Emission';
                                          solvents[index] = s;
                                          return { ...prev, solvents };
                                        });
                                      }}
                                      aria-label="Toggle vapour/gas emission occupational hazard"
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>


                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* amount */}
                                <div className="debug-form-field_2 amount-row">
                                  <span className="question debug_bold_inside_2">
                                    Amount <span className='debug_bold_inside_2_EX_question_unit'>(S:L)
                                      <Tooltip text="Millilitres of solvent used for processing 1 gram of matrix.">
                                        <div className="info-circle">i</div>
                                      </Tooltip>
                                      </span>
                                  </span>

                                  <div className={
                                          "amount-input-wrapper" +
                                          (triedSubmit && form.amount_solvents_SA[index] === -1
                                            ? " amount-input-wrapper--error"
                                            : "")
                                        }>
                                    <span className="amount-prefix">1:</span>
                                    <input
                                      type="number"
                                      min="0" max="1000000"
                                      className = 'debug_form_answer_2 amount-input'
                                      
                                      value={
                                        form.amount_solvents_SA[index] === -1 ||
                                        form.amount_solvents_SA[index] == null ||
                                        Number.isNaN(form.amount_solvents_SA[index])
                                          ? ''
                                          : form.amount_solvents_SA[index]
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num = raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const amount_solvents_SA = [...prev.amount_solvents_SA];
                                          amount_solvents_SA[index] = Number.isNaN(num) ? -1 : num;

                                          const solvents = [...prev.solvents];
                                          const s = { ...solvents[index] };
                                          s.amount = amount_solvents_SA[index];
                                          solvents[index] = s;

                                          return {
                                            ...prev,
                                            amount_solvents_SA,
                                            solvents,
                                          };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>



                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                      {/* --------------------------------------------------------------------------------------- */}

                      {/* ADDITIVES COLUMN */}
                      <div style={{ flex: 1, width: '100%', marginTop: '-1rem' }}>
                        <div className="question debug_bold_inside_2">
                          Additive List
                        </div>

                        {/* add additive */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <input
                            type="text" maxLength="50"
                            className="debug_form_answer_2_SA"
                            placeholder="New additive name"
                            value={newAdditiveName}
                            onChange={(e) => setNewAdditiveName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={add_Additive}
                            >
                            <span className="btn-add-label">Add item</span>
                            <span className="btn-add-icon">
                              <span className="btn-add-plus">+</span>
                            </span>
                          </button>

                        </div>

                        {/* existing additives */}
                        {form.additives.map((additive, index) => (
                          <div
                            key={`additive-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: additive name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {additive.name || `Additive ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>

                                {/* right: free / toggle / present */}
                                {/*<div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                    'present-label' +
                                    (!(form.present_additives_SA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_additives_SA[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_additives_SA = [...prev.present_additives_SA];
                                          present_additives_SA[index] = checked;
                                          return { ...prev, present_additives_SA };
                                        });
                                      }}
                                      aria-label="Additive present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_additives_SA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>*/}

                                <button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeAdditiveEverywhere(index)}
                                  >
                                  <span className="btn-remove-label">Remove</span>
                                  <span className="btn-remove-icon">
                                    <span className="btn-remove-plus">-</span>
                                  </span>
                                </button>
                              </div>

                            </div>

                            {/* details only if present */}
                            {form.present_additives_SA[index] && (
                              <div className='sa-details'>
                                {/* pictograms */}
                                <div className="debug-form-field_2">
                                  
                                  <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.35rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {PICTO_WORDS.map((picto, pictogramIndex) => (
                                      <div
                                        key={pictogramIndex}
                                        className="picto-row"
                                      >
                                        {/* left: pictogram image placeholder */}
                                        <div className='picto-left'>
                                          <img loading="eager" rel="preload"
                                            className="picto-icon"
                                            src={PICTO_IMAGES[pictogramIndex]}
                                            alt={picto}
                                          />

                                          {/* center: name */}
                                          <div className="picto-name">{picto}</div>
                                        </div>

                                        {/* right: checkbox */}
                                        {/* right: toggle styled like the others */}
                                          <label className="picto-toggle toggle_debug">
                                            <input
                                              type="checkbox"
                                              checked={additive.picto_bool[pictogramIndex] ?? false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm((prev) => {
                                                  const additives = [...prev.additives];
                                                  const s = { ...additives[index] };
                                                  const picto_bool = [...s.picto_bool];
                                                  picto_bool[pictogramIndex] = checked;
                                                  s.picto_bool = picto_bool;
                                                  additives[index] = s;
                                                  return { ...prev, additives };
                                                });
                                              }}
                                            />
                                            <span className="slider"></span>
                                          </label>

                                        
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* signal word */}
                                <div className="debug-form-field_2 signal-row">
                                  {/* left: label */}
                                  <div className="question debug_bold_inside_2">
                                    Signal word
                                  </div>

                                  {/* right: horizontal options */}
                                  <div className="signal-options">
                                    {['None', 'Warning', 'Danger'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={
                                          'signal-option' +
                                          (additive.signal_word === option ? ' signal-option--selected' : '')
                                        }
                                        onClick={() => {
                                          setForm((prev) => {
                                            const additives = [...prev.additives];
                                            const s = { ...additives[index] };
                                            s.signal_word = option;
                                            additives[index] = s;
                                            return { ...prev, additives };
                                          });
                                        }}
                                      >
                                        <span
                                          className={
                                            'signal-dot' +
                                            (additive.signal_word === option ? ' signal-dot--selected' : '')
                                          }
                                        />
                                        <span className="signal-label">{option}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* occupational hazard */}
                                <div className="debug-form-field_2 hazard-row">
                                  {/* left: label text */}
                                  <span className="question debug_bold_inside_2">
                                    Vapour/gas emission
                                  </span>

                                  {/* right: toggle */}
                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={additive.occupational_hazard === 'Vapour/gas emission'}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((prev) => {
                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.occupational_hazard = on
                                            ? 'Vapour/gas emission'
                                            : 'Zero Emission';
                                          additives[index] = s;
                                          return { ...prev, additives };
                                        });
                                      }}
                                      aria-label="Toggle vapour/gas emission occupational hazard"
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>


                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* amount */}
                                <div className="debug-form-field_2 amount-row-2">
                                  <span className="question debug_bold_inside_2">
                                    Amount <span className='debug_bold_inside_2_EX_question_unit'>(% on biomass weight)</span>
                                  </span>

                                  <div className={
                                          "amount-input-wrapper" +
                                          (triedSubmit && form.amount_additives_SA[index] === -1
                                            ? " amount-input-wrapper--error"
                                            : "")
                                        }>
                                    <input
                                      type="number"
                                      min="0" max="1000000"
                                      className="debug_form_answer_2 amount-input-2"
                                      value={
                                        form.amount_additives_SA[index] === -1 ||
                                        form.amount_additives_SA[index] == null ||
                                        Number.isNaN(form.amount_additives_SA[index])
                                          ? ''
                                          : form.amount_additives_SA[index]
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num = raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const amount_additives_SA = [...prev.amount_additives_SA];
                                          amount_additives_SA[index] = Number.isNaN(num) ? -1 : num;

                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.amount = amount_additives_SA[index];
                                          additives[index] = s;

                                          return {
                                            ...prev,
                                            amount_additives_SA,
                                            additives,
                                          };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>



                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* --------------------------------------------------------------------------------------- */}

                      
                    </div>

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_SA',
                      'Optional notes for this Solvents & Additives section.'
                    )}
                  </>
                )}
              </div>
            </div>
          </div>


          
          {/* Extraction */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">
                {/* header: title + toggle */}
                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Extraction</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="EX_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_EX}
                          onChange={(e) => updateFormField('show_EX', e.target.checked)}
                          aria-label="Toggle Extraction section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body only when toggle is ON */}
                {form.show_EX && (
                  <>
                    <div className="debug-form-separator" />

                    {/* 1) Depletion Efficiency */}
                    <div className="debug-form-field_2 ex-subsection-row">
                      <div className="ex-subsection-title">
                        <div className="question debug_bold_inside_2_EX_title">
                          Depletion Efficiency
                        </div>
                      </div>

                      <div className="ex-subsection-body">
                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Overall target content <span className='debug_bold_inside_2_EX_question_unit'>mg target compound / g matrix</span>
                            <Tooltip text="This data requires an exhaustive quantification of targeted compound present into the matrix">
                              <div className="info-circle">i</div>
                            </Tooltip>

                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.overall_target_content_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder="Insert a valid numerical value"
                            value={
                              form.overall_target_content_EX === -1 ||
                              form.overall_target_content_EX == null ||
                              Number.isNaN(form.overall_target_content_EX)
                                ? ''
                                : form.overall_target_content_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'overall_target_content_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Target yield <span className='debug_bold_inside_2_EX_question_unit'>mg target compound / g matrix</span>
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.target_yield_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder="Insert a valid numerical value"
                            value={
                              form.target_yield_EX === -1 ||
                              form.target_yield_EX == null ||
                              Number.isNaN(form.target_yield_EX)
                                ? ''
                                : form.target_yield_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'target_yield_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                      </div>
                    </div>

                    <div className="debug-form-separator" />

                    {/* 2) Solvent Impact */}
                    <div className="debug-form-field_2 ex-subsection-row">
                      <div className="ex-subsection-title">
                        <div className="question debug_bold_inside_2_EX_title">
                          Solvent impact
                        </div>
                      </div>

                      <div className="ex-subsection-body">
                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            N° of bio-derived solvents
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.bio_derived_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder='Insert a valid numerical value'
                            value={
                              form.bio_derived_EX === -1 ||
                              form.bio_derived_EX == null ||
                              Number.isNaN(form.bio_derived_EX)
                                ? ''
                                : form.bio_derived_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'bio_derived_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            N° of petrol-based solvents
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.petrol_based_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder='Insert a valid numerical value'
                            value={
                              form.petrol_based_EX === -1 ||
                              form.petrol_based_EX == null ||
                              Number.isNaN(form.petrol_based_EX)
                                ? ''
                                : form.petrol_based_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'petrol_based_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                      </div>
                    </div>

                    <div className="debug-form-separator" />

                    {/* 3) Carbon economy */}
                    <div className="debug-form-field_2 ex-subsection-row">
                      <div className="ex-subsection-title">
                        <div className="question debug_bold_inside_2_EX_title">
                          Carbon economy
                          <Tooltip text="To calculate the Organic Fraction content, a calcination protocol can be used. We recommend performing calcination at 650°C for 4 hours, after prior dehydration of the sample.">
                            <div className="info-circle">i</div>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="ex-subsection-body">
                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Product <span className='debug_bold_inside_2_EX_question_unit'>g Org. Fr./g Extract</span>
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.product_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder='Insert a valid numerical value'
                            value={
                              form.product_EX === -1 ||
                              form.product_EX == null ||
                              Number.isNaN(form.product_EX)
                                ? ''
                                : form.product_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'product_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Starting matrix <span className='debug_bold_inside_2_EX_question_unit'>g Org. Fr./g Matrix</span>
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.starting_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder='Insert a valid numerical value'
                            value=
                            {
                              form.starting_EX === -1 ||
                              form.starting_EX == null ||
                              Number.isNaN(form.starting_EX)
                                ? ''
                                : form.starting_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'starting_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Total yield <span className='debug_bold_inside_2_EX_question_unit'>g Extract/g Matrix</span>
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.total_yield_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder='Insert a valid numerical value'
                            value={
                              form.total_yield_EX === -1 ||
                              form.total_yield_EX == null ||
                              Number.isNaN(form.total_yield_EX)
                                ? ''
                                : form.total_yield_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'total_yield_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                      </div>
                    </div>

                    <div className="debug-form-separator" />

                    {/* 4) Time efficiency */}
                    <div className="debug-form-field_2 ex-subsection-row">
                      <div className="ex-subsection-title">
                        <div className="question debug_bold_inside_2_EX_title">
                          Time efficiency
                        </div>
                      </div>

                      <div className="ex-subsection-body">
                        <div className="debug-form-field_2">
                          <div className="question debug_bold_inside_2_EX_question">
                            Duration <span className='debug_bold_inside_2_EX_question_unit'>minutes</span>
                          </div>
                          <input
                            type="number"
                            className={
                              "debug_form_answer" +
                              (triedSubmit && form.duration_EX === -1
                                ? " debug_form_answer--error"
                                : "")
                            }
                            placeholder="Insert a valid numerical value"
                            value={
                              form.duration_EX === -1 ||
                              form.duration_EX == null ||
                              Number.isNaN(form.duration_EX)
                                ? ''
                                : form.duration_EX
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const num =
                                raw === '' ? -1 : Number.parseFloat(raw);
                              updateFormField(
                                'duration_EX',
                                Number.isNaN(num) ? -1 : num
                              );
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>

                      </div>
                    </div>

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_EX',
                      'Optional notes for this Extraction section.'
                    )}
                  </>
                )}
              </div>
            </div>
          </div>


          

          {/* Processes & Equipment */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">

                {/* header: title + toggle */}
                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Processes &amp; Equipment</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="PE_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_PE}
                          onChange={(e) => updateFormField('show_PE', e.target.checked)}
                          aria-label="Toggle Processes & Equipment section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body only when toggle is ON */}
                {form.show_PE && (
                  <>
                    <div className="debug-form-separator" />

                    {/* add process */}
                    <div className="debug-form-field_2">
                      <div className="question debug_bold_inside_2">
                        Processes
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          marginTop: '0.5rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <select
                          className="debug_form_answer_2_SA"
                          value={newProcessName}
                          onChange={(e) => setNewProcessName(e.target.value)}
                        >
                          <option value="">Select process</option>

                          <option disabled>--- Pretreatment ---</option>
                          <option value="Grinding">Grinding</option>
                          <option value="Sieving">Sieving</option>
                          
                          <option disabled>--- Extraction ---</option>
                          <option value="Microwaves">Microwaves</option>
                          <option value="Ultrasound">Ultrasound</option>
                          <option value="Hydrodynamic Cavitation">Hydrodynamic Cavitation</option>
                          <option value="Pulsed Electric Field">Pulsed Electric Field</option>
                          <option value="Intense Pulse Light">Intense Pulse Light</option>
                          <option value="Instant Controlled Pressure Drop">Instant Controlled Pressure Drop</option>
                          <option value="Extrusion">Extrusion</option>
                          <option value="High Shear Homogenization">High Shear Homogenization</option>
                          <option value="Tribology">Tribology</option>
                          <option value="Ohmie Heating">Ohmic Heating</option>
                          <option value="Electric Resistance Heating">Electric Resistance Heating</option>
                          <option value="De/Pressurization Only">De/Pressurization Only</option>
                          <option value="Cooling/Freezing">Cooling/Freezing</option>
                          <option value="Ambient Conditions">Ambient Conditions</option>
                          
                          <option disabled>--- Downstream ---</option>
                          <option value="Solid Filtration">Solid Filtration</option>
                          <option value="Centrifugation">Centrifugation</option>
                          <option value="Evaporation System">Evaporation System</option>
                          
                          <option disabled>--- Others ---</option>
                          <option value="Other...">Other...</option>

                          {/* add / edit more options as you like */}
                        </select>

                        {newProcessName === 'Other...' && (<input name="Add_Process_Name_Text" placeholder='process name' className="answer debug_form_answer_2_SA" type="text" maxLength="50" value={processNameOther} onChange={(e) => {
                          setProcessNameOther(e.target.value)
                        }} />)}

                        <button
                          type="button"
                          className="btn-add"
                          onClick={() => {

                            var trimmed

                            if (newProcessName === 'Other...') {
                              trimmed = processNameOther.trim();
                            } else {
                              trimmed = newProcessName.trim();
                            }

                            if (!trimmed) return;

                            setForm((prev) => {
                              const newObj = new PE_obj();
                              newObj.name = trimmed;

                              const processes = [...prev.processes, newObj];
                              const processes_PP = [...prev.processes_PP, -1];

                              return { ...prev, processes, processes_PP };
                            });

                            setNewProcessName('');
                          }}
                        >
                          <span className="btn-add-label">Add</span>
                          <span className="btn-add-icon"><span className="btn-add-plus">+</span></span>
                        </button>
                      </div>
                    </div>

                    {/* existing processes */}
                    {form.processes.length > 0 && (
                      <div className="debug-form-field_2">
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            gap: '0.75rem',
                          }}
                        >
                          {form.processes.map((proc, index) => (
                            <div
                              key={index}
                              style={{
                                /*borderTop: '1px solid #ddd',/* */
                                paddingTop: '0.75rem',
                              }}
                            >
                              
                            <div className="debug-form-separator" />

                              {/* header row: name + remove */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                <div className="debug_bold_inside_2_EX_title">
                                  {proc.name || `Process ${index + 1}`}
                                </div>

                                <button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => {
                                    setForm((prev) => {
                                      const processes = prev.processes.filter(
                                        (_, i) => i !== index
                                      );
                                      const processes_PP = prev.processes_PP.filter(
                                        (_, i) => i !== index
                                      );
                                      return { ...prev, processes, processes_PP };
                                    });
                                  }}
                                >
                                  <span className="btn-add-label">Remove</span>
                                  <span className="btn-add-icon"><span className="btn-remove-plus">-</span></span>
                                </button>
                              </div>

                              {/* details area aligned with 33% / 66% layout */}
                              <div className="pe-details">
                                {/* Pressure range */}
                                <div className="debug-form-field_2 pe-row">
                                  <div className="pe-label question debug_bold_inside_2">
                                    Pressure range
                                  </div>

                                  <div className="pe-field">

                                    <div className="PE_drop">

                                      {/* Low pressure select */}
                                      <span className="PE_span">Low:</span>
                                      <select
                                        className={
                                          "debug_form_answer_2" +
                                          (triedSubmit &&
                                          form.show_PE &&
                                          (proc.pressure_low === "" || proc.pressure_low == null)
                                            ? " debug_form_answer_2--error"
                                            : "")
                                        }
                                        value={proc.pressure_low || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setForm((prev) => {
                                            const processes = [...prev.processes];
                                            processes[index] = {
                                              ...processes[index],
                                              pressure_low: value,
                                            };
                                            return { ...prev, processes };
                                          });
                                        }}
                                      >
                                        {Object.keys(PRESSURE_LOW).map((label) => (
                                          <option key={label} value={label}>
                                            {label}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="PE_span">mbar</span>

                                    </div>

                                    <div className="PE_drop">

                                      {/* High pressure select */}
                                      <span className="PE_span">High:</span>
                                      <select
                                        className={
                                          "debug_form_answer_2" +
                                          (triedSubmit &&
                                          form.show_PE &&
                                          (proc.pressure_high === "" || proc.pressure_high == null)
                                            ? " debug_form_answer_2--error"
                                            : "")
                                        }
                                        value={proc.pressure_high || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setForm((prev) => {
                                            const processes = [...prev.processes];
                                            processes[index] = {
                                              ...processes[index],
                                              pressure_high: value,
                                            };
                                            return { ...prev, processes };
                                          });
                                        }}
                                      >

                                        {Object.keys(PRESSURE_HIGH).map((label) => (
                                          <option key={label} value={label}>
                                            {label}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="PE_span">bar</span>

                                    </div>

                                  </div>
                                </div>


                                {/* Energy consumption */}
                                <div className="debug-form-field_2 pe-row">
                                  <div className="pe-label question debug_bold_inside_2">
                                    Energy consumption <span className='debug_bold_inside_2_EX_question_unit'>kWh/kg</span>
                                    <Tooltip text="When assessing equipment energy consumption, it is advisable to use values based on actual operating conditions rather than nominal label data.">
                                      <div className="info-circle">i</div>
                                    </Tooltip>
                                  </div>
                                  <div className="pe-field">
                                    <input
                                      type="number"
                                      className={
                                        "debug_form_answer_2_SA" +
                                        (triedSubmit && proc.energy_consumption === -1
                                          ? " debug_form_answer_2_SA--error"
                                          : "")
                                      }
                                      value={
                                        proc.energy_consumption === -1 ||
                                        proc.energy_consumption == null ||
                                        Number.isNaN(proc.energy_consumption)
                                          ? ''
                                          : proc.energy_consumption
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num =
                                          raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const processes = [...prev.processes];
                                          processes[index] = {
                                            ...processes[index],
                                            energy_consumption: Number.isNaN(num)
                                              ? -1
                                              : num,
                                          };
                                          return { ...prev, processes };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>

                                {/* Duration */}
                                <div className="debug-form-field_2 pe-row">
                                  <div className="pe-label question debug_bold_inside_2">
                                    Duration <span className='debug_bold_inside_2_EX_question_unit'>minutes</span>
                                  </div>
                                  <div className="pe-field">
                                    <input
                                      type="number"
                                      className={
                                        "debug_form_answer_2_SA" +
                                        (triedSubmit && proc.duration === -1
                                          ? " debug_form_answer_2_SA--error"
                                          : "")
                                      }
                                      value={
                                        proc.duration === -1 ||
                                        proc.duration == null ||
                                        Number.isNaN(proc.duration)
                                          ? ''
                                          : proc.duration
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num =
                                          raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const processes = [...prev.processes];
                                          processes[index] = {
                                            ...processes[index],
                                            duration: Number.isNaN(num) ? -1 : num,
                                          };
                                          return { ...prev, processes };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_PE',
                      'Optional notes for this Processes & Equipment section.'
                    )}
                  </>
                )}
              </div>
            </div>
          </div>



          
          {/* Waste */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">

                {/* header: title + toggle */}
                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Waste</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="WA_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_WA}
                          onChange={(e) =>
                            updateFormField('show_WA', e.target.checked)
                          }
                          aria-label="Toggle Waste section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body only when toggle is ON */}
                {form.show_WA && (
                  <>
                    <div className="debug-form-separator" />

                    {/* PME fields */}
                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Product <span className='debug_bold_inside_2_WA_question_unit'>kg</span>
                        </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.product_WA === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value={
                          form.product_WA === -1 ||
                          form.product_WA == null ||
                          Number.isNaN(form.product_WA)
                            ? ''
                            : form.product_WA
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            product_WA: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter product amount"
                      />
                    </div>

                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Matrix <span className='debug_bold_inside_2_WA_question_unit'>kg</span>
                      </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.biomass_WA === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value={
                          form.biomass_WA === -1 ||
                          form.biomass_WA == null ||
                          Number.isNaN(form.biomass_WA)
                            ? ''
                            : form.biomass_WA
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            biomass_WA: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter matrix amount"
                      />
                    </div>

                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Solvent <span className='debug_bold_inside_2_WA_question_unit'>kg</span>
                        <Tooltip text="This data represents the amount of discarded material; if recovery processes have been performed, specify only the portion that could not be recovered.">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.solvent_WA === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value={
                          form.solvent_WA === -1 ||
                          form.solvent_WA == null ||
                          Number.isNaN(form.solvent_WA)
                            ? ''
                            : form.solvent_WA
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            solvent_WA: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter solvent amount"
                      />
                    </div>

                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Water <span className='debug_bold_inside_2_WA_question_unit'>kg</span>
                        <Tooltip text="This data represents the amount of discarded material; if recovery processes have been performed, specify only the portion that could not be recovered.">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.water_WA === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value={
                          form.water_WA === -1 ||
                          form.water_WA == null ||
                          Number.isNaN(form.water_WA)
                            ? ''
                            : form.water_WA
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            water_WA: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter water amount"
                      />
                    </div>

                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Additive <span className='debug_bold_inside_2_WA_question_unit'>kg</span>
                        <Tooltip text="This data represents the amount of discarded material; if recovery processes have been performed, specify only the portion that could not be recovered.">
                          <div className="info-circle">i</div>
                        </Tooltip>
                      </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.additive_WA === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value=
                        {
                          form.additive_WA === -1 ||
                          form.additive_WA == null ||
                          Number.isNaN(form.additive_WA)
                            ? ''
                            : form.additive_WA
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            additive_WA: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter additive amount"
                      />
                    </div>

                    <div
                      className="debug-form-separator"
                      style={{ flex: 1, width: '100%' }}
                    />

                    {/* two columns: Solvents / Additives */}
                    <div
                      className="debug-form-field_2"
                      style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', width: '100%' }}
                    >
                      {/* SOLVENTS COLUMN */}
                      <div style={{ flex: 1, width: '100%' }}>
                        <div className="question debug_bold_inside_2">
                          Solvent List:
                        </div>

                        {/* add solvent */}
                        {/*<div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <input
                            type="text" maxLength="50"
                            className="debug_form_answer_2_SA"
                            placeholder="New solvent name"
                            value={newSolventName}
                            onChange={(e) => setNewSolventName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={add_Solvent}
                            >
                            <span className="btn-add-label">Add item</span>
                            <span className="btn-add-icon">
                              <span className="btn-add-plus">+</span>
                            </span>
                          </button>

                        </div>*/}

                        {/* existing solvents */}
                        {form.solvents.map((solvent, index) => (
                          <div
                            key={`solvent-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: solvent name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {solvent.name || `Solvent ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>
                                {/* right: free / toggle / present */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                    'present-label' +
                                    (!(form.present_solvents_WA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_solvents_WA[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_solvents_WA = [...prev.present_solvents_WA];
                                          present_solvents_WA[index] = checked;
                                          return { ...prev, present_solvents_WA };
                                        });
                                      }}
                                      aria-label="Solvent present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_solvents_WA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>

                                {/*<button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeSolventEverywhere(index)}
                                  >
                                  <span className="btn-remove-label">Remove</span>
                                  <span className="btn-remove-icon">
                                    <span className="btn-remove-plus">-</span>
                                  </span>
                                </button>*/}
                              </div>

                            </div>

                            {/* details only if present */}
                            {form.present_solvents_WA[index] && (
                              <div className='sa-details'>


                                {/* pictograms */}
                                {/*
                                <div className="debug-form-field_2">
                                  
                                  <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.35rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {PICTO_WORDS.map((picto, pictogramIndex) => (
                                      <div
                                        key={pictogramIndex}
                                        className="picto-row"
                                      >
                                        <div className='picto-left'>
                                          <img loading="eager" rel="preload"
                                            className="picto-icon"
                                            src={PICTO_IMAGES[pictogramIndex]}
                                            alt={picto}
                                          />

                                          <div className="picto-name">{picto}</div>
                                        </div>

                                          <label className="picto-toggle toggle_debug">
                                            <input
                                              type="checkbox"
                                              checked={solvent.picto_bool[pictogramIndex] ?? false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm((prev) => {
                                                  const solvents = [...prev.solvents];
                                                  const s = { ...solvents[index] };
                                                  const picto_bool = [...s.picto_bool];
                                                  picto_bool[pictogramIndex] = checked;
                                                  s.picto_bool = picto_bool;
                                                  solvents[index] = s;
                                                  return { ...prev, solvents };
                                                });
                                              }}
                                            />
                                            <span className="slider"></span>
                                          </label>

                                        
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />
                                */}

                                {/* signal word */}
                                {/*
                                <div className="debug-form-field_2 signal-row">
                                  <div className="question debug_bold_inside_2">
                                    Signal word
                                  </div>

                                  <div className="signal-options">
                                    {['None', 'Warning', 'Danger'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={
                                          'signal-option' +
                                          (solvent.signal_word === option ? ' signal-option--selected' : '')
                                        }
                                        onClick={() => {
                                          setForm((prev) => {
                                            const solvents = [...prev.solvents];
                                            const s = { ...solvents[index] };
                                            s.signal_word = option;
                                            solvents[index] = s;
                                            return { ...prev, solvents };
                                          });
                                        }}
                                      >
                                        <span
                                          className={
                                            'signal-dot' +
                                            (solvent.signal_word === option ? ' signal-dot--selected' : '')
                                          }
                                        />
                                        <span className="signal-label">{option}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />
                                */}

                                {/* occupational hazard */}
                                {/*
                                <div className="debug-form-field_2 hazard-row">
                                  <span className="question debug_bold_inside_2">
                                    Vapour/gas emission
                                  </span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={solvent.occupational_hazard === 'Vapour/gas emission'}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((prev) => {
                                          const solvents = [...prev.solvents];
                                          const s = { ...solvents[index] };
                                          s.occupational_hazard = on
                                            ? 'Vapour/gas emission'
                                            : 'Zero Emission';
                                          solvents[index] = s;
                                          return { ...prev, solvents };
                                        });
                                      }}
                                      aria-label="Toggle vapour/gas emission occupational hazard"
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                                */}


                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* amount */}
                                <div className="debug-form-field_2 amount-row">
                                  <span className="question debug_bold_inside_2">
                                    Amount <span className='debug_bold_inside_2_EX_question_unit'>(S/L)</span>
                                  </span>

                                  <div className={
                                          "amount-input-wrapper" +
                                          (triedSubmit && form.amount_solvents_WA[index] === -1
                                            ? " amount-input-wrapper--error"
                                            : "")
                                        }>
                                    <span className="amount-prefix">1:</span>
                                    <input
                                      type="number"
                                      min="0" max="1000000"
                                      className="debug_form_answer_2 amount-input"
                                      value={
                                        form.amount_solvents_WA[index] === -1 ||
                                        form.amount_solvents_WA[index] == null ||
                                        Number.isNaN(form.amount_solvents_WA[index])
                                          ? ''
                                          : form.amount_solvents_WA[index]
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num = raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const amount_solvents_WA = [...prev.amount_solvents_WA];
                                          amount_solvents_WA[index] = Number.isNaN(num) ? -1 : num;

                                          const solvents = [...prev.solvents];
                                          const s = { ...solvents[index] };
                                          s.amount = amount_solvents_WA[index];
                                          solvents[index] = s;

                                          return {
                                            ...prev,
                                            amount_solvents_WA,
                                            solvents,
                                          };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>



                              </div>
                            )}
                            
                          </div>
                        ))}
                      </div>

                      <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                      {/* --------------------------------------------------------------------------------------- */}

                      {/* ADDITIVES COLUMN */}
                      <div style={{ flex: 1, width: '100%', marginTop: '-1rem' }}>
                        <div className="question debug_bold_inside_2">
                          Additive List
                        </div>

                        {/* add additive */}
                        {/*
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <input
                            type="text" maxLength="50"
                            className="debug_form_answer_2_SA"
                            placeholder="New additive name"
                            value={newAdditiveName}
                            onChange={(e) => setNewAdditiveName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={add_Additive}
                            >
                            <span className="btn-add-label">Add item</span>
                            <span className="btn-add-icon">
                              <span className="btn-add-plus">+</span>
                            </span>
                          </button>

                        </div>
                        */}

                        {/* existing additives */}
                        {form.additives.map((additive, index) => (
                          <div
                            key={`additive-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: additive name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {additive.name || `Additive ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>
                                {/* right: free / toggle / present */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                    'present-label' +
                                    (!(form.present_additives_WA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_additives_WA[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_additives_WA = [...prev.present_additives_WA];
                                          present_additives_WA[index] = checked;
                                          return { ...prev, present_additives_WA };
                                        });
                                      }}
                                      aria-label="Additive present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_additives_WA[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>

                                {/*<button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeAdditiveEverywhere(index)}
                                  >
                                  <span className="btn-remove-label">Remove</span>
                                  <span className="btn-remove-icon">
                                    <span className="btn-remove-plus">-</span>
                                  </span>
                                </button>*/}

                              </div>

                            </div>

                            {/* details only if present */}
                            {form.present_additives_WA[index] && (
                              <div className='sa-details'>

                                {/* pictograms */}
                                {/*
                                <div className="debug-form-field_2">
                                  
                                  <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.35rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {PICTO_WORDS.map((picto, pictogramIndex) => (
                                      <div
                                        key={pictogramIndex}
                                        className="picto-row"
                                      >
                                        <div className='picto-left'>
                                          <img loading="eager" rel="preload"
                                            className="picto-icon"
                                            src={PICTO_IMAGES[pictogramIndex]}
                                            alt={picto}
                                          />

                                          <div className="picto-name">{picto}</div>
                                        </div>

                                          <label className="picto-toggle toggle_debug">
                                            <input
                                              type="checkbox"
                                              checked={additive.picto_bool[pictogramIndex] ?? false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm((prev) => {
                                                  const additives = [...prev.additives];
                                                  const s = { ...additives[index] };
                                                  const picto_bool = [...s.picto_bool];
                                                  picto_bool[pictogramIndex] = checked;
                                                  s.picto_bool = picto_bool;
                                                  additives[index] = s;
                                                  return { ...prev, additives };
                                                });
                                              }}
                                            />
                                            <span className="slider"></span>
                                          </label>

                                        
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />
                                */}

                                {/* signal word */}
                                {/*
                                <div className="debug-form-field_2 signal-row">
                                  <div className="question debug_bold_inside_2">
                                    Signal word
                                  </div>

                                  <div className="signal-options">
                                    {['None', 'Warning', 'Danger'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={
                                          'signal-option' +
                                          (additive.signal_word === option ? ' signal-option--selected' : '')
                                        }
                                        onClick={() => {
                                          setForm((prev) => {
                                            const additives = [...prev.additives];
                                            const s = { ...additives[index] };
                                            s.signal_word = option;
                                            additives[index] = s;
                                            return { ...prev, additives };
                                          });
                                        }}
                                      >
                                        <span
                                          className={
                                            'signal-dot' +
                                            (additive.signal_word === option ? ' signal-dot--selected' : '')
                                          }
                                        />
                                        <span className="signal-label">{option}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />
                                */}

                                {/* occupational hazard */}
                                {/*
                                <div className="debug-form-field_2 hazard-row">
                                  <span className="question debug_bold_inside_2">
                                    Vapour/gas emission
                                  </span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={additive.occupational_hazard === 'Vapour/gas emission'}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((prev) => {
                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.occupational_hazard = on
                                            ? 'Vapour/gas emission'
                                            : 'Zero Emission';
                                          additives[index] = s;
                                          return { ...prev, additives };
                                        });
                                      }}
                                      aria-label="Toggle vapour/gas emission occupational hazard"
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                                */}


                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                {/* amount */}
                                <div className="debug-form-field_2 amount-row-2">
                                  <span className="question debug_bold_inside_2">
                                    Amount <span className='debug_bold_inside_2_EX_question_unit'>(% on matrix weight)</span>
                                  </span>

                                  <div className={
                                          "amount-input-wrapper" +
                                          (triedSubmit && form.amount_additives_WA[index] === -1
                                            ? " amount-input-wrapper--error"
                                            : "")
                                        }>
                                    <input
                                      type="number"
                                      min="0" max="1000000"
                                      className="debug_form_answer_2 amount-input-2"
                                      value={
                                        form.amount_additives_WA[index] === -1 ||
                                        form.amount_additives_WA[index] == null ||
                                        Number.isNaN(form.amount_additives_WA[index])
                                          ? ''
                                          : form.amount_additives_WA[index]
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num = raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const amount_additives_WA = [...prev.amount_additives_WA];
                                          amount_additives_WA[index] = Number.isNaN(num) ? -1 : num;

                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.amount = amount_additives_WA[index];
                                          additives[index] = s;

                                          return {
                                            ...prev,
                                            amount_additives_WA,
                                            additives,
                                          };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>



                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* --------------------------------------------------------------------------------------- */}

                      
                    </div>

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_WA',
                      'Optional notes for this Waste section.'
                    )}
                    
                  </>
                )}
              </div>
            </div>
          </div>

          
          {/* Product */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">

                {/* header: title + toggle */}
                <div className="debug-form-field_2">
                  <div className="debug_sectionTitle">
                    <div className="debug_sectionTitle_text">
                      <span>Product</span>
                    </div>

                    <div className="toggle-container">
                      <label className="toggle_debug">
                        <input
                          name="PR_Debug_Checkbox"
                          type="checkbox"
                          checked={form.show_PR}
                          onChange={(e) =>
                            updateFormField('show_PR', e.target.checked)
                          }
                          aria-label="Toggle Product section"
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* body only when toggle is ON */}
                {form.show_PR && (
                  <>
                    <div className="debug-form-separator" />

                    {/* fields */}
                    <div className="debug-form-field">
                      <div className="question debug_bold_inside">
                        Selectivity <span className='debug_bold_inside_2_WA_question_unit'>mg Target Compound/ g Extract</span>
                        </div>
                      <input
                        type="number"
                        min="0" max="1000000"
                        className={
                          "debug_form_answer" +
                          (triedSubmit && form.selectivity === -1
                            ? " debug_form_answer--error"
                            : "")
                        }
                        value={
                          form.selectivity === -1 ||
                          form.selectivity == null ||
                          Number.isNaN(form.selectivity)
                            ? ''
                            : form.selectivity
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? -1 : Number.parseFloat(raw);
                          setForm((prev) => ({
                            ...prev,
                            selectivity: Number.isNaN(num) ? -1 : num,
                          }));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter Selectivity"
                      />
                    </div>


                    <div
                      className="debug-form-separator"
                      style={{ flex: 1, width: '100%' }}
                    />

                    {/* two columns: Solvents / Additives */}
                    <div
                      className="debug-form-field_2"
                      style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', width: '100%' }}
                    >

                      {/* --------------------------------------------------------------------------------------- */}

                      {/* ADDITIVES COLUMN */}
                      <div style={{ flex: 1, width: '100%' }}>
                        <div className="question debug_bold_inside_2">
                          Contaminant List:
                          <Tooltip text="If residues of chemicals used during extraction or added during downstream processing are present in the final product, specify them accordingly.">
                            <div className="info-circle">i</div>
                          </Tooltip>
                        </div>

                        {/* add additive */}
                        {/*<div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <input
                            type="text" maxLength="50"
                            className="debug_form_answer_2_SA"
                            placeholder="New additive name"
                            value={newAdditiveName}
                            onChange={(e) => setNewAdditiveName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={add_Additive}
                            >
                            <span className="btn-add-label">Add item</span>
                            <span className="btn-add-icon">
                              <span className="btn-add-plus">+</span>
                            </span>
                          </button>

                        </div>*/}

                        {/* existing solvents */}
                        {form.solvents.map((solvent, index) => (
                          <div
                            key={`solvent-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: solvent name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {solvent.name || `Solvent ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>
                                {/* right: free / toggle / present */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                    'present-label' +
                                    (!(form.present_solvents_PR[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_solvents_PR[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_solvents_PR = [...prev.present_solvents_PR];
                                          present_solvents_PR[index] = checked;
                                          return { ...prev, present_solvents_PR };
                                        });
                                      }}
                                      aria-label="Solvent present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_solvents_PR[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>

                              </div>

                            </div>

                          </div>
                        ))}

                        {/* existing additives */}
                        {form.additives.map((additive, index) => (
                          <div
                            key={`additive-${index}`}
                            style={{
                              borderTop: '1px solid #ccc',
                              paddingTop: '1.5rem',
                              marginTop: '3rem',
                            }}
                          >
                            {/* name + present toggle */}
                            <div
                              className='sa-header-row'
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >

                              {/* left: additive name */}
                              <div className="question SA_title debug_bold_inside_2">
                                {additive.name || `Additive ${index + 1}`}
                              </div>

                              <div className='sa-header-right'>
                                {/* right: free / toggle / present */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  >
                                  <span className={
                                    'present-label' +
                                    (!(form.present_additives_PR[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>free</span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={form.present_additives_PR[index] ?? false}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((prev) => {
                                          const present_additives_PR = [...prev.present_additives_PR];
                                          present_additives_PR[index] = checked;
                                          return { ...prev, present_additives_PR };
                                        });
                                      }}
                                      aria-label="Additive present toggle"
                                    />
                                    <span className="slider"></span>
                                  </label>

                                  <span className={
                                    'present-label' +
                                    ((form.present_additives_PR[index] ?? false)
                                      ? ' present-label--active'
                                      : '')
                                  }>present</span>
                                </div>

                                {/*<button
                                  type="button"
                                  className="btn-remove"
                                  onClick={() => removeAdditiveEverywhere(index)}
                                  >
                                  <span className="btn-remove-label">Remove</span>
                                  <span className="btn-remove-icon">
                                    <span className="btn-remove-plus">-</span>
                                  </span>
                                </button>*/}

                              </div>

                            </div>

                            {/* details only if present */}
                            {/*
                            {form.present_additives_PR[index] && (
                              <div className='sa-details'>
                                <div className="debug-form-field_2">
                                  
                                  <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.35rem',
                                      marginTop: '0.25rem',
                                    }}
                                  >
                                    {PICTO_WORDS.map((picto, pictogramIndex) => (
                                      <div
                                        key={pictogramIndex}
                                        className="picto-row"
                                      >
                                        <div className='picto-left'>
                                          <img loading="eager" rel="preload"
                                            className="picto-icon"
                                            src={PICTO_IMAGES[pictogramIndex]}
                                            alt={picto}
                                          />

                                          <div className="picto-name">{picto}</div>
                                        </div>

                                          <label className="picto-toggle toggle_debug">
                                            <input
                                              type="checkbox"
                                              checked={additive.picto_bool[pictogramIndex] ?? false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setForm((prev) => {
                                                  const additives = [...prev.additives];
                                                  const s = { ...additives[index] };
                                                  const picto_bool = [...s.picto_bool];
                                                  picto_bool[pictogramIndex] = checked;
                                                  s.picto_bool = picto_bool;
                                                  additives[index] = s;
                                                  return { ...prev, additives };
                                                });
                                              }}
                                            />
                                            <span className="slider"></span>
                                          </label>

                                        
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                <div className="debug-form-field_2 signal-row">
                                  <div className="question debug_bold_inside_2">
                                    Signal word
                                  </div>

                                  <div className="signal-options">
                                    {['None', 'Warning', 'Danger'].map((option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        className={
                                          'signal-option' +
                                          (additive.signal_word === option ? ' signal-option--selected' : '')
                                        }
                                        onClick={() => {
                                          setForm((prev) => {
                                            const additives = [...prev.additives];
                                            const s = { ...additives[index] };
                                            s.signal_word = option;
                                            additives[index] = s;
                                            return { ...prev, additives };
                                          });
                                        }}
                                      >
                                        <span
                                          className={
                                            'signal-dot' +
                                            (additive.signal_word === option ? ' signal-dot--selected' : '')
                                          }
                                        />
                                        <span className="signal-label">{option}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                <div className="debug-form-field_2 hazard-row">
                                  <span className="question debug_bold_inside_2">
                                    Vapour/gas emission
                                  </span>

                                  <label className="toggle_debug">
                                    <input
                                      type="checkbox"
                                      checked={additive.occupational_hazard === 'Vapour/gas emission'}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((prev) => {
                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.occupational_hazard = on
                                            ? 'Vapour/gas emission'
                                            : 'Zero Emission';
                                          additives[index] = s;
                                          return { ...prev, additives };
                                        });
                                      }}
                                      aria-label="Toggle vapour/gas emission occupational hazard"
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>

                                <div className="debug-form-field_2 hazard-row">
                                  <span className="question debug_bold_inside_2">
                                    Additive's nature
                                  </span>

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                    }}
                                  >
                                    <span
                                      className={
                                        'present-label' +
                                        (form.nature_additives_PR[index] === 'Contaminant'
                                          ? ''
                                          : ' present-label--active')
                                      }
                                    >
                                      Contaminant
                                    </span>

                                    <label className="toggle_debug">
                                      <input
                                        type="checkbox"
                                        checked={form.nature_additives_PR[index] === 'Contaminant'}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setForm((prev) => {
                                            const nature_additives_PR = [...prev.nature_additives_PR];
                                            nature_additives_PR[index] = checked ? 'Contaminant' : 'Excipient';
                                            return { ...prev, nature_additives_PR };
                                          });
                                        }}
                                        aria-label="Toggle Additive nature"
                                      />
                                      <span className="slider"></span>
                                    </label>

                                    <span
                                      className={
                                        'present-label' +
                                        (form.nature_additives_PR[index] === 'Contaminant'
                                          ? ' present-label--active'
                                          : '')
                                      }
                                    >
                                      Excepient
                                    </span>
                                  </div>
                                </div>



                                <div className="debug-form-separator" style={{ flex: 1, width: '100%' }} />

                                <div className="debug-form-field_2 amount-row-2">
                                  <span className="question debug_bold_inside_2">
                                    Amount <span className='debug_bold_inside_2_EX_question_unit'>(% on matrix weight)</span>
                                  </span>

                                  <div className={
                                          "amount-input-wrapper" +
                                          (triedSubmit && form.amount_additives_PR[index] === -1
                                            ? " amount-input-wrapper--error"
                                            : "")
                                        }>
                                    <input
                                      type="number"
                                      min="0" max="1000000"
                                      className="debug_form_answer_2 amount-input-2"
                                      value={
                                        form.amount_additives_PR[index] === -1 ||
                                        form.amount_additives_PR[index] == null ||
                                        Number.isNaN(form.amount_additives_PR[index])
                                          ? ''
                                          : form.amount_additives_PR[index]
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num = raw === '' ? -1 : Number.parseFloat(raw);
                                        setForm((prev) => {
                                          const amount_additives_PR = [...prev.amount_additives_PR];
                                          amount_additives_PR[index] = Number.isNaN(num) ? -1 : num;

                                          const additives = [...prev.additives];
                                          const s = { ...additives[index] };
                                          s.amount = amount_additives_PR[index];
                                          additives[index] = s;

                                          return {
                                            ...prev,
                                            amount_additives_PR,
                                            additives,
                                          };
                                        });
                                      }}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </div>
                                </div>



                              </div>
                            )}
                            */}

                          </div>
                        ))}


                      </div>
                      {/* --------------------------------------------------------------------------------------- */}

                      
                    </div>

                    <div className="debug-form-separator" />
                    {renderSectionCommentField(
                      'comment_PR',
                      'Optional notes for this Product section.'
                    )}
                    
                  </>
                )}
              </div>
            </div>
          </div>


          {/* Submission / Privacy + Submit */}
          <div className="prova_row_form">
            <div className="prova_col_form prova_Half_form">
              <div className="debug-form-card">
                <div
                  className="debug-form-field_2"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',        // <-- FORCE ROW
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    columnGap: '1rem',
                    rowGap: 0,
                  }}
                >
                  {/* LEFT: checkbox + text */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                    />

                    <span
                      className="debug_bold_inside_2"
                      style={{
                        color: !privacyConsent && triedSubmit ? red_color : '#000000',
                      }}
                    >
                      I read the{' '}
                      <button
                        type="button"
                        onClick={openPrivacy} // go to Privacy section
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          cursor: 'pointer',
                          color: 'inherit',    // looks like normal text
                        }}
                      >
                        privacy policy
                      </button>{' '}
                      and accept the terms
                    </span>
                  </div>

                  {/* RIGHT: submit button, same style as add, arrow instead of + */}
                  <button
                    type="button"
                    className="btn-add"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleSubmit({ preventDefault: () => {} })}
                  >
                    <span className="btn-add-label">Submit</span>
                    <span className="btn-add-icon">
                      <span className="btn-add-plus">➜</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>





        </div>
        
      )

      case 2: // 2: Statistics
        return <div>Statistics Page - WIP</div>;

            case 5: // Database View
        return (
          <div className="prova_page_form">
            {/* HERO ROW – same structure / bg color as report */}
            

            {/* BODY ROW WITH CARD + TABLE */}
            <div className="prova_row_form">
              <div className="prova_col_form prova_Half_form" style={{ width: '100%' }}>
                <div className="debug-form-card" style={{ width: '90%', maxWidth: '90%' }}>
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div className="question debug_bold_inside">
                      Submissions Data
                    </div>
                  </div>

                  {dbData.length === 0 ? (
                    <div className="loader1">
                      <span>Loading</span>
                      <span className="dot dot1">.</span>
                      <span className="dot dot2">.</span>
                      <span className="dot dot3">.</span>
                    </div>
                  ) : (
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginTop: '0.5rem',
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              Institution Name
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              Matrix Name
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              Protocol Title
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              DOI
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              RM
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              SA
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              EX
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              PE
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              WA
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              PR
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                borderRight: '1px solid #ccc',
                              }}
                            >
                              <span style={{ fontWeight: '600' }}>SixScore</span>
                            </th>
                            <th
                              style={{
                                padding: '0.5rem 0.75rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                // last column: no right border if you prefer
                              }}
                            >
                              Detail
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbData.map((item, index) => (
                            <tr key={item.id ?? index}>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                  whiteSpace: 'break-spaces',
                                }}
                              >
                                {item.institutionName ?? '-'}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.matrixName ?? '-'}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.protocolTitle ?? '-'}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.DOI ?? '-'}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingRM === -1
                                  ? '-'
                                  : Number(item.greenRatingRM).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingAS === -1
                                  ? '-'
                                  : Number(item.greenRatingAS).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingEX === -1
                                  ? '-'
                                  : Number(item.greenRatingEX).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingPE === -1
                                  ? '-'
                                  : Number(item.greenRatingPE).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingWA === -1
                                  ? '-'
                                  : Number(item.greenRatingWA).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRatingPR === -1
                                  ? '-'
                                  : Number(item.greenRatingPR).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  borderRight: '1px solid #eee',
                                }}
                              >
                                {item.greenRating === '-'
                                  ? '-'
                                  : Number(item.greenRating).toFixed(0)}
                              </td>
                              <td
                                style={{
                                  padding: '0.4rem 0.75rem',
                                  textAlign: 'left',
                                }}
                              >
                                <button
                                  className="btn-24"
                                  style={{ backgroundColor: '#eee', color: '#000', borderRadius: '10px'}}
                                  onClick={() => openReportFromDb(item.id)}
                                >
                                  <span>See Report</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                  )}
                </div>
              </div>
            </div>
          </div>
        );


      case 6: // 6: Privacy
        return <div className="prova_page_form">
            {/* HERO ROW – same structure / bg color as report */}
            

            {/* BODY ROW WITH CARD + TABLE */}
            <div className="prova_row_form">
              <div className="prova_col_form prova_Half_form" style={{ width: '100%' }}>
                <div className="debug-form-card">
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
                      <h1 className='contentColumnTitle'>Privacy Policy</h1>
                      <h3 className='contentColumnP'>
                        Pursuant to Regulation (EU) 2016/679 (GDPR), we inform you that the data provided through this form 
                        will be used to create a public database on organic extraction techniques, freely 
                        accessible on this website in the Database section. The purpose of this initiative is to develop 
                        a comparative metric on the environmental impact of these procedures and to support scientific analysis.
                      </h3>

                      <h3 className='contentColumnP'>
                        The designated Data Controller is Giorgio Grillo. All data are processed securely and stored on Firebase servers.
                      </h3>

                      <h3 className='contentColumnP'>
                        No personal identifiers are intentionally collected. However, certain data fields, such as DOI or institutional affiliation, may allow indirect identification of contributors.
                      </h3>

                      <h3 className='contentColumnP'>
                        Participants may exercise their rights under Articles 15 to 22 of the GDPR, including the rights of access, rectification, erasure, restriction of processing, and objection, by contacting six.score.metric@gmail.com.
                      </h3>

                      <h3>
                        This website uses only technical cookies required for its proper functioning and does not employ profiling or tracking cookies.
                      </h3>

                      <h3 className='contentColumnP'>
                        This privacy notice may be updated periodically to reflect regulatory or procedural changes. Participants are encouraged to review it regularly to remain informed about data processing practices.
                      </h3>

                      <button
                          type="button"
                          className="chart-button"
                          onClick={() => {setCurrentContent(1)}}
                        >
                          Back to the Form
                        </button>

                    </div>

                  </div>

                </div>
              </div>
            </div>
            </div>

      case 3: // 6: Privacy
        return <div className="prova_page_form">
            {/* HERO ROW – same structure / bg color as report */}
            

            {/* BODY ROW WITH CARD + TABLE */}
            <div className="prova_row_form">
              <div className="prova_col_form prova_Half_form" style={{ width: '100%' }}>
                <div className="debug-form-card">
                  <div
                    className="debug-form-field_2"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
                      <h1 className='contentColumnTitle'>About Us</h1>
                      <h3 className='contentColumnP'>
                        The Organic Chemistry Group (Department of Drug Science and Technology, University of Turin) carries out research along several coherent and interconnected lines, with a strong focus on green chemistry and process intensification: from the design of circular processes for the valorisation of sustainable feedstocks and for sustainable synthesis, to the demonstration of fully end-to-end schemes (extraction/synthesis → fractionation/purification → product valorisation). The Group operates within a markedly collaborative and translational framework, through partnerships with companies and technology stakeholders (including pilot validation, scale-up, and prototyping) and through continuous participation in competitive national and European projects (including Horizon Europe/MSCA initiatives, BBI EU Projects, UNITA consortium and other networks), which enable the integration of complementary expertise and accelerate industrial uptake of the developed solutions.
                      </h3>

                      <h3 className='contentColumnP'>
                        A flagship activity is green extraction of natural compounds from biomasses and agro-industrial by-products, with a focus on the recovery and fractionation of bioactives (i.e. polyphenols, tannins, cannabinoids) and on cascade valorisation strategies. Within this framework, the Group develops projects across different matrices and value chains, where the goal is not merely to “extract”, but to deliver targeted, scalable fractions with demonstrable performance and sustainability profiles.
                      </h3>

                      <h3 className='contentColumnP'>
                        Supporting these research lines is the integration of non-conventional technologies, such as microwaves, ultrasound, hydrodynamic cavitation, flow reactors, pulsed electric fields and mechanochemistry (and, where relevant, synergies with biocatalysis/enzymes), with a robust process downstream (membranes, adsorbents/resins, separation and concentration schemes). This combination enables faster, more selective, and more readily transferable processes, while minimizing solvents, energy input, and waste without compromising product quality.
                      </h3>

                      <h3 className='contentColumnP'>
                       For expressions of interest, please contact us at six.score.metric@gmail.com
                      </h3>

                    </div>

                  </div>

                </div>
              </div>
            </div>
            </div>

      default: break;

    }
  }

  return (
    <div className="allPage">

      {/* Titlebar */}

      <div className="titleBar">
        <div className= 'title_logo'>
          <img loading="eager" rel="preload" style= {{ width: '10vw' }} src={logo_six_bianco} alt="Six Score Logo" onClick={() => setCurrentContent(0)} />
          <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem', color: 'var(--the-white)', lineHeight: 1 }}>
            v{version}
          </span>
        </div>
        <div className='titlecolumn'>
          <li className='titlecolcol'><button className="btn-24" onClick={() => setCurrentContent(0)}>Home</button></li>
              <li className='titlecolcol'><button className="btn-24" onClick={() => setCurrentContent(1)}>Form</button></li>
              <li className='titlecolcol'>
                <button className="btn-24" type="button" onClick={() => {openCurrentCsvPicker('current')}}>
                  <span>Load Data</span>
                </button>
              </li>
              <li className='titlecolcol'><button className="btn-24" onClick={() => setCurrentContent(5)}>Database</button></li>
              <li className='titlecolcol'><button className="btn-24" onClick={downloadPredefinedPdf}>User Guide</button></li>
              <li className='titlecolcol'><button className="btn-24" onClick={() => setCurrentContent(3)}>About us</button></li>
        </div>
      </div>

      {/* Under the Titlebar */}

      <input
        type="file"
        accept=".json"
        ref={currentCsvInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <div className="underPage">

        {/* Content Part -> see renderContent() */}

        <div className="content">
          {renderContent()}
        </div>

      </div>

      {isPrivacyOpen && (
        <div
          className="privacy-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // click sullo sfondo chiude
            if (e.target === e.currentTarget) closePrivacy();
          }}
        >
          <div className="privacy-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="privacy-modal-header">
              <h1 className="contentColumnTitle">Privacy Policy</h1>

              <button type="button" className="btn-24" onClick={closePrivacy}>
                ✕
              </button>
            </div>

            {/* Qui incolli lo stesso testo che hai nel case 6 */}
            <h3 className="contentColumnP">
              Pursuant to Regulation (EU) 2016/679 (GDPR), we inform you that the data provided through this form
              will be used to create a public database on organic extraction techniques, freely accessible on this
              website in the Database section. The purpose of this initiative is to develop a comparative metric on
              the environmental impact of these procedures and to support scientific analysis.
            </h3>

            <h3 className="contentColumnP">
              The designated Data Controller is Giorgio Grillo. All data are processed securely and stored on Firebase servers.
            </h3>

            <h3 className="contentColumnP">
              No personal identifiers are intentionally collected. However, certain data fields, such as DOI or institutional affiliation,
              may allow indirect identification of contributors.
            </h3>

            <h3 className="contentColumnP">
              Participants may exercise their rights under Articles 15 to 22 of the GDPR, including the rights of access, rectification,
              erasure, restriction of processing, and objection, by contacting six.score.metric@gmail.com.
            </h3>

            <h3>
              This website uses only technical cookies required for its proper functioning and does not employ profiling or tracking cookies.
            </h3>

            <h3 className="contentColumnP">
              This privacy notice may be updated periodically to reflect regulatory or procedural changes. Participants are encouraged
              to review it regularly to remain informed about data processing practices.
            </h3>

            <button type="button" className="chart-button" onClick={closePrivacy}>
              Close
            </button>
          </div>
        </div>
      )}


      {/*<div className="footerBar">
        <div className="footerContainer">
          <img loading="eager" rel="preload" src={logo} alt="Six Score Logo" className="footerLogo" />

          <div className="footerText">
            <h2 className="orgName">Six Score</h2>
            <p></p>
            <p>📞 +1 (123) 456-7890</p>
            <p>📧 contact@sixscore.org</p>
            <p><button className="privacyButton" onClick={() => setCurrentContent(6)}>Privacy Policy</button></p>
          </div>
        </div>
      </div>*/}

      <div className="footerBar" style={{ position: 'relative' }}>
        <div className="footerContainer">
          {/* LEFT COLUMN: same buttons as headerbar */}
          <div className="footerCol footerCol-nav">
            <button className="btn-24 footer-nav-btn" onClick={() => setCurrentContent(0)}>
              Home
            </button>
            <button className="btn-24 footer-nav-btn" onClick={() => setCurrentContent(1)}>
              Form
            </button>
            <button
              className="btn-24 footer-nav-btn"
              type="button"
              onClick={() => {openCurrentCsvPicker('current')}}
            >
              <span>Load Data</span>
            </button>
            <button className="btn-24 footer-nav-btn" onClick={() => setCurrentContent(5)}>
              Database
            </button>
            <button className="btn-24 footer-nav-btn" onClick={downloadPredefinedPdf}>
              User Guide
            </button>
            <button className="btn-24 footer-nav-btn" onClick={() => setCurrentContent(3)}>
              About us
            </button>
          </div>

          {/* RIGHT COLUMN: 3 empty rows for now */}
          <div className="footerCol footerCol-right">

            <div className="footerCol footerCol-comment">
              <h3 className="footer-comment-title">Give a Feedback</h3>

              <textarea
                maxLength= {500}
                id="footer-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="comment-text-area footer-comment-textarea"
                rows="4"
                placeholder="Write us about what you think, suggestions or ideas..."
              />

              <button
                onClick={handleComment}
                className="footer-comment-button"
              >
                Submit
              </button>
              <span> or write us an email at <span style={{ fontWeight: '500' }}>six.score.metric@gmail.com</span></span>
            </div>

            <div className="footer-social">
              <span className="footer-section-title">Follow us</span>
              <button className="footer-link-btn">LinkedIn</button>
              <button className="footer-link-btn">Instagram</button>
            </div>

            <div className="footer-legal">
              <button
                className="footer-legal-link"
                onClick={openPrivacy}
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0.4rem',
            transform: 'translateX(-50%)',
            fontSize: '0.75rem',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        >
          SixScore v{version}
        </span>
      </div>


    </div>
  );
}

export default App;