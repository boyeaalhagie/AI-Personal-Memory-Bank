"""
Diagnostic script to test emotion service functionality
"""
import requests
import json
import sys

def test_emotion_service():
    """Test if emotion service is working"""
    print("=" * 60)
    print("EMOTION SERVICE DIAGNOSTIC TEST")
    print("=" * 60)
    
    # 1. Check if emotion service is running
    print("\n1. Checking emotion service health...")
    try:
        response = requests.get("http://localhost:8002/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"   ✓ Emotion service is running")
            print(f"   Status: {health.get('status')}")
            print(f"   OpenAI initialized: {health.get('openai_initialized')}")
            if not health.get('openai_initialized'):
                print("   ⚠ WARNING: OpenAI client not initialized!")
        else:
            print(f"   ✗ Emotion service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to emotion service at http://localhost:8002")
        print("   Make sure emotion-service is running!")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # 2. Check if upload service is running
    print("\n2. Checking upload service...")
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("   ✓ Upload service is running")
        else:
            print(f"   ✗ Upload service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to upload service at http://localhost:8001")
        return False
    
    # 3. Check photos in database
    print("\n3. Checking photos in database...")
    try:
        response = requests.get("http://localhost:8001/photos?user_id=default", timeout=5)
        if response.status_code == 200:
            data = response.json()
            photos = data.get('photos', [])
            print(f"   Found {len(photos)} photos")
            
            if len(photos) == 0:
                print("   ⚠ No photos found. Upload a photo first!")
                return True
            
            # Count photos with/without emotions
            with_emotion = [p for p in photos if p.get('emotion')]
            without_emotion = [p for p in photos if not p.get('emotion')]
            
            print(f"   Photos with emotion: {len(with_emotion)}")
            print(f"   Photos without emotion: {len(without_emotion)}")
            
            if without_emotion:
                print(f"\n   Photos waiting for emotion tagging:")
                for photo in without_emotion[:5]:  # Show first 5
                    print(f"     - Photo ID {photo['id']}: {photo.get('file_path')}")
                
                if len(without_emotion) > 1:
                    print(f"\n   ⚠ {len(without_emotion)} photos are missing emotions.")
                    print(f"   This could mean:")
                    print(f"     - Emotion service is still processing them")
                    print(f"     - Emotion service failed to process them")
                    print(f"     - Emotion service is not running/wasn't running when photos were uploaded")
            
            if with_emotion:
                print(f"\n   Photos with emotions:")
                for photo in with_emotion[:5]:  # Show first 5
                    print(f"     - Photo ID {photo['id']}: {photo.get('emotion')} "
                          f"(confidence: {photo.get('emotion_confidence', 'N/A')})")
        else:
            print(f"   ✗ Failed to fetch photos: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 4. Test emotion service directly (if we have a photo without emotion)
    print("\n4. Recommendations:")
    if without_emotion and len(without_emotion) > 0:
        test_photo = without_emotion[0]
        print(f"   - Try manually triggering emotion tagging for photo ID {test_photo['id']}")
        print(f"   - Check emotion service logs for errors")
        print(f"   - Verify OpenAI API key is valid")
        print(f"   - Make sure file exists at: {test_photo.get('file_path')}")
    
    print("\n" + "=" * 60)
    return True

if __name__ == "__main__":
    try:
        test_emotion_service()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)

