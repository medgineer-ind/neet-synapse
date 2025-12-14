import { Syllabus } from '../types';

export const syllabus: Syllabus = {
  Physics: {
    "Units and Measurements": [
        "SI units, fundamental and derived units.",
        "Least count, accuracy and precision of measuring instruments.",
        "Errors in measurement, significant figures.",
        "Dimensions of physical quantities, dimensional analysis and its applications."
    ],
    "Kinematics": [
        "Motion in a straight line, position-time graph, speed and velocity.",
        "Uniform and non-uniform motion, average speed, instantaneous velocity.",
        "Uniformly accelerated motion, velocity-time and position-time graphs.",
        "Scalars and vectors, vector addition/subtraction, scalar and vector product.",
        "Motion in a plane, projectile motion, uniform circular motion."
    ],
    "Laws of Motion": [
        "Force and inertia, Newton’s laws of motion (1st, 2nd, 3rd), momentum.",
        "Impulse, conservation of linear momentum.",
        "Equilibrium of concurrent forces.",
        "Static and kinetic friction, laws of friction, rolling friction.",
        "Dynamics of uniform circular motion (centripetal force, vehicle on level/banked road)."
    ],
    "Work, Energy and Power": [
        "Work done by a constant/variable force, kinetic energy, work-energy theorem.",
        "Potential energy, conservation of mechanical energy.",
        "Potential energy of a spring, conservative vs non-conservative forces.",
        "Power, collisions in one and two dimensions (elastic/inelastic)."
    ],
    "Rotational Motion (System of Particles)": [
        "Centre of mass of a two-particle system and rigid body.",
        "Momentum conservation and centre of mass motion.",
        "Torque, angular momentum, conservation of angular momentum.",
        "Moment of inertia, radius of gyration.",
        "Values of moments of inertia for simple geometric objects (no derivation).",
        "Parallel and perpendicular axes theorems.",
        "Equilibrium of rigid bodies, equations of rotational motion."
    ],
    "Gravitation": [
        "Universal law of gravitation, Kepler’s laws of planetary motion.",
        "Acceleration due to gravity (g) and its variation with altitude/depth.",
        "Gravitational potential energy and gravitational potential.",
        "Escape velocity, orbital velocity of a satellite, geostationary satellites."
    ],
    "Properties of Solids and Liquids": [
        "Elastic behaviour, Stress-strain relationship, Hooke’s Law, Young’s modulus, bulk modulus, modulus of rigidity.",
        "Pressure due to a fluid column, Pascal’s law and its applications.",
        "Viscosity, Stokes’ law, terminal velocity, streamline and turbulent flow, critical velocity.",
        "Bernoulli’s principle and its applications.",
        "Surface energy and surface tension, angle of contact, capillary rise."
    ],
    "Thermodynamics": [
        "Thermal equilibrium, zeroth law of thermodynamics.",
        "Heat, work, and internal energy.",
        "First law of thermodynamics.",
        "Isothermal and adiabatic processes.",
        "Second law of thermodynamics (reversible and irreversible processes)."
    ],
    "Kinetic Theory of Gases": [
        "Equation of state of a perfect gas.",
        "Assumptions of KTG, concept of pressure.",
        "Kinetic interpretation of temperature, rms speed.",
        "Degrees of freedom, law of equipartition of energy.",
        "Concept of mean free path, Avogadro’s number."
    ],
    "Oscillations and Waves": [
        "Periodic motion, period, frequency, displacement as a function of time.",
        "Simple Harmonic Motion (SHM) and its equation; phase.",
        "Energy in SHM (kinetic/potential), simple pendulum (derivation of time period).",
        "Wave motion, longitudinal and transverse waves, speed of wave.",
        "Displacement relation for a progressive wave.",
        "Principle of superposition, reflection of waves.",
        "Standing waves in strings and organ pipes, fundamental mode and harmonics.",
        "Beats, Doppler effect."
    ],
    "Electrostatics": [
        "Electric charges, conservation, Coulomb’s law.",
        "Electric field, field lines, electric dipole, torque on a dipole.",
        "Electric flux, Gauss’s theorem and applications (infinite wire, infinite sheet, shell).",
        "Electric potential, potential difference, equipotential surfaces.",
        "Electrical potential energy of a system of charges.",
        "Conductors and insulators, dielectrics.",
        "Capacitors and capacitance, combination of capacitors, energy stored in capacitor."
    ],
    "Current Electricity": [
        "Electric current, drift velocity, Ohm’s law, V-I characteristics (linear/non-linear).",
        "Electrical energy and power, resistivity and conductivity.",
        "Temperature dependence of resistance.",
        "Internal resistance of a cell, EMF, combination of cells.",
        "Kirchhoff’s laws and simple applications.",
        "Wheatstone bridge, Metre bridge."
    ],
    "Magnetic Effects of Current and Magnetism": [
        "Biot-Savart law and its application to current carrying circular loop.",
        "Ampere’s law and its applications (infinite long wire, straight and toroidal solenoids).",
        "Force on a moving charge in uniform magnetic and electric fields (Cyclotron ideas).",
        "Force on a current-carrying conductor in a magnetic field.",
        "Force between two parallel current-carrying conductors.",
        "Torque experienced by a current loop in a magnetic field; Moving coil galvanometer.",
        "Current loop as a magnetic dipole, bar magnet as an equivalent solenoid.",
        "Magnetic field lines, magnetic properties (para-, dia-, ferro- substances)."
    ],
    "Electromagnetic Induction and Alternating Currents": [
        "Electromagnetic induction, Faraday’s laws, induced EMF and current, Lenz’s Law.",
        "Self and mutual inductance.",
        "Alternating currents, peak and RMS value of AC.",
        "Reactance and impedance, LC oscillations (qualitative), LCR series circuit, resonance.",
        "Power in AC circuits, wattless current.",
        "AC generator and transformer."
    ],
    "Electromagnetic Waves": [
        "Displacement current, characteristics of EM waves, transverse nature.",
        "Electromagnetic spectrum (radio to gamma) and elementary uses."
    ],
    "Optics": [
        "Reflection of light, spherical mirrors, mirror formula.",
        "Refraction of light, total internal reflection, optical fibers.",
        "Refraction at spherical surfaces, lenses, thin lens formula, lens maker’s formula.",
        "Magnification, power of a lens, combination of thin lenses.",
        "Refraction and dispersion of light through a prism.",
        "Optical instruments (microscope and astronomical telescope).",
        "Wave optics: Wavefront and Huygens’ principle.",
        "Reflection and refraction using wave theory.",
        "Interference, Young’s double slit experiment (fringe width).",
        "Diffraction due to a single slit.",
        "Polarization, plane polarized light, Brewster’s law."
    ],
    "Dual Nature of Matter and Radiation": [
        "Photoelectric effect, Hertz and Lenard’s observations.",
        "Einstein’s photoelectric equation, particle nature of light.",
        "Matter waves, wave nature of particles, de Broglie relation."
    ],
    "Atoms and Nuclei": [
        "Alpha-particle scattering experiment, Rutherford’s model.",
        "Bohr model, energy levels, hydrogen spectrum.",
        "Composition and size of nucleus, atomic masses, isotopes, isobars, isotones.",
        "Mass-energy relation, mass defect, binding energy per nucleon.",
        "Nuclear fission and fusion."
    ],
    "Electronic Devices": [
        "Energy bands in conductors, semiconductors, and insulators (qualitative).",
        "Semiconductor diode (I-V characteristics), Zener diode, Zener as voltage regulator.",
        "Logic gates (OR, AND, NOT, NAND and NOR)."
    ],
    "Experimental Skills": [
        "Vernier calipers, Screw gauge (measurements & errors).",
        "Simple pendulum (dissipation of energy).",
        "Metre Scale (mass of given object).",
        "Elasticity (extension of spring).",
        "Capillary rise, Cooling curve.",
        "Speed of sound (resonance tube).",
        "Specific heat capacity, Resistivity (Metre Bridge).",
        "Figure of merit of Galvanometer.",
        "Focal length of mirrors/lenses (parallax method).",
        "Plotting angle of deviation vs angle of incidence (Prism).",
        "Refractive index of a glass slab using traveling microscope.",
        "Characteristic curves of p-n junction and Zener diode."
    ]
  },
  Chemistry: {
    "Some Basic Concepts of Chemistry": [
        "Atomic and molecular masses, mole concept and molar mass.",
        "Percentage composition, empirical and molecular formulae.",
        "Chemical reactions, stoichiometry and calculations."
    ],
    "Atomic Structure": [
        "Bohr’s model and its limitations.",
        "Dual nature of matter and light, de Broglie’s relationship, Heisenberg uncertainty principle.",
        "Quantum numbers, shapes of s, p, and d orbitals.",
        "Aufbau principle, Pauli exclusion principle, Hund’s rule, electronic configuration."
    ],
    "Chemical Bonding and Molecular Structure": [
        "Ionic bond, Covalent bond, parameters (bond length/angle/energy/order).",
        "Lewis structure, polar character, Valence Bond Theory (VBT).",
        "Resonance, geometry of covalent molecules, VSEPR theory.",
        "Hybridization (s, p and d orbitals).",
        "Molecular Orbital Theory (MOT) of homonuclear diatomic molecules, Hydrogen bond."
    ],
    "Chemical Thermodynamics": [
        "First law: Internal energy, Enthalpy, Heat capacity, Specific heat.",
        "Measurement of ΔU and ΔH, Hess’s law, Enthalpies of different processes (bond, combustion, formation, etc.).",
        "Entropy, Gibbs energy change (ΔG) and equilibrium."
    ],
    "Equilibrium": [
        "Law of chemical equilibrium, equilibrium constant (K_p, K_c).",
        "Le Chatelier’s principle.",
        "Ionic equilibrium: Ionization of acids/bases, pH concept.",
        "Hydrolysis of salts, Buffer solutions, Solubility product (Ksp).",
    ],
    "Solutions": [
        "Types of solutions, expression of concentration.",
        "Solubility of gases in liquids, Raoult’s law.",
        "Colligative properties (vapor pressure lowering, BP elevation, FP depression, osmotic pressure).",
        "Determination of molecular masses, Van’t Hoff factor."
    ],
    "Redox Reactions & Electrochemistry": [
        "Oxidation and reduction, balancing redox reactions.",
        "Electrolytic and metallic conduction, conductance.",
        "Kohlrausch’s law, electrolysis.",
        "Galvanic cells, EMF, Nernst equation.",
        "Standard electrode potential, relation between ΔG and EMF."
    ],
    "Chemical Kinetics": [
        "Rate of reaction, factors affecting rate (concentration, temp, catalyst).",
        "Order and molecularity, rate law, rate constant.",
        "Integrated rate equations (zero and first order).",
        "Activation energy, Arrhenius equation."
    ],
    "Classification of Elements and Periodicity": [
        "Modern periodic law, s, p, d, f blocks.",
        "Periodic trends: Atomic/ionic radii, ionization enthalpy, electron gain enthalpy, electronegativity, valence."
    ],
    "p-Block Elements (Groups 13 to 18)": [
        "General introduction to electronic configuration, occurrence.",
        "Trends in physical and chemical properties down the group and across periods.",
        "Unique behaviour of the first element in each group."
    ],
    "d- and f-Block Elements": [
        "Electronic configuration, general trends of transition metals (colour, catalytic, magnetic).",
        "Preparation and properties of K2Cr2O7 and KMnO4.",
        "Lanthanoids (contraction and consequences). Actinoids (comparison with lanthanoids)."
    ],
    "Coordination Compounds": [
        "Ligands, coordination number, magnetic properties, shapes.",
        "IUPAC nomenclature of mononuclear coordination compounds.",
        "Isomerism, Bonding (Werner’s, VBT, CFT)."
    ],
    "Purification and Characterization": [
        "Crystallization, distillation, differential extraction, chromatography.",
        "Qualitative analysis (detection of N, S, P, Halogens).",
        "Quantitative analysis (estimation of C, H, N, Halogens, S, P - basic principles)."
    ],
    "Some Basic Principles of Organic Chemistry (GOC)": [
        "IUPAC nomenclature.",
        "Electronic displacements: Inductive, electromeric, resonance, hyperconjugation.",
        "Homolytic/Heterolytic fission, free radicals, carbocations, carbanions, electrophiles/nucleophiles."
    ],
    "Hydrocarbons": [
        "Alkanes: Conformational isomerism (Ethane), halogenation.",
        "Alkenes: Geometrical isomerism, Markovnikov’s/Anti-Markovnikov’s addition, Ozonolysis.",
        "Alkynes: Acidic character, addition reactions.",
        "Aromatic Hydrocarbons: Benzene structure, resonance, aromaticity, Friedel-Crafts alkylation/acylation, nitration, sulphonation, halogenation."
    ],
    "Haloalkanes and Haloarenes": [
        "Nature of C-X bond, substitution reactions (SN1, SN2).",
        "Optical rotation, enantiomers.",
        "Haloarenes: Nature of C-X bond, electrophilic substitution."
    ],
    "Alcohols, Phenols and Ethers": [
        "Alcohols: Dehydration mechanism, acidic nature.",
        "Phenols: Acidic nature, electrophilic substitution, Reimer-Tiemann, Kolbe’s reaction.",
        "Ethers: Williamsons synthesis, cleavage of C-O bond."
    ],
    "Aldehydes, Ketones and Carboxylic Acids": [
        "Nucleophilic addition to carbonyl, Grignard reagent addition.",
        "Aldol condensation, Cannizzaro reaction, Haloform reaction.",
        "Carboxylic Acids: Acidic strength, factors affecting it."
    ],
    "Organic Compounds Containing Nitrogen (Amines)": [
        "Primary/Secondary/Tertiary amines identification.",
        "Basic strength of amines.",
        "Diazonium salts: Preparation and synthetic importance (Sandmeyer etc.)."
    ],
    "Biomolecules": [
        "Carbohydrates: Classification, Monosaccharides (Glucose, Fructose), Polysaccharides (Starch, Cellulose, Glycogen).",
        "Proteins: Amino acids, peptide bond, primary/secondary/tertiary structure, denaturation.",
        "Nucleic Acids: DNA and RNA structure.",
        "Vitamins (Classification and functions)."
    ],
    "Practical Chemistry": [
        "Detection of functional groups (Hydroxyl, Carbonyl, Carboxyl, Amino).",
        "Salt Analysis: Cations (Pb2+, Cu2+, As3+, Al3+, Fe3+, Mn2+, Ni2+, Zn2+, Co2+, Ca2+, Sr2+, Ba2+, Mg2+, NH4+). Anions (CO3^2-, S^2-, SO3^2-, SO4^2-, NO2^-, NO3^-, Cl^-, Br^-, I^-, PO4^3-, C2O4^2-, CH3COO^-).",
        "Principles of Chemistry involving: Mohr’s salt titration, KMnO4 titration."
    ]
  },
  Botany: {
    "The Living World": [
        "Biodiversity, Need for classification.",
        "Three domains of life.",
        "Taxonomy and Systematics; Concept of species and taxonomical hierarchy.",
        "Binomial nomenclature."
    ],
    "Biological Classification": [
        "Five kingdom classification.",
        "Salient features and classification of Monera, Protista, and Fungi.",
        "Lichens, Viruses, and Viroids."
    ],
    "Plant Kingdom": [
        "Classification of plants: Algae, Bryophytes, Pteridophytes, Gymnosperms.",
        "Angiosperms (Life cycle and alternation of generation)."
    ],
    "Morphology of Flowering Plants": [
        "Morphology of Root, Stem, Leaf.",
        "Inflorescence (cymose/racemose), Flower, Fruit, Seed.",
        "Description of families—Malvaceae, Cruciferae (Brassicaceae), Leguminosae, Compositae (Asteraceae), Gramineae (Poaceae)."
    ],
    "Anatomy of Flowering Plants": [
        "Tissues (Meristematic and Permanent).",
        "Anatomy of Root, Stem, and Leaf (Monocot vs Dicot)."
    ],
    "Cell: The Unit of Life": [
        "Cell theory, Prokaryotic vs Eukaryotic cells.",
        "Cell organelles: Nucleus, Mitochondria, Plastids, Ribosomes, ER, Golgi, Lysosomes, Vacuoles, Cytoskeleton."
    ],
    "Cell Cycle and Cell Division": [
        "Cell cycle (G1, S, G2 phases).",
        "Mitosis (equations division) and Meiosis (reduction division)."
    ],
    "Photosynthesis in Higher Plants": [
        "Site of photosynthesis, pigments.",
        "Photochemical phase (Light reaction), Electron transport, Photophosphorylation.",
        "Biosynthetic phase (C3 cycle, C4 cycle), Photorespiration."
    ],
    "Respiration in Plants": [
        "Glycolysis, Fermentation (anaerobic).",
        "Aerobic respiration: TCA cycle, Electron Transport System (ETS).",
        "Amphibolic pathways, Respiratory Quotient (RQ)."
    ],
    "Plant Growth and Development": [
        "Phases of plant growth.",
        "Differentiation, dedifferentiation, and redifferentiation.",
        "Growth regulators: Auxin, Gibberellin, Cytokinin, Ethylene, ABA.",
        "Photoperiodism."
    ],
    "Sexual Reproduction in Flowering Plants": [
        "Structure of flower.",
        "Development of male and female gametophytes.",
        "Pollination types, Outbreeding devices, Pollen-Pistil interaction.",
        "Double fertilization, Endosperm and Embryo development.",
        "Apomixis and Polyembryony."
    ],
    "Principles of Inheritance and Variation": [
        "Mendel’s laws, Post-Mendelian genetics (Incomplete/Co-dominance).",
        "Chromosomal theory of inheritance.",
        "Linkage and crossing over.",
        "Sex determination (birds, insects, humans).",
        "Genetic disorders (Chromosomal and Mendelian)."
    ],
    "Molecular Basis of Inheritance": [
        "DNA as genetic material, DNA Structure & Packaging.",
        "Replication, Transcription, Genetic Code, Translation.",
        "Regulation of gene expression (Lac Operon).",
        "DNA Fingerprinting."
    ],
    "Microbes in Human Welfare": [
        "Household food processing, Industrial production.",
        "Sewage treatment, Energy generation (Biogas).",
        "Biocontrol agents and Biofertilizers."
    ],
    "Organisms and Populations": [
        "Organisms and environment.",
        "Population attributes (growth, birth/death rates).",
        "Population interactions (Mutualism, Competition, Predation, Parasitism, Commensalism)."
    ],
    "Ecosystem": [
        "Productivity and decomposition.",
        "Energy flow, Pyramids of number, biomass, energy."
    ],
    "Biodiversity and Conservation": [
        "Biodiversity patterns and loss.",
        "Conservation: In-situ (Biosphere reserves, Parks) and Ex-situ (Seed banks, Zoos)."
    ]
  },
  Zoology: {
    "Animal Kingdom": [
        "Salient features and classification of non-chordates (Porifera to Hemichordata).",
        "Salient features of Chordates (Fish, Amphibians, Reptiles, Birds, Mammals)."
    ],
    "Structural Organisation in Animals": [
        "Animal tissues: Epithelial, Connective, Muscular, Neural.",
        "Morphology, Anatomy, and functions of digestive, circulatory, respiratory, nervous, and reproductive systems of Frog."
    ],
    "Biomolecules": [
        "Structure/Function of Proteins, Carbohydrates, Lipids, Nucleic acids.",
        "Enzymes: Types, properties, Enzyme action (Lock & Key, Induced Fit), Factors affecting enzyme activity (Temp, pH, Substrate conc)."
    ],
    "Breathing and Exchange of Gases": [
        "Respiratory organs in animals.",
        "Mechanism of breathing, Respiratory volumes/capacities.",
        "Transport of gases (O2 and CO2).",
        "Disorders (Asthma, Emphysema, Occupational respiratory disorders)."
    ],
    "Body Fluids and Circulation": [
        "Composition of blood, Blood groups (ABO, Rh).",
        "Human heart structure, Cardiac cycle, ECG.",
        "Double circulation.",
        "Disorders (Hypertension, CAD, Angina, Heart failure)."
    ],
    "Excretory Products and their Elimination": [
        "Modes of excretion (Ammonotelism, Ureotelism, Uricotelism).",
        "Human excretory system (Kidney, Nephron structure).",
        "Urine formation, Counter current mechanism.",
        "Regulation of kidney function (Renin-Angiotensin, ANF, ADH)."
    ],
    "Locomotion and Movement": [
        "Types of movement (ciliary, flagellar, muscular).",
        "Mechanism of muscle contraction (Sliding filament theory).",
        "Skeletal system (Bones and Joints).",
        "Disorders (Myasthenia gravis, Tetany, Muscular dystrophy, Arthritis, Osteoporosis, Gout)."
    ],
    "Neural Control and Coordination": [
        "Neuron structure, Nerve impulse generation and conduction.",
        "Synaptic transmission.",
        "Central Nervous System (Brain parts).",
        "Sensory organs: Eye (parts, vision mechanism) and Ear (parts, hearing mechanism)."
    ],
    "Chemical Coordination and Integration": [
        "Endocrine glands: Pituitary, Pineal, Thyroid, Parathyroid, Adrenal, Pancreas, Gonads.",
        "Mechanism of hormone action (membrane-bound vs intracellular receptors)."
    ],
    "Human Reproduction": [
        "Male and Female reproductive systems.",
        "Gametogenesis (Spermatogenesis and Oogenesis).",
        "Menstrual cycle.",
        "Fertilization, Implantation, Pregnancy, Parturition, Lactation."
    ],
    "Reproductive Health": [
        "Sexually Transmitted Diseases (STDs).",
        "Birth control methods (Contraception).",
        "Medical Termination of Pregnancy (MTP).",
        "Infertility and ART (IVF, ZIFT, GIFT)."
    ],
    "Evolution": [
        "Origin of life.",
        "Evidences of evolution (Homologous/Analogous organs, Embryological support).",
        "Adaptive radiation.",
        "Mechanism of evolution (Variation, Mutation, Natural Selection).",
        "Hardy-Weinberg principle.",
        "Human Evolution."
    ],
    "Human Health and Disease": [
        "Pathogens: Parasites causing Malaria, Filariasis, Ascariasis, Ringworm.",
        "Bacterial/Viral: Typhoid, Pneumonia, Common Cold.",
        "Dengue and Chikungunya.",
        "Immunity (Innate, Acquired, Active/Passive), Vaccination.",
        "Allergies, Autoimmunity, AIDS, Cancer.",
        "Drug and Alcohol Abuse."
    ],
    "Biotechnology: Principles and Processes": [
        "Genetic engineering principles.",
        "Tools of recombinant DNA technology (Restriction enzymes, Vectors).",
        "Processes: PCR, Gel Electrophoresis, Bioreactors."
    ],
    "Biotechnology and its Applications": [
        "Applications in Agriculture (Bt Cotton, RNA interference).",
        "Applications in Medicine (Genetically engineered Insulin, Gene therapy).",
        "Transgenic animals, Biosafety, Biopiracy."
    ]
  },
};
