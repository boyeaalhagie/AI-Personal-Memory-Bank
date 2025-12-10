"""
Script to manually trigger emotion tagging for photos that don't have emotions yet
"""
import requests
import json
import time

def retag_photos():
    """Retag all photos without emotions"""
    print("=" * 60)
    print("MANUAL PHOTO RETAGGING SCRIPT")
    print("=" * 60)
    
    # 1. Get all photos
    print("\n1. Fetching photos...")
    try:
        response = requests.get("http://localhost:8001/photos?user_id=default", timeout=10)
        if response.status_code != 200:
            print(f"   ✗ Failed to fetch photos: {response.status_code}")
            return
        
        data = response.json()
        photos = data.get('photos', [])
        print(f"   ✓ Found {len(photos)} total photos")
        
        # Filter photos without emotions
        photos_without_emotion = [p for p in photos if not p.get('emotion')]
        print(f"   Photos without emotions: {len(photos_without_emotion)}")
        
        if len(photos_without_emotion) == 0:
            print("\n   ✓ All photos already have emotions!")
            return
        
        # 2. Check emotion service health
        print("\n2. Checking emotion service...")
        health_response = requests.get("http://localhost:8002/health", timeout=5)
        if health_response.status_code == 200:
            health = health_response.json()
            if not health.get('openai_initialized'):
                print("   ⚠ WARNING: OpenAI client not initialized!")
                print("   Emotion service may not be able to process photos.")
                response = input("\n   Continue anyway? (y/n): ")
                if response.lower() != 'y':
                    print("   Aborted.")
                    return
        else:
            print("   ✗ Emotion service not responding!")
            return
        
        # 3. Retag photos
        print(f"\n3. Retagging {len(photos_without_emotion)} photos...")
        print("   This may take a while (a few seconds per photo)...\n")
        
        success_count = 0
        fail_count = 0
        
        for i, photo in enumerate(photos_without_emotion, 1):
            photo_id = photo['id']
            file_path = photo['file_path']
            
            print(f"   [{i}/{len(photos_without_emotion)}] Processing photo ID {photo_id}...", end=' ', flush=True)
            
            try:
                # Call emotion service
                response = requests.post(
                    "http://localhost:8002/tag-photo",
                    json={
                        "photo_id": photo_id,
                        "file_path": file_path
                    },
                    timeout=120  # 2 minute timeout per photo
                )
                
                if response.status_code == 200:
                    result = response.json()
                    emotion = result.get('emotion', 'unknown')
                    confidence = result.get('emotion_confidence', 0)
                    print(f"✓ {emotion} (confidence: {confidence:.2f})")
                    success_count += 1
                else:
                    print(f"✗ Failed: {response.status_code} - {response.text[:100]}")
                    fail_count += 1
                
                # Small delay to avoid overwhelming the service
                time.sleep(1)
                
            except Exception as e:
                print(f"✗ Error: {str(e)[:100]}")
                fail_count += 1
        
        # 4. Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"   Successfully tagged: {success_count}")
        print(f"   Failed: {fail_count}")
        print("\n   Refresh your browser to see the emotion icons!")
    except Exception as e:
        print(f"\n✗ Error in retag_photos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        retag_photos()
    except KeyboardInterrupt:
        print("\n\nProcess interrupted by user")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

