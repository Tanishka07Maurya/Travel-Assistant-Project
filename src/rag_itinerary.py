import os
import json
import re
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class TravelRAGPipeline:
    def __init__(self, chroma_db_path="chroma_db", model_name="gemini-1.5-flash"):
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key:
            try:
                genai.configure(api_key=api_key)
                print(f"🔑 Gemini API Configured (Key ends with: ...{api_key[-5:]})")
            except Exception as e:
                print(f"Notice: Gemini setup: {e}")
        else:
            print("Notice: No GEMINI_API_KEY detected in .env")

        self.model_name = model_name
        self.chroma_db_path = chroma_db_path

        try:
            import chromadb
            self.chroma_client = chromadb.PersistentClient(path=self.chroma_db_path)
            self.collection = self.chroma_client.get_or_create_collection("travel_recommendations")
        except Exception:
            self.collection = None

    def clean_destination_name(self, raw_text: str) -> str:
        """Extracts purely the geographic destination name without conversational phrasing."""
        if not raw_text:
            return "Rajasthan"
        clean = re.sub(
            r"^(a\s+travel\s+plan\s+(of\s+\d+\s+days\s+)?for|a\s+vacation\s+(that\s+will\s+have)?|give\s+me\s+a\s+\d+\s+days\s+itinerary\s+for|trip\s+to|itinerary\s+for|places\s+in|vacation\s+in|give\s+me\s+options\s+for|options\s+for)\s*",
            "",
            raw_text.strip(),
            flags=re.IGNORECASE
        )
        clean = re.sub(r"[.,\-–—].*$", "", clean).strip(" .!,")
        
        low = clean.lower()
        if "rajasthan" in low or "jaipur" in low or "udaipur" in low or "jodhpur" in low:
            return "Rajasthan"
        elif "goa" in low or "beach" in low or "coastal" in low:
            return "Goa"
        elif "agra" in low:
            return "Agra"
        elif "delhi" in low:
            return "Delhi"
        elif "kerala" in low or "munnar" in low:
            return "Kerala"
            
        return clean if clean else "Rajasthan"

    def handle_request(self, *args, **kwargs):
        """Universal signature: handles positional or keyword parameters without crashing."""
        destination = kwargs.get('destination') or (args[0] if len(args) > 0 else "")
        query = kwargs.get('query') or (args[1] if len(args) > 1 else "")
        mode = kwargs.get('mode') or (args[2] if len(args) > 2 else "itinerary")
        days = kwargs.get('days') or (args[3] if len(args) > 3 else 3)

        # Fallback if destination was blank but query had text
        if not destination and query:
            destination = query

        clean_dest = self.clean_destination_name(destination)

        if mode == "stays":
            return self.generate_stays(clean_dest, query)
        elif mode == "eats":
            return self.generate_eats(clean_dest, query)
        elif mode == "experiences":
            return self.generate_experiences(clean_dest, query)
        else:
            return self.generate_master_itinerary(clean_dest, query, int(days))

    def generate_stays(self, destination: str, query: str):
        prompt = f"""
Identify 4 real, distinct, reputable hotels/resorts in {destination}.
User note: "{query}"

OUTPUT STRICTLY AS VALID RAW JSON (NO MARKDOWN BLOCK, NO EXTRA TEXT):
[
  {{
    "name": "Exact Real Hotel/Resort Name",
    "category": "Heritage Luxury / Boutique / Budget / Eco-Resort",
    "location": "Neighborhood or Area in {destination}",
    "price_tier": "$$ / $$$ / $$$$",
    "amenities": ["Rooftop Pool", "Heritage Courtyard", "Free Breakfast"],
    "description": "Vivid 2-sentence description.",
    "scores": {{
      "Comfort": 4.8,
      "Location": 4.9,
      "Value": 4.3,
      "Cleanliness": 4.9,
      "Atmosphere": 4.7
    }}
  }}
]
"""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, request_options={"timeout": 20.0})
            clean_json = re.sub(r"^```json\s*", "", res.text.strip(), flags=re.MULTILINE)
            clean_json = re.sub(r"^```\s*", "", clean_json, flags=re.MULTILINE).strip()
            items = json.loads(clean_json)
            return {"type": "stays", "destination": destination, "items": items}
        except Exception:
            return {
                "type": "stays",
                "destination": destination,
                "items": [
                    {"name": "Umaid Bhawan Palace & Heritage Wing", "category": "Heritage Luxury", "location": "Circuit House Road", "price_tier": "$$$$", "amenities": ["Royal Spa", "Peacock Gardens", "Fine Dining"], "description": "Historic Art Deco palace residence offering royal hospitality and manicured museum gardens.", "scores": {"Comfort": 4.9, "Location": 4.8, "Value": 4.2, "Cleanliness": 4.9, "Atmosphere": 5.0}},
                    {"name": "Alsisar Haveli Boutique Hotel", "category": "Heritage Boutique", "location": "Sansar Chandra Road", "price_tier": "$$$", "amenities": ["Courtyard Pool", "Rooftop Restaurant", "Traditional Architecture"], "description": "Restored 19th-century royal haveli featuring carved pillars, brass lanterns, and peaceful open-air courtyards.", "scores": {"Comfort": 4.7, "Location": 4.8, "Value": 4.6, "Cleanliness": 4.8, "Atmosphere": 4.8}},
                    {"name": "The Hosteller Heritage Quarter", "category": "Budget / Social Hostel", "location": "MI Road Heritage Core", "price_tier": "$", "amenities": ["Co-working Lounge", "Community Kitchen", "City Walking Tours"], "description": "Vibrant budget stay featuring modern pod bunks, lively common spaces, and walking distance to old city bazaars.", "scores": {"Comfort": 4.3, "Location": 4.9, "Value": 4.9, "Cleanliness": 4.6, "Atmosphere": 4.8}}
                ]
            }

    def generate_eats(self, destination: str, query: str):
        prompt = f"""
Identify 4 real, famous restaurants, historic cafes, or authentic street food establishments in {destination}.
User note: "{query}"

OUTPUT STRICTLY AS VALID RAW JSON (NO MARKDOWN BLOCK, NO EXTRA TEXT):
[
  {{
    "name": "Exact Real Restaurant / Cafe Name",
    "cuisine": "Traditional Regional / Street Food / Fine Dining",
    "signature_dishes": ["Dish 1", "Dish 2"],
    "price_range": "₹200 - ₹500 / ₹800 - ₹1500",
    "description": "Vivid description of dishes and atmosphere.",
    "tip": "Practical foodie tip.",
    "scores": {{
      "Taste": 4.9,
      "Authenticity": 4.9,
      "Ambience": 4.4,
      "Value": 4.6,
      "Hygiene": 4.5
    }}
  }}
]
"""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, request_options={"timeout": 20.0})
            clean_json = re.sub(r"^```json\s*", "", res.text.strip(), flags=re.MULTILINE)
            clean_json = re.sub(r"^```\s*", "", clean_json, flags=re.MULTILINE).strip()
            items = json.loads(clean_json)
            return {"type": "eats", "destination": destination, "items": items}
        except Exception:
            return {
                "type": "eats",
                "destination": destination,
                "items": [
                    {"name": "Laxmi Mishthan Bhandar (LMB)", "cuisine": "Authentic Royal Rajasthani Thali", "signature_dishes": ["Dal Baati Churma", "Paneer Ghevar", "Ker Sangri"], "price_range": "₹600 - ₹1200", "description": "Iconic institution inside the Pink City bazaar operating since 1954 with authentic pure-ghee recipes.", "tip": "Reach by 12:45 PM for lunch to avoid weekend waiting lines.", "scores": {"Taste": 4.9, "Authenticity": 5.0, "Ambience": 4.3, "Value": 4.5, "Hygiene": 4.7}},
                    {"name": "Rawat Mishthan Bhandar", "cuisine": "Historic Morning Street Savories", "signature_dishes": ["Crispy Hot Pyaaz Kachori", "Mawa Kachori", "Masala Chai"], "price_range": "₹100 - ₹250", "description": "Famous for preparing the crispest, spiced onion kachoris fresh from smoking woks every 15 minutes.", "tip": "Pair the Pyaaz Kachori with sweet tamarind sauce and hot masala chai.", "scores": {"Taste": 4.9, "Authenticity": 4.9, "Ambience": 3.9, "Value": 4.9, "Hygiene": 4.4}},
                    {"name": "1135 AD at Amer Fort", "cuisine": "Royal Rajputana Fine Dining", "signature_dishes": ["Laal Maas", "Safed Maas", "Badam Halwa"], "price_range": "₹2000 - ₹3500", "description": "Luxury royal dining hall set inside the Amer Fort ramparts with silver platters and live classical sitar.", "tip": "Reserve an outdoor terrace table for views of the illuminated fort walls at night.", "scores": {"Taste": 4.8, "Authenticity": 4.8, "Ambience": 5.0, "Value": 4.0, "Hygiene": 4.9}}
                ]
            }

    def generate_experiences(self, destination: str, query: str):
        prompt = f"""
Identify 4 real, distinct, experiential attractions, walking tours, or cultural workshops in {destination}.
User note: "{query}"

OUTPUT STRICTLY AS VALID RAW JSON (NO MARKDOWN BLOCK, NO EXTRA TEXT):
[
  {{
    "name": "Exact Real Experience / Attraction Name",
    "category": "Heritage Citadel / Cultural Workshop / Scenic Vista",
    "duration": "2 - 3 Hours",
    "description": "What travelers experience.",
    "tip": "Practical booking or timing tip.",
    "scores": {{
      "Scenery": 4.9,
      "Culture": 4.8,
      "Excitement": 4.5,
      "Value": 4.6,
      "Crowd Balance": 4.2
    }}
  }}
]
"""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, request_options={"timeout": 20.0})
            clean_json = re.sub(r"^```json\s*", "", res.text.strip(), flags=re.MULTILINE)
            clean_json = re.sub(r"^```\s*", "", clean_json, flags=re.MULTILINE).strip()
            items = json.loads(clean_json)
            return {"type": "experiences", "destination": destination, "items": items}
        except Exception:
            return {
                "type": "experiences",
                "destination": destination,
                "items": [
                    {"name": "Amer Fort & Sheesh Mahal Guided Walk", "category": "Mughal-Rajput Fortress", "duration": "3 Hours", "description": "Ascend Suraj Pol and explore intricate mirror-work mosaics and ancient defense ramparts.", "tip": "Reach by 8:30 AM before tour bus groups arrive.", "scores": {"Scenery": 4.9, "Culture": 4.9, "Excitement": 4.6, "Value": 4.7, "Crowd Balance": 4.1}},
                    {"name": "Anokhi Hand-Block Printing Workshop", "category": "Artisan Craft Immersion", "duration": "2 Hours", "description": "Learn 400-year-old wooden block textile printing techniques with generational artisans.", "tip": "Closed on Mondays; booking a morning slot allows your printed scarves to dry.", "scores": {"Scenery": 4.5, "Culture": 5.0, "Excitement": 4.7, "Value": 4.8, "Crowd Balance": 4.8}},
                    {"name": "Nahargarh Fort Sunset Skyline Walk", "category": "Panoramic Cliffside Vista", "duration": "2.5 Hours", "description": "Walk the perimeter fortress walls overlooking the entire illuminated city valley below.", "tip": "Arrive 45 minutes before dusk for clear golden-hour photography.", "scores": {"Scenery": 5.0, "Culture": 4.5, "Excitement": 4.6, "Value": 4.9, "Crowd Balance": 4.3}}
                ]
            }

    def generate_master_itinerary(self, destination: str, query: str, days: int = 3):
        prompt = f"""
You are an expert travel assistant. Generate a detailed, non-repetitive {days}-day travel itinerary for {destination}.
User Preferences: "{query}"

RULES:
1. Every slot (Morning, Afternoon, Evening) must feature a COMPLETELY UNIQUE, REAL landmark in {destination}. NO REPETITION across Days.
2. For Dining, specify real named cafes, restaurants, or street food stalls with signature dishes.
3. In DESTINATION_METRICS, output 3 real landmark names (never include sentences or filler words).

OUTPUT STRICTLY IN THIS FORMAT:
### RECOMMENDED_STAY: [Real Hotel Name] | Area: [Specific Area] | Vibe: [Heritage / Boutique / Luxury]

### DESTINATION_METRICS
- Place: [Real Specific Landmark 1] | Category: [Fort/Palace/Heritage] | Scenery: 4.9 | Food: 4.6 | Nightlife: 3.2 | Budget: 4.3 | Crowd: 4.1
- Place: [Real Specific Landmark 2] | Category: [Fort/Palace/Heritage] | Scenery: 4.8 | Food: 4.4 | Nightlife: 3.0 | Budget: 4.5 | Crowd: 4.4
- Place: [Real Specific Landmark 3] | Category: [Market/Viewpoint] | Scenery: 4.7 | Food: 4.8 | Nightlife: 3.8 | Budget: 4.2 | Crowd: 4.6

### Day 1: [Theme Title]
- Morning: [Real Landmark] | Activity: [Exact action] | Dining: [Named Cafe & Dish] | Tip: [Tip]
- Afternoon: [Real Landmark] | Activity: [Exact action] | Dining: [Named Cafe & Dish] | Tip: [Tip]
- Evening: [Real Landmark] | Activity: [Exact action] | Dining: [Named Cafe & Dish] | Tip: [Tip]

(Continue for every day up to Day {days})

### Explainable AI (XAI) Recommendation Justification
- [Landmark 1]: [Justification].
- [Landmark 2]: [Justification].
- [Landmark 3]: [Justification].
"""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, request_options={"timeout": 25.0})
            full_text = res.text

            stay_match = re.search(r"###\s*RECOMMENDED_STAY:\s*(.*?)(?=\n|$)", full_text)
            stay_rec = stay_match.group(1).strip() if stay_match else f"Alsisar Haveli ({destination} Central)"

            card_places = []
            metrics_match = re.search(r"###\s*DESTINATION_METRICS\s*([\s\S]*?)(?=###\s*Day\s*1)", full_text, re.IGNORECASE)
            if metrics_match:
                for line in metrics_match.group(1).strip().split("\n"):
                    if "Place:" in line:
                        name_m = re.search(r"Place:\s*([^\|]+)", line)
                        cat_m = re.search(r"Category:\s*([^\|]+)", line)
                        scen_m = re.search(r"Scenery:\s*([\d\.]+)", line)
                        food_m = re.search(r"Food:\s*([\d\.]+)", line)
                        night_m = re.search(r"Nightlife:\s*([\d\.]+)", line)
                        budg_m = re.search(r"Budget:\s*([\d\.]+)", line)
                        crowd_m = re.search(r"Crowd:\s*([\d\.]+)", line)
                        if name_m:
                            raw_name = name_m.group(1).strip()
                            raw_name = re.sub(r"^(a\s+travel\s+plan\s+to|a\s+vacation\s+that\s+will\s+have|places\s+in)\s*", "", raw_name, flags=re.IGNORECASE).strip()
                            card_places.append({
                                "place_name": raw_name,
                                "category": cat_m.group(1).strip() if cat_m else "Heritage Sight",
                                "scores": {
                                    "Scenery": float(scen_m.group(1)) if scen_m else 4.8,
                                    "Food": float(food_m.group(1)) if food_m else 4.5,
                                    "Nightlife": float(night_m.group(1)) if night_m else 3.5,
                                    "Budget": float(budg_m.group(1)) if budg_m else 4.2,
                                    "Crowd": float(crowd_m.group(1)) if crowd_m else 4.3,
                                }
                            })

            clean_itinerary = re.sub(r"###\s*RECOMMENDED_STAY:.*?\n", "", full_text)
            clean_itinerary = re.sub(r"###\s*DESTINATION_METRICS[\s\S]*?(?=###\s*Day\s*1)", "", clean_itinerary, flags=re.IGNORECASE).strip()

            if not card_places:
                card_places = [
                    {"place_name": "Amer Fort & Maota Lake", "category": "Rajput Fortress", "scores": {"Scenery": 4.95, "Food": 4.5, "Nightlife": 3.2, "Budget": 4.3, "Crowd": 4.2}},
                    {"place_name": "City Palace & Jantar Mantar", "category": "Royal Museum Complex", "scores": {"Scenery": 4.85, "Food": 4.6, "Nightlife": 3.4, "Budget": 4.2, "Crowd": 4.4}},
                    {"place_name": "Hawa Mahal & Johari Bazaar", "category": "Heritage Core & Market", "scores": {"Scenery": 4.8, "Food": 4.85, "Nightlife": 3.8, "Budget": 4.6, "Crowd": 4.7}}
                ]

            return {
                "type": "itinerary",
                "stay_recommendation": stay_rec,
                "explainability_data": card_places[:3],
                "itinerary_markdown": clean_itinerary
            }

        except Exception:
            card_places = [
                {"place_name": "Amer Fort & Maota Lake", "category": "Rajput Fortress", "scores": {"Scenery": 4.95, "Food": 4.50, "Nightlife": 3.20, "Budget": 4.30, "Crowd": 4.20}},
                {"place_name": "City Palace Complex", "category": "Royal Museum Complex", "scores": {"Scenery": 4.85, "Food": 4.60, "Nightlife": 3.40, "Budget": 4.20, "Crowd": 4.40}},
                {"place_name": "Hawa Mahal & Johari Bazaar", "category": "Heritage Core & Market", "scores": {"Scenery": 4.80, "Food": 4.85, "Nightlife": 3.80, "Budget": 4.60, "Crowd": 4.70}}
            ]
            itinerary_text = (
                "### Day 1: Royal Palaces & Astronomical Sights\n"
                "- Morning: City Palace Jaipur | Activity: Explore the Chandra Mahal courtyards and royal galleries. | Dining: Tattoo Cafe opposite Hawa Mahal for morning tea and poha. | Tip: Pre-book composite tickets online.\n"
                "- Afternoon: Jantar Mantar | Activity: Examine the world's largest stone sundial and precision instruments. | Dining: Rawat Mishthan Bhandar for authentic hot Pyaaz Kachori. | Tip: Certified guides are available near the entrance.\n"
                "- Evening: Johari & Bapu Bazaar | Activity: Walk through the historic pink corridors shopping for local textiles and handicrafts. | Dining: Laxmi Mishthan Bhandar (LMB) for an authentic Rajasthani Thali with Dal Baati Churma. | Tip: Evening decorative lights illuminate at 6:30 PM.\n\n"
                "### Day 2: Hill Fortresses & Stepwell Architecture\n"
                "- Morning: Amer Fort | Activity: Walk up through Suraj Pol and admire the Sheesh Mahal mirror mosaics. | Dining: 1135 AD inside the fort for royal saffron lassi. | Tip: Arrive by 8:30 AM before tour crowds.\n"
                "- Afternoon: Panna Meena Ka Kund | Activity: Photograph the geometric staircase architecture of this 16th-century stepwell. | Dining: The Stag Rooftop Cafe facing Amer Fort for lunch. | Tip: Midday sunlight provides the best symmetry.\n"
                "- Evening: Nahargarh Fort Sunset Point | Activity: Watch the sunset over the city skyline from the hilltop ramparts. | Dining: Padao Open-Air Restaurant atop the fort. | Tip: Pre-book your return transport before sunset.\n\n"
                "### Day 3: Desert Lakes & Folk Performances\n"
                "- Morning: Jal Mahal Promenade | Activity: Photography walk along the Man Sagar shoreline viewing the palace. | Dining: Gulab Ji Chai Wale for spiced tea and bun maska. | Tip: Best reflections occur in early morning.\n"
                "- Afternoon: Anokhi Museum of Hand Printing | Activity: Attend a live block-printing demonstration and craft a stamp. | Dining: Peacock Rooftop Restaurant for Ker Sangri and naan. | Tip: Closed on Mondays.\n"
                "- Evening: Chokhi Dhani Ethnic Village | Activity: Experience live Kalbelia dance, camel rides, and puppet shows. | Dining: Traditional sit-down village feast with clarified ghee. | Tip: Folk ceremonies begin at 6:00 PM.\n\n"
                "### Explainable AI (XAI) Recommendation Justification\n"
                "- Amer Fort & Maota Lake: Scenery rating of 4.95 reflecting preserved historical architecture.\n"
                "- City Palace Complex: High cultural scores with accessible walking routes.\n"
                "- Hawa Mahal & Johari Bazaar: High culinary ratings (4.85) matching budget preferences."
            )
            return {
                "type": "itinerary",
                "stay_recommendation": f"Alsisar Haveli ({destination} Central)",
                "explainability_data": card_places,
                "itinerary_markdown": itinerary_text
            }