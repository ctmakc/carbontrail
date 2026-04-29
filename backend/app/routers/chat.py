"""AI Chat — conversational climate spending exploration"""
from fastapi import APIRouter
from pydantic import BaseModel
from ..db import query
from ..services.ai import explain_pattern

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


def _get_context() -> str:
    """Build a data summary for the AI to reference"""
    stats = query("""
        SELECT
            (SELECT count(*) FROM contracts WHERE is_climate_relevant) as climate_contracts,
            (SELECT COALESCE(SUM(contract_value),0) FROM contracts WHERE is_climate_relevant) as contract_value,
            (SELECT count(*) FROM grants WHERE is_climate_relevant) as climate_grants,
            (SELECT COALESCE(SUM(agreement_value),0) FROM grants WHERE is_climate_relevant) as grant_value,
            (SELECT count(*) FROM lobby_funding_loops WHERE loop_signal_score > 0) as loops,
            (SELECT count(*) FROM greenwash_signals WHERE signal_type != 'standard') as greenwash
    """)[0]

    top_recipients = query("""
        SELECT entity_name, total_climate_value FROM green_recipients
        ORDER BY total_climate_value DESC LIMIT 10
    """)

    top_loops = query("""
        SELECT org_name, lobby_registration_count, total_climate_value, loop_signal_score
        FROM lobby_funding_loops WHERE loop_signal_score > 0
        ORDER BY loop_signal_score DESC LIMIT 10
    """)

    top_programs = query("""
        SELECT prog_name_en, SUM(agreement_value) as total, COUNT(*) as grants
        FROM grants WHERE is_climate_relevant AND prog_name_en IS NOT NULL
        GROUP BY prog_name_en ORDER BY total DESC LIMIT 10
    """)

    ctx = f"""CARBONTRAIL DATA CONTEXT:
- {stats['climate_contracts']:,} climate contracts (${stats['contract_value']:,.0f})
- {stats['climate_grants']:,} climate grants (${stats['grant_value']:,.0f})
- {stats['loops']:,} lobby-funding loops detected
- {stats['greenwash']:,} greenwash signals

TOP CLIMATE RECIPIENTS:
""" + "\n".join(f"- {r['entity_name']}: ${r['total_climate_value']:,.0f}" for r in top_recipients) + """

TOP LOBBY-FUNDING LOOPS:
""" + "\n".join(f"- {r['org_name']}: {r['lobby_registration_count']} lobbying reg, ${r['total_climate_value']:,.0f}, score {r['loop_signal_score']:.0f}" for r in top_loops) + """

TOP CLIMATE PROGRAMS:
""" + "\n".join(f"- {r['prog_name_en']}: ${r['total']:,.0f} ({r['grants']} grants)" for r in top_programs)

    return ctx


@router.post("/")
def chat(msg: ChatMessage):
    """Process a chat message about climate spending data"""
    import json, os, logging
    logger = logging.getLogger(__name__)

    context = _get_context()

    system = """You are CarbonTrail's AI analyst. You help users explore Canadian climate spending data interactively.

You have access to the following data context that summarizes the current database. Use it to answer questions factually.

Be concise (under 300 words). Use markdown formatting. Be pro-climate — frame insights as opportunities to strengthen accountability.

When asked about specific organizations, refer to the data context. If the data doesn't contain what's needed, say so honestly.

""" + context

    try:
        import boto3
        client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))
        model = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")

        response = client.invoke_model(
            modelId=model,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 600,
                "system": system,
                "messages": [{"role": "user", "content": msg.message}],
            }),
        )
        body = json.loads(response["body"].read())
        reply = body["content"][0]["text"]
    except Exception as e:
        logger.warning(f"Bedrock chat failed: {e}")
        # Fallback — answer common questions from data
        reply = _fallback_chat(msg.message, context)

    return {"reply": reply}


def _fallback_chat(message: str, context: str) -> str:
    """Rule-based fallback for common questions"""
    msg = message.lower()

    if "top" in msg and ("recipient" in msg or "receive" in msg or "who gets" in msg):
        rows = query("SELECT entity_name, total_climate_value FROM green_recipients ORDER BY total_climate_value DESC LIMIT 5")
        return "**Top 5 Climate Funding Recipients:**\n\n" + "\n".join(
            f"{i+1}. **{r['entity_name']}** — ${r['total_climate_value']:,.0f}" for i, r in enumerate(rows)
        )

    if "loop" in msg or "lobby" in msg:
        rows = query("SELECT org_name, lobby_registration_count, total_climate_value, loop_signal_score FROM lobby_funding_loops WHERE loop_signal_score > 0 ORDER BY loop_signal_score DESC LIMIT 5")
        return "**Top 5 Lobby-Funding Loops:**\n\n" + "\n".join(
            f"{i+1}. **{r['org_name']}** — {r['lobby_registration_count']} lobby reg, ${r['total_climate_value']:,.0f}, score {r['loop_signal_score']:.0f}" for i, r in enumerate(rows)
        )

    if "program" in msg:
        rows = query("SELECT prog_name_en, SUM(agreement_value) as total FROM grants WHERE is_climate_relevant AND prog_name_en IS NOT NULL GROUP BY prog_name_en ORDER BY total DESC LIMIT 5")
        return "**Top 5 Climate Programs by Funding:**\n\n" + "\n".join(
            f"{i+1}. **{r['prog_name_en']}** — ${r['total']:,.0f}" for i, r in enumerate(rows)
        )

    if "province" in msg or "where" in msg:
        rows = query("SELECT recipient_province, SUM(agreement_value) as total FROM grants WHERE is_climate_relevant AND recipient_province IS NOT NULL GROUP BY recipient_province ORDER BY total DESC LIMIT 10")
        return "**Climate Funding by Province:**\n\n" + "\n".join(
            f"- **{r['recipient_province']}**: ${r['total']:,.0f}" for r in rows
        )

    return "I can answer questions about:\n\n- **Top recipients** of climate funding\n- **Lobby-funding loops** and signals\n- **Climate programs** and their funding\n- **Provincial distribution** of climate grants\n- **Specific organizations** (search by name)\n\nTry asking: *\"Who are the top recipients?\"* or *\"Show me the biggest lobby loops\"*"
