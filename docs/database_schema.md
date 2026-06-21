# Govardhana CDMS Database Schema

## cattle_master

Purpose:
Master record for every cattle.

Key:
internal_id

Important:
tag_number contains current active tag only.

Columns:

* internal_id
* tag_number
* govt_uid
* cattle_name
* gender
* category
* breed
* color
* dob
* shed_id
* status
* adoption_status
* photo_url
* remarks

---

## tag_history

Purpose:
Maintain complete tag traceability.

Key:
history_id

Columns:

* history_id
* internal_id
* old_tag_number
* new_tag_number
* change_date
* reason
* changed_by
* remarks

---

## cattle_exit_log

Purpose:
Store exit and reactivation events.

Key:
exit_id

Includes:

* Sale
* Transfer
* Farmer Handover
* Death
* Reactivation

---

## users

Purpose:
Application users.

(Current structure to be updated during Sprint 2)

---

## milk_production

Purpose:
Daily milk production records.

(To be documented)

---

## nutrition

Purpose:
Feed and nutrition records.

(To be documented)

---

## medical_records

Purpose:
Medical treatments and health records.

(To be documented)

---

## dattu_yojana

Purpose:
Sponsorship records.

(To be documented)
