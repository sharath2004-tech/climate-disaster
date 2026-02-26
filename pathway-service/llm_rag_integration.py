"""
Pathway + LLM RAG Integration for Context-Aware Disaster Response
Implements real-time Retrieval-Augmented Generation using Pathway
Based on: https://pathway.com/developers/templates (LLM Examples)
"""

import pathway as pw
import os
import json
import logging
from typing import List, Dict, Any
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


# ============================================================================
# KNOWLEDGE BASE SCHEMA
# ============================================================================

class DisasterKnowledgeBase(pw.Schema):
    """Schema for disaster response knowledge base"""
    doc_id: str
    category: str  # evacuation, first_aid, weather, shelter
    title: str
    content: str
    keywords: str
    priority: int  # 1-10, higher = more critical


class UserQuery(pw.Schema):
    """Schema for user queries"""
    query_id: str
    timestamp: int
    user_id: str
    query_text: str
    location: str
    latitude: float
    longitude: float


class ContextualResponse(pw.Schema):
    """Schema for AI-generated responses with context"""
    query_id: str
    timestamp: int
    query_text: str
    response_text: str
    context_docs: str  # JSON array of relevant docs
    confidence: float
    sources: str


# ============================================================================
# VECTOR SIMILARITY & DOCUMENT RETRIEVAL
# ============================================================================

class DocumentRetriever:
    """Retrieve relevant documents from knowledge base"""
    
    @staticmethod
    def simple_similarity(query: str, doc_content: str, doc_keywords: str) -> float:
        """
        Simple keyword-based similarity (in production, use embeddings)
        For real deployments, integrate with:
        - OpenAI embeddings
        - Sentence-transformers
        - Pathway's built-in vector search
        """
        query_lower = query.lower()
        content_lower = doc_content.lower()
        keywords_lower = doc_keywords.lower()
        
        # Count matching words
        query_words = set(query_lower.split())
        content_words = set(content_lower.split())
        keyword_words = set(keywords_lower.split())
        
        # Calculate overlap
        content_overlap = len(query_words & content_words) / max(len(query_words), 1)
        keyword_overlap = len(query_words & keyword_words) / max(len(query_words), 1)
        
        # Weighted similarity
        similarity = (content_overlap * 0.6) + (keyword_overlap * 0.4)
        
        return similarity
    
    @staticmethod
    def retrieve_top_k(query: str, knowledge_base: List[Dict], k: int = 3) -> List[Dict]:
        """Retrieve top-k most relevant documents"""
        
        scored_docs = []
        for doc in knowledge_base:
            similarity = DocumentRetriever.simple_similarity(
                query,
                doc.get("content", ""),
                doc.get("keywords", "")
            )
            scored_docs.append({
                **doc,
                "similarity_score": similarity
            })
        
        # Sort by similarity and priority
        scored_docs.sort(
            key=lambda x: (x["similarity_score"], x.get("priority", 0)),
            reverse=True
        )
        
        return scored_docs[:k]


# ============================================================================
# LLM INTEGRATION
# ============================================================================

class LLMProvider:
    """Interface for different LLM providers"""
    
    @staticmethod
    def call_openrouter(prompt: str, model: str = "meta-llama/llama-3.1-8b-instruct") -> str:
        """Call OpenRouter API"""
        
        if not OPENROUTER_API_KEY:
            return "Error: OpenRouter API key not configured"
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are SKYNETRA, an AI disaster response assistant. Provide clear, actionable safety information."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            return f"Error generating response: {str(e)}"
    
    @staticmethod
    def call_groq(prompt: str, model: str = "llama-3.1-8b-instant") -> str:
        """Call Groq API (faster inference)"""
        
        if not GROQ_API_KEY:
            return "Error: Groq API key not configured"
        
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are SKYNETRA, an AI disaster response assistant. Provide clear, actionable safety information."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return f"Error generating response: {str(e)}"
    
    @staticmethod
    def generate_response(prompt: str) -> str:
        """Generate response using available LLM provider"""
        
        # Try Groq first (faster)
        if GROQ_API_KEY:
            return LLMProvider.call_groq(prompt)
        
        # Fallback to OpenRouter
        if OPENROUTER_API_KEY:
            return LLMProvider.call_openrouter(prompt)
        
        # No API keys available
        return "Error: No LLM API keys configured. Set GROQ_API_KEY or OPENROUTER_API_KEY."


# ============================================================================
# RAG PIPELINE WITH PATHWAY
# ============================================================================

def build_rag_prompt(query: str, context_docs: List[Dict]) -> str:
    """Build RAG prompt with retrieved context"""
    
    context_text = "\n\n".join([
        f"Document {i+1} ({doc['category']}):\n{doc['content']}"
        for i, doc in enumerate(context_docs)
    ])
    
    prompt = f"""You are SKYNETRA, an AI disaster response assistant for India.

Based on the following context documents, answer the user's question accurately and helpfully.

CONTEXT DOCUMENTS:
{context_text}

USER QUESTION:
{query}

Provide a clear, actionable response. If the context doesn't fully answer the question, use your general knowledge but prioritize the provided context. Include specific steps and safety advice when relevant."""
    
    return prompt


def process_query_with_rag(
    query_table: pw.Table,
    knowledge_base: List[Dict]
) -> pw.Table:
    """
    Process queries using RAG with Pathway streaming
    """
    
    def generate_contextualized_response(
        query_id: str,
        query_text: str,
        timestamp: int
    ) -> tuple:
        """Generate response with RAG"""
        
        # Step 1: Retrieve relevant documents
        relevant_docs = DocumentRetriever.retrieve_top_k(query_text, knowledge_base, k=3)
        
        # Step 2: Build RAG prompt
        prompt = build_rag_prompt(query_text, relevant_docs)
        
        # Step 3: Generate response using LLM
        response_text = LLMProvider.generate_response(prompt)
        
        # Step 4: Package results
        sources = ", ".join([doc["title"] for doc in relevant_docs])
        confidence = sum([doc["similarity_score"] for doc in relevant_docs]) / len(relevant_docs)
        
        return (
            query_id,
            timestamp,
            query_text,
            response_text,
            json.dumps([{
                "title": doc["title"],
                "category": doc["category"],
                "similarity": doc["similarity_score"]
            } for doc in relevant_docs]),
            confidence,
            sources
        )
    
    # Apply RAG to each query
    responses = query_table.select(
        *pw.apply(
            generate_contextualized_response,
            pw.this.query_id,
            pw.this.query_text,
            pw.this.timestamp
        )
    )
    
    return responses


# ============================================================================
# REAL-TIME CONTEXT ENRICHMENT
# ============================================================================

def enrich_with_weather_context(
    query_table: pw.Table,
    weather_table: pw.Table
) -> pw.Table:
    """
    Enrich user queries with current weather context
    Demonstrates Pathway's join capabilities
    """
    
    # Join queries with weather based on location proximity
    # This is simplified - in production, use spatial joins
    
    enriched = query_table.select(
        *pw.this,
        # Add weather context from nearby stations
        # (This would use proper geospatial joins in production)
    )
    
    return enriched


def enrich_with_risk_context(
    query_table: pw.Table,
    risk_predictions_table: pw.Table
) -> pw.Table:
    """
    Enrich user queries with current risk predictions
    """
    
    # Join queries with risk predictions for their location
    enriched = query_table.select(
        *pw.this,
        # Add risk assessment context
    )
    
    return enriched


# ============================================================================
# SAMPLE KNOWLEDGE BASE
# ============================================================================

def load_sample_knowledge_base() -> List[Dict]:
    """Load sample disaster response knowledge base"""
    
    knowledge_base = [
        {
            "doc_id": "KB001",
            "category": "flood",
            "title": "Flood Safety Guidelines",
            "content": """During a flood:
1. Move to higher ground immediately
2. Avoid walking or driving through flood waters
3. Turn off utilities if instructed
4. Stay informed through official channels
5. Keep emergency supplies ready (water, food, first aid)
6. Do not touch electrical equipment if wet
7. Document damage for insurance claims""",
            "keywords": "flood safety evacuation water flooding emergency rain",
            "priority": 9
        },
        {
            "doc_id": "KB002",
            "category": "fire",
            "title": "Wildfire Evacuation Procedures",
            "content": """When wildfire threatens:
1. Evacuate immediately if ordered
2. Monitor local news and emergency alerts
3. Wear protective clothing and N95 mask
4. Close all windows and doors
5. Take emergency kit, documents, medications
6. Use designated evacuation routes only
7. Never try to outrun a fire
8. Go to designated evacuation centers""",
            "keywords": "fire wildfire evacuation smoke emergency burn",
            "priority": 10
        },
        {
            "doc_id": "KB003",
            "category": "shelter",
            "title": "Emergency Shelter Information",
            "content": """Emergency shelters provide:
- Safe temporary accommodation
- Basic food and water
- Medical assistance
- Communication facilities
- Information updates
To find nearest shelter:
1. Check emergency alerts
2. Call local disaster helpline
3. Visit municipal website
4. Ask local authorities
Bring: ID, medications, important documents, phone charger""",
            "keywords": "shelter emergency accommodation safety refuge helpline",
            "priority": 8
        },
        {
            "doc_id": "KB004",
            "category": "first_aid",
            "title": "Basic First Aid During Disasters",
            "content": """Essential first aid steps:
1. Check scene safety first
2. Call emergency services (112 in India)
3. For bleeding: Apply pressure, elevate wound
4. For burns: Cool with water, cover with clean cloth
5. For fractures: Immobilize, don't move unnecessarily
6. For shock: Keep warm, elevate legs
7. CPR: 30 compressions, 2 breaths
Keep first aid kit with: bandages, antiseptic, pain relievers, emergency numbers""",
            "keywords": "first aid medical injury treatment emergency health cpr",
            "priority": 9
        },
        {
            "doc_id": "KB005",
            "category": "weather",
            "title": "Understanding Weather Alerts",
            "content": """Weather alert levels in India:
- Green: No warning, normal weather
- Yellow: Be aware, weather may cause disruption
- Orange: Be prepared, dangerous weather likely
- Red: Take action, very dangerous weather
Monitor IMD (India Meteorological Department) for:
- Cyclone warnings
- Heavy rainfall alerts
- Heat wave advisories
- Extreme weather predictions
Download official weather apps and enable emergency alerts on your phone.""",
            "keywords": "weather alert warning cyclone rainfall imd meteorological forecast",
            "priority": 7
        },
        {
            "doc_id": "KB006",
            "category": "evacuation",
            "title": "Evacuation Kit Essentials",
            "content": """Emergency evacuation kit should include:
DOCUMENTS: ID cards, property papers, insurance, medical records
SUPPLIES: Water (3 days), non-perishable food, first aid kit
CLOTHING: Weather-appropriate clothes, sturdy shoes, rain gear
TOOLS: Flashlight, batteries, radio, phone charger, power bank
HYGIENE: Toiletries, medications, sanitary items
IMPORTANT: Cash, emergency contacts list, local maps
Keep kit in waterproof container, easily accessible location.
Update every 6 months.""",
            "keywords": "evacuation kit emergency supplies preparedness documents food water",
            "priority": 8
        }
    ]
    
    return knowledge_base


# ============================================================================
# MAIN RAG PIPELINE
# ============================================================================

def run_rag_pipeline():
    """
    Run Pathway RAG pipeline for disaster response
    """
    
    logger.info("=" * 70)
    logger.info("🤖 PATHWAY + LLM RAG PIPELINE")
    logger.info("=" * 70)
    
    # Load knowledge base
    knowledge_base = load_sample_knowledge_base()
    logger.info(f"✓ Loaded {len(knowledge_base)} documents into knowledge base")
    
    # Create output directory
    os.makedirs("./output", exist_ok=True)
    
    # Setup input connector for user queries
    # In production, this would be HTTP endpoint or Kafka stream
    sample_queries = [
        {
            "query_id": "Q001",
            "timestamp": int(datetime.now().timestamp()),
            "user_id": "user123",
            "query_text": "How do I prepare for a flood?",
            "location": "Mumbai",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        {
            "query_id": "Q002",
            "timestamp": int(datetime.now().timestamp()),
            "user_id": "user456",
            "query_text": "What should I do if a wildfire approaches my area?",
            "location": "Bengaluru",
            "latitude": 12.9716,
            "longitude": 77.5946
        },
        {
            "query_id": "Q003",
            "timestamp": int(datetime.now().timestamp()),
            "user_id": "user789",
            "query_text": "Where can I find emergency shelter?",
            "location": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090
        }
    ]
    
    # Create query table
    query_table = pw.debug.table_from_rows(
        schema=UserQuery,
        rows=[
            (
                q["query_id"],
                q["timestamp"],
                q["user_id"],
                q["query_text"],
                q["location"],
                q["latitude"],
                q["longitude"]
            )
            for q in sample_queries
        ]
    )
    
    logger.info(f"✓ Created query stream with {len(sample_queries)} queries")
    
    # Process queries with RAG
    logger.info("⚙️  Processing queries with RAG...")
    responses = process_query_with_rag(query_table, knowledge_base)
    
    # Write responses
    pw.io.jsonlines.write(responses, "./output/rag_responses.jsonl")
    logger.info("✓ RAG responses written to: ./output/rag_responses.jsonl")
    
    logger.info("=" * 70)
    logger.info("✅ RAG Pipeline Ready!")
    logger.info("=" * 70)
    logger.info("\n💡 To use in production:")
    logger.info("  1. Replace sample queries with HTTP input connector")
    logger.info("  2. Use proper vector embeddings for document retrieval")
    logger.info("  3. Integrate with your LLM provider (OpenRouter, Groq, etc.)")
    logger.info("  4. Add caching for frequently asked questions")
    logger.info("=" * 70)
    
    return responses


if __name__ == "__main__":
    from datetime import datetime
    
    # Run RAG pipeline
    responses = run_rag_pipeline()
    
    # Start Pathway engine
    logger.info("🚀 Starting Pathway computation engine...")
    pw.run(monitoring_level=pw.MonitoringLevel.ALL)
