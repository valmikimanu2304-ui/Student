import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # 'admin' or 'student'
    student_id = db.Column(db.String(50), nullable=True) # links to Student.student_id if student
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "student_id": self.student_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    department = db.Column(db.String(100), nullable=False, default="Computer Science")
    year = db.Column(db.String(20), nullable=False, default="3rd Year")
    semester = db.Column(db.String(20), nullable=True, default="Sem 5")
    roll_no = db.Column(db.String(50), nullable=True)
    profile_photo = db.Column(db.String(255), nullable=True)
    face_registered = db.Column(db.Boolean, default=False)
    face_samples_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "department": self.department,
            "year": self.year,
            "semester": self.semester,
            "roll_no": self.roll_no,
            "profile_photo": self.profile_photo,
            "face_registered": self.face_registered,
            "face_samples_count": self.face_samples_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class FaceEncoding(db.Model):
    __tablename__ = 'face_encodings'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    encoding_json = db.Column(db.Text, nullable=False)  # JSON string of 128 float array
    sample_num = db.Column(db.Integer, default=1)
    image_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    time = db.Column(db.String(8), nullable=False)   # HH:MM:SS
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Present") # Present, Late, Absent
    confidence = db.Column(db.Float, default=0.95)
    verification_method = db.Column(db.String(50), default="AI Face Recognition")
    snapshot_path = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.String(255), nullable=True)

    def to_dict(self, student_name=None, department=None, roll_no=None):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": student_name,
            "department": department,
            "roll_no": roll_no,
            "date": self.date,
            "time": self.time,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "status": self.status,
            "confidence": round(self.confidence * 100, 1) if self.confidence else 95.0,
            "verification_method": self.verification_method,
            "snapshot_path": self.snapshot_path,
            "notes": self.notes
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=False)
