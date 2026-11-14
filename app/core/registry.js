// ═══════════════════════════════════════════════════════════════════════
// core/registry.js — Auto Lab registry: DOMAINS, SYSTEMS and MODULES (+ sub-modules).
// ES module. Also publishes the window.AUTO_* globals the shell and kit.js read.
//
// ADD A NEW MODULE → `node tools/new-module.mjs` or by hand: add one object to the "modules"
// list of its system (order = learning order), place its id in ONE stage of core/roadmap.js,
// create modules/<system-id>--<module-id>.html (+ .js), then `npm run sync && npm test`.
//
//   id, label, title, subtitle, file (relative to app/), color, icon (core/icons.js), level, min, mode
//   moduleVersion  SemVer of this module            status  'stable' | 'draft' | 'deprecated'
//   replacedBy     (deprecated only, required) id that takes over; old links / saved ids keep working via resolveModule().
//                  A deprecated entry keeps its id and files for at least one MINOR version, stays in its system's modules list,
//                  is in NO roadmap stage and is hidden from every home view; no flow / related link may point at it.
//   type           'guided' | 'custom' | 'group' | 'sub-module'
//   children       (group) ids of its sub-modules — listed in SUBMODULES, NOT shown as home cards
//   file name      modules/<system-id>--<module-id>.html   (tests check it)
//
// SYSTEMS: id, domain, title, color, icon, blurb, flow ["Label"|"Label|moduleId"], soon, related, modules[].
// The 18 systems follow the car's five groups.
// ═══════════════════════════════════════════════════════════════════════
import { SYSTEM_ICONS, MODULE_ICONS } from './icons.js';
import { ROADMAP } from './roadmap.js';

export const DOMAINS = ["Powertrain & Engine","Drivetrain & Transmission","Control & Handling","Electrical & Electronics","Body, Safety & Comfort"];

export const SYSTEMS = [
  {
    id: "engine",
    domain: "Powertrain & Engine",
    title: "Engine System",
    color: "#38bdf8",
    blurb: "Converts fuel (or electricity) into mechanical power: the four-stroke cycle, valves, crank, and the air it breathes.",
    icon: SYSTEM_ICONS["engine"],
    flow: ["Air filter|airfilter","Compressor|turbo","Intercooler|intercooler","Cycle|engine","Valvetrain|valvetrain","Crank|crankpiston"],
    soon: [],
    related: ["fuel","ignition","cooling"],
    modules: [
      {"id": "engine", "label": "Engine", "title": "4-Stroke Engine", "subtitle": "Automotive · Cycle & Valvetrain", "file": "modules/engine--engine.html", "color": "#38bdf8", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["engine"]},
      {"id": "crankpiston", "label": "Crank & Pistons", "title": "Crankshaft & Pistons", "subtitle": "Engine Mechanical · Crank, Rods & Rings", "file": "modules/engine--crankpiston.html", "color": "#ca8a04", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "custom", "status": "stable", "icon": MODULE_ICONS["crankpiston"]},
      {"id": "valvetrain", "label": "Valvetrain", "title": "Valvetrain", "subtitle": "Engine Mechanical · Cam, Lifters & Valves", "file": "modules/engine--valvetrain.html", "color": "#d946ef", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["valvetrain"]},
      {"id": "airfilter", "label": "Air Filter", "title": "Air Filter & Intake", "subtitle": "Air Intake · Filtration & Airflow", "file": "modules/engine--airfilter.html", "color": "#fb7185", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.1.14", "type": "guided", "status": "stable", "icon": MODULE_ICONS["airfilter"]},
      {"id": "turbo", "label": "Turbo", "title": "Turbocharger", "subtitle": "Forced Induction · Boost", "file": "modules/engine--turbo.html", "color": "#fb7185", "level": "Advanced", "min": 15, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["turbo"]},
      {"id": "intercooler", "label": "Intercooler", "title": "Intercooler", "subtitle": "Air Intake · Charge-Air Cooling", "file": "modules/engine--intercooler.html", "color": "#38bdf8", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "stable", "icon": MODULE_ICONS["intercooler"]}
    ]
  },
  {
    id: "fuel",
    domain: "Powertrain & Engine",
    title: "Fuel System",
    color: "#10b981",
    blurb: "Stores, filters and delivers petrol, diesel or alternative fuel to the engine.",
    icon: SYSTEM_ICONS["fuel"],
    flow: ["Tank|fuelpump","Pump|fuelpump","Filter|fuelpump","Carburetor|carburetor","Injector|mpfi","Rail|commonrail","Cylinder"],
    soon: [],
    related: ["engine","ignition"],
    modules: [
      {"id": "fuelpump", "label": "Fuel Pump", "title": "Fuel Pump & Tank", "subtitle": "Fuel System · Tank, Pump & Filter", "file": "modules/fuel--fuelpump.html", "color": "#10b981", "level": "Basic", "min": 11, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["fuelpump"]},
      {"id": "carburetor", "label": "Carb", "title": "Carburetor", "subtitle": "Fuel System · Venturi", "file": "modules/fuel--carburetor.html", "color": "#f59e0b", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["carburetor"]},
      {"id": "mpfi", "label": "Injection", "title": "Electronic Fuel Injection (MPFI)", "subtitle": "Fuel System · Port / Common Rail", "file": "modules/fuel--mpfi.html", "color": "#10b981", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["mpfi"]},
      {"id": "commonrail", "label": "Common Rail", "title": "Diesel Common Rail", "subtitle": "Fuel System · High-Pressure Diesel", "file": "modules/fuel--commonrail.html", "color": "#f97316", "level": "Advanced", "min": 15, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["commonrail"]}
    ]
  },
  {
    id: "ignition",
    domain: "Powertrain & Engine",
    title: "Ignition System",
    color: "#f97316",
    blurb: "Makes and times the high voltage that ignites the air-fuel mixture.",
    icon: SYSTEM_ICONS["ignition"],
    flow: ["Battery|electrical","Coil|coilplug","Timing|ignition","Spark plug|sparkplug","Cylinder"],
    soon: [],
    related: ["elec","engine"],
    modules: [
      {"id": "ignition", "label": "Ignition", "title": "Ignition System", "subtitle": "Electrical · Coil & Timing", "file": "modules/ignition--ignition.html", "color": "#f97316", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["ignition"]},
      {"id": "sparkplug", "label": "Spark Plug", "title": "Spark Plugs", "subtitle": "Ignition · Electrodes & Gap", "file": "modules/ignition--sparkplug.html", "color": "#facc15", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["sparkplug"]},
      {"id": "coilplug", "label": "Coil-on-Plug", "title": "Coil-on-Plug Ignition", "subtitle": "Ignition · Individual Coils", "file": "modules/ignition--coilplug.html", "color": "#f97316", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["coilplug"]}
    ]
  },
  {
    id: "lube",
    domain: "Powertrain & Engine",
    title: "Lubrication System",
    color: "#84cc16",
    blurb: "Circulates oil to cut friction, carry heat away and prevent wear on moving parts.",
    icon: SYSTEM_ICONS["lube"],
    flow: ["Sump","Pump|oilpump","Filter|oilfilter","Gallery","Bearings"],
    soon: [],
    related: ["cooling","engine"],
    modules: [
      {"id": "lubrication", "label": "Lubrication", "title": "Lubrication System", "subtitle": "Engine · Oil Grades & Wear", "file": "modules/lube--lubrication.html", "color": "#84cc16", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["lubrication"]},
      {"id": "oilpump", "label": "Oil Pump", "title": "Oil Pump Types", "subtitle": "Lubrication · Gear Pump & Relief Valve", "file": "modules/lube--oilpump.html", "color": "#84cc16", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.16", "type": "guided", "status": "stable", "icon": MODULE_ICONS["oilpump"]},
      {"id": "oilfilter", "label": "Oil Filter", "title": "Oil Filters", "subtitle": "Lubrication · Element & Bypass Valve", "file": "modules/lube--oilfilter.html", "color": "#eab308", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["oilfilter"]}
    ]
  },
  {
    id: "cooling",
    domain: "Powertrain & Engine",
    title: "Cooling System",
    color: "#06b6d4",
    blurb: "Coolant, water pump and radiator carry excess heat away and hold the best operating temperature.",
    icon: SYSTEM_ICONS["cooling"],
    flow: ["Engine block","Thermostat|thermostat","Radiator|radiator","Water pump|cooling"],
    soon: [],
    related: ["lube","hvac"],
    modules: [
      {"id": "cooling", "label": "Cooling", "title": "Cooling System", "subtitle": "Engine Cooling · Air / Liquid", "file": "modules/cooling--cooling.html", "color": "#06b6d4", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["cooling"]},
      {"id": "thermostat", "label": "Thermostat", "title": "Thermostat", "subtitle": "Cooling · Wax Element Valve", "file": "modules/cooling--thermostat.html", "color": "#f59e0b", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["thermostat"]},
      {"id": "radiator", "label": "Radiator", "title": "Radiator", "subtitle": "Cooling · Core, Fan & Airflow", "file": "modules/cooling--radiator.html", "color": "#06b6d4", "level": "Basic", "min": 11, "mode": "3D", "moduleVersion": "1.0.16", "type": "guided", "status": "stable", "icon": MODULE_ICONS["radiator"]}
    ]
  },
  {
    id: "exhaust",
    domain: "Powertrain & Engine",
    title: "Exhaust System",
    color: "#78909c",
    blurb: "Collects, cleans and silences burnt gases and routes them safely away from the cabin.",
    icon: SYSTEM_ICONS["exhaust"],
    flow: ["Manifold|exhaustsystem","EGR|egr","Catalyst|catalytic","DPF|dpf","Muffler|exhaustsystem","Tailpipe|exhaustsystem"],
    soon: [],
    related: ["engine","ecu"],
    modules: [
      {"id": "exhaustsystem", "label": "Exhaust", "title": "Exhaust System", "subtitle": "Emissions · Silencer & Catalyst", "file": "modules/exhaust--exhaustsystem.html", "color": "#78909c", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["exhaustsystem"]},
      {"id": "catalytic", "label": "Catalytic", "title": "Catalytic Converter", "subtitle": "Emissions · Three-Way Catalyst", "file": "modules/exhaust--catalytic.html", "color": "#fb923c", "level": "Intermediate", "min": 13, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["catalytic"]},
      {"id": "egr", "label": "EGR", "title": "Exhaust Gas Recirculation", "subtitle": "Emissions · EGR Valve & Cooler", "file": "modules/exhaust--egr.html", "color": "#a78bfa", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "stable", "icon": MODULE_ICONS["egr"]},
      {"id": "dpf", "label": "DPF", "title": "Diesel Particulate Filter", "subtitle": "Emissions · Soot Trap & Regeneration", "file": "modules/exhaust--dpf.html", "color": "#94a3b8", "level": "Advanced", "min": 14, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["dpf"]}
    ]
  },
  {
    id: "trans",
    domain: "Drivetrain & Transmission",
    title: "Transmission System",
    color: "#a78bfa",
    blurb: "A gearbox (manual, automatic or CVT) and clutch match engine speed to road speed and give extra pulling force at low speed.",
    icon: SYSTEM_ICONS["trans"],
    flow: ["Engine","Clutch|clutch","Gearbox|gearbox","Automatic|automatic","Driveshaft|driveshaft"],
    soon: [],
    related: ["shaftdiff","engine"],
    modules: [
      {"id": "transmission", "label": "Trans", "title": "Transmission System", "subtitle": "Drivetrain · 2W / 4W", "file": "modules/trans--transmission.html", "color": "#3b82f6", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["transmission"]},
      {"id": "clutch", "label": "Clutch", "title": "Clutch", "subtitle": "Transmission · Friction Disc", "file": "modules/trans--clutch.html", "color": "#e11d48", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["clutch"]},
      {"id": "gearbox", "label": "Gearbox", "title": "Manual Gearbox", "subtitle": "Transmission · H-Pattern", "file": "modules/trans--gearbox.html", "color": "#22c55e", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["gearbox"]},
      {"id": "automatic", "label": "Auto", "title": "Automatic Transmission", "subtitle": "Drivetrain · Torque Converter", "file": "modules/trans--automatic.html", "color": "#2dd4bf", "level": "Advanced", "min": 16, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["automatic"]}
    ]
  },
  {
    id: "shaftdiff",
    domain: "Drivetrain & Transmission",
    title: "Drive Shaft & Differential",
    color: "#f59e0b",
    blurb: "Carries power from the gearbox to the wheels and lets them turn at different speeds in a bend.",
    icon: SYSTEM_ICONS["shaftdiff"],
    flow: ["Gearbox|gearbox","Driveshaft|driveshaft","Differential|differential","4WD / AWD|awd","Wheels|tyres"],
    soon: [],
    related: ["trans","wheels"],
    modules: [
      {"id": "driveshaft", "label": "Driveshaft", "title": "Driveshafts & U-Joints", "subtitle": "Drivetrain · Cardan Joint & Speed Variation", "file": "modules/shaftdiff--driveshaft.html", "color": "#38bdf8", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["driveshaft"]},
      {"id": "differential", "label": "Diff", "title": "Differential", "subtitle": "Drivetrain · Torque Split", "file": "modules/shaftdiff--differential.html", "color": "#eab308", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.1.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["differential"]},
      {"id": "awd", "label": "4WD / AWD", "title": "4WD / AWD Systems", "subtitle": "Drivetrain · Transfer Case & Torque Split", "file": "modules/shaftdiff--awd.html", "color": "#22c55e", "level": "Advanced", "min": 15, "mode": "3D", "moduleVersion": "1.1.16", "type": "guided", "status": "stable", "icon": MODULE_ICONS["awd"]}
    ]
  },
  {
    id: "wheels",
    domain: "Drivetrain & Transmission",
    title: "Wheels & Tyres",
    color: "#64748b",
    blurb: "The only contact with the road: grip, load, alignment and balance.",
    icon: SYSTEM_ICONS["wheels"],
    flow: ["Tyre|tyres","Alignment|wheel-alignment","Balancing|wheel-balancing"],
    soon: [],
    related: ["shaftdiff","suspension","brakes"],
    modules: [
      {"id": "tyres", "label": "Wheels & Tyres", "title": "Wheels & Tyres", "subtitle": "Chassis · Pressure, Contact Patch & Wear", "file": "modules/wheels--tyres.html", "color": "#64748b", "level": "Basic", "min": 11, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["tyres"]},
      {"id": "wheel-alignment", "label": "Wheel Alignment", "title": "Wheel Alignment", "subtitle": "Chassis · Toe, Camber & Caster", "file": "modules/wheels--wheel-alignment.html", "color": "#14b8a6", "level": "Intermediate", "min": 15, "mode": "3D", "moduleVersion": "1.0.15", "type": "group", "status": "stable", "children": ["wa-toe","wa-camber","wa-caster"], "icon": MODULE_ICONS["wheel-alignment"]},
      {"id": "wheel-balancing", "label": "Wheel Balancing", "title": "Wheel Balancing", "subtitle": "Chassis · Static & Dynamic Balance", "file": "modules/wheels--wheel-balancing.html", "color": "#ef4444", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.16", "type": "group", "status": "stable", "children": ["wb-static","wb-dynamic","wb-procedure","wb-split"], "icon": MODULE_ICONS["wheel-balancing"]}
    ]
  },
  {
    id: "brakes",
    domain: "Control & Handling",
    title: "Braking System",
    color: "#ef4444",
    blurb: "Slows the car with hydraulic (fluid), mechanical or regenerative (battery-recharging) brakes, plus ABS to keep the wheels from locking.",
    icon: SYSTEM_ICONS["brakes"],
    flow: ["Pedal|braking","Master cylinder|braking","Caliper / drum|braking","ABS|absesc"],
    soon: [],
    related: ["wheels","safety"],
    modules: [
      {"id": "braking", "label": "Brakes", "title": "Hydraulic Braking System", "subtitle": "Chassis · Disc & Drum", "file": "modules/brakes--braking.html", "color": "#ef4444", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["braking"]},
      {"id": "absesc", "label": "ABS & ESC", "title": "ABS & Electronic Stability Control", "subtitle": "Chassis · Wheel Speed, Slip & Yaw Control", "file": "modules/brakes--absesc.html", "color": "#f43f5e", "level": "Advanced", "min": 15, "mode": "3D", "moduleVersion": "1.1.14", "type": "custom", "status": "stable", "icon": MODULE_ICONS["absesc"]}
    ]
  },
  {
    id: "steering",
    domain: "Control & Handling",
    title: "Steering System",
    color: "#a855f7",
    blurb: "Turns the steering wheel into the direction of the front wheels, usually through a rack and pinion (a toothed bar and a small gear).",
    icon: SYSTEM_ICONS["steering"],
    flow: ["Wheel|steering","Column|steering","Rack & pinion|steering","Tyres|tyres"],
    soon: [],
    related: ["suspension","wheels"],
    modules: [
      {"id": "steering", "label": "Steering", "title": "Steering System", "subtitle": "Steering · Rack & Pinion", "file": "modules/steering--steering.html", "color": "#a855f7", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["steering"]}
    ]
  },
  {
    id: "suspension",
    domain: "Control & Handling",
    title: "Suspension System",
    color: "#ec4899",
    blurb: "Springs and dampers (shock absorbers) soak up road bumps and keep the tyres in contact with the road.",
    icon: SYSTEM_ICONS["suspension"],
    flow: ["Tyre|tyres","Spring|suspension","Damper|suspension","Body|bodyframe"],
    soon: [],
    related: ["steering","wheels","body"],
    modules: [
      {"id": "suspension", "label": "Suspension", "title": "Suspension System", "subtitle": "Chassis · Springs & Dampers", "file": "modules/suspension--suspension.html", "color": "#ec4899", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["suspension"]}
    ]
  },
  {
    id: "elec",
    domain: "Electrical & Electronics",
    title: "Electrical & Charging System",
    color: "#fbbf24",
    blurb: "Battery, starter and alternator store, generate and share electricity for lights, ignition and accessories.",
    icon: SYSTEM_ICONS["elec"],
    flow: ["Battery|electrical","Wiring|wiring","Starter|starting","Alternator|electrical","Lamps|lighting"],
    soon: [],
    related: ["ignition","ecu"],
    modules: [
      {"id": "electrical", "label": "Electrical", "title": "Battery · Starter · Alternator", "subtitle": "Electrical · Charging", "file": "modules/elec--electrical.html", "color": "#fbbf24", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["electrical"]},
      {"id": "starting", "label": "Starting", "title": "Starting System", "subtitle": "Electrical · Starter Motor", "file": "modules/elec--starting.html", "color": "#818cf8", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["starting"]},
      {"id": "lighting", "label": "Lighting", "title": "Vehicle Lighting", "subtitle": "Electrical · Headlamp & Relay Circuit", "file": "modules/elec--lighting.html", "color": "#fde047", "level": "Basic", "min": 11, "mode": "3D", "moduleVersion": "1.0.15", "type": "guided", "status": "stable", "icon": MODULE_ICONS["lighting"]},
      {"id": "wiring", "label": "Wiring", "title": "Wiring Harness", "subtitle": "Electrical · Fuse, Relay & Load", "file": "modules/elec--wiring.html", "color": "#f43f5e", "level": "Intermediate", "min": 13, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "stable", "icon": MODULE_ICONS["wiring"]}
    ]
  },
  {
    id: "ecu",
    domain: "Electrical & Electronics",
    title: "ECUs & Sensors",
    color: "#c084fc",
    blurb: "On-board computers and sensors watch and adjust fuel, emissions, braking and stability in real time.",
    icon: SYSTEM_ICONS["ecu"],
    flow: ["Sensors|sensors","ECU|ecu","Diagnostics|obd2","Actuators","Engine"],
    soon: [],
    related: ["elec","exhaust","brakes"],
    modules: [
      {"id": "sensors", "label": "Sensors", "title": "Sensors & Wiring", "subtitle": "Electrical · Sensing & Control", "file": "modules/ecu--sensors.html", "color": "#22c55e", "level": "Intermediate", "min": 15, "mode": "2D", "moduleVersion": "1.0.14", "type": "custom", "status": "stable", "icon": MODULE_ICONS["sensors"]},
      {"id": "ecu", "label": "ECU", "title": "Engine Control Unit", "subtitle": "Sensors & Control · Inputs → Maps → Outputs", "file": "modules/ecu--ecu.html", "color": "#a855f7", "level": "Advanced", "min": 15, "mode": "3D", "moduleVersion": "1.0.15", "type": "custom", "status": "stable", "icon": MODULE_ICONS["ecu"]},
      {"id": "obd2", "label": "OBD-II", "title": "OBD-II Diagnostics", "subtitle": "Sensors & Control · Scan Tool, Faults & Live Data", "file": "modules/ecu--obd2.html", "color": "#22d3ee", "level": "Intermediate", "min": 12, "mode": "3D", "moduleVersion": "1.0.16", "type": "custom", "status": "stable", "icon": MODULE_ICONS["obd2"]}
    ]
  },
  {
    id: "body",
    domain: "Body, Safety & Comfort",
    title: "Frame & Chassis (Body)",
    color: "#0ea5e9",
    blurb: "The structure that holds everything together: a traditional body-on-frame or a one-piece unibody.",
    icon: SYSTEM_ICONS["body"],
    flow: ["Frame|bodyframe","Body shell|bodyframe","Crumple zones|crumple"],
    soon: [],
    related: ["safety","suspension"],
    modules: [
      {"id": "bodyframe", "label": "Body & Frame", "title": "Body & Frame", "subtitle": "Body · Ladder Frame & Unibody", "file": "modules/body--bodyframe.html", "color": "#0ea5e9", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["bodyframe"]}
    ]
  },
  {
    id: "safety",
    domain: "Body, Safety & Comfort",
    title: "Active & Passive Safety",
    color: "#f43f5e",
    blurb: "Crumple zones, seat belts, airbags, traction control and ABS protect people before and during a crash.",
    icon: SYSTEM_ICONS["safety"],
    flow: ["Crumple zone|crumple","Belts & airbags|restraints","Traction control|traction","ABS & ESC|absesc"],
    soon: [],
    related: ["brakes","body"],
    modules: [
      {"id": "crumple", "label": "Crumple Zones", "title": "Crumple Zones & Crash Energy", "subtitle": "Safety · Passive Structure", "file": "modules/safety--crumple.html", "color": "#f59e0b", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["crumple"]},
      {"id": "restraints", "label": "Belts & Airbags", "title": "Seatbelts & Airbags", "subtitle": "Safety · Restraints in a Crash", "file": "modules/safety--restraints.html", "color": "#ef4444", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["restraints"]},
      {"id": "traction", "label": "Traction Control", "title": "Traction Control (TCS)", "subtitle": "Active Safety · Wheel Spin & Torque Cut", "file": "modules/safety--traction.html", "color": "#8b5cf6", "level": "Intermediate", "min": 13, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["traction"]}
    ]
  },
  {
    id: "hvac",
    domain: "Body, Safety & Comfort",
    title: "Climate Control (HVAC)",
    color: "#14b8a6",
    blurb: "Heats, cools and dries the cabin air and sends it where you want it.",
    icon: SYSTEM_ICONS["hvac"],
    flow: ["Compressor|accycle","Condenser|accycle","Evaporator|accycle","Heater core|hvacflow","Vents|hvacflow"],
    soon: [],
    related: ["cooling","elec"],
    modules: [
      {"id": "accycle", "label": "A/C Cycle", "title": "A/C Refrigeration Cycle", "subtitle": "Climate Control · Compressor to Evaporator", "file": "modules/hvac--accycle.html", "color": "#06b6d4", "level": "Intermediate", "min": 14, "mode": "3D", "moduleVersion": "1.1.15", "type": "guided", "status": "draft", "icon": MODULE_ICONS["accycle"]},
      {"id": "hvacflow", "label": "Heater & Vents", "title": "Heater, Blower & Air Distribution", "subtitle": "Climate Control · Blend Door & Modes", "file": "modules/hvac--hvacflow.html", "color": "#f97316", "level": "Basic", "min": 12, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["hvacflow"]}
    ]
  },
  {
    id: "info",
    domain: "Body, Safety & Comfort",
    title: "Infotainment & Navigation",
    color: "#6366f1",
    blurb: "Audio, phone connection, camera and GPS maps shown on the head unit.",
    icon: SYSTEM_ICONS["info"],
    flow: ["Antenna|headunit","Head unit|headunit","GPS|gpsnav","Speakers|headunit"],
    soon: [],
    related: ["ecu","elec"],
    modules: [
      {"id": "headunit", "label": "Infotainment", "title": "Infotainment & Audio", "subtitle": "Infotainment · Head Unit & Speakers", "file": "modules/info--headunit.html", "color": "#6366f1", "level": "Basic", "min": 11, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["headunit"]},
      {"id": "gpsnav", "label": "GPS Navigation", "title": "GPS Navigation", "subtitle": "Navigation · Satellites & Dead Reckoning", "file": "modules/info--gpsnav.html", "color": "#22c55e", "level": "Intermediate", "min": 13, "mode": "3D", "moduleVersion": "1.0.14", "type": "guided", "status": "draft", "icon": MODULE_ICONS["gpsnav"]}
    ]
  }
];

/* Sub-pages that hang off a group module (parent). Registered so every file in modules/ is tracked,
   but not shown as cards on the home views and not part of the roadmap stages. */
export const SUBMODULES = [
  {"id": "wa-toe", "system": "wheels", "title": "Toe", "file": "modules/wheels--wa-toe.html", "parent": "wheel-alignment", "moduleVersion": "1.0.15", "type": "sub-module", "status": "stable"},
  {"id": "wa-camber", "system": "wheels", "title": "Camber", "file": "modules/wheels--wa-camber.html", "parent": "wheel-alignment", "moduleVersion": "1.0.15", "type": "sub-module", "status": "stable"},
  {"id": "wa-caster", "system": "wheels", "title": "Caster", "file": "modules/wheels--wa-caster.html", "parent": "wheel-alignment", "moduleVersion": "1.0.15", "type": "sub-module", "status": "stable"},
  {"id": "wb-static", "system": "wheels", "title": "Static balance", "file": "modules/wheels--wb-static.html", "parent": "wheel-balancing", "moduleVersion": "1.0.16", "type": "sub-module", "status": "stable"},
  {"id": "wb-dynamic", "system": "wheels", "title": "Dynamic balance", "file": "modules/wheels--wb-dynamic.html", "parent": "wheel-balancing", "moduleVersion": "1.0.16", "type": "sub-module", "status": "stable"},
  {"id": "wb-procedure", "system": "wheels", "title": "Procedure", "file": "modules/wheels--wb-procedure.html", "parent": "wheel-balancing", "moduleVersion": "1.0.16", "type": "sub-module", "status": "stable"},
  {"id": "wb-split", "system": "wheels", "title": "Hidden weights", "file": "modules/wheels--wb-split.html", "parent": "wheel-balancing", "moduleVersion": "1.0.16", "type": "sub-module", "status": "stable"}
];

export { ROADMAP };

/* ── Derived globals used by the shell (do not edit) ─────────────────── */
export const MODULES = [];
export const META = {};
export const SYSTEMS_FLAT = SYSTEMS.map(function (s) {
  s.modules.forEach(function (m) {
    MODULES.push(m);
    META[m.id] = [m.level || 'Basic', m.min || 10, m.mode || '3D'];
  });
  return Object.assign({}, s, { modules: s.modules.map(function (m) { return m.id; }) });
});

/** Follow `replacedBy` links from `id` to the live module: returns the module object, or null for an unknown id / a broken or circular chain.
    Pure (takes the list) so it can be tested with a fixture; resolveModule(id) uses the real registry. */
export function resolveIn(list, id, maxHops = 5) {
  let m = list.find((x) => x.id === id);
  for (let hop = 0; m && m.status === 'deprecated'; hop++) {
    if (hop >= maxHops || !m.replacedBy) return null;
    m = list.find((x) => x.id === m.replacedBy);
  }
  return m || null;
}
export const resolveModule = (id) => resolveIn(MODULES, id);

if (typeof window !== 'undefined') {
  window.AUTO_DOMAINS = DOMAINS;
  window.AUTO_ROADMAP = ROADMAP;
  window.AUTO_MODULES = MODULES;
  window.AUTO_META = META;
  window.AUTO_SYSTEMS = SYSTEMS_FLAT;
}
