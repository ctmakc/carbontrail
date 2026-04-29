"""
CarbonTrail AI Service — AWS Bedrock / Claude
Generates human-readable explanations for climate spending patterns.
"""
import json
import os
import logging

logger = logging.getLogger(__name__)

# Try to import boto3 for Bedrock
try:
    import boto3
    HAS_BEDROCK = True
except ImportError:
    HAS_BEDROCK = False

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SYSTEM_PROMPT = """You are CarbonTrail's climate spending analyst. You analyze patterns in Canadian public climate funding data — contracts, grants, and lobbying registrations.

Your role:
- Explain patterns found in the data in clear, accessible language
- Be pro-climate: frame findings as opportunities to strengthen accountability, NOT as attacks on climate spending
- Use careful language: "review signal", "pattern worth examining", "may warrant closer review"
- Never accuse anyone of wrongdoing — present facts and let the reader draw conclusions
- Always note that lobbying is legal and often appropriate
- Emphasize that transparency strengthens public trust in climate investments

Format your responses in concise paragraphs. Use markdown sparingly (bold for emphasis only). Keep responses under 300 words."""


def _get_client():
    if not HAS_BEDROCK:
        return None
    try:
        return boto3.client("bedrock-runtime", region_name=AWS_REGION)
    except Exception as e:
        logger.warning(f"Bedrock client init failed: {e}")
        return None


def explain_pattern(pattern_type: str, data: dict) -> str:
    """Generate AI explanation for a climate spending pattern."""
    client = _get_client()
    if client is None:
        return _fallback_explanation(pattern_type, data)

    prompts = {
        "lobby_loop": f"""Analyze this lobby-to-funding loop in Canadian climate spending:

Organization: {data.get('org_name', 'Unknown')}
Lobbying registrations targeting climate departments: {data.get('lobby_count', 0)}
Climate grants received: ${data.get('grant_value', 0):,.0f} ({data.get('grant_count', 0)} grants)
Climate contracts received: ${data.get('contract_value', 0):,.0f} ({data.get('contract_count', 0)} contracts)
Sole-source contracts: {data.get('sole_source_count', 0)}
Receives government funding: {data.get('receives_govt_funding', False)}
Signal score: {data.get('signal_score', 0)}/100

Explain what this pattern means, why it deserves review, and what legitimate explanations might exist.""",

        "greenwash_signal": f"""Analyze this potential greenwashing signal in Canadian climate lobbying:

Organization: {data.get('org_name', 'Unknown')}
Total lobbying registrations: {data.get('registration_count', 0)}
Signal type: {data.get('signal_type', 'unknown')}
Lobbies on environment: {data.get('any_environment', False)}
Lobbies on energy: {data.get('any_energy', False)}
Lobbies on taxation: {data.get('any_taxation_trade', False)}
Subject breadth: {data.get('max_subject_breadth', 0)} areas
Climate funding received: ${data.get('climate_funding', 0):,.0f}

Explain what this lobbying pattern might indicate and why it's flagged.""",

        "recipient_profile": f"""Provide a brief climate funding profile for this organization:

Name: {data.get('entity_name', 'Unknown')}
Province: {data.get('province', 'Unknown')}
Climate grants: ${data.get('grant_value', 0):,.0f} ({data.get('grant_count', 0)} grants across {data.get('grant_programs', 0)} programs)
Climate contracts: ${data.get('contract_value', 0):,.0f} ({data.get('contract_count', 0)} contracts)
Sole-source contracts: {data.get('sole_source_count', 0)}
Total climate funding: ${data.get('total_climate_value', 0):,.0f}
Receives both grants and contracts: {data.get('dual_recipient', False)}

Summarize what this entity's relationship to climate spending looks like and note anything worth reviewing.""",

        "funding_gap": f"""Analyze this climate funding distribution pattern:

Province: {data.get('province', 'Unknown')}
Total climate grants: ${data.get('total_value', 0):,.0f}
Number of grants: {data.get('grant_count', 0)}
Recipients: {data.get('recipient_count', 0)}
Programs available: {data.get('program_count', 0)}
National rank by funding: {data.get('rank', 'N/A')}

Comment on whether this province appears well-served by climate funding relative to its needs.""",

        "general": f"""Analyze this climate spending data point:

{json.dumps(data, indent=2, default=str)}

Provide a brief, balanced analysis.""",
    }

    prompt = prompts.get(pattern_type, prompts["general"])

    try:
        response = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        body = json.loads(response["body"].read())
        return body["content"][0]["text"]
    except Exception as e:
        logger.error(f"Bedrock call failed: {e}")
        return _fallback_explanation(pattern_type, data)


def _fallback_explanation(pattern_type: str, data: dict) -> str:
    """Rule-based fallback when Bedrock is unavailable."""
    name = data.get("org_name") or data.get("entity_name") or "This organization"

    if pattern_type == "lobby_loop":
        parts = [f"**{name}** has {data.get('lobby_count', 0)} lobbying registrations targeting climate-related departments"]
        gv = data.get("grant_value", 0)
        cv = data.get("contract_value", 0)
        if gv > 0:
            parts.append(f"and received ${gv:,.0f} in climate grants")
        if cv > 0:
            parts.append(f"plus ${cv:,.0f} in climate contracts")
        parts.append("from those same departments.")
        ss = data.get("sole_source_count", 0)
        if ss > 0:
            parts.append(f"Of these, {ss} were sole-source contracts — worth reviewing whether competitive processes were available.")
        parts.append("Lobbying is legal and often helps government access industry expertise. However, the combination of active lobbying and significant funding from the same departments is a standard review signal in public accountability work.")
        return " ".join(parts)

    elif pattern_type == "greenwash_signal":
        st = data.get("signal_type", "")
        if st == "energy_tax_nexus":
            return f"**{name}** lobbies on both energy policy and taxation — a pattern that may indicate seeking regulatory relief alongside climate engagement. This is common among energy companies navigating the transition, but the combination deserves scrutiny when paired with climate funding."
        else:
            breadth = data.get("max_subject_breadth", 0)
            return f"**{name}** lobbies across {breadth} subject areas including environment and energy. Broad-spectrum lobbying often indicates a large organization with diverse regulatory interests. Worth reviewing whether their climate-related activities align with their broader lobbying positions."

    elif pattern_type == "recipient_profile":
        tv = data.get("total_climate_value", 0)
        dual = data.get("dual_recipient", False)
        text = f"**{name}** has received ${tv:,.0f} in climate-related public funding."
        if dual:
            text += " Notably, they receive both grants and contracts from climate departments — a dual relationship that may reflect deep sector engagement, but also warrants review for potential over-concentration."
        return text

    return f"Pattern detected for {name}. Review the underlying data for context."
