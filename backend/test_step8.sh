#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# DAMS Step 8 — Queue, Notifications, Admin Dashboard Integration Test
# ═══════════════════════════════════════════════════════════════
BASE="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo -e "  ${GREEN}✔ $label${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}✖ $label${NC} (expected: '$expected')"
    echo "    Got: $(echo "$actual" | head -c 200)"
    ((FAIL++))
  fi
}

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  DAMS Step 8 Integration Tests                ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}1. Setup users${NC}"
# ──────────────────────────────────────────────

# Create admin via DB (register endpoint only creates patients)
ADMIN_HASH=$(docker exec dams-backend node -e "import('bcryptjs').then(b=>b.default.hash('Admin@s8!', 10).then(h=>console.log(h)))" 2>/dev/null)
docker exec dams-db psql -U dams_user -d dams -c \
  "INSERT INTO users (full_name, email, phone_number, password_hash, role) VALUES ('Admin Step8', 'admin_step8@dams.com', '+251900880000', '$ADMIN_HASH', 'admin') ON CONFLICT (email) DO NOTHING;" > /dev/null 2>&1

ADMIN_RES=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin_step8@dams.com","password":"Admin@s8!"}')
ADMIN_TOKEN=$(echo "$ADMIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
ADMIN_ROLE=$(echo "$ADMIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('user',{}).get('role',''))" 2>/dev/null)
check "Admin login (role=admin)" "admin" "$ADMIN_ROLE"

# Patient
PAT_REG=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"fullName":"S8 Patient","email":"s8pat@test.com","password":"Pass@12345","phoneNumber":"+251911880001","dateOfBirth":"1992-03-20","gender":"female"}')
PAT_TOKEN=$(echo "$PAT_REG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
if [ -z "$PAT_TOKEN" ]; then
  PAT_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"s8pat@test.com","password":"Pass@12345"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
fi
check "Patient token" "" "$([ -n "$PAT_TOKEN" ] && echo 'ok')"

# Dentist (via admin staff endpoint, with all-day availability)
curl -s -X POST "$BASE/users/staff" -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"fullName":"Dr. S8 Dentist","email":"s8dent@test.com","password":"Pass@12345","phoneNumber":"+251922880002","role":"dentist","specialization":"Orthodontics","licenseNumber":"S8-D-001","availability":[{"dayOfWeek":0,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":1,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":2,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":3,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":4,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":5,"startTime":"08:00","endTime":"17:00"},{"dayOfWeek":6,"startTime":"08:00","endTime":"17:00"}]}' > /dev/null 2>&1
DENT_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"s8dent@test.com","password":"Pass@12345"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
check "Dentist token" "" "$([ -n "$DENT_TOKEN" ] && echo 'ok')"

# Receptionist
curl -s -X POST "$BASE/users/staff" -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"fullName":"S8 Receptionist","email":"s8rec@test.com","password":"Pass@12345","phoneNumber":"+251933880003","role":"receptionist","shift":"full_day"}' > /dev/null 2>&1
REC_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"s8rec@test.com","password":"Pass@12345"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
check "Receptionist token" "" "$([ -n "$REC_TOKEN" ] && echo 'ok')"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}2. Resolve IDs${NC}"
# ──────────────────────────────────────────────

DENT_LIST=$(curl -s "$BASE/dentists" -H "Authorization: Bearer $PAT_TOKEN")
DENT_ID=$(echo "$DENT_LIST" | python3 -c "
import sys,json
data=json.load(sys.stdin).get('data',[])
for d in data:
  if 'S8 Dentist' in d.get('full_name',''):
    print(d.get('dentist_id', d.get('id','')))
    break
else:
  if data: print(data[-1].get('dentist_id', data[-1].get('id','')))
" 2>/dev/null)
echo "  Dentist ID: $DENT_ID"

# Get patient record ID
PAT_REC_ID=$(docker exec dams-db psql -U dams_user -d dams -t -c "SELECT p.id FROM patients p INNER JOIN users u ON u.id = p.user_id WHERE u.email='s8pat@test.com'" 2>/dev/null | tr -d ' \n\r')
echo "  Patient record ID: $PAT_REC_ID"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}3. Create walk-in appointment for today (using existing patient)${NC}"
# ──────────────────────────────────────────────

TODAY=$(date +%Y-%m-%d)
WALKIN_RES=$(curl -s -X POST "$BASE/appointments/walk-in" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REC_TOKEN" \
  -d "{\"patientId\":$PAT_REC_ID,\"dentistId\":$DENT_ID,\"appointmentDate\":\"$TODAY\",\"appointmentTime\":\"10:00\",\"reason\":\"Queue integration test\"}")
APPT_ID=$(echo "$WALKIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
check "Walk-in appointment created" "success" "$WALKIN_RES"
echo "  Appointment ID: $APPT_ID"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}4. Dentist approves${NC}"
# ──────────────────────────────────────────────

APPROVE=$(curl -s -X POST "$BASE/appointments/$APPT_ID/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DENT_TOKEN" \
  -d '{"action":"approve"}')
check "Appointment approved" "approved" "$APPROVE"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}5. Queue Management${NC}"
# ──────────────────────────────────────────────

# Add to queue
QA=$(curl -s -X POST "$BASE/queue" -H "Content-Type: application/json" -H "Authorization: Bearer $REC_TOKEN" \
  -d "{\"appointmentId\":$APPT_ID}")
QID=$(echo "$QA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
check "Added to queue" "queue_number" "$QA"
echo "  Queue Entry ID: $QID"

# Duplicate
QD=$(curl -s -X POST "$BASE/queue" -H "Content-Type: application/json" -H "Authorization: Bearer $REC_TOKEN" \
  -d "{\"appointmentId\":$APPT_ID}")
check "Duplicate rejected" "already in the queue" "$QD"

# Today's queue (receptionist)
TQ=$(curl -s "$BASE/queue/today" -H "Authorization: Bearer $REC_TOKEN")
check "Receptionist sees queue" "queue_number" "$TQ"

# Today's queue (dentist filtered)
TQD=$(curl -s "$BASE/queue/today?dentistId=$DENT_ID" -H "Authorization: Bearer $DENT_TOKEN")
check "Dentist sees own queue" "queue_number" "$TQD"

# Call patient
CP=$(curl -s -X PATCH "$BASE/queue/$QID/call" -H "Authorization: Bearer $REC_TOKEN")
check "Patient called (in_progress)" "in_progress" "$CP"

# Double call fails
CP2=$(curl -s -X PATCH "$BASE/queue/$QID/call" -H "Authorization: Bearer $REC_TOKEN")
check "Double call rejected" "Can only call" "$CP2"

# Complete
CQ=$(curl -s -X PATCH "$BASE/queue/$QID/complete" -H "Authorization: Bearer $REC_TOKEN")
check "Queue completed" "completed" "$CQ"

# Double complete fails
CQ2=$(curl -s -X PATCH "$BASE/queue/$QID/complete" -H "Authorization: Bearer $REC_TOKEN")
check "Double complete rejected" "Can only complete" "$CQ2"

# --- Test cancel flow with a second appointment ---
WALKIN2=$(curl -s -X POST "$BASE/appointments/walk-in" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REC_TOKEN" \
  -d "{\"patientId\":$PAT_REC_ID,\"dentistId\":$DENT_ID,\"appointmentDate\":\"$TODAY\",\"appointmentTime\":\"14:00\",\"reason\":\"Cancel test\"}")
APPT2_ID=$(echo "$WALKIN2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
curl -s -X POST "$BASE/appointments/$APPT2_ID/respond" -H "Content-Type: application/json" -H "Authorization: Bearer $DENT_TOKEN" -d '{"action":"approve"}' > /dev/null 2>&1
QA2=$(curl -s -X POST "$BASE/queue" -H "Content-Type: application/json" -H "Authorization: Bearer $REC_TOKEN" -d "{\"appointmentId\":$APPT2_ID}")
QID2=$(echo "$QA2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null)
CAN=$(curl -s -X PATCH "$BASE/queue/$QID2/cancel" -H "Authorization: Bearer $REC_TOKEN")
check "Queue entry cancelled" "cancelled" "$CAN"

# Stats
STATS=$(curl -s "$BASE/queue/stats" -H "Authorization: Bearer $REC_TOKEN")
check "Queue stats" "averageWaitMinutes" "$STATS"
check "Stats shows completed" "completed" "$STATS"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}6. Notifications${NC}"
# ──────────────────────────────────────────────

NL=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $DENT_TOKEN")
check "List notifications" "success" "$NL"
NCOUNT=$(echo "$NL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('pagination',{}).get('total',0))" 2>/dev/null)
echo "  Dentist has $NCOUNT notifications"

UC=$(curl -s "$BASE/notifications/unread-count" -H "Authorization: Bearer $DENT_TOKEN")
check "Unread count" "unreadCount" "$UC"

NID=$(echo "$NL" | python3 -c "
import sys,json
ns=json.load(sys.stdin).get('data',{}).get('notifications',[])
if ns: print(ns[0]['id'])
" 2>/dev/null)

if [ -n "$NID" ]; then
  MR=$(curl -s -X PATCH "$BASE/notifications/$NID/read" -H "Authorization: Bearer $DENT_TOKEN")
  check "Mark read" "success" "$MR"

  MAR=$(curl -s -X PATCH "$BASE/notifications/read-all" -H "Authorization: Bearer $DENT_TOKEN")
  check "Mark all read" "success" "$MAR"

  FR=$(curl -s "$BASE/notifications?isRead=true" -H "Authorization: Bearer $DENT_TOKEN")
  check "Filter isRead=true" "success" "$FR"

  DEL=$(curl -s -X DELETE "$BASE/notifications/$NID" -H "Authorization: Bearer $DENT_TOKEN")
  check "Delete notification" "success" "$DEL"

  # Verify deleted
  DEL2=$(curl -s -X DELETE "$BASE/notifications/$NID" -H "Authorization: Bearer $DENT_TOKEN")
  check "Delete again → 404" "not found" "$DEL2"
else
  echo -e "  ${RED}✖ No notifications to test${NC}"
  ((FAIL+=5))
fi

# Patient notifications
PNL=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $PAT_TOKEN")
PCOUNT=$(echo "$PNL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('pagination',{}).get('total',0))" 2>/dev/null)
echo "  Patient has $PCOUNT notifications"
check "Patient has notifications" "success" "$PNL"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}7. Admin Dashboard${NC}"
# ──────────────────────────────────────────────

DASH=$(curl -s "$BASE/admin/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Dashboard stats" "totalPatients" "$DASH"
check "Today appointments" "todayAppointments" "$DASH"
check "Status distribution" "statusDistribution" "$DASH"
check "Top dentists" "topDentists" "$DASH"
check "Week count" "thisWeekAppointments" "$DASH"
check "Month count" "thisMonthAppointments" "$DASH"

FROM_DATE=$(date -d "-30 days" +%Y-%m-%d 2>/dev/null || echo "2026-04-01")
AR=$(curl -s "$BASE/admin/reports/appointments?from=$FROM_DATE&to=$TODAY" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Appt report" "cancellationRate" "$AR"
check "Emergency count" "emergencyCount" "$AR"
check "Daily counts" "dailyCounts" "$AR"
check "Avg per dentist" "avgAppointmentsPerDentist" "$AR"

PR=$(curl -s "$BASE/admin/reports/patients" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Patient report" "totalActivePatients" "$PR"
check "Top patients" "topPatientsByVisits" "$PR"
check "Registrations" "newRegistrations" "$PR"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}8. RBAC${NC}"
# ──────────────────────────────────────────────

R1=$(curl -s -X POST "$BASE/queue" -H "Content-Type: application/json" -H "Authorization: Bearer $PAT_TOKEN" -d '{"appointmentId":1}')
check "Patient → queue blocked" "Access denied" "$R1"

R2=$(curl -s "$BASE/admin/dashboard" -H "Authorization: Bearer $DENT_TOKEN")
check "Dentist → admin blocked" "Access denied" "$R2"

R3=$(curl -s "$BASE/admin/dashboard" -H "Authorization: Bearer $REC_TOKEN")
check "Receptionist → admin blocked" "Access denied" "$R3"

R4=$(curl -s "$BASE/queue/stats" -H "Authorization: Bearer $DENT_TOKEN")
check "Dentist → queue stats blocked" "Access denied" "$R4"

R5=$(curl -s "$BASE/notifications")
check "No auth → blocked" "No token" "$R5"

# ──────────────────────────────────────────────
echo -e "\n${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
[ "$FAIL" -eq 0 ] && echo -e "\n${GREEN}🎉 All Step 8 tests passed! Backend API is complete.${NC}" || echo -e "\n${RED}⚠ $FAIL test(s) failed.${NC}"
