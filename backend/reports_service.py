import os
import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(records, title="Attendance Report", subtitle=None, stats=None):
    """
    Generates a PDF document in-memory using ReportLab.
    records: list of dicts with keys: student_id, student_name, department, date, time, status, confidence
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'), # Indigo 900
        alignment=1, # Center
        spaceAfter=4
    )
    
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563'),
        alignment=1, # Center
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1F2937'),
        spaceBefore=10,
        spaceAfter=6
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1F2937')
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )

    elements = []

    # Title & Header
    elements.append(Paragraph("AI-BASED SMART ATTENDANCE MANAGEMENT SYSTEM", header_style))
    elements.append(Paragraph(f"Official Attendance Log & Analytics Report | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", sub_style))
    if subtitle:
        elements.append(Paragraph(subtitle, sub_style))

    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceBefore=2, spaceAfter=14))

    # Summary Statistics Box if provided
    if stats:
        stat_data = [
            [
                Paragraph(f"<b>Total Records:</b> {stats.get('total', len(records))}", cell_style),
                Paragraph(f"<b>Present:</b> <font color='#16a34a'>{stats.get('present', 0)}</font>", cell_style),
                Paragraph(f"<b>Late:</b> <font color='#d97706'>{stats.get('late', 0)}</font>", cell_style),
                Paragraph(f"<b>Attendance Rate:</b> <b>{stats.get('rate', 0)}%</b>", cell_style)
            ]
        ]
        t_stat = Table(stat_data, colWidths=[130, 130, 130, 150])
        t_stat.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0FDF4')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#86EFAC')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BBF7D0')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        elements.append(t_stat)
        elements.append(Spacer(1, 14))

    # Table of Records
    table_data = [[
        Paragraph("<b>#</b>", cell_bold),
        Paragraph("<b>Student ID</b>", cell_bold),
        Paragraph("<b>Student Name</b>", cell_bold),
        Paragraph("<b>Department</b>", cell_bold),
        Paragraph("<b>Date</b>", cell_bold),
        Paragraph("<b>Time</b>", cell_bold),
        Paragraph("<b>Status</b>", cell_bold),
        Paragraph("<b>Confidence</b>", cell_bold)
    ]]

    for i, r in enumerate(records[:150], 1): # Cap at 150 records per PDF report
        st = r.get('status', 'Present')
        st_color = '#16a34a' if st == 'Present' else ('#d97706' if st == 'Late' else '#dc2626')
        
        table_data.append([
            Paragraph(str(i), cell_style),
            Paragraph(str(r.get('student_id', '')), cell_style),
            Paragraph(str(r.get('student_name', 'N/A')), cell_style),
            Paragraph(str(r.get('department', 'General')), cell_style),
            Paragraph(str(r.get('date', '')), cell_style),
            Paragraph(str(r.get('time', '')), cell_style),
            Paragraph(f"<font color='{st_color}'><b>{st}</b></font>", cell_style),
            Paragraph(f"{r.get('confidence', 95)}%", cell_style)
        ])

    table = Table(table_data, colWidths=[24, 76, 120, 100, 65, 55, 55, 45])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 14))
    elements.append(Paragraph("<i>End of Attendance Report. Verified by AI Vision Recognition Module.</i>", sub_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_csv_report(records):
    """
    Generates a CSV string in-memory.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student ID", "Full Name", "Department", "Date", "Time", "Status", "Confidence (%)", "Method", "Notes"])
    for i, r in enumerate(records, 1):
        writer.writerow([
            i,
            r.get('student_id', ''),
            r.get('student_name', ''),
            r.get('department', ''),
            r.get('date', ''),
            r.get('time', ''),
            r.get('status', 'Present'),
            r.get('confidence', 95),
            r.get('verification_method', 'AI Face Recognition'),
            r.get('notes', '')
        ])
    return output.getvalue()
