import os
from pathlib import Path
from tkinter import Tk, filedialog, ttk, messagebox, simpledialog
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from PIL import Image
import io

class SimplePDFEditor:
    def __init__(self):
        self.root = Tk()
        self.root.title("Simple PDF Editor")
        self.root.geometry("600x500")
        
        ttk.Label(self.root, text="Simple PDF Editor", font=("Helvetica", 18, "bold")).pack(pady=20)
        
        buttons = [
            ("Merge PDFs", self.merge_pdfs),
            ("Split PDF", self.split_pdf),
            ("Rotate Pages", self.rotate_pages),
            ("Delete Pages", self.delete_pages),
            ("Add Watermark", self.add_watermark),
            ("Add Page Numbers", self.add_page_numbers),
            ("Extract Text", self.extract_text),
            ("Extract Images", self.extract_images),
        ]
        
        for text, command in buttons:
            ttk.Button(self.root, text=text, command=command).pack(pady=8, fill="x", padx=50)
        
        self.root.mainloop()

    def select_files(self, title="Select PDF files", multiple=False):
        filetypes = [("PDF files", "*.pdf")]
        if multiple:
            return filedialog.askopenfilenames(title=title, filetypes=filetypes)
        else:
            return filedialog.askopenfilename(title=title, filetypes=filetypes)

    def select_save_file(self, title="Save as", defaultextension=".pdf"):
        return filedialog.asksaveasfilename(title=title, defaultextension=defaultextension)

    # 1. Merge PDFs
    def merge_pdfs(self):
        files = self.select_files("Select PDFs to merge", multiple=True)
        if not files:
            return
        output_path = self.select_save_file("Save merged PDF")
        if not output_path:
            return
            
        merger = PdfWriter()
        for f in files:
            merger.append(f)
        merger.write(output_path)
        merger.close()
        messagebox.showinfo("Success", f"Merged PDF saved to:\n{output_path}")

    # 2. Split PDF
    def split_pdf(self):
        file = self.select_files("Select PDF to split")
        if not file:
            return
        folder = filedialog.askdirectory(title="Select folder to save pages")
        if not folder:
            return
            
        reader = PdfReader(file)
        for i, page in enumerate(reader.pages, 1):
            writer = PdfWriter()
            writer.add_page(page)
            output_path = Path(folder) / f"page_{i}.pdf"
            writer.write(str(output_path))
        messagebox.showinfo("Success", f"Split into {len(reader.pages)} files in:\n{folder}")

    # 3. Rotate pages
    def rotate_pages(self):
        file = self.select_files("Select PDF")
        if not file:
            return
        pages_str = simpledialog.askstring("Pages", "Enter page numbers (e.g., 1,3-5) or 'all':")
        if not pages_str:
            return
        angle = simpledialog.askinteger("Rotation", "Rotate by degrees (90, 180, 270):", minvalue=90, maxvalue=270)
        if not angle:
            return
            
        reader = PdfReader(file)
        writer = PdfWriter()
        
        pages_to_rotate = self.parse_pages(pages_str, len(reader.pages))
        
        for i, page in enumerate(reader.pages):
            if (i + 1) in pages_to_rotate or pages_str.strip().lower() == "all":
                page.rotate(angle)
            writer.add_page(page)
            
        output = self.select_save_file()
        if output:
            writer.write(output)
            messagebox.showinfo("Done", "Pages rotated!")

    # 4. Delete pages
    def delete_pages(self):
        file = self.select_files("Select PDF")
        if not file:
            return
        pages_str = simpledialog.askstring("Delete", "Enter page numbers to delete (e.g., 2,5-7):")
        if not pages_str:
            return
            
        reader = PdfReader(file)
        writer = PdfWriter()
        pages_to_delete = self.parse_pages(pages_str, len(reader.pages))
        
        for i, page in enumerate(reader.pages):
            if (i + 1) not in pages_to_delete:
                writer.add_page(page)
                
        output = self.select_save_file()
        if output:
            writer.write(output)
            messagebox.showinfo("Done", "Pages deleted!")

    # 5. Add watermark (text)
    def add_watermark(self):
        file = self.select_files("Select PDF")
        if not file:
            return
        text = simpledialog.askstring("Watermark", "Enter watermark text:")
        if not text:
            return
            
        reader = PdfReader(file)
        writer = PdfWriter()
        
        # Create watermark PDF
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        width, height = letter
        can.setFont("Helvetica", 50)
        can.setFillAlpha(0.3)
        can.rotate(45)
        can.drawCentredString(width/2, height/2 - 100, text)
        can.save()
        packet.seek(0)
        watermark = PdfReader(packet)
        watermark_page = watermark.pages[0]
        
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
            
        output = self.select_save_file()
        if output:
            writer.write(output)
            messagebox.showinfo("Done", "Watermark added!")

    # 6. Add page numbers
    def add_page_numbers(self):
        file = self.select_files("Select PDF")
        if not file:
            return
            
        reader = PdfReader(file)
        writer = PdfWriter()
        
        for i, page in enumerate(reader.pages):
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=page.mediabox.lower_right)
            width, height = page.mediabox.width, page.mediabox.height
            can.drawString(width - 100, 20, f"Page {i+1}")
            can.save()
            packet.seek(0)
            overlay = PdfReader(packet).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
            
        output = self.select_save_file()
        if output:
            writer.write(output)
            messagebox.showinfo("Done", "Page numbers added!")

    # 7. Extract text
    def extract_text(self):
        file = self.select_files("Select PDF")
        if not file:
            return
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
            
        save_path = self.select_save_file("Save text as", ".txt")
        if save_path:
            Path(save_path).write_text(text, encoding="utf-8")
            messagebox.showinfo("Done", f"Text saved to {save_path}")

    # 8. Extract images
    def extract_images(self):
        file = self.select_files("Select PDF")
        if not file:
            return
        folder = filedialog.askdirectory(title="Save images to")
        if not folder:
            return
            
        reader = PdfReader(file)
        count = 0
        for page_num, page in enumerate(reader.pages, 1):
            if "/XObject" in page["/Resources"]:
                xObject = page["/Resources"]["/XObject"].get_object()
                for obj in xObject:
                    if xObject[obj]["/Subtype"] == "/Image":
                        size = (xObject[obj]["/Width"], xObject[obj]["/Height"])
                        data = xObject[obj].get_data()
                        if "/Filter" in xObject[obj]:
                            if xObject[obj]["/Filter"] == "/DCTDecode":
                                ext = ".jpg"
                            elif xObject[obj]["/Filter"] == "/JPXDecode":
                                ext = ".jp2"
                            else:
                                ext = ".png"
                        else:
                            ext = ".png"
                        
                        img = Image.open(io.BytesIO(data))
                        path = Path(folder) / f"page{page_num}_img{count}{ext}"
                        img.save(str(path))
                        count += 1
        messagebox.showinfo("Done", f"Extracted {count} images")

    def parse_pages(self, pages_str, total_pages):
        pages = set()
        for part in pages_str.replace(" ", "").split(","):
            if "-" in part:
                start, end = map(int, part.split("-"))
                pages.update(range(start, end + 1))
            else:
                pages.add(int(part))
        return {p for p in pages if 1 <= p <= total_pages}

if __name__ == "__main__":
    SimplePDFEditor()