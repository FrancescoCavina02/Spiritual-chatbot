#!/usr/bin/env python3
"""
Test and compare LLM providers (OpenAI, Anthropic, Google, Ollama)
Tests performance, quality, and response time
"""

import asyncio
import time
import json
from typing import Dict, Any
import requests

API_BASE_URL = "http://127.0.0.1:8000"

# Test queries at different complexity levels
TEST_QUERIES = [
    {
        "name": "Simple Question",
        "query": "What is mindfulness?",
        "expected_length": "short"
    },
    {
        "name": "Moderate Complexity",
        "query": "How can I develop a daily meditation practice?",
        "expected_length": "medium"
    },
    {
        "name": "Complex Philosophical",
        "query": "What spiritual practices can help with fear and anxiety, and how do they work according to Buddhist and Taoist philosophy?",
        "expected_length": "long"
    }
]

PROVIDERS = ["openai", "anthropic", "google", "ollama"]


def test_health_check():
    """Test API health"""
    print("=" * 80)
    print("HEALTH CHECK")
    print("=" * 80)
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        health_data = response.json()
        
        print(f"✓ API Status: {health_data['status']}")
        print(f"✓ Services:")
        for service, status in health_data['services'].items():
            print(f"  - {service}: {status}")
        print()
        
        return health_data['status'] == 'healthy'
    
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_semantic_search():
    """Test semantic search"""
    print("=" * 80)
    print("SEMANTIC SEARCH TEST")
    print("=" * 80)
    
    query = "meditation and inner peace"
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_BASE_URL}/api/search",
            json={"query": query, "top_k": 5}
        )
        elapsed = time.time() - start_time
        
        results = response.json()
        
        print(f"Query: '{query}'")
        print(f"Results found: {results['total_results']}")
        print(f"Processing time: {elapsed:.2f}s")
        print("\nTop 3 Results:")
        
        for i, result in enumerate(results['results'][:3], 1):
            print(f"\n{i}. {result['title']} ({result['category']})")
            print(f"   Book: {result['book']}")
            print(f"   Relevance: {result['relevance_score']:.3f}")
            print(f"   Snippet: {result['text'][:100]}...")
        
        print("\n✓ Semantic search working\n")
        return True
    
    except Exception as e:
        print(f"✗ Semantic search failed: {e}\n")
        return False


def test_chat_provider(provider: str, query: str, timeout: int = 120) -> Dict[str, Any]:
    """Test a specific LLM provider"""
    print(f"\n--- Testing {provider.upper()} ---")
    print(f"Query: {query}")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE_URL}/api/chat",
            json={
                "message": query,
                "provider": provider,
                "stream": False
            },
            timeout=timeout
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            response_text = result['message']
            citations = result.get('citations', [])
            
            print(f"✓ Response received in {elapsed:.2f}s")
            print(f"✓ Response length: {len(response_text)} characters")
            print(f"✓ Citations: {len(citations)}")
            print(f"\nResponse preview:")
            print(response_text[:300] + "..." if len(response_text) > 300 else response_text)
            
            if citations:
                print(f"\nTop 3 Citations:")
                for i, cite in enumerate(citations[:3], 1):
                    print(f"  {i}. {cite['title']} ({cite['category']}) - {cite['relevance_score']:.3f}")
            
            return {
                "success": True,
                "provider": provider,
                "response_time": elapsed,
                "response_length": len(response_text),
                "citation_count": len(citations),
                "response": response_text
            }
        else:
            print(f"✗ Request failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return {
                "success": False,
                "provider": provider,
                "error": response.text
            }
    
    except requests.exceptions.Timeout:
        print(f"✗ Request timed out after {timeout}s")
        return {
            "success": False,
            "provider": provider,
            "error": "Timeout"
        }
    
    except Exception as e:
        print(f"✗ Error: {e}")
        return {
            "success": False,
            "provider": provider,
            "error": str(e)
        }


def run_comparison_test():
    """Run comprehensive comparison test"""
    print("\n" + "=" * 80)
    print("LLM PROVIDER COMPARISON TEST")
    print("=" * 80 + "\n")
    
    # Test health
    if not test_health_check():
        print("⚠️  API not healthy, aborting tests")
        return
    
    # Test search
    test_semantic_search()
    
    # Test each provider with different queries
    results = []
    
    for test_case in TEST_QUERIES:
        print("\n" + "=" * 80)
        print(f"TEST CASE: {test_case['name']}")
        print("=" * 80)
        
        for provider in PROVIDERS:
            result = test_chat_provider(
                provider,
                test_case['query'],
                timeout=180  # 3 minutes max
            )
            result['test_case'] = test_case['name']
            results.append(result)
            
            # Wait between requests
            time.sleep(2)
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80 + "\n")
    
    successful_results = [r for r in results if r.get('success')]
    
    if successful_results:
        print("Provider Performance:")
        for provider in PROVIDERS:
            provider_results = [r for r in successful_results if r['provider'] == provider]
            if provider_results:
                avg_time = sum(r['response_time'] for r in provider_results) / len(provider_results)
                avg_length = sum(r['response_length'] for r in provider_results) / len(provider_results)
                avg_citations = sum(r['citation_count'] for r in provider_results) / len(provider_results)
                
                print(f"\n{provider.upper()}:")
                print(f"  ✓ Tests passed: {len(provider_results)}")
                print(f"  ⏱️  Avg response time: {avg_time:.2f}s")
                print(f"  📝 Avg response length: {avg_length:.0f} chars")
                print(f"  📚 Avg citations: {avg_citations:.1f}")
            else:
                print(f"\n{provider.upper()}:")
                print(f"  ✗ No successful tests")
    
    # Save detailed results
    output_file = "test_results_llm_comparison.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Detailed results saved to {output_file}")


def quick_test_openai():
    """Quick test of OpenAI only"""
    print("=" * 80)
    print("QUICK OPENAI TEST")
    print("=" * 80 + "\n")
    
    if not test_health_check():
        return
    
    query = "What is the essence of mindfulness according to my notes?"
    print(f"Testing OpenAI with query: '{query}'\n")
    
    result = test_chat_provider("openai", query, timeout=30)
    
    if result['success']:
        print("\n" + "=" * 80)
        print("✓ OpenAI TEST SUCCESSFUL")
        print("=" * 80)
        print(f"Response time: {result['response_time']:.2f}s")
        print(f"Response quality: Good" if result['response_length'] > 200 else "Response quality: Short")
        print("\n🎉 OpenAI integration working perfectly!")
    else:
        print("\n" + "=" * 80)
        print("✗ OPENAI TEST FAILED")
        print("=" * 80)
        print(f"Error: {result.get('error', 'Unknown error')}")
        print("\n⚠️  Check your API key and server configuration")


if __name__ == "__main__":
    import sys
    
    print("\n🤖 LLM Provider Testing Tool\n")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        # Quick test - just OpenAI
        quick_test_openai()
    else:
        # Full comparison test
        print("Running full comparison test (this may take several minutes)...")
        print("Use '--quick' flag for fast OpenAI-only test\n")
        run_comparison_test()
    
    print("\n✨ Testing complete!\n")

