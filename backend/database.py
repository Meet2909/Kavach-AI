"""
backend/database.py — KAVACH-AI Sovereign Database & Seed Manager
================================================================
Implements local, air-gapped SQLite persistence for:
1. Sensor Telemetry (sensor_maintenance_data.csv)
2. Historical Maintenance Logs (maintenance_history.csv)
3. Industrial Knowledge Graph (Nodes, Edges, Revisions)
4. Document Metadata & Revision Conflict Tracking

Zero external services, 100% on-premise, 0 MB GPU VRAM overhead.
"""

import os
import sqlite3
import csv
import json
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
WORKSPACE_DIR = os.path.join(CURRENT_DIR, "workspace")
DB_PATH = os.path.join(WORKSPACE_DIR, "kavach.db")
DEMO_DATA_DIR = os.path.join(PROJECT_ROOT, "demo_data")

os.makedirs(WORKSPACE_DIR, exist_ok=True)

def get_db_connection():
    """Returns a thread-safe connection to the SQLite database with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Creates tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Documents & Revisions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_name TEXT NOT NULL,
        revision TEXT NOT NULL,
        file_path TEXT,
        file_type TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ACTIVE'
    )
    """)

    # 2. Knowledge Graph Nodes (Refinery Entities & Equipment)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_nodes (
        node_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        name TEXT,
        properties TEXT, -- JSON string of specifications & parameters
        criticality TEXT DEFAULT 'Medium',
        active_revision TEXT DEFAULT 'Rev-1',
        source_doc TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Knowledge Graph Edges (Physical Piping, Wiring, Regulatory Rules)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_node TEXT NOT NULL,
        relation TEXT NOT NULL,
        target_node TEXT NOT NULL,
        doc_reference TEXT,
        FOREIGN KEY (source_node) REFERENCES graph_nodes(node_id),
        FOREIGN KEY (target_node) REFERENCES graph_nodes(node_id)
    )
    """)

    # 4. Sensor Telemetry & Predictive Maintenance
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_telemetry (
        sensor_id TEXT,
        timestamp TEXT,
        voltage REAL,
        current REAL,
        temperature REAL,
        power REAL,
        humidity REAL,
        vibration REAL,
        equipment_id TEXT,
        operational_status TEXT,
        fault_status TEXT,
        failure_type TEXT,
        last_maintenance_date TEXT,
        maintenance_type TEXT,
        failure_history TEXT,
        repair_time_hrs REAL,
        maintenance_costs REAL,
        equipment_relationship TEXT,
        equipment_criticality TEXT,
        fault_detected INTEGER,
        predictive_trigger INTEGER,
        PRIMARY KEY (sensor_id, timestamp)
    )
    """)

    # 5. Historical Maintenance Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id TEXT NOT NULL,
        date TEXT NOT NULL,
        incident_type TEXT,
        description TEXT,
        downtime_hours REAL,
        status TEXT,
        technician TEXT
    )
    """)

    # 6. Revision Conflicts Table (Point #4)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS revision_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id TEXT NOT NULL,
        parameter TEXT NOT NULL,
        old_revision TEXT NOT NULL,
        old_value TEXT NOT NULL,
        new_revision TEXT NOT NULL,
        new_value TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'FLAGGED_FOR_REVIEW'
    )
    """)

    conn.commit()
    conn.close()

def seed_demo_data():
    """Seeds the SQLite database with maintenance_history.csv and sensor_maintenance_data.csv."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Maintenance History
    maint_csv = os.path.join(DEMO_DATA_DIR, "maintenance_history.csv")
    if os.path.exists(maint_csv):
        cursor.execute("SELECT COUNT(*) FROM maintenance_logs")
        if cursor.fetchone()[0] == 0:
            with open(maint_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cursor.execute("""
                    INSERT INTO maintenance_logs 
                    (equipment_id, date, incident_type, description, downtime_hours, status, technician)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row['Equipment_ID'], row['Date'], row['Type'], 
                        row['Description'], float(row['Downtime_Hours']), 
                        row['Status'], row['Technician']
                    ))
            print(f"[DB-SEED] Ingested maintenance_history.csv successfully.")

    # 2. Seed Sensor Telemetry Data
    sensor_csv = os.path.join(DEMO_DATA_DIR, "sensor_maintenance_data.csv")
    if os.path.exists(sensor_csv):
        cursor.execute("SELECT COUNT(*) FROM sensor_telemetry")
        if cursor.fetchone()[0] == 0:
            with open(sensor_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    cursor.execute("""
                    INSERT OR IGNORE INTO sensor_telemetry
                    (sensor_id, timestamp, voltage, current, temperature, power, humidity, vibration,
                     equipment_id, operational_status, fault_status, failure_type, last_maintenance_date,
                     maintenance_type, failure_history, repair_time_hrs, maintenance_costs,
                     equipment_relationship, equipment_criticality, fault_detected, predictive_trigger)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row['Sensor_ID'], row['Timestamp'], float(row['Voltage (V)']),
                        float(row['Current (A)']), float(row['Temperature (°C)']), float(row['Power (W)']),
                        float(row['Humidity (%)']), float(row['Vibration (m/s²)']), row['Equipment_ID'],
                        row['Operational Status'], row['Fault Status'], row['Failure Type'],
                        row['Last Maintenance Date'], row['Maintenance Type'], row['Failure History'],
                        float(row['Repair Time (hrs)']), float(row['Maintenance Costs (USD)']),
                        row['Equipment Relationship'], row['Equipment Criticality'],
                        int(row['Fault Detected']), int(row['Predictive Maintenance Trigger'])
                    ))
                    count += 1
            print(f"[DB-SEED] Ingested {count} sensor telemetry rows successfully.")

    # 3. Seed Knowledge Graph Baseline Entities (P&ID Equipment)
    cursor.execute("SELECT COUNT(*) FROM graph_nodes")
    if cursor.fetchone()[0] == 0:
        baseline_nodes = [
            ("PUMP-A", "EQUIPMENT", "Primary Feedwater Pump A", json.dumps({"type": "centrifugal", "flow_rate": "150 m3/h", "max_temp": "85C"}), "High", "Rev-1", "refinery_manifest.pdf"),
            ("PUMP-B", "EQUIPMENT", "Secondary Booster Pump B", json.dumps({"type": "progressive_cavity", "flow_rate": "110 m3/h"}), "Medium", "Rev-1", "refinery_manifest.pdf"),
            ("HEX-01", "HEAT_EXCHANGER", "Shell & Tube Exchanger 01", json.dumps({"design_pressure": "40 bar", "tube_material": "Titanium"}), "High", "Rev-1", "refinery_manifest.pdf"),
            ("COMPRESSOR-C", "COMPRESSOR", "Multi-stage Centrifugal Compressor", json.dumps({"stages": 3, "rpm": 12000, "gas": "Hydrogen"}), "Critical", "Rev-1", "refinery_manifest.pdf"),
            ("VALVE-12", "VALVE", "High-Pressure Globe Control Valve", json.dumps({"actuator": "pneumatic", "fail_mode": "fail_closed", "rating": "ANSI 600"}), "High", "Rev-1", "refinery_manifest.pdf"),
            ("BOILER-B101", "BOILER", "Primary Industrial Steam Boiler B-101", json.dumps({"max_operating_temp": "400C", "max_pressure": "30 bar", "fuel": "Natural Gas"}), "Critical", "Rev-2", "Boiler-Safety-SOP-Rev2.pdf")
        ]
        cursor.executemany("""
        INSERT OR IGNORE INTO graph_nodes (node_id, entity_type, name, properties, criticality, active_revision, source_doc)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, baseline_nodes)

        # Baseline Relationships (Edges)
        baseline_edges = [
            ("PUMP-A", "FEEDS_INTO", "HEX-01", "P&ID_Drawing_01"),
            ("HEX-01", "FEEDS_INTO", "BOILER-B101", "P&ID_Drawing_01"),
            ("VALVE-12", "REGULATES", "BOILER-B101", "P&ID_Drawing_01"),
            ("COMPRESSOR-C", "BOOSTS_PRESSURE_FOR", "BOILER-B101", "P&ID_Drawing_01")
        ]
        cursor.executemany("""
        INSERT OR IGNORE INTO graph_edges (source_node, relation, target_node, doc_reference)
        VALUES (?, ?, ?, ?)
        """, baseline_edges)
        print("[DB-SEED] Ingested Knowledge Graph baseline topology (6 nodes, 4 edges).")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_database()
    seed_demo_data()
    print("KAVACH-AI Sovereign Database initialized and seeded successfully.")
