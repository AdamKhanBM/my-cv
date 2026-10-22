/* =========================================================================
   Skills map: where each skill comes from.
   Public version of skills-map.json (which stays out of the repo): the two
   unpublished projects are described only in general terms, and no private
   repo or folder names appear here.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('skillmap');
  if (!root) return;

  var es = document.documentElement.lang === 'es';
  function L(o, k) { return o[k + (es ? '_es' : '_en')]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var UI = es ? {
    origins: 'De dónde vienen', skills: 'Conocimientos',
    hint: 'Pasa el ratón o toca un proyecto o un conocimiento para ver cómo se conectan.',
    count: function (o, s, l) { return o + ' orígenes · ' + s + ' conocimientos · ' + l + ' conexiones'; },
    see: 'Ver la demo ↑', papers: 'Ver las publicaciones ↓', from: 'Viene de',
    example: 'Un ejemplo para empezar. Elige cualquier otro origen o conocimiento.',
    sources: function (n) { return n === 1 ? '1 origen' : n + ' orígenes'; }
  } : {
    origins: 'Where they come from', skills: 'Skills',
    hint: 'Hover or tap a project or a skill to see how they connect.',
    count: function (o, s, l) { return o + ' sources · ' + s + ' skills · ' + l + ' connections'; },
    see: 'See the demo ↑', papers: 'See the papers ↓', from: 'Comes from',
    example: 'An example to start with. Pick any other source or skill.',
    sources: function (n) { return n === 1 ? '1 source' : n + ' sources'; }
  };

  var GROUPS = [
    { id: 'imaging', name_en: 'Imaging', name_es: 'Imagen' },
    { id: 'statistics', name_en: 'Statistics', name_es: 'Estadística' },
    { id: 'ml', name_en: 'Machine learning', name_es: 'Machine learning' },
    { id: 'software', name_en: 'Software engineering', name_es: 'Ingeniería de software' },
    { id: 'biology', name_en: 'Biology', name_es: 'Biología' },
    { id: 'chemistry', name_en: 'Chemistry', name_es: 'Química' }
  ];

  var ORIGINS = [
    { id: 'p1', kicker_en: 'Problem 01', kicker_es: 'Problema 01', name_en: 'Counting colonies', name_es: 'Contar colonias', href: '#p1-h' },
    { id: 'p2', kicker_en: 'Problem 02', kicker_es: 'Problema 02', name_en: 'From plate to GI50', name_es: 'De la placa al GI50', href: '#p2-h' },
    { id: 'p3', kicker_en: 'Problem 03', kicker_es: 'Problema 03', name_en: 'Cell cycle from DAPI', name_es: 'Ciclo celular con DAPI', href: '#p3-h' },
    { id: 'p4', kicker_en: 'Problem 04', kicker_es: 'Problema 04', name_en: 'RNA-seq and mechanism', name_es: 'RNA-seq y mecanismo', href: '#p4-h' },
    { id: 'ml', kicker_en: 'Project · in preparation', kicker_es: 'Proyecto · en preparación', name_en: 'Deep learning on molecules', name_es: 'Deep learning con moléculas' },
    { id: 'net', kicker_en: 'Project · public data', kicker_es: 'Proyecto · datos públicos', name_en: 'Melanoma network', name_es: 'Red de melanoma' },
    { id: 'live', kicker_en: 'Project · in preparation', kicker_es: 'Proyecto · en preparación', name_en: 'Live-cell imaging', name_es: 'Imagen de células vivas' },
    { id: 'lab', kicker_en: 'Bench work', kicker_es: 'Laboratorio', name_en: 'Screening in 8 papers', name_es: 'Cribado en 8 publicaciones', href: '#papers' }
  ];

  var SKILLS = [
    { id: 'segmentation', group: 'imaging', name_en: 'Image segmentation', name_es: 'Segmentación de imágenes' },
    { id: 'features', group: 'imaging', name_en: 'Quantitative image features', name_es: 'Medidas cuantitativas en imagen' },
    { id: 'livecell', group: 'imaging', name_en: 'Live-cell imaging', name_es: 'Imagen de células vivas' },
    { id: 'tests', group: 'statistics', name_en: 'Hypothesis testing', name_es: 'Contraste de hipótesis' },
    { id: 'agreement', group: 'statistics', name_en: 'Method agreement', name_es: 'Concordancia de métodos' },
    { id: 'doseresp', group: 'statistics', name_en: 'Dose-response analysis', name_es: 'Análisis dosis-respuesta' },
    { id: 'de', group: 'statistics', name_en: 'Differential expression', name_es: 'Expresión diferencial' },
    { id: 'gnn', group: 'ml', name_en: 'Graph neural networks', name_es: 'Redes neuronales de grafos' },
    { id: 'uncert', group: 'ml', name_en: 'Uncertainty estimation', name_es: 'Estimación de incertidumbre' },
    { id: 'explain', group: 'ml', name_en: 'Model explainability', name_es: 'Explicabilidad de modelos' },
    { id: 'classic', group: 'ml', name_en: 'Classical ML and validation', name_es: 'ML clásico y validación' },
    { id: 'unsup', group: 'ml', name_en: 'Unsupervised learning', name_es: 'Aprendizaje no supervisado' },
    { id: 'labtools', group: 'software', name_en: 'Tools for non-coders', name_es: 'Herramientas para quien no programa' },
    { id: 'testing', group: 'software', name_en: 'Testing and databases', name_es: 'Tests y bases de datos' },
    { id: 'pipelines', group: 'software', name_en: 'Reproducible pipelines', name_es: 'Pipelines reproducibles' },
    { id: 'assays', group: 'biology', name_en: 'Cell-based phenotypic assays', name_es: 'Ensayos fenotípicos celulares' },
    { id: 'fluo', group: 'biology', name_en: 'Fluorescence microscopy', name_es: 'Microscopía de fluorescencia' },
    { id: 'netbio', group: 'biology', name_en: 'Network biology', name_es: 'Biología de redes' },
    { id: 'chem', group: 'chemistry', name_en: 'Cheminformatics', name_es: 'Quimioinformática' },
    { id: 'prior', group: 'chemistry', name_en: 'Compound prioritisation', name_es: 'Priorización de compuestos' }
  ];

  /* [origin, skill, note_en, note_es] */
  var LINKS = [
    ['p1', 'segmentation', 'Segmented colonies in plate photos with CLAHE, local Sauvola thresholding and watershed splitting.', 'Segmenté colonias en fotos de placas con CLAHE, umbral local de Sauvola y separación por watershed.'],
    ['p1', 'features', 'Measured the count and area of every colony from labelled masks.', 'Medí el número y el área de cada colonia a partir de máscaras etiquetadas.'],
    ['p1', 'tests', 'Compared treatments across biological replicates with paired tests, effect sizes and FDR correction.', 'Comparé tratamientos entre réplicas biológicas con pruebas pareadas, tamaño del efecto y corrección FDR.'],
    ['p1', 'agreement', 'Benchmarked the counts against an established colony counter with Bland-Altman and Lin\'s concordance.', 'Contrasté los conteos con un contador de colonias de referencia mediante Bland-Altman y la concordancia de Lin.'],
    ['p1', 'labtools', 'Packaged the analysis as a notebook with sliders that runs in Google Colab.', 'Empaqueté el análisis en un notebook con controles deslizantes que funciona en Google Colab.'],
    ['p1', 'assays', 'Took clonogenic assays from the plate photo to the surviving fraction per condition.', 'Llevé ensayos clonogénicos desde la foto de la placa hasta la fracción de supervivencia por condición.'],

    ['p2', 'doseresp', 'Computed NCI-60 growth, GI50, TGI and LC50 by log-dose interpolation, flagging outlier replicates.', 'Calculé el crecimiento NCI-60 y GI50, TGI y LC50 por interpolación en log-dosis, marcando réplicas atípicas.'],
    ['p2', 'labtools', 'Built a Streamlit app that reads raw plate-reader exports, so anyone in the lab can run it.', 'Creé una app en Streamlit que lee la exportación del lector de placas, para que cualquiera del laboratorio la use.'],
    ['p2', 'testing', 'Stored every curve in an SQLite database and covered parsing, maths and storage with 89 pytest tests.', 'Guardé cada curva en una base de datos SQLite y cubrí lectura, cálculos y almacenamiento con 89 tests en pytest.'],
    ['p2', 'prior', 'Ranked compounds by pGI50 and selectivity index across cell lines.', 'Ordené compuestos por pGI50 e índice de selectividad entre líneas celulares.'],
    ['p2', 'assays', 'Encoded the SRB plate layout, the day-0 correction and the replicate structure of the weekly screen.', 'Codifiqué el diseño de placa del SRB, la corrección con el día 0 y la estructura de réplicas del cribado semanal.'],

    ['p3', 'segmentation', 'Segmented DAPI-stained nuclei with Otsu thresholding, morphological cleaning and watershed.', 'Segmenté núcleos teñidos con DAPI con umbral de Otsu, limpieza morfológica y watershed.'],
    ['p3', 'features', 'Extracted area, integrated DNA intensity and shape descriptors for every nucleus.', 'Extraje área, intensidad integrada de ADN y descriptores de forma de cada núcleo.'],
    ['p3', 'unsup', 'Fitted a Gaussian mixture to control DNA content, chosen by BIC, then applied it to treated cells.', 'Ajusté una mezcla de gaussianas al ADN del control, elegida por BIC, y la apliqué a las células tratadas.'],
    ['p3', 'tests', 'Compared control and treated nuclei with t-tests, Mann-Whitney and IQR outlier screening.', 'Comparé núcleos control y tratados con pruebas t, Mann-Whitney y detección de atípicos por IQR.'],
    ['p3', 'fluo', 'Acquired DAPI images at 20x and 40x and read Zeiss CZI files directly in Python.', 'Adquirí imágenes DAPI a 20x y 40x y leí los archivos CZI de Zeiss directamente en Python.'],

    ['p4', 'de', 'Ran DESeq2 on cell-line RNA-seq, then GSEA and over-representation analysis with clusterProfiler.', 'Hice DESeq2 sobre RNA-seq de líneas celulares y después GSEA y sobrerrepresentación con clusterProfiler.'],
    ['p4', 'netbio', 'Inferred signalling networks from expression changes with the COSMOS prior-knowledge network.', 'Inferí redes de señalización a partir de cambios de expresión con la red de conocimiento previo COSMOS.'],
    ['p4', 'uncert', 'Used model confidence to decide which compounds were worth sequencing.', 'Usé la confianza del modelo para decidir qué compuestos merecía la pena secuenciar.'],
    ['p4', 'pipelines', 'Took sequencing reads through quality control to count matrices before the statistics.', 'Llevé las lecturas de secuenciación desde el control de calidad hasta las matrices de conteos.'],

    ['ml', 'gnn', 'Built a graph neural network in PyTorch Geometric that learns from molecular structure.', 'Construí una red neuronal de grafos en PyTorch Geometric que aprende de la estructura molecular.'],
    ['ml', 'uncert', 'Added an estimate of how far to trust each prediction.', 'Añadí una estimación de cuánto fiarse de cada predicción.'],
    ['ml', 'explain', 'Made the model show which parts of a molecule drive each prediction.', 'Hice que el modelo muestre qué partes de la molécula pesan en cada predicción.'],
    ['ml', 'chem', 'Turned SMILES into molecular graphs with RDKit.', 'Convertí SMILES en grafos moleculares con RDKit.'],
    ['ml', 'classic', 'Compared the network against standard fingerprint baselines.', 'Comparé la red con modelos de referencia basados en fingerprints.'],

    ['net', 'pipelines', 'Wrote a per-sample Bash pipeline from SRA download through fastp trimming to Salmon quantification.', 'Escribí un pipeline en Bash por muestra, desde la descarga de SRA y el recorte con fastp hasta la cuantificación con Salmon.'],
    ['net', 'de', 'Normalised and batch-corrected many public datasets with edgeR, voom and limma.', 'Normalicé y corregí el efecto lote de muchos conjuntos públicos con edgeR, voom y limma.'],
    ['net', 'netbio', 'Inferred regulator activity and cell-cell signalling with OmniPath resources.', 'Inferí la actividad de reguladores y la comunicación entre células con recursos de OmniPath.'],
    ['net', 'unsup', 'Learned embeddings of a biological network and explored them with dimensionality reduction.', 'Aprendí embeddings de una red biológica y los exploré con reducción de dimensionalidad.'],
    ['net', 'prior', 'Scored drugs against disease signatures from public perturbation data.', 'Puntué fármacos frente a firmas de la enfermedad con datos públicos de perturbación.'],

    ['live', 'livecell', 'Analysed time-lapse imaging of treated tumour cells.', 'Analicé time-lapses de células tumorales tratadas.'],
    ['live', 'classic', 'Trained and validated classifiers on features extracted from images.', 'Entrené y validé clasificadores con rasgos extraídos de las imágenes.'],
    ['live', 'unsup', 'Explored compound responses with dimensionality reduction and clustering.', 'Exploré las respuestas a compuestos con reducción de dimensionalidad y agrupamiento.'],
    ['live', 'pipelines', 'Packaged code and trained models so the analysis can be rerun.', 'Empaqueté el código y los modelos entrenados para poder repetir el análisis.'],
    ['live', 'fluo', 'Cross-checked imaging results with an independent fluorescence assay.', 'Contrasté los resultados con un ensayo de fluorescencia independiente.'],

    ['lab', 'assays', 'Ran SRB antiproliferative screens of new compounds against panels of human solid tumour cell lines.', 'Hice cribados antiproliferativos SRB de compuestos nuevos frente a paneles de líneas tumorales humanas.'],
    ['lab', 'livecell', 'Recorded and analysed live-cell time-lapses to show how compounds kill tumour cells.', 'Grabé y analicé time-lapses de células vivas para ver cómo los compuestos matan a las células tumorales.'],
    ['lab', 'prior', 'Reported GI50 values used to compare compound series against reference drugs.', 'Aporté valores de GI50 para comparar series de compuestos con fármacos de referencia.']
  ];

  /* ── Build ─────────────────────────────────────────────────────────── */
  var oById = {}, sById = {}, gById = {};
  ORIGINS.forEach(function (o) { oById[o.id] = o; });
  SKILLS.forEach(function (s) { sById[s.id] = s; });
  GROUPS.forEach(function (g) { gById[g.id] = g; });
  var links = LINKS.map(function (l) { return { o: l[0], s: l[1], note: es ? l[3] : l[2] }; });

  root.innerHTML =
    '<svg class="smap-lines" aria-hidden="true"></svg>' +
    '<div class="smap-col smap-origins"><p class="label">' + UI.origins + '</p></div>' +
    '<div class="smap-col smap-skills"><p class="label">' + UI.skills + '</p></div>' +
    '<aside class="smap-detail" aria-live="polite"></aside>';
  var svg = root.querySelector('.smap-lines');
  var oCol = root.querySelector('.smap-origins');
  var sCol = root.querySelector('.smap-skills');
  var detail = root.querySelector('.smap-detail');
  var oEl = {}, sEl = {};

  ORIGINS.forEach(function (o) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'smap-o';
    b.innerHTML = '<span class="k">' + esc(L(o, 'kicker')) + '</span><span class="n">' + esc(L(o, 'name')) + '</span>';
    b.setAttribute('aria-pressed', 'false');
    oCol.appendChild(b);
    oEl[o.id] = b;
    wire(b, { kind: 'o', id: o.id });
  });

  GROUPS.forEach(function (g) {
    var box = document.createElement('div');
    box.className = 'smap-group';
    box.innerHTML = '<p class="g">' + esc(L(g, 'name')) + '</p>';
    SKILLS.filter(function (s) { return s.group === g.id; }).forEach(function (s) {
      var n = links.filter(function (l) { return l.s === s.id; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'smap-s';
      b.innerHTML = esc(L(s, 'name')) + '<span class="c" aria-hidden="true">' + new Array(n + 1).join('●') + '</span>';
      b.setAttribute('aria-label', L(s, 'name') + ', ' + UI.sources(n));
      b.title = UI.sources(n);
      b.setAttribute('aria-pressed', 'false');
      box.appendChild(b);
      sEl[s.id] = b;
      wire(b, { kind: 's', id: s.id });
    });
    sCol.appendChild(box);
  });

  links.forEach(function (l) {
    l.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(l.path);
  });

  /* ── Interaction ───────────────────────────────────────────────────────
     Hover (mouse only) previews; a click or tap pins the selection. The map
     opens with Problem 02 pinned, so it tells a story before anyone acts. */
  var START = { kind: 'o', id: 'p2' };
  var pinned = START, hover = null, untouched = true;

  function same(a, b) { return a && b && a.kind === b.kind && a.id === b.id; }
  function wire(el, item) {
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = item; untouched = false; apply(); } });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = null; apply(); } });
    el.addEventListener('focus', function () { hover = item; untouched = false; apply(); });
    el.addEventListener('blur', function () { hover = null; apply(); });
    el.addEventListener('click', function () { pinned = same(pinned, item) ? null : item; untouched = false; apply(); });
  }

  function apply() {
    var a = hover || pinned, relO = {}, relS = {};
    root.classList.toggle('has-focus', !!a);
    links.forEach(function (l) {
      var hot = a && ((a.kind === 'o' && l.o === a.id) || (a.kind === 's' && l.s === a.id));
      l.path.classList.toggle('hot', !!hot);
      if (hot) { relO[l.o] = 1; relS[l.s] = 1; }
    });
    Object.keys(oEl).forEach(function (id) {
      oEl[id].classList.toggle('on', !!a && a.kind === 'o' && a.id === id);
      oEl[id].classList.toggle('rel', !!relO[id]);
      oEl[id].setAttribute('aria-pressed', same(pinned, { kind: 'o', id: id }));
    });
    Object.keys(sEl).forEach(function (id) {
      sEl[id].classList.toggle('on', !!a && a.kind === 's' && a.id === id);
      sEl[id].classList.toggle('rel', !!relS[id]);
      sEl[id].setAttribute('aria-pressed', same(pinned, { kind: 's', id: id }));
    });
    renderDetail(a);
  }

  function renderDetail(a) {
    if (!a) {
      detail.innerHTML = '<p class="smap-hint">' + UI.hint + '</p><p class="mono">' +
        UI.count(ORIGINS.length, SKILLS.length, links.length) + '</p>';
      return;
    }
    var html, mine;
    var intro = untouched && same(a, START) ? '<p class="smap-example">' + UI.example + '</p>' : '';
    if (a.kind === 'o') {
      var o = oById[a.id];
      mine = links.filter(function (l) { return l.o === a.id; });
      html = intro + '<p class="label">' + esc(L(o, 'kicker')) + '</p><h3>' + esc(L(o, 'name')) + '</h3><dl>' +
        mine.map(function (l) { return '<dt>' + esc(L(sById[l.s], 'name')) + '</dt><dd>' + esc(l.note) + '</dd>'; }).join('') + '</dl>';
      if (o.href) html += '<a class="smap-go" href="' + o.href + '">' + (o.id === 'lab' ? UI.papers : UI.see) + '</a>';
    } else {
      var s = sById[a.id];
      mine = links.filter(function (l) { return l.s === a.id; });
      html = '<p class="label">' + esc(L(gById[s.group], 'name')) + '</p><h3>' + esc(L(s, 'name')) + '</h3>' +
        '<p class="smap-from">' + UI.from + '</p><dl>' +
        mine.map(function (l) { return '<dt>' + esc(L(oById[l.o], 'name')) + '</dt><dd>' + esc(l.note) + '</dd>'; }).join('') + '</dl>';
    }
    detail.innerHTML = html;
  }

  /* ── Lines ─────────────────────────────────────────────────────────────
     Curves from the right edge of each source to the left edge of each
     skill, measured from the live layout. Hidden on narrow screens. */
  function draw() {
    if (getComputedStyle(svg).display === 'none') return;
    var box = root.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + box.width.toFixed(0) + ' ' + box.height.toFixed(0));
    links.forEach(function (l) {
      var a = oEl[l.o].getBoundingClientRect(), b = sEl[l.s].getBoundingClientRect();
      var x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
      var x2 = b.left - box.left - 4, y2 = b.top + b.height / 2 - box.top;
      var dx = (x2 - x1) * .55;
      l.path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
    });
  }

  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(root);
  window.addEventListener('resize', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  apply();
  draw();
})();
