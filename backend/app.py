import os
import sys
import json
import base64
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import db, User, Student, FaceEncoding, Attendance, Setting
from face_service import engine
from reports_service import generate_pdf_report, generate_csv_report
from seed_data import seed_database

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Base config
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'attendance.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'smart-attendance-secret-key-2026'

UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
PROFILES_DIR = os.path.join(UPLOADS_DIR, 'profiles')
SNAPSHOTS_DIR = os.path.join(UPLOADS_DIR, 'snapshots')
os.makedirs(PROFILES_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

db.init_app(app)

# Initialize database and in-memory face cache
with app.app_context():
    db.create_all()
    seed_database()
    # Cache all face encodings
    all_encodings = FaceEncoding.query.all()
    engine.refresh_cache(all_encodings)

# Helper function to get setting
def get_setting_val(key, default=None):
    s = Setting.query.filter_by(key=key).first()
    return s.value if s else default

# ================= AUTHENTICATION =================

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('email', '')
    password = data.get('password', '')

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password"}), 401

    student_data = None
    if user.role == 'student' and user.student_id:
        stu = Student.query.filter_by(student_id=user.student_id).first()
        if stu:
            student_data = stu.to_dict()

    return jsonify({
        "message": "Login successful",
        "token": f"jwt-mock-token-{user.id}-{int(datetime.utcnow().timestamp())}",
        "user": user.to_dict(),
        "student": student_data
    })

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    token = request.headers.get('Authorization', '')
    # For robust demonstration, default to admin if not specified or student if token matches
    user = User.query.filter_by(role='admin').first()
    return jsonify({"user": user.to_dict() if user else None})

# ================= DASHBOARD & STATS =================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    today_str = datetime.now().strftime("%Y-%m-%d")
    total_students = Student.query.count()
    
    # Today's attendance
    today_attendance = Attendance.query.filter_by(date=today_str).all()
    present_today_count = sum(1 for a in today_attendance if a.status == "Present")
    late_today_count = sum(1 for a in today_attendance if a.status == "Late")
    total_present_today = present_today_count + late_today_count
    absent_today = max(0, total_students - total_present_today)
    
    rate_today = round((total_present_today / total_students * 100), 1) if total_students > 0 else 0.0

    # 7-day trend
    labels = []
    trend_present = []
    trend_late = []
    trend_absent = []
    
    now = datetime.now()
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        labels.append(d.strftime("%a %d"))
        day_atts = Attendance.query.filter_by(date=d_str).all()
        p = sum(1 for a in day_atts if a.status == "Present")
        l = sum(1 for a in day_atts if a.status == "Late")
        total_p = p + l
        ab = max(0, total_students - total_p)
        trend_present.append(p)
        trend_late.append(l)
        trend_absent.append(ab)

    # Department breakdown
    depts = db.session.query(Student.department).distinct().all()
    dept_stats = []
    for (dept_name,) in depts:
        dept_students = Student.query.filter_by(department=dept_name).all()
        dept_student_ids = [s.student_id for s in dept_students]
        dept_total = len(dept_students)
        dept_present = sum(1 for a in today_attendance if a.student_id in dept_student_ids)
        rate = round((dept_present / dept_total * 100), 1) if dept_total > 0 else 0
        dept_stats.append({
            "department": dept_name,
            "total": dept_total,
            "present": dept_present,
            "absent": dept_total - dept_present,
            "rate": rate
        })

    # Recent Live Records (last 8)
    recent_atts = Attendance.query.order_by(Attendance.id.desc()).limit(8).all()
    recent_list = []
    for att in recent_atts:
        stu = Student.query.filter_by(student_id=att.student_id).first()
        recent_list.append(att.to_dict(
            student_name=stu.full_name if stu else "Unknown",
            department=stu.department if stu else "N/A",
            roll_no=stu.roll_no if stu else ""
        ))

    return jsonify({
        "total_students": total_students,
        "present_today": total_present_today,
        "on_time_today": present_today_count,
        "late_today": late_today_count,
        "absent_today": absent_today,
        "attendance_percentage": rate_today,
        "trends": {
            "labels": labels,
            "present": trend_present,
            "late": trend_late,
            "absent": trend_absent
        },
        "department_stats": dept_stats,
        "recent_activity": recent_list
    })

# ================= STUDENT MANAGEMENT =================

@app.route('/api/students', methods=['GET'])
def get_students():
    query = Student.query
    dept = request.args.get('department')
    search = request.args.get('search')
    year = request.args.get('year')

    if dept and dept != 'all':
        query = query.filter_by(department=dept)
    if year and year != 'all':
        query = query.filter_by(year=year)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.student_id.ilike(search_fmt)) |
            (Student.full_name.ilike(search_fmt)) |
            (Student.email.ilike(search_fmt)) |
            (Student.roll_no.ilike(search_fmt))
        )

    students = query.order_by(Student.id.desc()).all()
    res = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    for s in students:
        s_dict = s.to_dict()
        # Total attendance count
        s_dict['total_present'] = Attendance.query.filter_by(student_id=s.student_id).count()
        today_att = Attendance.query.filter_by(student_id=s.student_id, date=today_str).first()
        s_dict['today_status'] = today_att.status if today_att else "Not Marked"
        res.append(s_dict)

    return jsonify({"students": res, "total": len(res)})

@app.route('/api/students', methods=['POST'])
def create_student():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip().upper()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()

    if not student_id or not full_name or not email:
        return jsonify({"error": "Student ID, Full Name, and Email are required."}), 400

    if Student.query.filter_by(student_id=student_id).first():
        return jsonify({"error": f"Student with ID '{student_id}' already exists."}), 400
    if Student.query.filter_by(email=email).first():
        return jsonify({"error": f"Email '{email}' is already registered."}), 400

    new_stu = Student(
        student_id=student_id,
        full_name=full_name,
        email=email,
        phone=data.get('phone', ''),
        department=data.get('department', 'Computer Science'),
        year=data.get('year', '1st Year'),
        semester=data.get('semester', 'Sem 1'),
        roll_no=data.get('roll_no', ''),
        face_registered=False,
        face_samples_count=0
    )
    db.session.add(new_stu)

    # Also create user account for student portal login
    raw_password = data.get('password') or "student123"
    stu_user = User(
        username=student_id.lower(),
        email=email,
        password_hash=generate_password_hash(raw_password),
        role='student',
        student_id=student_id
    )
    db.session.add(stu_user)

    db.session.commit()
    return jsonify({"message": "Student created successfully!", "student": new_stu.to_dict()}), 201

@app.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": "Student not found"}), 404

    s_dict = stu.to_dict()
    # Attendance summary
    all_atts = Attendance.query.filter_by(student_id=student_id).all()
    total_present = sum(1 for a in all_atts if a.status in ["Present", "Late"])
    late_count = sum(1 for a in all_atts if a.status == "Late")
    
    s_dict["stats"] = {
        "total_attended": total_present,
        "on_time": total_present - late_count,
        "late": late_count,
        "recent_records": [a.to_dict() for a in all_atts[-10:]]
    }
    return jsonify(s_dict)

@app.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json() or {}
    if 'full_name' in data:
        stu.full_name = data['full_name']
    if 'email' in data:
        stu.email = data['email']
    if 'phone' in data:
        stu.phone = data['phone']
    if 'department' in data:
        stu.department = data['department']
    if 'year' in data:
        stu.year = data['year']
    if 'semester' in data:
        stu.semester = data['semester']
    if 'roll_no' in data:
        stu.roll_no = data['roll_no']

    db.session.commit()
    return jsonify({"message": "Student updated successfully", "student": stu.to_dict()})

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": "Student not found"}), 404

    # Remove encodings, user account, and attendance
    FaceEncoding.query.filter_by(student_id=student_id).delete()
    Attendance.query.filter_by(student_id=student_id).delete()
    User.query.filter_by(student_id=student_id).delete()
    db.session.delete(stu)
    db.session.commit()

    # Refresh in-memory cache
    engine.refresh_cache(FaceEncoding.query.all())

    return jsonify({"message": f"Student '{student_id}' deleted successfully"})

# ================= FACE REGISTRATION & RECOGNITION =================

@app.route('/api/face/register', methods=['POST'])
def register_face():
    """
    Receives student_id and multiple base64 captured face images.
    Extracts deep embeddings and stores in FaceEncoding table.
    """
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    images = data.get('images', [])  # list of base64 strings

    if not student_id:
        return jsonify({"error": "Student ID is required."}), 400

    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": f"Student '{student_id}' does not exist. Please register the student details first."}), 404

    if not images or len(images) == 0:
        return jsonify({"error": "At least 1 face capture image is required."}), 400

    # Delete any previous encodings for clean update
    FaceEncoding.query.filter_by(student_id=student_id).delete()

    saved_encodings = 0
    saved_profile_path = None

    for idx, b64_img in enumerate(images):
        cv_img = engine.decode_base64_image(b64_img)
        if cv_img is None:
            continue

        detected = engine.detect_and_extract(cv_img)
        if not detected:
            continue

        # Take the most prominent detected face in this frame
        best_face = max(detected, key=lambda x: x['box'][2] * x['box'][3])
        feat_vec = best_face['feature']

        fe = FaceEncoding(
            student_id=student_id,
            encoding_json=json.dumps(feat_vec),
            sample_num=idx + 1
        )
        db.session.add(fe)
        saved_encodings += 1

        # Save the first good frame as the student's profile photo
        if saved_profile_path is None:
            photo_filename = f"{student_id}_{int(datetime.now().timestamp())}.jpg"
            full_path = os.path.join(PROFILES_DIR, photo_filename)
            import cv2
            cv2.imwrite(full_path, cv_img)
            saved_profile_path = f"/api/uploads/profiles/{photo_filename}"
            stu.profile_photo = saved_profile_path

    if saved_encodings == 0:
        return jsonify({"error": "No clear face could be detected in the provided images. Please ensure good lighting and face the camera directly."}), 422

    stu.face_registered = True
    stu.face_samples_count = saved_encodings
    db.session.commit()

    # Refresh in-memory cache
    engine.refresh_cache(FaceEncoding.query.all())

    return jsonify({
        "message": f"Successfully registered face with {saved_encodings} biometric samples!",
        "student_id": student_id,
        "samples_count": saved_encodings,
        "profile_photo": stu.profile_photo
    })

@app.route('/api/face/recognize', methods=['POST'])
def recognize_face():
    """
    Receives a webcam frame, runs detection, matching, and auto-marks attendance.
    """
    data = request.get_json() or {}
    b64_img = data.get('image', '')
    auto_mark = data.get('auto_mark', True)

    if not b64_img:
        return jsonify({"error": "No image data provided"}), 400

    cv_img = engine.decode_base64_image(b64_img)
    if cv_img is None:
        return jsonify({"error": "Could not decode image"}), 400

    # Get threshold from settings or default
    thresh = float(get_setting_val('face_match_threshold', 0.38))
    late_threshold_time = get_setting_val('late_threshold', '09:30:00')

    detected = engine.detect_and_extract(cv_img)
    faces_res = []
    newly_marked = []

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    for item in detected:
        box = item['box']
        feat = item['feature']
        student_id, conf, sim = engine.match_feature(feat, cosine_threshold=thresh)

        student_info = None
        already_marked = False
        prev_mark_time = None
        mark_status = None

        if student_id != "Unknown":
            stu = Student.query.filter_by(student_id=student_id).first()
            if stu:
                student_info = {
                    "student_id": stu.student_id,
                    "full_name": stu.full_name,
                    "department": stu.department,
                    "year": stu.year,
                    "roll_no": stu.roll_no,
                    "profile_photo": stu.profile_photo
                }

                # Check if already marked attendance today
                existing = Attendance.query.filter_by(
                    student_id=student_id,
                    date=today_str
                ).first()

                if existing:
                    already_marked = True
                    prev_mark_time = existing.time
                    mark_status = existing.status
                elif auto_mark:
                    # Decide status based on late threshold
                    status = "Late" if time_str > late_threshold_time else "Present"
                    
                    # Save a snapshot of the verification frame
                    snap_filename = f"att_{student_id}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
                    snap_path = os.path.join(SNAPSHOTS_DIR, snap_filename)
                    import cv2
                    cv2.imwrite(snap_path, cv_img)

                    new_att = Attendance(
                        student_id=student_id,
                        date=today_str,
                        time=time_str,
                        timestamp=now,
                        status=status,
                        confidence=conf,
                        verification_method="AI Face Recognition",
                        snapshot_path=f"/api/uploads/snapshots/{snap_filename}"
                    )
                    db.session.add(new_att)
                    db.session.commit()

                    already_marked = False
                    mark_status = status
                    newly_marked.append({
                        "student_id": student_id,
                        "full_name": stu.full_name,
                        "department": stu.department,
                        "time": time_str,
                        "status": status,
                        "confidence": round(conf * 100, 1)
                    })

        faces_res.append({
            "box": box, # [x, y, w, h]
            "student_id": student_id,
            "student_info": student_info,
            "confidence": round(conf * 100, 1),
            "similarity": sim,
            "already_marked": already_marked,
            "previous_checkin": prev_mark_time,
            "status": mark_status
        })

    return jsonify({
        "detected_count": len(faces_res),
        "faces": faces_res,
        "newly_marked": newly_marked,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    })

# ================= ATTENDANCE RECORDS =================

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    query = Attendance.query.join(Student, Attendance.student_id == Student.student_id)

    date_filter = request.args.get('date')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    dept = request.args.get('department')
    status = request.args.get('status')
    search = request.args.get('search')

    if date_filter:
        query = query.filter(Attendance.date == date_filter)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    if dept and dept != 'all':
        query = query.filter(Student.department == dept)
    if status and status != 'all':
        query = query.filter(Attendance.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Student.student_id.ilike(search_fmt)) |
            (Student.full_name.ilike(search_fmt)) |
            (Student.roll_no.ilike(search_fmt))
        )

    records = query.order_by(Attendance.id.desc()).limit(300).all()

    res = []
    for att in records:
        stu = Student.query.filter_by(student_id=att.student_id).first()
        res.append(att.to_dict(
            student_name=stu.full_name if stu else "Unknown",
            department=stu.department if stu else "N/A",
            roll_no=stu.roll_no if stu else ""
        ))

    return jsonify({
        "records": res,
        "total": len(res)
    })

@app.route('/api/attendance/manual', methods=['POST'])
def manual_mark_attendance():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    status = data.get('status', 'Present')
    date_str = data.get('date', datetime.now().strftime("%Y-%m-%d"))
    time_str = data.get('time', datetime.now().strftime("%H:%M:%S"))
    notes = data.get('notes', 'Manual Override by Admin')

    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": "Student not found"}), 404

    # Check if record already exists for this date
    existing = Attendance.query.filter_by(student_id=student_id, date=date_str).first()
    if existing:
        existing.status = status
        existing.time = time_str
        existing.notes = notes
        existing.verification_method = "Manual Override"
        db.session.commit()
        return jsonify({"message": f"Updated attendance for {stu.full_name} on {date_str}", "record": existing.to_dict()})

    new_att = Attendance(
        student_id=student_id,
        date=date_str,
        time=time_str,
        timestamp=datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S"),
        status=status,
        confidence=1.0,
        verification_method="Manual Override",
        notes=notes
    )
    db.session.add(new_att)
    db.session.commit()

    return jsonify({"message": f"Marked {status} for {stu.full_name}", "record": new_att.to_dict()}), 201

@app.route('/api/attendance/<int:att_id>', methods=['DELETE'])
def delete_attendance(att_id):
    att = Attendance.query.get(att_id)
    if not att:
        return jsonify({"error": "Record not found"}), 404
    db.session.delete(att)
    db.session.commit()
    return jsonify({"message": "Attendance record deleted successfully"})

# ================= REPORTS & EXPORTS =================

@app.route('/api/reports/export/pdf', methods=['GET'])
def export_pdf():
    dept = request.args.get('department', 'all')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = Attendance.query.join(Student, Attendance.student_id == Student.student_id)
    if dept and dept != 'all':
        query = query.filter(Student.department == dept)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    records_raw = query.order_by(Attendance.date.desc(), Attendance.time.desc()).limit(150).all()
    records = []
    for att in records_raw:
        stu = Student.query.filter_by(student_id=att.student_id).first()
        records.append({
            "student_id": att.student_id,
            "student_name": stu.full_name if stu else "Unknown",
            "department": stu.department if stu else "N/A",
            "date": att.date,
            "time": att.time,
            "status": att.status,
            "confidence": round(att.confidence * 100, 1)
        })

    total = len(records)
    p_count = sum(1 for r in records if r['status'] == 'Present')
    l_count = sum(1 for r in records if r['status'] == 'Late')
    rate = round(((p_count + l_count) / max(1, total) * 100), 1)

    stats = {
        "total": total,
        "present": p_count,
        "late": l_count,
        "rate": rate
    }

    sub = f"Filter: Department = {dept}"
    if date_from and date_to:
        sub += f" | Date Range: {date_from} to {date_to}"

    pdf_buffer = generate_pdf_report(records, title="Smart Attendance Official Report", subtitle=sub, stats=stats)
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Attendance_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    )

@app.route('/api/reports/export/csv', methods=['GET'])
def export_csv():
    dept = request.args.get('department', 'all')
    query = Attendance.query.join(Student, Attendance.student_id == Student.student_id)
    if dept and dept != 'all':
        query = query.filter(Student.department == dept)

    records_raw = query.order_by(Attendance.date.desc()).all()
    records = []
    for att in records_raw:
        stu = Student.query.filter_by(student_id=att.student_id).first()
        records.append({
            "student_id": att.student_id,
            "student_name": stu.full_name if stu else "",
            "department": stu.department if stu else "",
            "date": att.date,
            "time": att.time,
            "status": att.status,
            "confidence": round(att.confidence * 100, 1),
            "verification_method": att.verification_method,
            "notes": att.notes or ""
        })

    csv_data = generate_csv_report(records)
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=attendance_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# ================= STUDENT PORTAL =================

@app.route('/api/student-portal/<student_id>', methods=['GET'])
def get_student_portal(student_id):
    stu = Student.query.filter_by(student_id=student_id).first()
    if not stu:
        return jsonify({"error": "Student not found"}), 404

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    current_month_str = now.strftime("%Y-%m")

    # All attendance records for this student
    all_atts = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).all()
    total_records = len(all_atts)
    present_count = sum(1 for a in all_atts if a.status == "Present")
    late_count = sum(1 for a in all_atts if a.status == "Late")
    overall_percentage = round(((present_count + late_count) / max(1, total_records) * 100), 1)

    # Today's status
    today_att = Attendance.query.filter_by(student_id=student_id, date=today_str).first()

    # Month calendar map
    month_map = {}
    for a in all_atts:
        if a.date.startswith(current_month_str):
            month_map[a.date] = {
                "status": a.status,
                "time": a.time,
                "confidence": round(a.confidence * 100, 1)
            }

    return jsonify({
        "student": stu.to_dict(),
        "stats": {
            "total_sessions": total_records,
            "present_count": present_count,
            "late_count": late_count,
            "absent_count": 0, # calculated relative to working days
            "attendance_percentage": overall_percentage
        },
        "today": today_att.to_dict() if today_att else None,
        "month_calendar": month_map,
        "history": [a.to_dict() for a in all_atts]
    })

# ================= SETTINGS =================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    all_s = Setting.query.all()
    data = {s.key: s.value for s in all_s}
    return jsonify(data)

@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.get_json() or {}
    for k, v in data.items():
        s = Setting.query.filter_by(key=k).first()
        if s:
            s.value = str(v)
        else:
            db.session.add(Setting(key=k, value=str(v)))
    db.session.commit()
    return jsonify({"message": "Settings updated successfully", "settings": data})

# Static uploads serving
@app.route('/api/uploads/<folder>/<filename>')
def serve_upload(folder, filename):
    folder_path = os.path.join(UPLOADS_DIR, folder)
    return send_from_directory(folder_path, filename)

# Fallback to frontend build index.html if frontend is built
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    dist_dir = os.path.abspath(os.path.join(BASE_DIR, '../frontend/dist'))
    if path != "" and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    if os.path.exists(os.path.join(dist_dir, 'index.html')):
        return send_from_directory(dist_dir, 'index.html')
    return jsonify({
        "system": "AI-Based Smart Attendance Management System API",
        "status": "Online",
        "version": "2.0.0",
        "docs": "Please connect with the React Frontend on port 5173"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
