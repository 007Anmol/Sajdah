# backend/main.py
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
import uuid
import asyncio
import os
from pathlib import Path
import tempfile

app = FastAPI(title="PDF Master Pro API")

# Allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your Vercel URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp directory (auto-cleans on reboot + we clean faster)
TEMP_DIR = Path(tempfile.gettempdir()) / "pdf-master-pro"
TEMP_DIR.mkdir(exist_ok=True)

# Background cleanup every 5 minutes
async def cleanup_temp():
    while True:
        await asyncio.sleep(300)
        now = asyncio.get_event_loop().time()
        for file in TEMP_DIR.iterdir():
            try:
                if now - file.stat().st_atime > 600:  # 10 min old
                    file.unlink(missing_ok=True)
            except:
                pass

@app.on_event("startup")
async def start_cleanup():
    asyncio.create_task(cleanup_temp())

def temp_path(suffix=""):
    return TEMP_DIR / f"{uuid.uuid4()}{suffix}"

# 1. Merge PDFs
@app.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(400, "Need at least 2 PDFs")

    writer = PdfWriter()
    paths = []

    try:
        for file in files:
            path = temp_path(f"_{file.filename}")
            paths.append(path)
            content = await file.read()
            path.write_bytes(content)
            writer.append(path)

        output = temp_path("_merged.pdf")
        output.write_bytes(writer.write()[1])  # pypdf returns (stream, metadata)

        def stream():
            try:
                yield from open(output, "rb")
            finally:
                for p in paths + [output]:
                    try: p.unlink(missing_ok=True)
                    except: pass

        return StreamingResponse(stream(), media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=merged.pdf"})
    except:
        for p in paths:
            p.unlink(missing_ok=True)
        raise HTTPException(500, "Merge failed")

# 2. Add Watermark
@app.post("/watermark")
async def add_watermark(file: UploadFile = File(...), text: str = Form(...)):
    if not text.strip():
        raise HTTPException(400, "Text required")

    input_path = temp_path(f"_{file.filename}")
    output_path = temp_path("_watermarked.pdf")

    try:
        content = await file.read()
        input_path.write_bytes(content)

        reader = PdfReader(input_path)
        writer = PdfWriter()

        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica-Bold", 80)
        can.setFillAlpha(0.25)
        can.setFillColorRGB(0.9, 0.1, 0.1)
        can.rotate(45)
        can.drawCentredString(600, 100, text.upper())
        can.save()
        packet.seek(0)
        watermark = PdfReader(packet).pages[0]

        for page in reader.pages:
            page.merge_page(watermark)
            writer.add_page(page)

        output_path.write_bytes(writer.write()[1])

        def stream():
            try:
                yield from open(output_path, "rb")
            finally:
                input_path.unlink(missing_ok=True)
                output_path.unlink(missing_ok=True)

        return StreamingResponse(stream(), media_type="application/pdf",
                                 headers={"Content-Disposition": f"attachment; filename=watermarked_{text}.pdf"})
    except:
        input_path.unlink(missing_ok=True)
        output_path.unlink(missing_ok=True)
        raise HTTPException(500, "Watermark failed")

# Health check
@app.get("/")
def home():
    return {"status": "PDF Master Pro API Running", "files_in_temp": len(list(TEMP_DIR.iterdir()))}