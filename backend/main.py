from flask import Flask, jsonify
from flask import request
import os
import requests
from flask_cors import CORS
from flask import request, Response


app = Flask(__name__)
CORS(app)  # allow all origins

@app.route("/")
def index():
    return jsonify({"message": "Radio Explorer API is running"}), 200

#test route
@app.route("/api/ping")
def ping():
    return jsonify({"ok": True, "msg": "pong"}), 200

@app.route("/api/country/<country_name>")
def get_stations_by_country(country_name):
    try:
        url = f"https://de1.api.radio-browser.info/json/stations/bycountry/{country_name}"

        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()
        return jsonify(data), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/proxy")
def proxy_station():
    url = request.args.get("url")
    if not url:
        return {"error": "No url provided"}, 400

    try:
        r = requests.get(url, stream=True, timeout=10)
        return Response(r.iter_content(chunk_size=1024),
                        content_type=r.headers.get("content-type"))
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
