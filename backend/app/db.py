"""DuckDB connection for CarbonTrail"""
import duckdb
import os

DB_PATH = os.environ.get(
    "CARBONTRAIL_DB",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "carbontrail.duckdb"),
)

_conn = None

def get_connection() -> duckdb.DuckDBPyConnection:
    global _conn
    if _conn is None:
        _conn = duckdb.connect(DB_PATH, read_only=True)
        _conn.execute("SET memory_limit='2GB'")
        _conn.execute("SET threads=4")
    return _conn

def query(sql: str, params=None):
    con = get_connection()
    result = con.execute(sql, params) if params else con.execute(sql)
    columns = [desc[0] for desc in result.description]
    rows = result.fetchall()
    return [dict(zip(columns, row)) for row in rows]
