"use client";
import { Printer } from "lucide-react";
export default function PrintButton() {
  return (
    <button className="btn-inline print-button" onClick={() => window.print()}>
      <Printer size={17} /> Cetak / Simpan PDF
    </button>
  );
}
