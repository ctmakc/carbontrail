"""
CarbonTrail ETL Pipeline — Follow the Green Money
===================================================
Filters Canadian open data to climate/environment related:
 - ECCC & NRCan contracts and grants
 - Environment/Energy/Climate lobbying
 - Cross-references entities across all three
"""

import duckdb
import os
import time

DATA_ROOT = "/data/opendata/canada"
DB_PATH = os.environ.get(
    "CARBONTRAIL_DB",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "carbontrail.duckdb"),
)

# ── Climate-related government departments (owner_org codes)
CLIMATE_DEPTS = [
    "ECCC",   # Environment and Climate Change Canada
    "NRCan",  # Natural Resources Canada
    "TC",     # Transport Canada (EV, clean transport)
    "INFC",   # Infrastructure Canada (green infra)
    "AAFC",   # Agriculture and Agri-Food Canada (sustainable ag)
    "DFO",    # Fisheries and Oceans (marine conservation)
    "CIRNAC", # Crown-Indigenous Relations (northern energy)
    "ISC",    # Indigenous Services Canada (remote clean energy)
]

# Match patterns for owner_org_title (case-insensitive partial match)
CLIMATE_DEPT_PATTERNS = [
    "environment",
    "climate",
    "natural resource",
    "ressources naturelles",
    "transport",
    "infrastructure",
    "fisheries",
    "agriculture",
]

# Lobbying subject codes related to climate
# Based on Lobbyists Registration Act schedule:
# SMT-13 = Environment, SMT-10 = Energy, SMT-25 = Natural Resources
# SMT-7 = Infrastructure/Transport
CLIMATE_SUBJECT_CODES = [
    "SMT-13",  # Environment
    "SMT-10",  # Energy
    "SMT-25",  # Natural Resources
    "SMT-7",   # Infrastructure / Transport
]

# Climate-related NRCan grant programs (keyword matching)
CLIMATE_PROGRAM_KEYWORDS = [
    "clean", "green", "emission", "zero emission", "carbon", "climate",
    "renewable", "solar", "wind", "hydrogen", "electrif", "biofuel",
    "energy efficiency", "tree", "biodiversity", "conservation",
    "sustainable", "pollution", "environmental", "ghg", "net zero",
    "decarboni", "circular economy",
]


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def connect():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = duckdb.connect(DB_PATH)
    con.execute("SET memory_limit='4GB'")
    con.execute("SET threads=4")
    return con


# ─── 1. ALL CONTRACTS (full dataset, tagged by climate relevance) ─────
def ingest_contracts(con):
    log("Ingesting PSPC contracts...")
    csv = f"{DATA_ROOT}/pspc/contracts.csv"

    con.execute("DROP TABLE IF EXISTS contracts_raw")
    con.execute(f"""
        CREATE TABLE contracts_raw AS
        SELECT * FROM read_csv('{csv}',
            header=true, ignore_errors=true, auto_detect=true, sample_size=10000)
    """)
    count = con.execute("SELECT count(*) FROM contracts_raw").fetchone()[0]
    log(f"  contracts_raw: {count:,} rows")

    con.execute("DROP TABLE IF EXISTS contracts")
    con.execute("""
        CREATE TABLE contracts AS
        SELECT
            reference_number,
            procurement_id,
            TRIM(vendor_name) as vendor_name,
            UPPER(TRIM(COALESCE(vendor_name, ''))) as vendor_name_norm,
            vendor_postal_code,
            TRIM(buyer_name) as buyer_name,
            TRY_CAST(contract_date AS DATE) as contract_date,
            CAST(economic_object_code AS VARCHAR) as economic_object_code,
            description_en,
            description_fr,
            TRY_CAST(contract_period_start AS DATE) as contract_period_start,
            TRY_CAST(delivery_date AS DATE) as delivery_date,
            TRY_CAST(contract_value AS DOUBLE) as contract_value,
            TRY_CAST(original_value AS DOUBLE) as original_value,
            TRY_CAST(amendment_value AS DOUBLE) as amendment_value,
            comments_en,
            solicitation_procedure,
            limited_tendering_reason,
            indigenous_business,
            CAST(instrument_type AS VARCHAR) as instrument_type,
            TRY_CAST(number_of_bids AS INTEGER) as number_of_bids,
            reporting_period,
            owner_org,
            owner_org_title,
            -- Climate tagging (use LIKE instead of SIMILAR TO for DuckDB compat)
            CASE WHEN (
                LOWER(COALESCE(owner_org_title,'')) LIKE '%environment%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%climate%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%natural resource%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%ressources naturelles%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%transport%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%infrastructure%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%fisheries%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%agriculture%'
            ) THEN true ELSE false END as is_climate_dept,
            CASE WHEN (
                LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%clean energy%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%renewable%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%solar%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%emission%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%carbon%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%climate%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%hydrogen%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%electric vehicle%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%biodiversity%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%conservation%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%sustainable%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%ghg%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%net zero%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%decarboni%'
                OR LOWER(COALESCE(description_en,'') || ' ' || COALESCE(comments_en,'')) LIKE '%pollution%'
            ) THEN true ELSE false END as is_climate_topic,
            CASE WHEN solicitation_procedure NOT IN ('TN', 'tn') OR solicitation_procedure IS NULL
                THEN true ELSE false END as is_sole_source,
            YEAR(TRY_CAST(contract_date AS DATE)) as contract_year
        FROM contracts_raw
        WHERE vendor_name IS NOT NULL AND TRIM(vendor_name) != ''
    """)

    # Mark rows as climate_relevant if dept OR topic matches
    con.execute("ALTER TABLE contracts ADD COLUMN is_climate_relevant BOOLEAN")
    con.execute("UPDATE contracts SET is_climate_relevant = (is_climate_dept OR is_climate_topic)")

    total = con.execute("SELECT count(*) FROM contracts").fetchone()[0]
    climate = con.execute("SELECT count(*) FROM contracts WHERE is_climate_relevant").fetchone()[0]
    log(f"  contracts total: {total:,} | climate-relevant: {climate:,}")
    con.execute("DROP TABLE IF EXISTS contracts_raw")


# ─── 2. ALL GRANTS (tagged by climate relevance) ────────────────────
def ingest_grants(con):
    log("Ingesting federal grants...")
    csv = f"{DATA_ROOT}/grants/grants.csv"

    con.execute("DROP TABLE IF EXISTS grants_raw")
    con.execute(f"""
        CREATE TABLE grants_raw AS
        SELECT * FROM read_csv('{csv}',
            header=true, ignore_errors=true, auto_detect=true, sample_size=10000)
    """)
    count = con.execute("SELECT count(*) FROM grants_raw").fetchone()[0]
    log(f"  grants_raw: {count:,} rows")

    con.execute("DROP TABLE IF EXISTS grants")
    con.execute("""
        CREATE TABLE grants AS
        SELECT
            ref_number,
            TRY_CAST(amendment_number AS INTEGER) as amendment_number,
            agreement_type,
            recipient_type,
            TRIM(recipient_business_number) as recipient_bn,
            TRIM(recipient_legal_name) as recipient_legal_name,
            UPPER(TRIM(COALESCE(recipient_legal_name, ''))) as recipient_name_norm,
            TRIM(recipient_operating_name) as recipient_operating_name,
            recipient_country,
            recipient_province,
            recipient_city,
            recipient_postal_code,
            federal_riding_name_en,
            prog_name_en,
            prog_purpose_en,
            agreement_title_en,
            TRY_CAST(agreement_value AS DOUBLE) as agreement_value,
            TRY_CAST(agreement_start_date AS DATE) as agreement_start_date,
            TRY_CAST(agreement_end_date AS DATE) as agreement_end_date,
            description_en,
            expected_results_en,
            owner_org,
            owner_org_title,
            YEAR(TRY_CAST(agreement_start_date AS DATE)) as grant_year,
            -- Climate tagging
            CASE WHEN (
                LOWER(COALESCE(owner_org_title,'')) LIKE '%environment%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%climate%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%natural resource%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%ressources naturelles%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%transport%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%infrastructure%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%fisheries%'
                OR LOWER(COALESCE(owner_org_title,'')) LIKE '%agriculture%'
            ) THEN true ELSE false END as is_climate_dept,
            CASE WHEN (
                LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%clean energy%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%renewable%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%emission%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%carbon%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%climate%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%hydrogen%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%electric vehicle%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%biodiversity%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%conservation%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%sustainable%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%ghg%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%net zero%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%pollution%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%tree planting%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%energy efficiency%'
                OR LOWER(COALESCE(prog_name_en,'') || ' ' || COALESCE(description_en,'') || ' ' || COALESCE(expected_results_en,'')) LIKE '%green%'
            ) THEN true ELSE false END as is_climate_topic
        FROM grants_raw
        WHERE recipient_legal_name IS NOT NULL AND TRIM(recipient_legal_name) != ''
    """)

    con.execute("ALTER TABLE grants ADD COLUMN is_climate_relevant BOOLEAN")
    con.execute("UPDATE grants SET is_climate_relevant = (is_climate_dept OR is_climate_topic)")

    total = con.execute("SELECT count(*) FROM grants").fetchone()[0]
    climate = con.execute("SELECT count(*) FROM grants WHERE is_climate_relevant").fetchone()[0]
    log(f"  grants total: {total:,} | climate-relevant: {climate:,}")
    con.execute("DROP TABLE IF EXISTS grants_raw")


# ─── 3. LOBBYIST DATA ──────────────────────────────────────────────
def ingest_lobbyists(con):
    log("Ingesting lobbyist registry...")
    base = f"{DATA_ROOT}/lobbyists"

    # Primary registrations
    con.execute("DROP TABLE IF EXISTS lobbyist_registrations")
    con.execute(f"""
        CREATE TABLE lobbyist_registrations AS
        SELECT * FROM read_csv('{base}/Registration_PrimaryExport.csv',
            header=true, ignore_errors=true, auto_detect=true,
            sample_size=5000)
    """)
    count = con.execute("SELECT count(*) FROM lobbyist_registrations").fetchone()[0]
    log(f"  lobbyist_registrations: {count:,}")

    # Subject matters
    con.execute("DROP TABLE IF EXISTS lobbyist_subjects")
    con.execute(f"""
        CREATE TABLE lobbyist_subjects AS
        SELECT * FROM read_csv('{base}/Registration_SubjectMattersExport.csv',
            header=true, ignore_errors=true, auto_detect=true)
    """)
    count = con.execute("SELECT count(*) FROM lobbyist_subjects").fetchone()[0]
    log(f"  lobbyist_subjects: {count:,}")

    # Government institutions targeted
    con.execute("DROP TABLE IF EXISTS lobbyist_govt_inst")
    con.execute(f"""
        CREATE TABLE lobbyist_govt_inst AS
        SELECT * FROM read_csv('{base}/Registration_GovernmentInstExport.csv',
            header=true, ignore_errors=true, auto_detect=true)
    """)
    count = con.execute("SELECT count(*) FROM lobbyist_govt_inst").fetchone()[0]
    log(f"  lobbyist_govt_inst: {count:,}")

    # Government funding received by lobbyists/clients
    con.execute("DROP TABLE IF EXISTS lobbyist_govt_funding")
    con.execute(f"""
        CREATE TABLE lobbyist_govt_funding AS
        SELECT * FROM read_csv('{base}/Registration_GovtFundingExport.csv',
            header=true, ignore_errors=true, auto_detect=true)
    """)
    count = con.execute("SELECT count(*) FROM lobbyist_govt_funding").fetchone()[0]
    log(f"  lobbyist_govt_funding: {count:,}")

    # In-house lobbyists
    con.execute("DROP TABLE IF EXISTS lobbyist_inhouse")
    con.execute(f"""
        CREATE TABLE lobbyist_inhouse AS
        SELECT * FROM read_csv('{base}/Registration_InHouseLobbyistsExport.csv',
            header=true, ignore_errors=true, auto_detect=true)
    """)
    count = con.execute("SELECT count(*) FROM lobbyist_inhouse").fetchone()[0]
    log(f"  lobbyist_inhouse: {count:,}")

    # Build climate-relevant lobby view: registrations that target ECCC/NRCan or have env subject codes
    con.execute("DROP VIEW IF EXISTS climate_lobby_registrations")
    con.execute("""
        CREATE VIEW climate_lobby_registrations AS
        SELECT DISTINCT lr.*
        FROM lobbyist_registrations lr
        WHERE lr."REG_ID_ENR" IN (
            -- Targeted environment/energy institutions
            SELECT DISTINCT "REG_ID_ENR" FROM lobbyist_govt_inst
            WHERE UPPER("INSTITUTION") SIMILAR TO '%(ENVIRONMENT|CLIMATE|NATURAL RESOURCE|ENERGY|NEB|CER|ECCC|NRCAN)%'
        )
        OR lr."REG_ID_ENR" IN (
            -- Has environment/energy/natural resources subject codes
            SELECT DISTINCT "REG_ID_ENR" FROM lobbyist_subjects
            WHERE "SUBJECT_CODE_OBJET" IN ('SMT-13', 'SMT-10', 'SMT-25', 'SMT-7')
        )
    """)
    count = con.execute("SELECT count(*) FROM climate_lobby_registrations").fetchone()[0]
    log(f"  climate_lobby_registrations (view): {count:,}")


# ─── 4. CHARITIES with environment programs ───────────────────────
def ingest_charities(con):
    log("Ingesting T3010 charities...")
    base = f"{DATA_ROOT}/t3010"

    con.execute("DROP TABLE IF EXISTS charities")
    con.execute(f"""
        CREATE TABLE charities AS
        SELECT
            TRIM(BN) as bn,
            Category as category,
            "Sub Category" as sub_category,
            Designation as designation,
            TRIM("Legal Name") as legal_name,
            UPPER(TRIM(COALESCE("Legal Name", ''))) as legal_name_norm,
            City as city,
            Province as province,
            "Postal Code" as postal_code
        FROM read_csv('{base}/ident_2024.csv',
            header=true, ignore_errors=true, auto_detect=true)
        WHERE BN IS NOT NULL
    """)
    count = con.execute("SELECT count(*) FROM charities").fetchone()[0]
    log(f"  charities: {count:,}")

    # Directors for network analysis
    con.execute("DROP TABLE IF EXISTS charity_directors")
    con.execute(f"""
        CREATE TABLE charity_directors AS
        SELECT
            TRIM(BN) as bn,
            TRIM("Last Name") as last_name,
            TRIM("First Name") as first_name,
            UPPER(TRIM(COALESCE("Last Name",''))) || ', ' || UPPER(TRIM(COALESCE("First Name",''))) as director_name_norm,
            Position as position
        FROM read_csv('{base}/directors_2024_updated.csv',
            header=true, ignore_errors=true, auto_detect=true)
        WHERE BN IS NOT NULL AND "Last Name" IS NOT NULL AND TRIM("Last Name") != ''
    """)
    count = con.execute("SELECT count(*) FROM charity_directors").fetchone()[0]
    log(f"  charity_directors: {count:,}")

    # Programs — flag environment-focused charities
    con.execute("DROP TABLE IF EXISTS charity_programs")
    con.execute(f"""
        CREATE TABLE charity_programs AS
        SELECT
            TRIM(BN) as bn,
            "Program Type" as program_type,
            Description as description
        FROM read_csv('{base}/programs_2024.csv',
            header=true, ignore_errors=true, auto_detect=true)
        WHERE BN IS NOT NULL
    """)
    count = con.execute("SELECT count(*) FROM charity_programs").fetchone()[0]
    log(f"  charity_programs: {count:,}")


# ─── 5. ANALYTICAL TABLES ──────────────────────────────────────────
def build_analytics(con):
    log("Building analytical tables...")

    # ── GREEN MONEY FLOW: spending by program, year, province ──
    con.execute("DROP TABLE IF EXISTS green_money_flow")
    con.execute("""
        CREATE TABLE green_money_flow AS
        SELECT
            'grant' as flow_type,
            owner_org,
            owner_org_title,
            prog_name_en as program,
            recipient_province as province,
            grant_year as year,
            COUNT(*) as record_count,
            SUM(agreement_value) as total_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count
        FROM grants
        WHERE is_climate_relevant AND agreement_value > 0
        GROUP BY owner_org, owner_org_title, prog_name_en, recipient_province, grant_year

        UNION ALL

        SELECT
            'contract' as flow_type,
            owner_org,
            owner_org_title,
            description_en as program,
            NULL as province,
            contract_year as year,
            COUNT(*) as record_count,
            SUM(contract_value) as total_value,
            COUNT(DISTINCT vendor_name_norm) as recipient_count
        FROM contracts
        WHERE is_climate_relevant AND contract_value > 0
        GROUP BY owner_org, owner_org_title, description_en, contract_year
    """)
    count = con.execute("SELECT count(*) FROM green_money_flow").fetchone()[0]
    log(f"  green_money_flow: {count:,}")

    # ── TOP GREEN RECIPIENTS: who gets the most climate money ──
    con.execute("DROP TABLE IF EXISTS green_recipients")
    con.execute("""
        CREATE TABLE green_recipients AS
        WITH grant_totals AS (
            SELECT
                recipient_name_norm,
                recipient_legal_name,
                recipient_bn,
                recipient_province,
                COUNT(*) as grant_count,
                SUM(agreement_value) as grant_value,
                COUNT(DISTINCT prog_name_en) as grant_programs,
                COUNT(DISTINCT owner_org) as grant_depts,
                LIST(DISTINCT prog_name_en ORDER BY prog_name_en) as grant_program_list,
                MIN(grant_year) as first_grant_year,
                MAX(grant_year) as last_grant_year
            FROM grants
            WHERE is_climate_relevant AND agreement_value > 0
            GROUP BY recipient_name_norm, recipient_legal_name, recipient_bn, recipient_province
        ),
        contract_totals AS (
            SELECT
                vendor_name_norm,
                COUNT(*) as contract_count,
                SUM(contract_value) as contract_value,
                COUNT(DISTINCT owner_org) as contract_depts,
                SUM(CASE WHEN is_sole_source THEN 1 ELSE 0 END) as sole_source_count,
                MIN(contract_year) as first_contract_year,
                MAX(contract_year) as last_contract_year
            FROM contracts
            WHERE is_climate_relevant AND contract_value > 0
            GROUP BY vendor_name_norm
        )
        SELECT
            COALESCE(g.recipient_name_norm, c.vendor_name_norm) as entity_name_norm,
            g.recipient_legal_name as entity_name,
            g.recipient_bn as business_number,
            g.recipient_province as province,
            COALESCE(g.grant_count, 0) as grant_count,
            COALESCE(g.grant_value, 0) as grant_value,
            COALESCE(g.grant_programs, 0) as grant_programs,
            g.grant_program_list,
            COALESCE(c.contract_count, 0) as contract_count,
            COALESCE(c.contract_value, 0) as contract_value,
            COALESCE(c.sole_source_count, 0) as sole_source_count,
            COALESCE(g.grant_value, 0) + COALESCE(c.contract_value, 0) as total_climate_value,
            -- Both grants and contracts = deeper relationship
            CASE WHEN g.grant_count > 0 AND c.contract_count > 0 THEN true ELSE false END as dual_recipient
        FROM grant_totals g
        FULL OUTER JOIN contract_totals c ON g.recipient_name_norm = c.vendor_name_norm
        ORDER BY total_climate_value DESC
    """)
    count = con.execute("SELECT count(*) FROM green_recipients").fetchone()[0]
    log(f"  green_recipients: {count:,}")

    # ── LOBBY-TO-FUNDING LOOP: orgs that lobby ECCC/NRCan AND receive their money ──
    con.execute("DROP TABLE IF EXISTS lobby_funding_loops")
    con.execute("""
        CREATE TABLE lobby_funding_loops AS
        WITH lobby_orgs AS (
            SELECT DISTINCT
                UPPER(TRIM(COALESCE("EN_CLIENT_ORG_CORP_NM_AN",''))) as org_name_norm,
                "EN_CLIENT_ORG_CORP_NM_AN" as org_name,
                COUNT(DISTINCT "REG_ID_ENR") as lobby_registration_count,
                MIN(TRY_CAST("EFFECTIVE_DATE_VIGUEUR" AS DATE)) as first_lobby_date,
                MAX(TRY_CAST("EFFECTIVE_DATE_VIGUEUR" AS DATE)) as last_lobby_date,
                BOOL_OR("GOVT_FUND_IND_FIN_GOUV" = 'Y') as receives_govt_funding
            FROM climate_lobby_registrations
            WHERE "EN_CLIENT_ORG_CORP_NM_AN" IS NOT NULL
                AND TRIM("EN_CLIENT_ORG_CORP_NM_AN") != ''
                AND TRIM("EN_CLIENT_ORG_CORP_NM_AN") != 'null'
            GROUP BY org_name_norm, org_name
        )
        SELECT
            l.org_name_norm,
            l.org_name,
            l.lobby_registration_count,
            l.first_lobby_date,
            l.last_lobby_date,
            l.receives_govt_funding,
            gr.grant_count,
            gr.grant_value,
            gr.grant_programs,
            gr.contract_count,
            gr.contract_value,
            gr.sole_source_count,
            gr.total_climate_value,
            -- Loop strength: more lobbying + more money = stronger signal
            CASE
                WHEN gr.total_climate_value > 0 AND l.lobby_registration_count > 0
                THEN LEAST(100,
                    LOG2(l.lobby_registration_count + 1) * 15
                    + LOG2(GREATEST(gr.total_climate_value, 1)) * 5
                    + (CASE WHEN gr.sole_source_count > 0 THEN 15 ELSE 0 END)
                    + (CASE WHEN gr.dual_recipient THEN 10 ELSE 0 END)
                )
                ELSE 0
            END as loop_signal_score
        FROM lobby_orgs l
        LEFT JOIN green_recipients gr ON l.org_name_norm = gr.entity_name_norm
        WHERE gr.total_climate_value > 0 OR l.lobby_registration_count >= 3
        ORDER BY loop_signal_score DESC
    """)
    count = con.execute("SELECT count(*) FROM lobby_funding_loops").fetchone()[0]
    log(f"  lobby_funding_loops: {count:,}")

    # ── GREENWASHING SIGNALS: lobbied on environment but also fossil-adjacent ──
    con.execute("DROP TABLE IF EXISTS greenwash_signals")
    con.execute("""
        CREATE TABLE greenwash_signals AS
        WITH env_lobbyists AS (
            SELECT DISTINCT "REG_ID_ENR"
            FROM lobbyist_subjects
            WHERE "SUBJECT_CODE_OBJET" IN ('SMT-13', 'SMT-10', 'SMT-25')
        ),
        reg_subject_mix AS (
            SELECT
                lr."REG_ID_ENR",
                UPPER(TRIM(COALESCE(lr."EN_CLIENT_ORG_CORP_NM_AN",''))) as org_name_norm,
                lr."EN_CLIENT_ORG_CORP_NM_AN" as org_name,
                LIST(DISTINCT ls."SUBJECT_CODE_OBJET" ORDER BY ls."SUBJECT_CODE_OBJET") as all_subjects,
                LEN(LIST(DISTINCT ls."SUBJECT_CODE_OBJET")) as subject_breadth,
                BOOL_OR(ls."SUBJECT_CODE_OBJET" = 'SMT-13') as lobbies_environment,
                BOOL_OR(ls."SUBJECT_CODE_OBJET" = 'SMT-10') as lobbies_energy,
                BOOL_OR(ls."SUBJECT_CODE_OBJET" = 'SMT-25') as lobbies_natural_resources,
                BOOL_OR(ls."SUBJECT_CODE_OBJET" IN ('SMT-20', 'SMT-33')) as lobbies_taxation_trade
            FROM lobbyist_registrations lr
            JOIN lobbyist_subjects ls ON lr."REG_ID_ENR" = ls."REG_ID_ENR"
            WHERE lr."REG_ID_ENR" IN (SELECT "REG_ID_ENR" FROM env_lobbyists)
                AND lr."EN_CLIENT_ORG_CORP_NM_AN" IS NOT NULL
                AND TRIM(lr."EN_CLIENT_ORG_CORP_NM_AN") != ''
                AND TRIM(lr."EN_CLIENT_ORG_CORP_NM_AN") != 'null'
            GROUP BY lr."REG_ID_ENR", org_name_norm, org_name
        )
        SELECT
            org_name_norm,
            org_name,
            COUNT(*) as registration_count,
            LIST(DISTINCT all_subjects) as subject_profiles,
            BOOL_OR(lobbies_environment) as any_environment,
            BOOL_OR(lobbies_energy) as any_energy,
            BOOL_OR(lobbies_natural_resources) as any_natural_resources,
            BOOL_OR(lobbies_taxation_trade) as any_taxation_trade,
            MAX(subject_breadth) as max_subject_breadth,
            -- Signal: orgs lobbying on BOTH energy AND taxation/trade may be seeking regulatory relief
            CASE
                WHEN BOOL_OR(lobbies_energy) AND BOOL_OR(lobbies_taxation_trade) THEN 'energy_tax_nexus'
                WHEN MAX(subject_breadth) > 8 THEN 'broad_spectrum_lobby'
                ELSE 'standard'
            END as signal_type
        FROM reg_subject_mix
        GROUP BY org_name_norm, org_name
        HAVING COUNT(*) >= 2
        ORDER BY registration_count DESC
    """)
    count = con.execute("SELECT count(*) FROM greenwash_signals").fetchone()[0]
    log(f"  greenwash_signals: {count:,}")

    # ── PROVINCIAL CLIMATE FUNDING GAP ──
    con.execute("DROP TABLE IF EXISTS provincial_climate_gaps")
    con.execute("""
        CREATE TABLE provincial_climate_gaps AS
        SELECT
            recipient_province as province,
            prog_name_en as program,
            owner_org_title as department,
            grant_year as year,
            COUNT(*) as grant_count,
            SUM(agreement_value) as total_value,
            AVG(agreement_value) as avg_value,
            COUNT(DISTINCT recipient_name_norm) as recipient_count
        FROM grants
        WHERE is_climate_relevant
            AND recipient_province IS NOT NULL
            AND recipient_province != ''
            AND agreement_value > 0
        GROUP BY recipient_province, prog_name_en, owner_org_title, grant_year
    """)
    count = con.execute("SELECT count(*) FROM provincial_climate_gaps").fetchone()[0]
    log(f"  provincial_climate_gaps: {count:,}")

    # ── CLIMATE SPENDING TIMELINE ──
    con.execute("DROP TABLE IF EXISTS climate_spending_timeline")
    con.execute("""
        CREATE TABLE climate_spending_timeline AS
        SELECT
            year,
            flow_type,
            owner_org_title as department,
            SUM(total_value) as total_value,
            SUM(record_count) as record_count,
            SUM(recipient_count) as recipient_count
        FROM green_money_flow
        WHERE year IS NOT NULL AND year >= 2005 AND year <= 2026
        GROUP BY year, flow_type, owner_org_title
        ORDER BY year, flow_type
    """)
    count = con.execute("SELECT count(*) FROM climate_spending_timeline").fetchone()[0]
    log(f"  climate_spending_timeline: {count:,}")

    # Fix null entity names — fill from normalized name
    con.execute("""
        UPDATE green_recipients
        SET entity_name = entity_name_norm
        WHERE entity_name IS NULL OR TRIM(entity_name) = ''
    """)
    log("  Fixed null entity names in green_recipients")


# ─── 6. INDEXES ───────────────────────────────────────────────────
def build_indexes(con):
    log("Building indexes...")
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_c_vendor ON contracts(vendor_name_norm)",
        "CREATE INDEX IF NOT EXISTS idx_c_org ON contracts(owner_org)",
        "CREATE INDEX IF NOT EXISTS idx_c_year ON contracts(contract_year)",
        "CREATE INDEX IF NOT EXISTS idx_c_climate ON contracts(is_climate_relevant)",
        "CREATE INDEX IF NOT EXISTS idx_g_recipient ON grants(recipient_name_norm)",
        "CREATE INDEX IF NOT EXISTS idx_g_bn ON grants(recipient_bn)",
        "CREATE INDEX IF NOT EXISTS idx_g_org ON grants(owner_org)",
        "CREATE INDEX IF NOT EXISTS idx_g_climate ON grants(is_climate_relevant)",
        "CREATE INDEX IF NOT EXISTS idx_gr_entity ON green_recipients(entity_name_norm)",
        "CREATE INDEX IF NOT EXISTS idx_lfl_org ON lobby_funding_loops(org_name_norm)",
        "CREATE INDEX IF NOT EXISTS idx_char_bn ON charities(bn)",
        "CREATE INDEX IF NOT EXISTS idx_dir_bn ON charity_directors(bn)",
    ]
    for idx in indexes:
        con.execute(idx)
    log("  Done")


# ─── SUMMARY ──────────────────────────────────────────────────────
def print_summary(con):
    log("=" * 60)
    log("CARBONTRAIL DATABASE SUMMARY")
    log("=" * 60)
    tables = con.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='main' AND table_type='BASE TABLE'
        ORDER BY table_name
    """).fetchall()
    for (t,) in tables:
        count = con.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
        log(f"  {t:40s} {count:>12,} rows")

    views = con.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='main' AND table_type='VIEW'
    """).fetchall()
    for (v,) in views:
        count = con.execute(f'SELECT count(*) FROM "{v}"').fetchone()[0]
        log(f"  {v:40s} {count:>12,} rows (view)")

    size_mb = os.path.getsize(DB_PATH) / (1024 * 1024)
    log(f"\n  Database size: {size_mb:.1f} MB")

    # Key metrics
    log("\n  KEY CLIMATE METRICS:")
    r = con.execute("SELECT count(*), COALESCE(SUM(contract_value),0) FROM contracts WHERE is_climate_relevant").fetchone()
    log(f"  Climate contracts:  {r[0]:>10,}  (${r[1]:>16,.0f})")
    r = con.execute("SELECT count(*), COALESCE(SUM(agreement_value),0) FROM grants WHERE is_climate_relevant").fetchone()
    log(f"  Climate grants:     {r[0]:>10,}  (${r[1]:>16,.0f})")
    r = con.execute("SELECT count(*) FROM climate_lobby_registrations").fetchone()
    log(f"  Climate lobby regs: {r[0]:>10,}")
    r = con.execute("SELECT count(*) FROM lobby_funding_loops WHERE loop_signal_score > 0").fetchone()
    log(f"  Lobby-funding loops:{r[0]:>10,}")
    r = con.execute("SELECT count(*) FROM green_recipients WHERE dual_recipient").fetchone()
    log(f"  Dual recipients:    {r[0]:>10,}")


# ─── MAIN ─────────────────────────────────────────────────────────
def main():
    log("🌍 CarbonTrail ETL — Follow the Green Money")
    start = time.time()

    con = connect()
    ingest_contracts(con)
    ingest_grants(con)
    ingest_lobbyists(con)
    ingest_charities(con)
    build_analytics(con)
    build_indexes(con)
    print_summary(con)

    con.close()
    elapsed = time.time() - start
    log(f"\n✅ ETL complete in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
