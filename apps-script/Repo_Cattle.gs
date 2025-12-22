/************************************
 * REPOSITORY - CATTLE (MASTER & ORIGINS)
 * Matches Schema v1.1 - FIXED APPEND LOGIC
 ************************************/

function findSheet_(partialName) {
  var ss = SpreadsheetApp.getActive();
  var sheets = ss.getSheets();
  var target = partialName.toLowerCase().replace(/[^a-z0-9]/g, ""); 
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase().replace(/[^a-z0-9]/g, "").includes(target)) return sheets[i];
  }
  return null;
}

function getMasterSheet_() { return findSheet_("cattlemaster") || findSheet_("master"); }
function getOriginsSheet_() { return findSheet_("cattleorigins") || findSheet_("origins"); }
function getNewBornSheet_() { return findSheet_("birthlog") || findSheet_("newborn"); }

function getSheetHeaderMap_(sheet) {
  if (!sheet) return {};
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function(h, i) {
    if (h) {
      var clean = String(h).toLowerCase().trim().replace(/\s+/g, "_");
      map[clean] = i;
      map[String(h).toLowerCase().trim()] = i; 
    }
  });
  return map;
}

/**
 * 🛠️ SMART APPEND: Finds the true last row with text, ignoring empty formatted rows.
 */
function smartAppend_(sheet, rowData) {
  // 1. Get all data in Column A (assuming Internal ID is never empty)
  // We grab up to the last "technically used" row to scan it.
  var lastTechRow = sheet.getLastRow();
  var trueLastRow = 1; // Default to 1 (Header row)

  if (lastTechRow > 1) {
    var colA = sheet.getRange(1, 1, lastTechRow, 1).getValues();
    // Scan backwards to find the first non-empty cell
    for (var i = colA.length - 1; i >= 0; i--) {
      if (colA[i][0] !== "" && colA[i][0] != null) {
        trueLastRow = i + 1; // Convert 0-based index to 1-based row
        break;
      }
    }
  }

  // 2. Write data to the very next row
  sheet.getRange(trueLastRow + 1, 1, 1, rowData.length).setValues([rowData]);
}

// --- MAIN ACTIONS ---

function getCattle_() {
  const sheet = getMasterSheet_();
  if (!sheet) return jsonResponse_({ success: true, data: [] });
  const map = getSheetHeaderMap_(sheet);
  const data = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues().map(row => ({
      id: row[map["internal_id"]] || row[map["id"]],
      tagNumber: row[map["tag_number"]],
      govtId: row[map["govt_uid"]],
      name: row[map["cattle_name"]],
      status: row[map["status"]]
  }));
  return jsonResponse_({ success: true, data }); 
}

function getActiveCattle_() {
  const sheet = getMasterSheet_();
  if (!sheet) return jsonResponse_({ success: true, data: [] });
  const map = getSheetHeaderMap_(sheet);
  const data = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues()
    .filter(row => String(row[map["status"]]).toLowerCase() === 'active')
    .map(row => ({
      id: row[map["internal_id"]],
      tagNumber: row[map["tag_number"]],
      name: row[map["cattle_name"]],
      breed: row[map["breed"]],
      gender: row[map["gender"]],
      category: row[map["category"]],
      shedId: row[map["shed_id"]],
      status: "Active"
    }));
  return jsonResponse_({ success: true, data });
}

function addCattle_(payload) {
  try {
    const masterSheet = getMasterSheet_();
    if (!masterSheet) throw new Error("CRITICAL: 'cattle_master' sheet not found.");
    
    // --- ID LOGIC ---
    const map = getSheetHeaderMap_(masterSheet);
    let maxId = 0;
    let idIdx = map["internal_id"] !== undefined ? map["internal_id"] : (map["id"] !== undefined ? map["id"] : 0);
    
    if (masterSheet.getLastRow() > 1) {
      const ids = masterSheet.getRange(2, idIdx + 1, masterSheet.getLastRow() - 1, 1).getValues();
      ids.forEach(r => {
        let numericPart = String(r[0]).replace(/[^0-9]/g, '');
        if (numericPart) {
          let val = parseInt(numericPart, 10);
          if (val > maxId) maxId = val;
        }
      });
    }
    const finalId = "RPCAT" + String(maxId + 1).padStart(4, '0');

    // --- SAVE TO MASTER ---
    const row = new Array(masterSheet.getLastColumn()).fill('');
    const set = (arr, m, keys, val) => {
      if (val === undefined || val === null) return;
      for (let k of keys) { if (m[k] !== undefined) { arr[m[k]] = val; return; } }
    };

    set(row, map, ["internal_id", "id"], finalId);
    set(row, map, ["tag_number"], payload.tagNumber);
    set(row, map, ["govt_uid"], payload.govtId);
    set(row, map, ["prev_tag_numbers"], payload.prevTags);
    set(row, map, ["cattle_name"], payload.name);
    set(row, map, ["gender"], payload.gender);
    set(row, map, ["category"], payload.category);
    set(row, map, ["breed"], payload.breed);
    set(row, map, ["color", "colour"], payload.color);
    set(row, map, ["dob"], parseIsoDateToDate_(payload.dob));
    set(row, map, ["shed_id"], payload.shedId);
    set(row, map, ["status"], "Active");
    set(row, map, ["adoption_status"], payload.adoptionStatus);
    set(row, map, ["is_disabled"], payload.isDisabled);
    set(row, map, ["disability_details"], payload.disabilityDetails);
    set(row, map, ["remarks"], payload.remarks);

    smartAppend_(masterSheet, row); // Uses new Smart Append

    // --- SAVE TO ORIGINS ---
    let debugMsg = "";
    const originSheet = getOriginsSheet_();
    
    if (originSheet) {
      const oMap = getSheetHeaderMap_(originSheet);
      const oRow = new Array(originSheet.getLastColumn()).fill('');

      set(oRow, oMap, ["internal_id"], finalId);
      set(oRow, oMap, ["admission_date"], parseIsoDateToDate_(payload.admissionDate));
      set(oRow, oMap, ["admission_type"], payload.admissionType);
      set(oRow, oMap, ["source_party_name", "source_name"], payload.sourceName);
      set(oRow, oMap, ["source_party_address", "source_address"], payload.sourceAddress);
      set(oRow, oMap, ["source_party_mobile", "source_mobile"], payload.sourceMobile);
      set(oRow, oMap, ["admission_weight", "weight"], payload.weight);
      set(oRow, oMap, ["purchase_price", "price"], payload.price);
      set(oRow, oMap, ["admission_age_months", "age"], payload.ageMonths);
      
      smartAppend_(originSheet, oRow); // Uses new Smart Append
      
      debugMsg = `\n[Origins Saved]\nSource: ${payload.sourceName}`;
    } else {
      debugMsg = "\n[WARNING: Origins Sheet Missing]";
    }

    return jsonSuccess_({ success: true, id: finalId, message: "Registered " + finalId + debugMsg });
  } catch (err) {
    return jsonResponse_({ success: false, error: err.toString() });
  }
}

function toIsoDateString_(d) { return d && d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd") : ""; }
function parseIsoDateToDate_(d) { return d ? new Date(d) : null; }
function getNewBorn_(e) { return jsonResponse_({ success: true, data: [] }); }
function jsonResponse_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonSuccess_(obj) { return jsonResponse_(obj); }