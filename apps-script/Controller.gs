/************************************
 * CONTROLLER - HTTP HANDLERS
 ************************************/

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";
  try {
    switch (action) {
      // --- CATTLE ---
      case "getCattle":       return getCattle_();
      case "getActiveCattle": return getActiveCattle_();
      case "getCattleById":   return getCattleById_(e);
      case "getNewBorn":      return getNewBorn_(e);

      // --- DAILY OPS ---
      case "getMilkYield":    return getMilkYield_(e);
      case "getBioWaste":     return getBioWaste_(e);
      case "getFeeding":      return getFeeding_(e);

      // --- MEDICAL ---
      case "getVaccine":      return getVaccine_();
      case "getTreatments":   return getTreatments_(e);

      // --- FINANCE ---
      case "getDattuYojana":  return getDattuYojana_(e);

      // --- REPORTS ---
      case "getDeathRecords": return getDeathRecords_(e);
      case "getBirthReport":  return getBirthReport_(e);
      case "getSalesReport":  return getSalesReport_(e);
      case "getDattuReport":  return getDattuReport_(e);
      case "getMilkReport":   return getMilkReport_(e);
      case "getBioReport":    return getBioReport_(e);

      // --- USER AUTH ---
      case "login":           return loginUser_(e.parameter.email, e.parameter.password);
      case "getUsers":        return getUsers_(e);

      default:
        return ContentService.createTextOutput(JSON.stringify({success: false, error: "Invalid Action GET"}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HANDLE POST REQUESTS (Adding/Updating Data)
 */
function doPost(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "";
    
    // Parse the JSON body. 
    // Since we sent it as 'text/plain' from React, we access it via postData.contents
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    switch (action) {
      // --- CATTLE ---
      case "addCattle":       return addCattle_(body);
      case "updateCattle":    return updateCattle_(body);
      case "addNewBorn":      return addNewBorn_(body);
      case "updateNewBorn":   return updateNewBorn_(body);

      // --- DAILY OPS ---
      case "addMilkYield":    return addMilkYield_(body);
      case "updateMilkYield": return updateMilkYield_(body);
      case "addBioWaste":     return addBioWaste_(body);
      case "updateBioWaste":  return updateBioWaste_(body);
      case "addFeeding":      return addFeeding_(body);
      case "updateFeeding":   return updateFeeding_(body);

      // --- MEDICAL ---
      case "addTreatment":    return addTreatment_(body);
      case "updateTreatment": return updateTreatment_(body);

      // --- FINANCE ---
      case "addDattuYojana":  return addDattuYojana_(body);
      case "updateDattuYojana": return updateDattuYojana_(body);

      // --- USERS ---
      case "addUser":         return addUser_(body);
      case "updateUser":      return updateUser_(body);

      default:
        return ContentService.createTextOutput(JSON.stringify({success: false, error: "Invalid Action POST"}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 🛠️ DIAGNOSTIC TOOL
 * Run this function directly in the editor to test cattle_origins
 */
function debugOriginsConnection() {
  var sheet = getOriginsSheet_();
  
  if (!sheet) {
    Logger.log("❌ FAILURE: Could not find any sheet named 'cattle_origins' or 'origins'.");
    Logger.log("   ACTION: Please rename your sheet tab to exactly 'cattle_origins'.");
    return;
  }
  
  Logger.log("✅ SUCCESS: Found sheet named: " + sheet.getName());
  
  var map = getSheetHeaderMap_(sheet);
  Logger.log("   Headers detected in Row 1: " + Object.keys(map).join(", "));
  
  // Test finding a specific column
  if (map["source_party_name"] !== undefined) {
    Logger.log("✅ Column 'source_party_name' found at index " + map["source_party_name"]);
  } else {
    Logger.log("❌ FAILURE: Could not find header 'source_party_name'.");
    Logger.log("   ACTION: Check if cell E1 contains 'source_party_name'.");
  }
}