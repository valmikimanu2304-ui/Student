import os
import json
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from database import db, User, Student, FaceEncoding, Attendance, Setting

def seed_database():
    """Seeds initial administrative user, sample students, settings, and attendance records."""
    
    # 1. System Settings
    default_settings = {
        "org_name": "Apex Institute of Technology",
        "academic_year": "2026-2027",
        "checkin_start": "08:00:00",
        "late_threshold": "09:30:00",
        "checkin_end": "17:00:00",
        "face_match_threshold": "0.38",
        "theme_accent": "blue",
        "anti_spoofing": "true",
        "duplicate_prevention": "true"
    }
    for k, v in default_settings.items():
        if not Setting.query.filter_by(key=k).first():
            db.session.add(Setting(key=k, value=v))
            
    # 2. Admin User
    admin_user = User.query.filter_by(email="admin@smartattendance.edu").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@smartattendance.edu",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            student_id=None
        )
        db.session.add(admin_user)

    # 3. Seed Students
    sample_students = [
        {
            "student_id": "CS2026001",
            "full_name": "Alexander Vance",
            "email": "alex.vance@smartattendance.edu",
            "phone": "+1 (555) 234-5678",
            "department": "Computer Science",
            "year": "3rd Year",
            "semester": "Sem 5",
            "roll_no": "CS-01",
            "face_registered": True,
            "face_samples_count": 5
        },
        {
            "student_id": "CS2026002",
            "full_name": "Sophia Reynolds",
            "email": "sophia.reynolds@smartattendance.edu",
            "phone": "+1 (555) 345-6789",
            "department": "Computer Science",
            "year": "3rd Year",
            "semester": "Sem 5",
            "roll_no": "CS-02",
            "face_registered": True,
            "face_samples_count": 4
        },
        {
            "student_id": "AI2026003",
            "full_name": "Marcus Chen",
            "email": "marcus.chen@smartattendance.edu",
            "phone": "+1 (555) 456-7890",
            "department": "AI & Data Science",
            "year": "2nd Year",
            "semester": "Sem 3",
            "roll_no": "AI-14",
            "face_registered": True,
            "face_samples_count": 5
        },
        {
            "student_id": "IT2026004",
            "full_name": "Emily Watson",
            "email": "emily.watson@smartattendance.edu",
            "phone": "+1 (555) 567-8901",
            "department": "Information Technology",
            "year": "4th Year",
            "semester": "Sem 7",
            "roll_no": "IT-08",
            "face_registered": True,
            "face_samples_count": 5
        },
        {
            "student_id": "EC2026005",
            "full_name": "Rahul Sharma",
            "email": "rahul.sharma@smartattendance.edu",
            "phone": "+1 (555) 678-9012",
            "department": "Electronics & Comm",
            "year": "3rd Year",
            "semester": "Sem 5",
            "roll_no": "EC-22",
            "face_registered": True,
            "face_samples_count": 4
        },
        {
            "student_id": "CS2026006",
            "full_name": "Priya Patel",
            "email": "priya.patel@smartattendance.edu",
            "phone": "+1 (555) 789-0123",
            "department": "Computer Science",
            "year": "2nd Year",
            "semester": "Sem 3",
            "roll_no": "CS-31",
            "face_registered": False,
            "face_samples_count": 0
        },
        {
            "student_id": "ME2026007",
            "full_name": "David Miller",
            "email": "david.miller@smartattendance.edu",
            "phone": "+1 (555) 890-1234",
            "department": "Mechanical Engineering",
            "year": "4th Year",
            "semester": "Sem 7",
            "roll_no": "ME-05",
            "face_registered": True,
            "face_samples_count": 5
        },
        {
            "student_id": "AI2026008",
            "full_name": "Aisha Al-Mansoor",
            "email": "aisha.mansoor@smartattendance.edu",
            "phone": "+1 (555) 901-2345",
            "department": "AI & Data Science",
            "year": "3rd Year",
            "semester": "Sem 5",
            "roll_no": "AI-02",
            "face_registered": True,
            "face_samples_count": 5
        }
    ]

    for s_info in sample_students:
        existing = Student.query.filter_by(student_id=s_info["student_id"]).first()
        if not existing:
            stu = Student(**s_info)
            db.session.add(stu)
            
            # Create user account for student
            stu_user = User(
                username=s_info["student_id"].lower(),
                email=s_info["email"],
                password_hash=generate_password_hash("student123"),
                role="student",
                student_id=s_info["student_id"]
            )
            db.session.add(stu_user)
            
            # If face registered, generate a representative synthetic 128-d embedding
            # so matching works right away if tested with simulated vectors or when updated with real webcam
            if s_info["face_registered"]:
                # Seed a consistent pseudo-random 128-float unit vector for demo
                rng = random.Random(hash(s_info["student_id"]))
                vec = [rng.gauss(0, 1) for _ in range(128)]
                norm = sum(x*x for x in vec) ** 0.5
                vec = [round(x / norm, 5) for x in vec]
                fe = FaceEncoding(
                    student_id=s_info["student_id"],
                    encoding_json=json.dumps(vec),
                    sample_num=1
                )
                db.session.add(fe)

    db.session.commit()

    # 4. Generate 14 days of realistic historical attendance
    existing_att_count = Attendance.query.count()
    if existing_att_count == 0:
        students = Student.query.all()
        now = datetime.now()
        
        for day_offset in range(13, -1, -1):
            target_date = now - timedelta(days=day_offset)
            # Skip Sundays
            if target_date.weekday() == 6:
                continue
                
            date_str = target_date.strftime("%Y-%m-%d")
            
            for stu in students:
                # 85% chance student attends
                if random.random() < 0.88:
                    # Decide if Present or Late
                    is_late = random.random() < 0.15
                    if is_late:
                        hour = random.randint(9, 10)
                        minute = random.randint(31, 55)
                        status = "Late"
                    else:
                        hour = random.randint(8, 9)
                        minute = random.randint(15, 29)
                        status = "Present"
                        
                    second = random.randint(10, 59)
                    time_str = f"{hour:02d}:{minute:02d}:{second:02d}"
                    conf = round(random.uniform(0.91, 0.99), 2)
                    
                    att = Attendance(
                        student_id=stu.student_id,
                        date=date_str,
                        time=time_str,
                        timestamp=datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S"),
                        status=status,
                        confidence=conf,
                        verification_method="AI Face Recognition"
                    )
                    db.session.add(att)
                    
        db.session.commit()
        print(f"[Seed] Successfully seeded {Attendance.query.count()} historical attendance records.")
