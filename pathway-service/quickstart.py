"""
Quick Start Script for Pathway Integration
Run this for an instant demo of all Pathway features
"""

import os
import sys
import time
from pathlib import Path

# ANSI color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RED = '\033[91m'
BOLD = '\033[1m'
END = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*70}{END}")
    print(f"{BOLD}{BLUE}{text.center(70)}{END}")
    print(f"{BOLD}{BLUE}{'='*70}{END}\n")

def print_success(text):
    print(f"{GREEN}✓ {text}{END}")

def print_warning(text):
    print(f"{YELLOW}⚠ {text}{END}")

def print_error(text):
    print(f"{RED}✗ {text}{END}")

def print_info(text):
    print(f"{BLUE}ℹ {text}{END}")

def check_environment():
    """Check if environment is properly configured"""
    print_header("ENVIRONMENT CHECK")
    
    # Check Python version
    if sys.version_info >= (3, 9):
        print_success(f"Python version: {sys.version.split()[0]}")
    else:
        print_error(f"Python {sys.version.split()[0]} - Need Python 3.9+")
        return False
    
    # Check required packages
    try:
        import pathway as pw
        print_success(f"Pathway installed: {pw.__version__ if hasattr(pw, '__version__') else 'OK'}")
    except ImportError:
        print_error("Pathway not installed")
        print_info("Install with: pip install pathway")
        return False
    
    # Check environment variables
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        print_success("OpenWeather API key configured")
    else:
        print_warning("OpenWeather API key not set (will use mock data)")
        print_info("Get free key: https://openweathermap.org/api")
    
    llm_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("GROQ_API_KEY")
    if llm_key:
        print_success("LLM API key configured")
    else:
        print_warning("No LLM API key (RAG features disabled)")
    
    # Create output directory
    output_dir = Path("./output")
    output_dir.mkdir(exist_ok=True)
    print_success(f"Output directory: {output_dir.absolute()}")
    
    return True

def demo_menu():
    """Show interactive demo menu"""
    print_header("PATHWAY DISASTER RESPONSE DEMOS")
    
    print(f"{BOLD}Choose a demo to run:{END}\n")
    print(f"  {BOLD}1.{END} Streaming Pipeline - Real-time risk analysis")
    print(f"  {BOLD}2.{END} HTTP Connectors - Data ingestion endpoints")
    print(f"  {BOLD}3.{END} LLM-RAG Integration - AI-powered responses")
    print(f"  {BOLD}4.{END} Advanced Transformations - Complex analytics")
    print(f"  {BOLD}5.{END} Production Pipeline - Complete integrated system")
    print(f"  {BOLD}6.{END} View Documentation")
    print(f"  {BOLD}0.{END} Exit\n")
    
    choice = input(f"{BOLD}Enter choice (0-6): {END}").strip()
    return choice

def run_demo(choice):
    """Run selected demo"""
    
    demos = {
        "1": ("streaming_pipeline.py", "Streaming Risk Analysis"),
        "2": ("http_connectors.py", "HTTP Data Connectors"),
        "3": ("llm_rag_integration.py", "LLM-RAG Integration"),
        "4": ("advanced_transformations.py", "Advanced Transformations"),
        "5": ("production_pipeline.py", "Production Pipeline"),
    }
    
    if choice == "6":
        show_documentation()
        return True
    
    if choice == "0":
        print_info("Goodbye!")
        return False
    
    if choice not in demos:
        print_error("Invalid choice")
        time.sleep(1)
        return True
    
    script, name = demos[choice]
    
    print_header(f"RUNNING: {name}")
    print_info(f"Script: {script}")
    print_info("Press Ctrl+C to stop\n")
    
    time.sleep(2)
    
    try:
        os.system(f"python {script}")
    except KeyboardInterrupt:
        print_warning("\nDemo stopped by user")
    
    input(f"\n{BOLD}Press Enter to continue...{END}")
    return True

def show_documentation():
    """Display documentation"""
    print_header("DOCUMENTATION")
    
    print(f"{BOLD}📚 Official Pathway Resources:{END}")
    print("  • API Docs: https://pathway.com/developers/api-docs/pathway")
    print("  • Examples: https://pathway.com/developers/templates")
    print("  • Tutorials: https://pathway.com/developers/tutorials\n")
    
    print(f"{BOLD}📁 Local Documentation:{END}")
    print("  • PATHWAY_INTEGRATION_GUIDE.md - Complete integration guide")
    print("  • README.md - Project overview\n")
    
    print(f"{BOLD}🆕 Enhanced Files:{END}")
    print("  • streaming_pipeline.py - Core streaming implementation")
    print("  • http_connectors.py - I/O connectors (HTTP, Kafka, CSV)")
    print("  • llm_rag_integration.py - AI-powered RAG")
    print("  • advanced_transformations.py - Complex analytics")
    print("  • production_pipeline.py - Complete integrated system\n")
    
    print(f"{BOLD}🚀 Quick Start:{END}")
    print("  1. Set environment variables:")
    print("     export OPENWEATHER_API_KEY='your-key'")
    print("  2. Run production pipeline:")
    print("     python production_pipeline.py")
    print("  3. Test with curl:")
    print("     curl -X POST http://localhost:8080/ -H 'Content-Type: application/json' -d '{...}'\n")
    
    input(f"{BOLD}Press Enter to continue...{END}")

def main():
    """Main entry point"""
    print_header("PATHWAY INTEGRATION - QUICK START")
    
    print(f"{BOLD}Welcome to the Pathway Disaster Response System!{END}\n")
    print("This interactive demo showcases real-time streaming data processing")
    print("for climate disaster response using Pathway.\n")
    
    # Check environment
    if not check_environment():
        print_error("\nEnvironment check failed. Please fix issues and try again.")
        return 1
    
    print_success("Environment ready!")
    time.sleep(2)
    
    # Interactive demo loop
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        choice = demo_menu()
        
        if not run_demo(choice):
            break
        
        os.system('cls' if os.name == 'nt' else 'clear')
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print_warning("\n\nInterrupted by user")
        sys.exit(0)
