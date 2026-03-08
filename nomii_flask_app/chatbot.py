import re
import random

# --- LAYER 3: CONTEXT MANAGER ---
# Simple in-memory context store (SessionID -> Dict)
# In production, this would be Redis.
CHAT_CONTEXT = {}

# --- LAYER 5: MULTILINGUAL TRANSLATION (Simulated) ---
# Simulates Google Translate / LibreTranslate API
def translate_text(text, target_lang):
    if target_lang == 'en':
        return text
    
    # Simulated simple keyword translation for demo purposes
    translations = {
        'hi': {
            'Weather': 'मौसम (Mausam)',
            'Price': 'कीमत (Keemat)',
            'Delivery': 'वितरण (Vitaran)',
            'Crop': 'फसल (Fasal)',
            'Tomato': 'टमाटर (Tamaatar)',
            'Hello': 'नमस्ते (Namaste)',
        },
        'ta': {
            'Weather': 'வானிலை (Vaanilai)',
            'Price': 'விலை (Vilai)',
            'Delivery': 'டெலிவரி (Delivery)',
            'Crop': 'பயிர் (Payir)',
            'Tomato': 'தக்காளி (Thakkaali)',
            'Hello': 'வணக்கம் (Vanakkam)',
        }
    }
    
    dict_lang = translations.get(target_lang, {})
    for eng, local in dict_lang.items():
        # Case insensitive replace
        pattern = re.compile(re.escape(eng), re.IGNORECASE)
        text = pattern.sub(local, text)
        
    return f"[{target_lang.upper()}] {text}"

# --- LAYER 2: NLU (Intent & Entity Extraction) ---
# Simulates HuggingFace BERT/RoBERTa Intent Classification & NER
def process_nlu(message):
    message = message.lower()
    
    # Define intents and their keyword heuristics (representing Softmax probabilities)
    intents = {
        'weather_query': ['weather', 'rain', 'temperature', 'hot', 'cold', 'forecast', 'climate'],
        'market_price': ['price', 'cost', 'mandi', 'rate', 'market', 'sell'],
        'delivery_tracking': ['track', 'order', 'delivery', 'status', 'where is', 'shipping', 'supply'],
        'crop_disease': ['disease', 'sick', 'pest', 'leaf', 'yellow', 'spots', 'wilt'],
        'greeting': ['hello', 'hi', 'hey', 'help', 'start']
    }
    
    # Calculate scores
    scores = {}
    for intent, keywords in intents.items():
        score = sum(1 for kw in keywords if kw in message)
        scores[intent] = score
        
    # Get top intent
    top_intent = max(scores, key=scores.get) if any(scores.values()) else 'unknown'
    confidence = scores[top_intent] / max(len(message.split()), 1) * 3 if top_intent != 'unknown' else 0.0
    
    # Confidence threshold fallback
    if confidence < 0.6 and top_intent != 'unknown' and top_intent != 'greeting':
        # Simulated low confidence
        pass 
        
    # Extraction (NER simulation)
    entities = {}
    
    # Extract Location
    locations = ['chennai', 'mumbai', 'delhi', 'pune', 'bangalore', 'hyderabad', 'kolkata', 'ahmedabad', 'village', 'green valley']
    for loc in locations:
        if loc in message:
            entities['location'] = loc.title()
            break
            
    # Extract Crop
    crops = ['tomato', 'rice', 'wheat', 'potato', 'onion', 'banana', 'maize', 'sugarcane', 'cotton', 'soya', 'groundnut', 'bajra']
    for crop in crops:
        if crop in message:
            entities['crop'] = crop.title()
            break
            
    # Extract Language preference (simulated language detection)
    if 'hindi' in message or 'हिंदी' in message:
        entities['language'] = 'hi'
    elif 'tamil' in message or 'தமிழ்' in message:
        entities['language'] = 'ta'
    else:
        entities['language'] = 'en'
        
    return {
        'intent': top_intent if confidence >= 0.3 else 'unknown', # 0.3 threshold
        'confidence': min(confidence, 0.99),
        'entities': entities
    }

# --- LAYER 4: ACTION LAYER & LAYER 5: RESPONSE GEN ---
def handle_chat_message(user_id, message, db_conn=None):
    """
    Main entry point for Chatbot. Processes message through 5 layers.
    """
    # 1. Retrieve/Init Context
    session_id = f"sess_{user_id}"
    context = CHAT_CONTEXT.get(session_id, {'previous_intent': None, 'entities': {}, 'lang': 'en'})
    
    # 2. NLU Processing (Intent & NER)
    nlu_result = process_nlu(message)
    intent = nlu_result['intent']
    entities = nlu_result['entities']
    
    # Merge entities into context
    for k, v in entities.items():
        context['entities'][k] = v
        
    if 'language' in entities:
        context['lang'] = entities['language']
        
    # Handle follow-up resolution (Context Layer)
    if intent == 'unknown' and context['previous_intent']:
        # Assume user is answering a follow-up question
        intent = context['previous_intent']
        
    # 3. Action / Decision Engine
    response_text = ""
    target_lang = context['lang']
    
    try:
        if intent == 'greeting':
            response_text = "Hello! I am Nomii, your ecosystem AI assistant. I can help you check **Weather**, **Market Prices**, **Track Orders**, or diagnose **Crop Diseases**. How can I assist you today?"
            
        elif intent == 'weather_query':
            from app import _fetch_weather, _classify_weather, CROP_WEATHER_ADVICE
            loc = context['entities'].get('location', 'Delhi')
            # Call internal Weather API logic
            w = _fetch_weather(loc)
            wtype = _classify_weather(w['temp'], w['humidity'])
            advisory = CROP_WEATHER_ADVICE[wtype]['advisory']
            
            response_text = f"**Weather in {loc}**\nTemperature: {w['temp']}°C ({w['desc'].title()})\nHumidity: {w['humidity']}%\n\n**AI Advisory**: {advisory}"
            
        elif intent == 'market_price':
            crop = context['entities'].get('crop')
            loc = context['entities'].get('location', 'Mumbai')
            
            if not crop:
                response_text = "Which crop's price would you like to check? (e.g. Tomato, Wheat, Rice)"
                context['previous_intent'] = 'market_price'
            else:
                # Simulate Agmarknet API data
                base_prices = {'Tomato': 18, 'Rice': 35, 'Wheat': 34, 'Potato': 16, 'Onion': 25, 'Banana': 26, 'Maize': 17, 'Sugarcane': 33, 'Cotton': 60, 'Soya': 41, 'Groundnut': 54, 'Bajra': 21}
                p = base_prices.get(crop, 20)
                price = round(p + random.uniform(-2, 3), 2)
                
                response_text = f"The current Agmarknet market price for **{crop}** in **{loc}** is **₹{price}/kg**."
                context['previous_intent'] = None # Clear context
                
        elif intent == 'delivery_tracking':
            # Call internal Supply Chain logic
            if not db_conn:
                response_text = "Tracking system is currently offline."
            else:
                # Get latest order
                row = db_conn.execute("SELECT id, status, product_id FROM orders WHERE buyer_id = ? OR seller_id = ? ORDER BY placed_at DESC LIMIT 1", (user_id, user_id)).fetchone()
                if row:
                    status = row['status'].title()
                    response_text = f"Your most recent order (ID: #{row['id']}) is currently: **{status}**."
                else:
                    response_text = "I couldn't find any recent orders associated with your account."
                    
        elif intent == 'crop_disease':
            response_text = "DeepAI Image Recognition simulation: Please upload an image of the affected crop leaf to diagnose the disease and get pesticide recommendations."
            
        else:
            # Fallback
            response_text = "I'm not exactly sure what you mean. Could you rephrase? I can help with market prices, weather, and order tracking."
            
    except Exception as e:
        # Error handling fallback
        response_text = "Sorry, I encountered an error connecting to the ecosystem services. Please try again later."
        print(f"Chatbot Error: {e}")
        
    # Save context
    CHAT_CONTEXT[session_id] = context
    
    # 4. Translation
    final_response = translate_text(response_text, target_lang)
    
    return final_response
