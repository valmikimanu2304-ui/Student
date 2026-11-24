import os
import sys
import time
import subprocess
import webbrowser
import threading

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def print_banner():
    print("=" * 70)
    print("   AI-BASED SMART ATTENDANCE MANAGEMENT SYSTEM (FACETRACK.AI PRO)")
    print("=" * 70)
    print("  Status: All-In-One Unified Server Running")
    print("  Frontend UI:  http://localhost:5173  (Vite Live HMR)")
    print("  Unified Port: http://localhost:5000  (Flask + React Production Build)")
    print("  Backend API:  http://localhost:5000/api")
    print("-" * 70)
    print("  Admin Login:   admin@smartattendance.edu / admin123")
    print("  Student Login: alex.vance@smartattendance.edu / student123")
    print("=" * 70)
    print("  Press Ctrl+C to stop all services.\n")

def open_browser_delayed(url, delay=2.5):
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not automatically open browser: {e}")

def run_backend():
    sys.path.insert(0, BACKEND_DIR)
    from app import app
    app.run(host="0.0.0.0", port=5000, debug=False)

def main():
    print("\nStarting All-In-One Attendance Management System...\n")
    
    # Auto-open browser in background thread
    threading.Thread(target=open_browser_delayed, args=("http://localhost:5173",), daemon=True).start()
    
    print_banner()
    run_backend()

if __name__ == "__main__":
    main()
