// ACT Form 25MC3 Autograder — Wildewood Education
// Paste this entire file into Tools > Script Editor in your Google Sheet

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
// RAW → SCALED CONVERSION TABLES (index = raw score)
// ============================================================

var SCORE_TABLES = {
  english: [1,2,4,5,6,7,8,9,10,10,10,11,12,13,14,15,15,16,17,18,19,20,21,21,22,22,23,24,24,25,26,27,28,29,30,32,34,34,35,35,36],
  math:    [1,4,7,9,11,12,13,13,14,14,14,14,15,15,15,16,16,17,17,17,18,18,19,20,21,22,24,25,26,26,27,28,29,30,31,33,34,34,35,35,36,36],
  reading: [1,2,4,6,7,9,10,11,11,13,14,15,17,18,19,21,22,23,24,24,25,27,28,29,31,33,35,36],
  science: [1,3,5,7,9,10,11,11,12,13,15,16,16,17,18,19,20,21,22,22,23,24,24,25,25,26,27,28,29,30,31,33,34,35,36]
};

// ============================================================
// COLORS
// ============================================================

var C = {
  forestGreen: '#2D5016',
  sage:        '#8AAD6E',
  white:       '#FFFFFF',
  lightGray:   '#F5F5F5',
  red:         '#CC0000',
  lightRed:    '#FFEBEE',
  lightGreen:  '#E8F5E9',
  rowAlt:      '#F2F7EE',
  subhead:     '#F0F0F0'
};

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

// ============================================================
// SETUP SHEET
// ============================================================

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ---- Remove any leftover protections from a previous run ----
  removeAllProtections(ss);

  // ---- ANSWER_KEY tab (hidden) ----
  var akSheet = ss.getSheetByName('ANSWER_KEY') || ss.insertSheet('ANSWER_KEY');
  akSheet.clearContents();
  var akData = [['Section','Question','Correct Answer','Scored']];
  ['english','math','reading','science'].forEach(function(sec) {
    var key = ANSWER_KEYS[sec];
    for (var q = 1; q <= key.total; q++) {
      akData.push([
        sec.charAt(0).toUpperCase() + sec.slice(1),
        q,
        key.answers[q] || '',
        key.notScored.indexOf(q) === -1 ? 'Yes' : 'No'
      ]);
    }
  });
  akSheet.getRange(1, 1, akData.length, 4).setValues(akData);
  akSheet.hideSheet();

  // ---- ANSWER SHEET tab ----
  var ans = ss.getSheetByName('Answer Sheet') || ss.insertSheet('Answer Sheet', 0);
  ans.clearContents();
  ans.clearFormats();
  ans.clearConditionalFormatRules();

  // Column widths: A-H, no spacers per spec
  [1,2,3,4,5,6,7,8].forEach(function(col) {
    ans.setColumnWidth(col, col % 2 === 1 ? 48 : 90);
  });

  // Section headers row 1 (merged pairs)
  var sectionLabels = ['ENGLISH','MATH','READING','SCIENCE'];
  var sectionCols   = [1, 3, 5, 7]; // A, C, E, G
  sectionLabels.forEach(function(label, i) {
    var col = sectionCols[i];
    ans.getRange(1, col, 1, 2).merge()
      .setValue(label)
      .setBackground(C.forestGreen)
      .setFontColor(C.white)
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('center');
  });
  ans.setRowHeight(1, 32);

  // Sub-headers row 2
  var subCols = [1,2,3,4,5,6,7,8];
  var subLabels = ['Q#','Answer','Q#','Answer','Q#','Answer','Q#','Answer'];
  subCols.forEach(function(col, i) {
    ans.getRange(2, col)
      .setValue(subLabels[i])
      .setBackground(C.sage)
      .setFontColor(C.white)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
  });
  ans.setRowHeight(2, 26);

  // Question rows (3–52, max for English=50)
  var totals = [50, 45, 36, 40]; // english, math, reading, science
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

  // Protect everything except answer columns (B, D, F, H)
  var protection = ans.protect().setDescription('Q# columns locked');
  protection.setUnprotectedRanges([
    ans.getRange('B3:B52'),
    ans.getRange('D3:D47'),
    ans.getRange('F3:F38'),
    ans.getRange('H3:H42')
  ]);

  // Conditional formatting — invalid entries → orange; apply after protecting
  buildConditionalFormatting(ans);

  // ---- SCORE REPORT tab ----
  var sr = ss.getSheetByName('Score Report') || ss.insertSheet('Score Report', 1);
  sr.clearContents();
  sr.clearFormats();
  sr.getRange('A1:F1').merge()
    .setValue('Wildewood Education — ACT Score Report')
    .setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center');
  sr.getRange('A2:F2').merge()
    .setValue('Run "Grade My Test" to generate your score report.')
    .setBackground(C.sage).setFontColor(C.white).setFontSize(10).setHorizontalAlignment('center');
  sr.setRowHeight(1, 50);
  sr.setRowHeight(2, 28);
  [180,120,180,100,100,100].forEach(function(w, i) { sr.setColumnWidth(i+1, w); });

  // Reorder: Answer Sheet first, Score Report second, ANSWER_KEY last
  ss.setActiveSheet(ans);
  ss.moveActiveSheet(1);

  SpreadsheetApp.getUi().alert(
    'Setup complete!\n\n' +
    '• Fill in answers on the "Answer Sheet" tab.\n' +
    '• Use the Wildewood ACT menu → "Grade My Test" to score.\n' +
    '• To add the "Grade My Test" button: Insert → Drawing, create a button shape, click Save, then right-click it → Assign script → type: gradeTest'
  );
}

// ============================================================
// REMOVE PROTECTIONS (clears locks from prior runs)
// ============================================================

function removeAllProtections(ss) {
  ss.getSheets().forEach(function(sheet) {
    sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(p) {
      if (p.canEdit()) p.remove();
    });
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function(p) {
      if (p.canEdit()) p.remove();
    });
  });
}

// ============================================================
// CONDITIONAL FORMATTING (invalid answer entries → orange)
// ============================================================

function buildConditionalFormatting(sheet) {
  var rules = [];

  // [answerCol, startRow, endRow, ismath]
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

    // Odd questions (Q# odd → row number odd when offset by 2, i.e. row 3=Q1, row 5=Q3...)
    // Row - 2 = Q#; Q# is odd when ROW()-2 is odd → MOD(ROW(),2)=1
    var oddFormula  = '=AND(' + c.col + c.r1 + '<>"",MOD(ROW()-2,2)=1,NOT(OR(' +
      oddValid.split(',').map(function(v){ return 'UPPER('+c.col+c.r1+')='+v; }).join(',') + ')))';
    var evenFormula = '=AND(' + c.col + c.r1 + '<>"",MOD(ROW()-2,2)=0,NOT(OR(' +
      evenValid.split(',').map(function(v){ return 'UPPER('+c.col+c.r1+')='+v; }).join(',') + ')))';

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(oddFormula)
      .setBackground('#FF6600').setFontColor(C.white)
      .setRanges([rng]).build());

    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(evenFormula)
      .setBackground('#FF6600').setFontColor(C.white)
      .setRanges([rng]).build());
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

  if (!ans || !sr) {
    SpreadsheetApp.getUi().alert('Missing sheets. Run Setup Sheet first.');
    return;
  }

  var studentAnswers = {
    english: ans.getRange('B3:B52').getValues().map(function(r){ return r[0]; }),
    math:    ans.getRange('D3:D47').getValues().map(function(r){ return r[0]; }),
    reading: ans.getRange('F3:F38').getValues().map(function(r){ return r[0]; }),
    science: ans.getRange('H3:H42').getValues().map(function(r){ return r[0]; })
  };

  var results = {};
  ['english','math','reading','science'].forEach(function(sec) {
    results[sec] = gradeSection(sec, studentAnswers[sec]);
    results[sec].scaled = rawToScaled(sec, results[sec].raw);
  });

  var composite = Math.round(
    (results.english.scaled + results.math.scaled + results.reading.scaled + results.science.scaled) / 4
  );

  buildScoreReport(sr, results, composite);
  ss.setActiveSheet(sr);
}

function gradeSection(section, studentAnswers) {
  var key    = ANSWER_KEYS[section];
  var missed = [];
  var blanks = [];
  var raw    = 0;

  for (var i = 0; i < key.total; i++) {
    var qNum    = i + 1;
    var scored  = key.notScored.indexOf(qNum) === -1;
    if (!scored) continue;

    var student = studentAnswers[i] ? String(studentAnswers[i]).trim().toUpperCase() : '';
    var correct = key.answers[qNum] ? key.answers[qNum].toUpperCase() : '';

    if (student === '') {
      blanks.push(qNum);
    } else if (student === correct) {
      raw++;
    } else {
      missed.push({ q: qNum, student: student, correct: correct });
    }
  }

  return { raw: raw, missed: missed, blanks: blanks };
}

function rawToScaled(section, raw) {
  var table = SCORE_TABLES[section];
  var idx   = Math.max(0, Math.min(raw, table.length - 1));
  return table[idx];
}

// ============================================================
// BUILD SCORE REPORT
// ============================================================

function buildScoreReport(sheet, results, composite) {
  sheet.clearContents();
  sheet.clearFormats();

  var row = 1;

  // ---- Header ----
  sheet.getRange(row, 1, 1, 6).merge()
    .setValue('Wildewood Education — ACT Score Report')
    .setBackground(C.forestGreen).setFontColor(C.white)
    .setFontWeight('bold').setFontSize(18).setHorizontalAlignment('center');
  sheet.setRowHeight(row, 50); row++;

  sheet.getRange(row, 1, 1, 6).merge()
    .setValue('ACT Practice Test  ·  Form 25MC3')
    .setBackground(C.sage).setFontColor(C.white)
    .setFontSize(11).setHorizontalAlignment('center');
  sheet.setRowHeight(row, 30); row++;

  row++; // spacer

  // ---- Composite ----
  sheet.getRange(row, 1)
    .setValue('COMPOSITE SCORE')
    .setFontSize(13).setFontWeight('bold').setFontColor(C.forestGreen);
  sheet.getRange(row, 2)
    .setValue(composite)
    .setFontSize(24).setFontWeight('bold').setFontColor(C.forestGreen).setHorizontalAlignment('center');
  sheet.getRange(row, 3)
    .setValue('/ 36')
    .setFontSize(13).setFontColor('#888888').setVerticalAlignment('middle');
  sheet.setRowHeight(row, 40); row++;

  row++; // spacer

  // ---- Section scores table ----
  var sHdr = ['Section', 'Raw Score', 'Max Raw', 'Scaled Score'];
  sHdr.forEach(function(h, i) {
    sheet.getRange(row, i + 1)
      .setValue(h)
      .setBackground(C.forestGreen).setFontColor(C.white)
      .setFontWeight('bold').setHorizontalAlignment('center');
  });
  row++;

  var sectionDefs = [
    {label:'English', key:'english', maxRaw:40},
    {label:'Math',    key:'math',    maxRaw:41},
    {label:'Reading', key:'reading', maxRaw:27},
    {label:'Science', key:'science', maxRaw:34}
  ];

  sectionDefs.forEach(function(s, idx) {
    var r  = results[s.key];
    var bg = idx % 2 === 0 ? '#F8F8F8' : C.white;
    sheet.getRange(row, 1).setValue(s.label).setBackground(bg).setFontWeight('bold');
    sheet.getRange(row, 2).setValue(r.raw).setBackground(bg).setHorizontalAlignment('center');
    sheet.getRange(row, 3).setValue(s.maxRaw).setBackground(bg).setHorizontalAlignment('center').setFontColor('#AAAAAA');
    sheet.getRange(row, 4).setValue(r.scaled).setBackground(bg).setHorizontalAlignment('center').setFontWeight('bold').setFontSize(12);
    row++;
  });

  row++; // spacer

  // ---- Missed questions per section ----
  sectionDefs.forEach(function(s) {
    var r = results[s.key];

    // Section subheader
    sheet.getRange(row, 1, 1, 6).merge()
      .setValue(s.label + '  —  Missed Questions')
      .setBackground(C.sage).setFontColor(C.white)
      .setFontWeight('bold').setFontSize(11);
    sheet.setRowHeight(row, 28); row++;

    if (r.missed.length === 0 && r.blanks.length === 0) {
      sheet.getRange(row, 1, 1, 4).merge()
        .setValue('✓  No missed or blank questions!')
        .setFontColor(C.forestGreen).setFontWeight('bold').setFontStyle('normal');
      row++;
    } else {
      if (r.missed.length > 0) {
        // Column headers
        ['Q#','Your Answer','Correct Answer'].forEach(function(h, i) {
          sheet.getRange(row, i + 1).setValue(h)
            .setBackground(C.subhead).setFontWeight('bold').setHorizontalAlignment('center');
        });
        row++;

        r.missed.forEach(function(m) {
          sheet.getRange(row, 1).setValue(m.q).setHorizontalAlignment('center');
          sheet.getRange(row, 2).setValue(m.student)
            .setBackground(C.lightRed).setFontColor(C.red)
            .setFontWeight('bold').setHorizontalAlignment('center');
          sheet.getRange(row, 3).setValue(m.correct)
            .setBackground(C.lightGreen).setFontColor(C.forestGreen)
            .setFontWeight('bold').setHorizontalAlignment('center');
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

    row++; // spacer between sections
  });

  // Auto-size
  sheet.autoResizeColumns(1, 6);
}

// ============================================================
// CLEAR STUDENT ANSWERS
// ============================================================

function clearStudentAnswers() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var ans = ss.getSheetByName('Answer Sheet');
  if (!ans) {
    SpreadsheetApp.getUi().alert('Answer Sheet not found. Run Setup Sheet first.');
    return;
  }

  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Clear All Answers', 'Erase all student answers and reset the Score Report?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  ans.getRange('B3:B52').clearContent();
  ans.getRange('D3:D47').clearContent();
  ans.getRange('F3:F38').clearContent();
  ans.getRange('H3:H42').clearContent();

  var sr = ss.getSheetByName('Score Report');
  if (sr) {
    sr.clearContents();
    sr.clearFormats();
    sr.getRange('A1:F1').merge()
      .setValue('Wildewood Education — ACT Score Report')
      .setBackground(C.forestGreen).setFontColor(C.white).setFontWeight('bold').setFontSize(16).setHorizontalAlignment('center');
    sr.getRange('A2:F2').merge()
      .setValue('Run "Grade My Test" to generate your score report.')
      .setBackground(C.sage).setFontColor(C.white).setFontSize(10).setHorizontalAlignment('center');
    sr.setRowHeight(1, 50);
    sr.setRowHeight(2, 28);
  }

  ss.setActiveSheet(ans);
  ui.alert('Done. All answers cleared.');
}
