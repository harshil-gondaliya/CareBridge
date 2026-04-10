from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import numpy as np
import cv2
import re
from difflib import SequenceMatcher

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR
reader = easyocr.Reader(['en'], gpu=False)

MEDICINE_DICTIONARY = [
    "Acetaminophen",
    "Aciloc",
    "Allip",
    "Amlodipine",
    "Aristo",
    "Aspirin",
    "Atorvastatin",
    "Azithromycin",
    "Calcium",
    "Cilacar",
    "Cilacar M",
    "Clopidogrel",
    "Crocin",
    "Dolo",
    "Ecosprin",
    "Ecosprin 75",
    "Feburic",
    "Febuxostat",
    "GTN Sorbitrate",
    "Korandil",
    "Korandil 5",
    "Metformin",
    "Pantoprazole",
    "Paracetamol",
    "Shelcal XT",
    "Sorbitrate",
    "Telma",
    "Thycium XT",
    "Tonact",
    "Tonact 40",
]

MEDICINE_STOP_WORDS = {
    "tab",
    "tablet",
    "cap",
    "capsule",
    "syp",
    "inj",
    "mg",
    "ml",
    "day",
    "days",
    "before",
    "after",
    "food",
    "opinion",
    "floor",
    "complex",
    "centre",
    "road",
    "email",
    "appointment",
}

OCR_MEDICINE_ALIASES = {
    "adlie": "Allip",
    "cilacay": "Cilacar M",
    "ecospmn": "Ecosprin",
    "ecospnin": "Ecosprin",
    "etospmn": "Ecosprin",
    "feben": "Feburic",
    "febenc": "Feburic",
    "febunc": "Feburic",
    "gtnjorbihule": "GTN Sorbitrate",
    "jorbihule": "GTN Sorbitrate",
    "kardlo": "Korandil",
    "koronail": "Korandil",
    "thciumxt": "Thycium XT",
    "tonact": "Tonact",
}

def resize_if_small(image, min_width=800, max_width=1000):
    height, width = image.shape[:2]
    if width >= min_width:
        return image

    target_width = min(min_width, max_width)
    scale = target_width / width
    return cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

def enhance_for_ocr(image):
    enlarged = resize_if_small(image)
    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrast = clahe.apply(denoised)
    blurred = cv2.GaussianBlur(contrast, (0, 0), 1.0)
    return cv2.addWeighted(contrast, 1.5, blurred, -0.5, 0)

def threshold_for_ocr(image):
    enhanced = enhance_for_ocr(image)
    return cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

def crop_prescription_body(image):
    height, width = image.shape[:2]
    top = int(height * 0.22)
    bottom = int(height * 0.80)
    left = int(width * 0.03)
    right = int(width * 0.97)
    return image[top:bottom, left:right]

def clean_text(text):
    return " ".join(text.strip().split())

def bbox_center_y(bbox):
    return sum(point[1] for point in bbox) / len(bbox)

def bbox_left_x(bbox):
    return min(point[0] for point in bbox)

def normalize_for_match(text):
    return re.sub(r"[^a-z0-9]+", "", text.lower())

def fuzzy_score(left, right):
    left_key = normalize_for_match(left)
    right_key = normalize_for_match(right)
    if not left_key or not right_key:
        return 0

    return SequenceMatcher(None, left_key, right_key).ratio()

def best_medicine_match(text):
    normalized_text = normalize_for_match(text)
    for alias, medicine in OCR_MEDICINE_ALIASES.items():
        if alias in normalized_text:
            return [{
                "ocrText": text,
                "medicine": medicine,
                "score": 96.0
            }]

    candidates = []
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]*", text)
    filtered_words = [
        word for word in words
        if word.lower() not in MEDICINE_STOP_WORDS and len(word) >= 3
    ]

    search_phrases = [" ".join(filtered_words)]
    search_phrases.extend(filtered_words)

    for phrase in search_phrases:
        for medicine in MEDICINE_DICTIONARY:
            score = fuzzy_score(phrase, medicine)
            if score >= 0.64:
                candidates.append({
                    "ocrText": phrase,
                    "medicine": medicine,
                    "score": round(score * 100, 2)
                })

    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates[:3]

def group_lines_into_rows(lines, y_threshold=34):
    sorted_lines = sorted(lines, key=lambda line: (bbox_center_y(line["bbox"]), bbox_left_x(line["bbox"])))
    rows = []

    for line in sorted_lines:
        center_y = bbox_center_y(line["bbox"])
        row_match = None

        for row in rows:
            if abs(row["centerY"] - center_y) <= y_threshold:
                row_match = row
                break

        if row_match is None:
            rows.append({
                "centerY": center_y,
                "items": [line]
            })
        else:
            row_match["items"].append(line)
            row_match["centerY"] = (
                row_match["centerY"] * (len(row_match["items"]) - 1) + center_y
            ) / len(row_match["items"])

    grouped_rows = []
    for index, row in enumerate(rows, start=1):
        items = sorted(row["items"], key=lambda line: bbox_left_x(line["bbox"]))
        raw_text = " ".join(item["text"] for item in items)
        raw_text_lower = raw_text.lower()
        if any(stop_word in raw_text_lower for stop_word in ("floor", "complex", "centre", "road", "email", "appointment", "phone")):
            continue

        avg_conf = round(sum(item["confidence"] for item in items) / len(items), 2)
        suggestions = best_medicine_match(raw_text)

        grouped_rows.append({
            "row": len(grouped_rows) + 1,
            "rawText": raw_text,
            "suggestedMedicine": suggestions[0]["medicine"] if suggestions else "",
            "suggestionConfidence": suggestions[0]["score"] if suggestions else 0,
            "suggestions": suggestions,
            "confidence": avg_conf
        })

    return grouped_rows

def build_corrected_prescription_text(rows):
    corrected_lines = []

    for row in rows:
        if row["suggestedMedicine"]:
            corrected_lines.append(
                f'{row["row"]}. {row["suggestedMedicine"]}  | OCR: {row["rawText"]}'
            )
        else:
            corrected_lines.append(f'{row["row"]}. {row["rawText"]}')

    return "\n".join(corrected_lines)

def parse_results(results):
    lines = []
    total_conf = 0

    for bbox, text, confidence in results:
        cleaned = clean_text(text)
        if cleaned:
            lines.append({
                "text": cleaned,
                "confidence": round(float(confidence) * 100, 2),
                "bbox": [[round(float(x), 2), round(float(y), 2)] for x, y in bbox]
            })
            total_conf += float(confidence)

    avg_conf = 0
    if lines:
        avg_conf = round(total_conf / len(lines) * 100, 2)

    return lines, avg_conf

def lines_to_text(lines):
    return "\n".join(line["text"] for line in lines)

def split_full_page_sections(lines, image_height):
    doctor_info = []
    prescription = []
    footer = []

    for line in lines:
        center_y = bbox_center_y(line["bbox"])
        if center_y < image_height * 0.23:
            doctor_info.append(line)
        elif center_y > image_height * 0.88:
            footer.append(line)
        else:
            prescription.append(line)

    return {
        "doctorInfo": lines_to_text(doctor_info),
        "prescriptionText": lines_to_text(prescription),
        "footerText": lines_to_text(footer)
    }

def score_body_result(lines, avg_conf):
    medicine_markers = ("tab", "cap", "syp", "inj", "mg", "ml", "day", "days", "0-", "1-")
    marker_hits = sum(
        1 for line in lines
        if any(marker in line["text"].lower() for marker in medicine_markers)
    )
    return (len(lines) * 4) + marker_hits + avg_conf

def best_body_ocr(image):
    body = crop_prescription_body(image)
    variants = [
        ("body_original", resize_if_small(body)),
        ("body_enhanced", enhance_for_ocr(body)),
    ]

    best = {
        "variant": "body_original",
        "lines": [],
        "averageConfidence": 0,
        "text": ""
    }

    for variant_name, variant_image in variants:
        results = reader.readtext(variant_image, paragraph=False)
        lines, avg_conf = parse_results(results)
        if score_body_result(lines, avg_conf) > score_body_result(best["lines"], best["averageConfidence"]):
            best = {
                "variant": variant_name,
                "lines": lines,
                "averageConfidence": avg_conf,
                "text": lines_to_text(lines)
            }

    return best

@app.route("/ocr", methods=["POST"])
def run_ocr():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]

        # Convert file to OpenCV image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        # 🔥 NO preprocessing (important)
        full_page_image = resize_if_small(img)
        full_results = reader.readtext(full_page_image, paragraph=False)
        full_lines, full_avg_conf = parse_results(full_results)
        full_text = lines_to_text(full_lines)

        sections = split_full_page_sections(full_lines, full_page_image.shape[0])
        body_ocr = best_body_ocr(img)
        medicine_rows = group_lines_into_rows(body_ocr["lines"])
        corrected_prescription_text = build_corrected_prescription_text(medicine_rows)

        display_text = "\n\n".join([
            "Doctor / Clinic Info:\n" + (sections["doctorInfo"] or "Not detected"),
            "Prescription / Medicines:\n" + (body_ocr["text"] or sections["prescriptionText"] or "Not detected"),
            "Medicine Suggestions:\n" + (corrected_prescription_text or "Not detected"),
            "Footer / Contact Info:\n" + (sections["footerText"] or "Not detected"),
            "Full Page Text:\n" + (full_text or "Not detected")
        ])

        return jsonify({
            "text": display_text,
            "fullText": full_text,
            "doctorInfo": sections["doctorInfo"],
            "prescriptionText": body_ocr["text"] or sections["prescriptionText"],
            "correctedPrescriptionText": corrected_prescription_text,
            "medicineRows": medicine_rows,
            "footerText": sections["footerText"],
            "lines": full_lines,
            "bodyLines": body_ocr["lines"],
            "linesDetected": len(full_lines),
            "bodyLinesDetected": len(body_ocr["lines"]),
            "averageConfidence": full_avg_conf,
            "bodyAverageConfidence": body_ocr["averageConfidence"],
            "bodyVariant": body_ocr["variant"]
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": "OCR processing failed"}), 500


if __name__ == "__main__":
    app.run(port=5003, debug=True)
