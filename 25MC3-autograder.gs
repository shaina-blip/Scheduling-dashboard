// ACT Form 25MC3 Autograder — Wildewood Education

// ============================================================
// ANSWER KEYS
// ============================================================

var ANSWER_KEYS = {
  english: {
    answers: {
      1:'D',2:'F',3:'A',4:'H',5:'D',6:'J',7:'A',8:'G',9:'C',10:'F',
      11:'D',12:'H',13:'B',14:'J',15:'B',16:'J',17:'A',18:'F',19:'A',20:'F',
      21:'A',22:'H',23:'D',24:'H',25:'A',26:'G',27:'C',28:'G',29:'C',30:'J',
      41:'A',42:'F',43:'C',44:'J',45:'D',46:'J',47:'B',48:'J',49:'D',50:'F'
    },
    notScored: [31,32,33,34,35,36,37,38,39,40],
    total: 50
  },
  math: {
    answers: {
      1:'C',2:'G',3:'D',4:'H',5:'D',6:'G',
      8:'H',9:'C',10:'G',11:'D',12:'G',13:'B',14:'F',15:'B',16:'J',
      18:'H',19:'B',20:'H',21:'A',22:'H',23:'D',24:'H',25:'B',26:'H',27:'C',
      29:'A',30:'G',31:'C',32:'H',33:'D',34:'F',35:'B',36:'F',37:'A',38:'G',
      40:'F',41:'D',42:'H',43:'B',44:'F',45:'A'
    },
    notScored: [7,17,28,39],
    total: 45
  },
  reading: {
    answers: {
      1:'C',2:'F',3:'B',4:'H',5:'A',6:'G',7:'B',8:'J',9:'B',
      19:'B',20:'G',21:'D',22:'G',23:'D',24:'H',25:'C',26:'F',27:'B',
      28:'F',29:'C',30:'G',31:'A',32:'F',33:'C',34:'G',35:'D',36:'J'
    },
    notScored: [10,11,12,13,14,15,16,17,18],
    total: 36
  },
  science: {
    answers: {
      1:'B',2:'G',3:'A',4:'J',5:'D',6:'G',7:'D',8:'F',9:'B',10:'F',
      11:'A',12:'F',13:'C',14:'G',15:'C',16:'F',
      23:'A',24:'F',25:'D',26:'H',27:'D',28:'J',29:'B',30:'H',
      31:'B',32:'F',33:'C',34:'J',35:'C',36:'H',37:'B',38:'H',39:'D',40:'H'
    },
    notScored: [17,18,19,20,21,22],
    total: 40
  }
};

// ============================================================
// QUESTION CATEGORIES (official ACT reporting categories)
// Filled by classification; report shows a breakdown when present.
// ============================================================

var CATEGORY_LABELS = {
  POW:'Production of Writing', KLA:'Knowledge of Language', CSE:'Conventions of Standard English',
  PHM:'Preparing for Higher Math', IES:'Integrating Essential Skills', MDL:'Modeling',
  KID:'Key Ideas & Details', CS:'Craft & Structure', IKI:'Integration of Knowledge & Ideas',
  IOD:'Interpretation of Data', SIN:'Scientific Investigation', EMI:'Evaluation of Models, Inferences & Results'
};

// Order in which categories appear per section
var CATEGORY_ORDER = {
  english: ['CSE','POW','KLA'],
  math:    ['PHM','IES','MDL'],
  reading: ['KID','CS','IKI'],
  science: ['IOD','SIN','EMI']
};

// Per-question category map (best-effort classification, not official ACT labels).
var QUESTION_CATEGORIES = {
  english: {
    1:'CSE',2:'CSE',3:'POW',4:'POW',5:'POW',6:'CSE',7:'CSE',8:'POW',9:'CSE',10:'POW',
    11:'CSE',12:'CSE',13:'POW',14:'CSE',15:'POW',16:'CSE',17:'KLA',18:'CSE',19:'KLA',20:'POW',
    21:'POW',22:'CSE',23:'KLA',24:'CSE',25:'POW',26:'CSE',27:'POW',28:'KLA',29:'POW',30:'POW',
    31:'KLA',32:'POW',33:'CSE',34:'POW',35:'CSE',36:'CSE',37:'CSE',38:'KLA',39:'POW',40:'POW',
    41:'CSE',42:'KLA',43:'POW',44:'CSE',45:'CSE',46:'CSE',47:'POW',48:'POW',49:'POW',50:'CSE'
  },
  math: {
    1:'PHM',2:'PHM',3:'PHM',4:'MDL',5:'PHM',6:'MDL',7:'PHM',8:'MDL',9:'PHM',10:'IES',
    11:'PHM',12:'PHM',13:'IES',14:'PHM',15:'PHM',16:'PHM',17:'IES',18:'PHM',19:'PHM',20:'IES',
    21:'PHM',22:'PHM',23:'PHM',24:'PHM',25:'PHM',26:'IES',27:'MDL',28:'PHM',29:'IES',30:'PHM',
    31:'MDL',32:'MDL',33:'PHM',34:'IES',35:'PHM',36:'PHM',37:'PHM',38:'MDL',39:'MDL',40:'PHM',
    41:'MDL',42:'PHM',43:'PHM',44:'PHM',45:'PHM'
  },
  reading: {
    1:'CS',2:'KID',3:'KID',4:'CS',5:'KID',6:'CS',7:'KID',8:'CS',9:'CS',10:'KID',
    11:'CS',12:'KID',13:'KID',14:'KID',15:'CS',16:'IKI',17:'IKI',18:'IKI',19:'CS',20:'KID',
    21:'CS',22:'KID',23:'CS',24:'KID',25:'KID',26:'CS',27:'CS',28:'CS',29:'KID',30:'KID',
    31:'KID',32:'KID',33:'CS',34:'KID',35:'KID',36:'KID'
  },
  science: {
    1:'IOD',2:'IOD',3:'IOD',4:'IOD',5:'EMI',6:'IOD',7:'SIN',8:'EMI',9:'SIN',10:'SIN',
    11:'EMI',12:'IOD',13:'IOD',14:'EMI',15:'IOD',16:'IOD',17:'IOD',18:'SIN',19:'SIN',20:'IOD',
    21:'EMI',22:'EMI',23:'EMI',24:'EMI',25:'EMI',26:'EMI',27:'EMI',28:'EMI',29:'IOD',30:'SIN',
    31:'IOD',32:'IOD',33:'SIN',34:'EMI',35:'IOD',36:'EMI',37:'IOD',38:'EMI',39:'EMI',40:'IOD'
  }
};

// ============================================================
// RAW → SCALED CONVERSION TABLES (index = raw score)
// ============================================================

var SCORE_TABLES = {
  english: [1,2,4,5,6,7,8,9,10,10,10,11,12,13,14,15,15,16,17,18,19,20,21,21,22,22,23,24,24,25,26,27,28,29,30,32,34,34,35,35,36],
  math:    [1,4,7,9,11,12,13,13,14,14,14,14,15,15,15,16,16,17,17,17,18,18,19,20,21,22,24,25,26,26,27,28,29,30,31,33,34,34,35,35,36,36],
  reading: [1,2,4,6,7,9,10,11,11,13,14,15,17,18,19,21,22,23,24,24,25,27,28,29,31,33,35,36],
  science: [1,3,5,7,9,10,11,11,12,13,15,16,16,17,18,19,20,21,22,22,23,24,24,25,25,26,27,28,29,30,31,33,34,35,36]
};

// ============================================================
// COLORS & SETUP-PAGE CONFIG
// ============================================================

var C = {
  forestGreen: '#2D5016',
  sage:        '#8AAD6E',
  white:       '#FFFFFF',
  red:         '#CC0000',
  lightRed:    '#FFEBEE',
  lightGreen:  '#E8F5E9',
  rowAlt:      '#F2F7EE',
  subhead:     '#F0F0F0'
};

var SETUP_TAB    = 'Setup Page';
var NAME_CELL    = 'C4';
var DATE_CELL    = 'C5';
var SCIENCE_CELL = 'C6'; // checkbox: TRUE = taking Science

// ============================================================
// MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wildewood ACT')
    .addItem('Grade My Test', 'gradeTest')
    .addSeparator()
    .addItem('Clear Student Answers', 'clearStudentAnswers')
    .addSeparator()
    .addItem('Setup Sheet (first run only)', 'setupSheet')
    .addToUi();
}

// Auto-adjust the Answer Sheet when the Science checkbox is toggled.
function onEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== SETUP_TAB) return;
  if (e.range.getA1Notation() !== SCIENCE_CELL) return;
  applyVersion(e.range.getValue() === true);
}

function applyVersion(includeScience) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ans = ss.getSheetByName('Answer Sheet');
  if (!ans) return;
  if (includeScience) ans.showColumns(7, 2);   // columns G, H
  else ans.hideColumns(7, 2);
}

function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sp = ss.getSheetByName(SETUP_TAB);
  if (!sp) return { name:'', date:'', science:true };
  var sci = sp.getRange(SCIENCE_CELL).getValue();
  return {
    name: sp.getRange(NAME_CELL).getValue(),
    date: sp.getRange(DATE_CELL).getValue(),
    science: sci === true || sci === 'TRUE'
  };
}

// ============================================================
// SETUP SHEET
// ============================================================

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  removeAllProtections(ss);

  // ---- ANSWER_KEY tab (hidden) ----
  var akSheet = ss.getSheetByName('ANSWER_KEY') || ss.insertSheet('ANSWER_KEY');
  akSheet.clearContents();
  var akData = [['Section','Question','Correct Answer','Category','Scored']];
  ['english','math','reading','science'].forEach(function(sec) {
    var key = ANSWER_KEYS[sec];
    for (var q = 1; q <= key.total; q++) {
      akData.push([
        sec.charAt(0).toUpperCase() + sec.slice(1), q,
        key.answers[q] || '',
        (QUESTION_CATEGORIES[sec] && QUESTION_CATEGORIES[sec][q]) || '',
        key.notScored.indexOf(q) === -1 ? 'Yes' : 'No'
      ]);
    }
  });
  akSheet.getRange(1, 1, akData.length, 5).setValues(akData);
  akSheet.hideSheet();

  // ---- SETUP PAGE tab ----
  createSetupPage(ss);

  // ---- ANSWER SHEET tab ----
  var ans = ss.getSheetByName('Answer Sheet') || ss.insertSheet('Answer Sheet');
  ans.getRange(1, 1, ans.getMaxRows(), ans.getMaxColumns()).breakApart();
  ans.clearContents();
  ans.clearFormats();
  ans.clearConditionalFormatRules();
  ans.showColumns(7, 2);

  [1,2,3,4,5,6,7,8].forEach(function(col) {
    ans.setColumnWidth(col, col % 2 === 1 ? 48 : 90);
  });

  var sectionLabels = ['ENGLISH','MATH','READING','SCIENCE'];
  var sectionCols   = [1, 3, 5, 7];
  sectionLabels.forEach(function(label, i) {
    ans.getRange(1, sectionCols[i], 1, 2).merge()
      .setValue(label).setBackground(C.forestGreen).setFontColor(C.white)
      .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  });
  ans.setRowHeight(1, 32);

  var subLabels = ['Q#','Answer','Q#','Answer','Q#','Answer','Q#','Answer'];
  [1,2,3,4,5,6,7,8].forEach(function(col, i) {
    ans.getRange(2, col).setValue(subLabels[i])
      .setBackground(C.sage).setFontColor(C.white)
      .setFontWeight('bold').setHorizontalAlignment('center');
  });
  ans.setRowHeight(2, 26);

  var totals = [50, 45, 36, 40];
  for (var i = 1; i <= 50; i++) {
    var row = i + 2;
    var bg = (i % 2 === 0) ? C.rowAlt : C.white;
    sectionCols.forEach(function(col, si) {
      if (i <= totals[si]) {
        ans.getRange(row, col).setValue(i).setHorizontalAlignment('center').setBackground(bg).setFontColor('#444444');
        ans.getRange(row, col + 1).setBackground(bg).setHorizontalAlignment('center').setFontSize(11);
      }
    });
    ans.setRowHeight(row, 22);
  }

  buildConditionalFormatting(ans);
  addDirectionsBox(ans);

  // ---- SCORE REPORT tab ----
  var sr = ss.getSheetByName('Score Report') || ss.insertSheet('Score Report');
  resetScoreReport(sr);
  [180,120,180,100,100,100].forEach(function(w, i) { sr.setColumnWidth(i+1, w); });

  // ---- Order tabs: Setup Page, Answer Sheet, Score Report ----
  ss.setActiveSheet(ss.getSheetByName(SETUP_TAB)); ss.moveActiveSheet(1);
  ss.setActiveSheet(ans); ss.moveActiveSheet(2);
  ss.setActiveSheet(sr); ss.moveActiveSheet(3);

  // Apply current version selection
  applyVersion(getSettings().science);

  ss.setActiveSheet(ss.getSheetByName(SETUP_TAB));
  SpreadsheetApp.getUi().alert(
    'Setup complete!\n\n' +
    '1. On the "Setup Page" tab, enter the student name and choose whether Science is included.\n' +
    '2. Fill in answers on the "Answer Sheet" tab.\n' +
    '3. Click  Wildewood ACT ▸ Grade My Test  (or the button) to score.\n' +
    '4. Open the "Score Report" tab and download as PDF.\n\n' +
    'Button: Insert ▸ Drawing → make a button → Save → right-click → Assign script → gradeTest'
  );
}

// ============================================================
// SETUP PAGE
// ============================================================

function createSetupPage(ss) {
  var sp = ss.getSheetByName(SETUP_TAB) || ss.insertSheet(SETUP_TAB);
  sp.getRange(1, 1, sp.getMaxRows(), sp.getMaxColumns()).breakApart();
  sp.clearContents();
  sp.clearFormats();
  sp.setColumnWidth(1, 24);
  sp.setColumnWidth(2, 190);
  sp.setColumnWidth(3, 220);
  sp.setColumnWidth(4, 24);

  // Title
  sp.getRange('B2:C2').merge()
    .setValue('Wildewood Education — ACT Setup')
    .setBackground(C.forestGreen).setFontColor(C.white)
    .setFontWeight('bold').setFontSize(15).setHorizontalAlignment('center');
  sp.setRowHeight(2, 40);

  // Fields
  sp.getRange('B4').setValue('Student Name:').setFontWeight('bold').setHorizontalAlignment('right');
  sp.getRange(NAME_CELL).setBackground('#FFFDE7').setBorder(true,true,true,true,false,false);

  sp.getRange('B5').setValue('Test Date:').setFontWeight('bold').setHorizontalAlignment('right');
  sp.getRange(DATE_CELL).setBackground('#FFFDE7').setBorder(true,true,true,true,false,false);

  sp.getRange('B6').setValue('Taking the Science section?').setFontWeight('bold').setHorizontalAlignment('right');
  sp.getRange(SCIENCE_CELL).insertCheckboxes();
  sp.getRange(SCIENCE_CELL).setValue(true);

  [4,5,6].forEach(function(r){ sp.setRowHeight(r, 28); });

  // Helper note
  sp.getRange('B8:C12').merge()
    .setValue(
      'How this works:\n\n' +
      '• Type the student\'s name above — it appears on the Score Report.\n\n' +
      '• Check the box if you ARE taking the optional Science section. ' +
      'Uncheck it to take the core test only (English, Math, Reading).\n\n' +
      '• Toggling the box automatically shows or hides the Science columns ' +
      'on the Answer Sheet.\n\n' +
      'Note: Your Composite is the average of English, Math, and Reading. ' +
      'Science is reported separately (plus a STEM score with Math).')
    .setBackground(C.rowAlt).setFontColor('#2D2D2D').setFontSize(11)
    .setVerticalAlignment('top').setWrap(true)
    .setBorder(true,true,true,true,false,false, C.sage, SpreadsheetApp.BorderStyle.SOLID);
  sp.setRowHeight(8, 30);

  // Hide gridlines for a cleaner look
  sp.setHiddenGridlines(true);
}

// ============================================================
// DIRECTIONS BOX (+ timing chart) on the Answer Sheet
// ============================================================

function addDirectionsBox(sheet) {
  var startCol = 10; // column J
  var endCol   = 14; // column N
  var width    = endCol - startCol + 1;

  sheet.setColumnWidth(9, 24);
  for (var c = startCol; c <= endCol; c++) sheet.setColumnWidth(c, 150);

  // Title (row 1, aligns with section headers)
  sheet.getRange(1, startCol, 1, width).merge()
    .setValue('📋  How to Fill This Out')
    .setBackground(C.forestGreen).setFontColor(C.white)
    .setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Body — vertical merge across rows 2–14 so the answer-grid rows stay short.
  var dirTop = 2, dirBot = 14;
  var directions =
    '⚠  Before you start: find a quiet space, silence your phone, and use a timer for each section (see the chart below). Take the test in one sitting if you can.\n\n' +
    '1.  Type ONE answer per question in the "Answer" column next to each number.\n\n' +
    '2.  Write the correct letter according to that question\'s answer choices. If you put a "B" when the choices are F G H J, the cell will turn ORANGE — that means fix it.\n\n' +
    '3.  Lowercase is fine — "a" counts the same as "A".\n\n' +
    '4.  Skipping one? Leave it blank. Blanks just don\'t earn a point (they\'re not marked wrong).\n\n' +
    '5.  Don\'t type in the gray "Q#" columns — those are just the question numbers.\n\n' +
    '6.  When you\'re done, hit the  Grade My Test  button.\n\n' +
    '7.  Go to the  Score Report  tab and download it as a PDF  (File ▸ Download ▸ PDF).';

  sheet.getRange(dirTop, startCol, dirBot - dirTop + 1, width).merge()
    .setValue(directions)
    .setBackground('#F2F7EE').setFontColor('#2D2D2D')
    .setFontSize(11).setHorizontalAlignment('left')
    .setVerticalAlignment('top').setWrap(true);

  sheet.getRange(1, startCol, dirBot, width)
    .setBorder(true, true, true, true, false, false, C.forestGreen, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // ---- Timing chart (rows 16+, one chart row per grid row, no height overrides) ----
  var tRow = 16;
  sheet.getRange(tRow, startCol, 1, width).merge()
    .setValue('⏱  ACT Timing  (Enhanced 2025)')
    .setBackground(C.forestGreen).setFontColor(C.white)
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

  var timing = [
    ['Section', '# Q', 'Time'],
    ['English', '50', '35 min'],
    ['Math', '45', '50 min'],
    ['☕  BREAK', '—', '10 min'],
    ['Reading', '36', '40 min'],
    ['Science (optional)', '40', '40 min'],
    ['TOTAL (with Science)', '171', '~2 hr 55 min']
  ];

  timing.forEach(function(rowVals, i) {
    var r = tRow + 1 + i;
    var isHeader = (i === 0);
    var isBreak  = (rowVals[0].indexOf('BREAK') !== -1);
    var isTotal  = (rowVals[0].indexOf('TOTAL') !== -1);

    sheet.getRange(r, startCol, 1, 2).merge().setValue(rowVals[0]).setHorizontalAlignment('left');
    sheet.getRange(r, startCol + 2).setValue(rowVals[1]).setHorizontalAlignment('center');
    sheet.getRange(r, startCol + 3, 1, 2).merge().setValue(rowVals[2]).setHorizontalAlignment('center');

    var rng = sheet.getRange(r, startCol, 1, width);
    if (isHeader)      rng.setBackground(C.sage).setFontColor(C.white).setFontWeight('bold');
    else if (isBreak)  rng.setBackground('#FFF4D6').setFontColor('#7A5C00').setFontStyle('italic');
    else if (isTotal)  rng.setBackground('#E8F0E0').setFontColor(C.forestGreen).setFontWeight('bold');
    else               rng.setBackground(i % 2 === 0 ? '#FFFFFF' : '#F7FAF3');
  });

  sheet.getRange(tRow, startCol, timing.length + 1, width)
    .setBorder(true, true, true, true, true, false, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);

  var noteRow = tRow + timing.length + 1;
  sheet.getRange(noteRow, startCol, 1, width).merge()
    .setValue('Break comes after Math. Science is optional — set it on the Setup Page tab.')
    .setFontSize(9).setFontColor('#888888').setFontStyle('italic').setWrap(true);
}

// ============================================================
// REMOVE PROTECTIONS
// ============================================================

function removeAllProtections(ss) {
  ss.getSheets().forEach(function(sheet) {
    [SpreadsheetApp.ProtectionType.RANGE, SpreadsheetApp.ProtectionType.SHEET].forEach(function(type) {
      sheet.getProtections(type).forEach(function(p) {
        try { p.remove(); } catch (e) {}
      });
    });
  });
}

// ============================================================
// CONDITIONAL FORMATTING (invalid answer entries → orange)
// ============================================================

function buildConditionalFormatting(sheet) {
  var rules = [];
  var cols = [
    {col:'B', r1:3, r2:52, math:false},
    {col:'D', r1:3, r2:47, math:true},
    {col:'F', r1:3, r2:38, math:false},
    {col:'H', r1:3, r2:42, math:false}
  ];
  cols.forEach(function(c) {
    var rng = sheet.getRange(c.col + c.r1 + ':' + c.col + c.r2);
    var oddValid  = c.math ? '"A","B","C","D","E"' : '"A","B","C","D"';
    var evenValid = c.math ? '"F","G","H","J","K"' : '"F","G","H","J"';
    var oddFormula  = '=AND(' + c.col + c.r1 + '<>"",MOD(ROW()-2,2)=1,NOT(OR(' +
      oddValid.split(',').map(function(v){ return 'UPPER('+c.col+c.r1+')='+v; }).join(',') + ')))';
    var evenFormula = '=AND(' + c.col + c.r1 + '<>"",MOD(ROW()-2,2)=0,NOT(OR(' +
      evenValid.split(',').map(function(v){ return 'UPPER('+c.col+c.r1+')='+v; }).join(',') + ')))';
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(oddFormula)
      .setBackground('#FF6600').setFontColor(C.white).setRanges([rng]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(evenFormula)
      .setBackground('#FF6600').setFontColor(C.white).setRanges([rng]).build());
  });
  sheet.setConditionalFormatRules(rules);
}

// ============================================================
// GRADE TEST
// ============================================================

function gradeTest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ans = ss.getSheetByName('Answer Sheet');
  var sr  = ss.getSheetByName('Score Report');
  if (!ans || !sr) { SpreadsheetApp.getUi().alert('Missing sheets. Run Setup Sheet first.'); return; }

  var settings = getSettings();
  var includeScience = settings.science;

  var ranges = {
    english: 'B3:B52', math: 'D3:D47', reading: 'F3:F38', science: 'H3:H42'
  };

  var sections = ['english','math','reading'];
  if (includeScience) sections.push('science');

  var results = {};
  sections.forEach(function(sec) {
    var vals = ans.getRange(ranges[sec]).getValues().map(function(r){ return r[0]; });
    results[sec] = gradeSection(sec, vals);
    results[sec].scaled = rawToScaled(sec, results[sec].raw);
  });

  var composite = Math.round((results.english.scaled + results.math.scaled + results.reading.scaled) / 3);
  var stem = includeScience ? Math.round((results.math.scaled + results.science.scaled) / 2) : null;

  buildScoreReport(sr, results, composite, stem, settings, includeScience);
  ss.setActiveSheet(sr);
}

function gradeSection(section, studentAnswers) {
  var key    = ANSWER_KEYS[section];
  var catMap = QUESTION_CATEGORIES[section] || {};
  var missed = [], blanks = [], raw = 0;
  var catTally = {}; // code -> {correct, total}

  for (var i = 0; i < key.total; i++) {
    var qNum = i + 1;
    if (key.notScored.indexOf(qNum) !== -1) continue;

    var student = studentAnswers[i] ? String(studentAnswers[i]).trim().toUpperCase() : '';
    var correct = key.answers[qNum] ? key.answers[qNum].toUpperCase() : '';
    var isCorrect = (student !== '' && student === correct);

    if (student === '') blanks.push(qNum);
    else if (isCorrect) raw++;
    else missed.push({ q: qNum, student: student, correct: correct });

    var cat = catMap[qNum];
    if (cat) {
      if (!catTally[cat]) catTally[cat] = { correct: 0, total: 0 };
      catTally[cat].total++;
      if (isCorrect) catTally[cat].correct++;
    }
  }
  return { raw: raw, missed: missed, blanks: blanks, catTally: catTally };
}

function rawToScaled(section, raw) {
  var table = SCORE_TABLES[section];
  return table[Math.max(0, Math.min(raw, table.length - 1))];
}

// ============================================================
// SCORE REPORT
// ============================================================

function resetScoreReport(sheet) {
  sheet.clearContents();
  sheet.clearFormats();
  sheet.getRange('A1:F1').merge()
    .setValue('Wildewood Education — ACT Score Report')
    .setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center');
  sheet.getRange('A2:F2').merge()
    .setValue('Run "Grade My Test" to generate your score report.')
    .setBackground(C.sage).setFontColor(C.white).setFontSize(10).setHorizontalAlignment('center');
  sheet.setRowHeight(1, 50);
  sheet.setRowHeight(2, 28);
}

function buildScoreReport(sheet, results, composite, stem, settings, includeScience) {
  sheet.clearContents();
  sheet.clearFormats();
  var row = 1;

  // Header
  sheet.getRange(row, 1, 1, 6).merge()
    .setValue('Wildewood Education — ACT Score Report')
    .setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setFontSize(18).setHorizontalAlignment('center');
  sheet.setRowHeight(row, 50); row++;

  var sub = 'ACT Practice Test  ·  Form 25MC3';
  if (settings && settings.name) sub = settings.name + '   ·   ' + sub;
  if (settings && settings.date) sub += '   ·   ' + settings.date;
  sheet.getRange(row, 1, 1, 6).merge()
    .setValue(sub)
    .setBackground(C.sage).setFontColor(C.white).setFontSize(11).setHorizontalAlignment('center');
  sheet.setRowHeight(row, 30); row++;
  row++;

  // Composite
  sheet.getRange(row, 1).setValue('COMPOSITE SCORE').setFontSize(13).setFontWeight('bold').setFontColor(C.forestGreen);
  sheet.getRange(row, 2).setValue(composite).setFontSize(24).setFontWeight('bold').setFontColor(C.forestGreen).setHorizontalAlignment('center');
  sheet.getRange(row, 3).setValue('/ 36').setFontSize(13).setFontColor('#888888').setVerticalAlignment('middle');
  sheet.setRowHeight(row, 40); row++;
  sheet.getRange(row, 1, 1, 6).merge()
    .setValue('Composite = average of English, Math, and Reading (Enhanced ACT).')
    .setFontSize(9).setFontColor('#888888').setFontStyle('italic');
  row++;
  if (includeScience && stem !== null) {
    sheet.getRange(row, 1).setValue('STEM Score').setFontWeight('bold').setFontColor(C.forestGreen);
    sheet.getRange(row, 2).setValue(stem).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(row, 3, 1, 4).merge().setValue('(average of Math + Science)').setFontSize(9).setFontColor('#888888').setFontStyle('italic');
    row++;
  }
  row++;

  // Section scores table
  ['Section','Raw Score','Max Raw','Scaled Score'].forEach(function(h, i) {
    sheet.getRange(row, i + 1).setValue(h).setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setHorizontalAlignment('center');
  });
  row++;

  var sectionDefs = [
    {label:'English', key:'english', maxRaw:40},
    {label:'Math', key:'math', maxRaw:41},
    {label:'Reading', key:'reading', maxRaw:27},
    {label:'Science (separate)', key:'science', maxRaw:34}
  ];
  var shown = sectionDefs.filter(function(s){ return results[s.key]; });
  shown.forEach(function(s, idx) {
    var r = results[s.key];
    var bg = idx % 2 === 0 ? '#F8F8F8' : C.white;
    sheet.getRange(row, 1).setValue(s.label).setBackground(bg).setFontWeight('bold');
    sheet.getRange(row, 2).setValue(r.raw).setBackground(bg).setHorizontalAlignment('center');
    sheet.getRange(row, 3).setValue(s.maxRaw).setBackground(bg).setHorizontalAlignment('center').setFontColor('#AAAAAA');
    sheet.getRange(row, 4).setValue(r.scaled).setBackground(bg).setHorizontalAlignment('center').setFontWeight('bold').setFontSize(12);
    row++;
  });
  row++;

  // Category breakdown (only if categories are present)
  var hasCats = shown.some(function(s){ return Object.keys(results[s.key].catTally || {}).length > 0; });
  if (hasCats) {
    sheet.getRange(row, 1, 1, 6).merge()
      .setValue('Performance by Reporting Category')
      .setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setFontSize(12);
    sheet.setRowHeight(row, 26); row++;

    shown.forEach(function(s) {
      var tally = results[s.key].catTally || {};
      if (Object.keys(tally).length === 0) return;

      sheet.getRange(row, 1, 1, 6).merge()
        .setValue(s.label.replace(' (separate)', ''))
        .setBackground(C.sage).setFontColor(C.white).setFontWeight('bold');
      row++;

      var order = CATEGORY_ORDER[s.key] || Object.keys(tally);
      order.forEach(function(code) {
        if (!tally[code]) return;
        var t = tally[code];
        var pct = t.total ? Math.round(100 * t.correct / t.total) : 0;
        sheet.getRange(row, 1, 1, 3).merge().setValue(CATEGORY_LABELS[code] || code);
        sheet.getRange(row, 4).setValue(t.correct + ' / ' + t.total).setHorizontalAlignment('center');
        sheet.getRange(row, 5, 1, 2).merge().setValue(pct + '%').setHorizontalAlignment('center')
          .setFontColor(pct >= 75 ? C.forestGreen : (pct >= 50 ? '#B8860B' : C.red)).setFontWeight('bold');
        row++;
      });
    });
    row++;
  }

  // Missed questions per section
  shown.forEach(function(s) {
    var r = results[s.key];
    sheet.getRange(row, 1, 1, 6).merge()
      .setValue(s.label.replace(' (separate)', '') + '  —  Missed Questions')
      .setBackground(C.sage).setFontColor(C.white).setFontWeight('bold').setFontSize(11);
    sheet.setRowHeight(row, 28); row++;

    if (r.missed.length === 0 && r.blanks.length === 0) {
      sheet.getRange(row, 1, 1, 4).merge()
        .setValue('✓  No missed or blank questions!')
        .setFontColor(C.forestGreen).setFontWeight('bold');
      row++;
    } else {
      if (r.missed.length > 0) {
        ['Q#','Your Answer','Correct Answer'].forEach(function(h, i) {
          sheet.getRange(row, i + 1).setValue(h).setBackground(C.subhead).setFontWeight('bold').setHorizontalAlignment('center');
        });
        row++;
        r.missed.forEach(function(m) {
          sheet.getRange(row, 1).setValue(m.q).setHorizontalAlignment('center');
          sheet.getRange(row, 2).setValue(m.student).setBackground(C.lightRed).setFontColor(C.red).setFontWeight('bold').setHorizontalAlignment('center');
          sheet.getRange(row, 3).setValue(m.correct).setBackground(C.lightGreen).setFontColor(C.forestGreen).setFontWeight('bold').setHorizontalAlignment('center');
          row++;
        });
      }
      if (r.blanks.length > 0) {
        sheet.getRange(row, 1, 1, 5).merge()
          .setValue('Left blank: Q' + r.blanks.join(', Q'))
          .setFontColor('#888888').setFontStyle('italic');
        row++;
      }
    }
    row++;
  });

  sheet.autoResizeColumns(1, 6);
}

// ============================================================
// CLEAR STUDENT ANSWERS
// ============================================================

function clearStudentAnswers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ans = ss.getSheetByName('Answer Sheet');
  if (!ans) { SpreadsheetApp.getUi().alert('Answer Sheet not found. Run Setup Sheet first.'); return; }

  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Clear All Answers', 'Erase all student answers and reset the Score Report?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  ans.getRange('B3:B52').clearContent();
  ans.getRange('D3:D47').clearContent();
  ans.getRange('F3:F38').clearContent();
  ans.getRange('H3:H42').clearContent();

  var sr = ss.getSheetByName('Score Report');
  if (sr) resetScoreReport(sr);

  ss.setActiveSheet(ans);
  ui.alert('Done. All answers cleared.');
}
